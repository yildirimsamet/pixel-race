

import os
import json
import logging
import hashlib
import struct
import asyncio
from typing import Optional, Dict, Any

import base58
import httpx
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import transfer, TransferParams, create_account, CreateAccountParams
from solders.message import Message
from solders.signature import Signature
from solders.transaction import Transaction
from solders.instruction import Instruction, AccountMeta
from solders.compute_budget import set_compute_unit_limit, set_compute_unit_price

from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.instructions import (
    initialize_mint,
    InitializeMintParams,
    get_associated_token_address,
    create_associated_token_account,
    mint_to,
    MintToParams,
)

from app.services.filebase_service import FilebaseService
from app.services.nft_storage_service import NFTStorageService
from app.services.svg_renderer import SVGRenderer
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service

logger = logging.getLogger(__name__)

LAMPORTS_PER_SOL = 1_000_000_000

TOKEN_METADATA_PROGRAM_ID = Pubkey.from_string("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

SYSTEM_PROGRAM_ID = Pubkey.from_string("11111111111111111111111111111111")
SYSVAR_RENT_PUBKEY = Pubkey.from_string("SysvarRent111111111111111111111111111111111")

MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")


class SolanaService:


    def __init__(self):
        self.rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
        self.rpc_fallback = os.getenv("SOLANA_RPC_FALLBACK")
        self.network = os.getenv("SOLANA_NETWORK", "devnet")
        self.priority_fee_microlamports = int(os.getenv("SOLANA_PRIORITY_FEE_MICROLAMPORTS", "1000"))

        self.ipfs_provider = os.getenv("IPFS_PROVIDER", "nft_storage")

        try:
            self.client = Client(
                self.rpc_url,
                timeout=httpx.Timeout(60.0, connect=10.0)
            )
            test_pubkey = Pubkey.from_string("11111111111111111111111111111111")
            self.client.get_balance(test_pubkey)
            logger.info(f"Connected to primary RPC: {self.rpc_url}")
        except Exception as e:
            if self.rpc_fallback:
                logger.warning(f"Primary RPC failed ({e}), using fallback: {self.rpc_fallback}")
                self.client = Client(
                    self.rpc_fallback,
                    timeout=httpx.Timeout(60.0, connect=10.0)
                )
                self.rpc_url = self.rpc_fallback
            else:
                logger.error(f"Primary RPC failed and no fallback configured: {e}")
                self.client = Client(
                    self.rpc_url,
                    timeout=httpx.Timeout(60.0, connect=10.0)
                )

        private_key_b58 = os.getenv("SOLANA_PRIVATE_KEY")
        if private_key_b58:
            try:
                private_key_bytes = base58.b58decode(private_key_b58)
                self.treasury = Keypair.from_bytes(private_key_bytes)
                logger.info(f"Treasury wallet loaded: {self.treasury.pubkey()}")
            except Exception as e:
                logger.error(f"Failed to load treasury wallet: {e}")
                self.treasury = None
        else:
            logger.warning("SOLANA_PRIVATE_KEY not set, treasury wallet not loaded")
            self.treasury = None

        logger.info(
            f"SolanaService initialized (network: {self.network}, RPC: {self.rpc_url}, "
            f"priority_fee: {self.priority_fee_microlamports} micro-lamports)"
        )

    async def _retry_rpc_call(self, func, *args, max_retries: int = 3, **kwargs):

        for attempt in range(max_retries):
            try:
                result = func(*args, **kwargs)
                if attempt > 0:
                    logger.info(f"RPC call succeeded on attempt {attempt + 1}")
                return result
            except (httpx.TimeoutException, httpx.HTTPError) as e:
                delay = 2 ** attempt
                if attempt < max_retries - 1:
                    logger.warning(
                        f"RPC call failed (attempt {attempt + 1}/{max_retries}): {type(e).__name__} - {e}. "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"RPC call failed after {max_retries} attempts: {type(e).__name__} - {e}"
                    )
                    raise Exception(f"RPC timeout after {max_retries} retries: {e}")
            except Exception as e:
                import traceback
                logger.error(
                    f"RPC call failed with non-retryable error: {type(e).__name__} - {e}\n"
                    f"Traceback: {traceback.format_exc()}"
                )
                raise

    async def _confirm_transaction_async(
        self,
        signature: str,
        timeout: int = 60,
        poll_interval: float = 2.0
    ) -> bool:

        try:
            signature_obj = Signature.from_string(signature)
            start_time = asyncio.get_event_loop().time()

            while (asyncio.get_event_loop().time() - start_time) < timeout:
                try:
                    response = self.client.get_signature_statuses([signature_obj])

                    if response.value and len(response.value) > 0:
                        status = response.value[0]

                        if status is not None:
                            if status.err is not None:
                                logger.warning(
                                    f"Transaction {signature[:16]}... failed on-chain: {status.err}"
                                )
                                return False

                            if status.confirmation_status in ["confirmed", "finalized"]:
                                logger.info(
                                    f"Transaction {signature[:16]}... confirmed "
                                    f"(status: {status.confirmation_status})"
                                )
                                return True

                    await asyncio.sleep(poll_interval)

                except Exception as e:
                    logger.warning(
                        f"Error checking transaction status for {signature[:16]}...: {e}"
                    )
                    await asyncio.sleep(poll_interval)

            logger.warning(
                f"Transaction confirmation timeout after {timeout}s for {signature[:16]}..."
            )
            return False

        except Exception as e:
            logger.error(
                f"Transaction confirmation failed for {signature[:16]}...: {e}"
            )
            return False

    async def _send_transaction_with_retry(
        self,
        transaction: Transaction,
        max_retries: int = 3,
        wait_for_confirmation: bool = True
    ) -> str:

        for attempt in range(max_retries):
            try:
                logger.info(
                    f"Sending transaction (attempt {attempt + 1}/{max_retries})..."
                )

                response = self.client.send_raw_transaction(
                    bytes(transaction),
                    opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed)
                )

                if response.value is None:
                    raise Exception("Transaction send returned None")

                signature = str(response.value)
                logger.info(f"Transaction sent successfully: {signature[:16]}...")

                if wait_for_confirmation:
                    logger.info("Confirming transaction (blocking)...")
                    self.client.confirm_transaction(response.value, commitment=Confirmed)
                    logger.info(f"Transaction confirmed: {signature[:16]}...")

                return signature

            except (httpx.TimeoutException, httpx.HTTPError) as e:
                delay = 2 ** attempt
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Transaction send failed (attempt {attempt + 1}/{max_retries}): "
                        f"{type(e).__name__} - {e}. Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"Transaction send failed after {max_retries} attempts: "
                        f"{type(e).__name__} - {e}"
                    )
                    raise Exception(f"Transaction timeout after {max_retries} retries: {e}")
            except Exception as e:
                error_msg = str(e).lower()
                if "insufficient funds" in error_msg:
                    logger.error(f"Transaction failed: Insufficient funds in treasury wallet")
                    raise Exception("Insufficient funds in treasury wallet")
                elif "blockhash not found" in error_msg:
                    logger.warning(
                        f"Transaction failed: Blockhash expired (attempt {attempt + 1}/{max_retries})"
                    )
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1)
                        continue
                    raise Exception("Transaction failed: Blockhash expired")
                else:
                    logger.error(
                        f"Transaction failed with error: {type(e).__name__} - {e}"
                    )
                    raise Exception(f"Transaction failed: {e}")

        raise Exception(f"Transaction failed after {max_retries} attempts")

    def get_wallet_balance(self, wallet_address: str) -> float:

        try:
            pubkey = Pubkey.from_string(wallet_address)
            response = self.client.get_balance(pubkey, commitment=Confirmed)
            lamports = response.value
            sol_balance = lamports / LAMPORTS_PER_SOL
            logger.debug(f"Wallet {wallet_address[:8]}... balance: {sol_balance} SOL")
            return sol_balance
        except Exception as e:
            import traceback
            logger.error(
                f"Failed to get wallet balance for {wallet_address[:8]}...: "
                f"{type(e).__name__} - {e}\n"
                f"Traceback: {traceback.format_exc()}"
            )
            return 0.0

    async def verify_transaction(
        self,
        tx_signature: str,
        from_wallet: str,
        to_wallet: str,
        expected_amount_sol: float,
        tolerance_sol: float = 0.005
    ) -> bool:

        try:
            logger.info(
                f"VERIFY_TRANSACTION - START - Verifying transaction {tx_signature[:16]}... "
                f"from {from_wallet[:8]}... to {to_wallet[:8]}... "
                f"expected amount: {expected_amount_sol} SOL (tolerance: {tolerance_sol} SOL)"
            )

            signature_object = Signature.from_string(tx_signature)
            logger.info(
                f"Signature object created: {signature_object} "
                f"(type: {type(signature_object).__name__})"
            )

            logger.info(
                f"VERIFY_TRANSACTION - FETCH_TX - Calling get_transaction RPC method with: "
                f"signature={signature_object}, encoding=jsonParsed, commitment=Confirmed, "
                f"max_supported_transaction_version=0"
            )
            response = await self._retry_rpc_call(
                self.client.get_transaction,
                signature_object,
                encoding="jsonParsed",
                commitment=Confirmed,
                max_supported_transaction_version=0
            )

            if not response.value:
                logger.warning(f"Transaction {tx_signature[:16]}... not found on-chain")
                return False

            tx_data = response.value

            if tx_data.transaction.meta.err is not None:
                logger.error(
                    f"Transaction {tx_signature[:16]}... failed on-chain: "
                    f"{tx_data.transaction.meta.err}"
                )
                return False

            message = tx_data.transaction.transaction.message
            instructions = message.instructions

            transfers_found = []
            for instruction in instructions:
                if str(instruction.program_id) == "11111111111111111111111111111111":
                    parsed = instruction.parsed

                    if parsed.get("type") == "transfer":
                        info = parsed.get("info", {})
                        source = info.get("source")
                        destination = info.get("destination")
                        lamports = info.get("lamports", 0)

                        amount_sol = lamports / LAMPORTS_PER_SOL
                        transfers_found.append({
                            "from": source,
                            "to": destination,
                            "amount": amount_sol
                        })

                        amount_diff = abs(amount_sol - expected_amount_sol)
                        if (source == from_wallet and
                            destination == to_wallet and
                            amount_diff <= tolerance_sol):

                            logger.info(
                                f"VERIFY_TRANSACTION - SUCCESS - Transaction verified: {amount_sol} SOL from "
                                f"{from_wallet[:8]}... to {to_wallet[:8]}... "
                                f"(diff: {amount_diff:.6f} SOL)"
                            )
                            return True

            logger.warning(
                f"VERIFY_TRANSACTION - ERROR - Transaction {tx_signature[:16]}... does not match expected parameters:\n"
                f"  Expected: from={from_wallet[:8]}... to={to_wallet[:8]}... amount={expected_amount_sol} SOL\n"
                f"  Found {len(transfers_found)} transfer(s): {transfers_found}"
            )
            await logging_service.log_action(
                user_id=None,
                action=LogAction.VERIFY_TX,
                step=LogStep.ERROR,
                level=LogLevel.ERROR,
                message="Transaction does not match expected parameters",
                metadata={
                    "tx_signature": tx_signature,
                    "expected_from": from_wallet,
                    "expected_to": to_wallet,
                    "expected_amount": expected_amount_sol,
                },
            )
            return False

        except Exception as e:
            import traceback
            logger.error(
                f"❌ Transaction verification failed for {tx_signature[:16]}...: "
                f"{type(e).__name__} - {e}\n"
                f"Full error details:\n{traceback.format_exc()}"
            )
            return False

    async def mint_horse_nft(
        self,
        horse_id: str,
        owner_wallet: str,
        metadata: Dict[str, Any]
    ) -> tuple[str, str]:

        logger.info(f"🎨 Minting REAL NFT for horse {horse_id} to wallet {owner_wallet}")

        if not self.treasury:
            raise Exception("Treasury wallet not loaded. Cannot mint NFT.")

        try:
            image_uri = await self._upload_horse_image_to_ipfs(
                horse_id,
                metadata.get('color', '#FF5733')
            )

            metaplex_metadata = self._build_metaplex_metadata(
                horse_id=horse_id,
                horse_name=metadata.get('name', 'Unnamed Horse'),
                horse_data=metadata,
                image_uri=image_uri
            )

            metadata_uri = await self._upload_to_ipfs_provider(
                data=metaplex_metadata,
                filename=f"horse-{horse_id}.json",
                content_type="application/json",
                data_type="json"
            )

            logger.info(f"✅ Metadata uploaded to IPFS: {metadata_uri}")

            metadata_url = self._convert_ipfs_to_gateway_url(metadata_uri)
            logger.info(f"📝 Metadata gateway URL: {metadata_url}")

            mint_keypair = Keypair()
            owner_pubkey = Pubkey.from_string(owner_wallet)

            logger.info(f"🔑 Generated mint keypair: {mint_keypair.pubkey()}")

            if self.treasury:
                treasury_balance = self.get_wallet_balance(str(self.treasury.pubkey()))
                min_required_sol = 0.02

                if treasury_balance < min_required_sol:
                    raise Exception(
                        f"Insufficient treasury balance: {treasury_balance} SOL. "
                        f"Need at least {min_required_sol} SOL for NFT minting. "
                        f"Please fund treasury wallet: {self.treasury.pubkey()}"
                    )

                logger.info(f"💰 Treasury balance check passed: {treasury_balance} SOL")
            else:
                logger.warning("⚠️ Treasury wallet not loaded, skipping balance check")

            mint_signature = await self._mint_nft_onchain(
                mint_keypair=mint_keypair,
                owner_pubkey=owner_pubkey,
                metadata_uri=metadata_url,
                horse_name=metaplex_metadata["name"],
                symbol=metaplex_metadata["symbol"],
                seller_fee_basis_points=metaplex_metadata["seller_fee_basis_points"]
            )

            mint_address = str(mint_keypair.pubkey())

            logger.info(
                f"🎉 NFT MINTING TRANSACTION SENT!\n"
                f"   Mint Address: {mint_address}\n"
                f"   Metadata URI: {metadata_url}\n"
                f"   Transaction: {mint_signature}\n"
                f"   Status: Confirming in background (check logs)\n"
                f"   Explorer: https://explorer.solana.com/tx/{mint_signature}?cluster={self.network}"
            )

            return mint_address, metadata_url

        except Exception as e:
            logger.error(f"❌ NFT minting failed: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to mint NFT: {e}")

    async def _upload_horse_image_to_ipfs(self, horse_id: str, color: str) -> str:

        try:
            svg_renderer = SVGRenderer()
            png_bytes = svg_renderer.render_horse_png(horse_color=color, output_size=512)

            if not png_bytes:
                logger.warning(f"SVG rendering failed for horse {horse_id[:8]}..., using Robohash fallback")
                return self._get_robohash_fallback_uri(horse_id)

            image_uri = await self._upload_to_ipfs_provider(
                data=png_bytes,
                filename=f"horse-{horse_id}.png",
                content_type="image/png",
                data_type="image"
            )

            logger.info(f"✅ Custom horse image uploaded to IPFS: {image_uri}")
            return image_uri

        except Exception as e:
            logger.error(f"Failed to upload custom horse image: {e}")
            logger.warning(f"Using Robohash fallback for horse {horse_id[:8]}...")
            return self._get_robohash_fallback_uri(horse_id)

    async def _upload_to_ipfs_provider(
        self,
        data: Any,
        filename: str,
        content_type: str,
        data_type: str
    ) -> str:

        try:
            if self.ipfs_provider == "nft_storage":
                service = NFTStorageService()
                if data_type == "json":
                    return await service.upload_json(data, filename)
                else:
                    return await service.upload_image(data, filename, content_type)

            elif self.ipfs_provider == "filebase":
                service = FilebaseService()
                if data_type == "json":
                    return await service.upload_json(data, filename)
                else:
                    return await service.upload_image(data, filename, content_type)

            else:
                raise Exception(f"Unknown IPFS provider: {self.ipfs_provider}")

        except Exception as e:
            logger.error(f"IPFS upload failed with {self.ipfs_provider}: {e}")
            if self.ipfs_provider == "nft_storage":
                logger.warning("Falling back to Filebase...")
                service = FilebaseService()
                if data_type == "json":
                    return await service.upload_json(data, filename)
                else:
                    return await service.upload_image(data, filename, content_type)
            raise

    def _get_robohash_fallback_uri(self, horse_id: str) -> str:

        robohash_url = f"https://robohash.org/{horse_id}.png?set=set4&size=512x512&bgset=bg1"
        logger.debug(f"Using Robohash fallback for horse {horse_id[:8]}...")
        return robohash_url

    def _convert_ipfs_to_gateway_url(self, ipfs_uri: str) -> str:

        if ipfs_uri.startswith("http://") or ipfs_uri.startswith("https://"):
            return ipfs_uri

        cid = ipfs_uri.replace("ipfs://", "")

        gateway_url = f"https://ipfs.filebase.io/ipfs/{cid}"

        logger.debug(f"Converted IPFS URI to gateway URL: {ipfs_uri} → {gateway_url}")
        return gateway_url

    def _build_metaplex_metadata(
        self,
        horse_id: str,
        horse_name: str,
        horse_data: Dict[str, Any],
        image_uri: str
    ) -> Dict[str, Any]:

        image_url = self._convert_ipfs_to_gateway_url(image_uri)

        metadata = {
            "name": f"{horse_name} #{horse_id[:8]}",
            "symbol": "PXLHORSE",
            "description": (
                f"Pixel Race Genesis Horse. A unique racing NFT with on-chain identity. "
                f"Current stats, level, and performance history are tracked off-chain and accessible via API."
            ),
            "seller_fee_basis_points": 500,
            "image": image_url,
            "external_url": f"https://pixelrace.game/horse/{horse_id}",
            "attributes": [
                {"trait_type": "Horse ID", "value": horse_id},
                {"trait_type": "Birthdate", "value": str(horse_data.get('birthdate', ''))},
                {"trait_type": "Color", "value": horse_data.get('color', '#FF5733')},
                {"trait_type": "Generation", "value": "Genesis"},
            ],
            "properties": {
                "files": [
                    {
                        "uri": image_url,
                        "type": "image/png"
                    }
                ],
                "category": "image",
                "creators": [
                    {
                        "address": str(self.treasury.pubkey()) if self.treasury else "11111111111111111111111111111111",
                        "share": 100
                    }
                ]
            }
        }

        logger.debug(f"Built Metaplex metadata for {horse_name} (static attributes only)")
        return metadata

    async def _mint_nft_onchain(
        self,
        mint_keypair: Keypair,
        owner_pubkey: Pubkey,
        metadata_uri: str,
        horse_name: str,
        symbol: str,
        seller_fee_basis_points: int
    ) -> str:

        try:
            logger.info(
                f"Minting NFT on-chain: {horse_name} to {owner_pubkey} "
                f"(priority_fee: {self.priority_fee_microlamports} micro-lamports)"
            )
            recent_blockhash_resp = self.client.get_latest_blockhash(commitment=Confirmed)
            recent_blockhash = recent_blockhash_resp.value.blockhash

            mint_rent_response = self.client.get_minimum_balance_for_rent_exemption(82)
            mint_rent = mint_rent_response.value

            logger.info(f"💰 Mint account rent: {mint_rent} lamports ({mint_rent / LAMPORTS_PER_SOL} SOL)")

            create_mint_account_ix = create_account(
                CreateAccountParams(
                    from_pubkey=self.treasury.pubkey(),
                    to_pubkey=mint_keypair.pubkey(),
                    lamports=mint_rent,
                    space=82,
                    owner=TOKEN_PROGRAM_ID
                )
            )

            initialize_mint_ix = initialize_mint(
                InitializeMintParams(
                    program_id=TOKEN_PROGRAM_ID,
                    mint=mint_keypair.pubkey(),
                    decimals=0,
                    mint_authority=self.treasury.pubkey(),
                    freeze_authority=self.treasury.pubkey()
                )
            )

            owner_ata = get_associated_token_address(owner_pubkey, mint_keypair.pubkey())
            create_ata_ix = create_associated_token_account(
                payer=self.treasury.pubkey(),
                owner=owner_pubkey,
                mint=mint_keypair.pubkey()
            )

            mint_to_ix = mint_to(
                MintToParams(
                    program_id=TOKEN_PROGRAM_ID,
                    mint=mint_keypair.pubkey(),
                    dest=owner_ata,
                    mint_authority=self.treasury.pubkey(),
                    amount=1,
                    signers=[]
                )
            )

            metadata_pda, metadata_bump = Pubkey.find_program_address(
                [b"metadata", bytes(TOKEN_METADATA_PROGRAM_ID), bytes(mint_keypair.pubkey())],
                TOKEN_METADATA_PROGRAM_ID
            )

            create_metadata_ix = self._build_create_metadata_instruction(
                metadata_pda=metadata_pda,
                mint=mint_keypair.pubkey(),
                mint_authority=self.treasury.pubkey(),
                payer=self.treasury.pubkey(),
                update_authority=self.treasury.pubkey(),
                name=horse_name,
                symbol=symbol,
                uri=metadata_uri,
                seller_fee_basis_points=seller_fee_basis_points
            )

            master_edition_pda, master_edition_bump = Pubkey.find_program_address(
                [b"metadata", bytes(TOKEN_METADATA_PROGRAM_ID), bytes(mint_keypair.pubkey()), b"edition"],
                TOKEN_METADATA_PROGRAM_ID
            )

            create_master_edition_ix = self._build_create_master_edition_instruction(
                master_edition_pda=master_edition_pda,
                mint=mint_keypair.pubkey(),
                update_authority=self.treasury.pubkey(),
                mint_authority=self.treasury.pubkey(),
                payer=self.treasury.pubkey(),
                metadata_pda=metadata_pda,
                max_supply=0
            )

            compute_budget_ix1 = set_compute_unit_limit(300_000)
            compute_budget_ix2 = set_compute_unit_price(self.priority_fee_microlamports)

            memo_text = "Pixel Race - Horse NFT Minting"
            memo_ix = Instruction(
                program_id=MEMO_PROGRAM_ID,
                data=memo_text.encode('utf-8'),
                accounts=[]
            )

            instructions = [
                compute_budget_ix1,
                compute_budget_ix2,
                memo_ix,
                create_mint_account_ix,
                initialize_mint_ix,
                create_ata_ix,
                mint_to_ix,
                create_metadata_ix,
                create_master_edition_ix
            ]

            logger.info(
                f"Building NFT mint transaction with {len(instructions)} instructions "
                f"(compute_limit: 300000, priority_fee: {self.priority_fee_microlamports}, memo: '{memo_text}')"
            )

            message = Message.new_with_blockhash(
                instructions,
                self.treasury.pubkey(),
                recent_blockhash
            )

            transaction = Transaction([self.treasury, mint_keypair], message, recent_blockhash)

            signature = await self._send_transaction_with_retry(
                transaction,
                wait_for_confirmation=False
            )

            logger.info(f"✅ NFT minting transaction SENT! Signature: {signature}")
            logger.info("⏳ Transaction confirmation will happen asynchronously in background")

            asyncio.create_task(self._confirm_transaction_async(signature, timeout=60))

            return signature

        except Exception as e:
            logger.error(f"❌ On-chain minting failed: {e}")
            raise

    def _build_create_metadata_instruction(
        self,
        metadata_pda: Pubkey,
        mint: Pubkey,
        mint_authority: Pubkey,
        payer: Pubkey,
        update_authority: Pubkey,
        name: str,
        symbol: str,
        uri: str,
        seller_fee_basis_points: int
    ) -> Instruction:

        discriminator = bytes([33])




        name_bytes = name.encode('utf-8')
        symbol_bytes = symbol.encode('utf-8')
        uri_bytes = uri.encode('utf-8')

        data = bytearray(discriminator)

        data.extend(struct.pack('<I', len(name_bytes)))
        data.extend(name_bytes)

        data.extend(struct.pack('<I', len(symbol_bytes)))
        data.extend(symbol_bytes)

        data.extend(struct.pack('<I', len(uri_bytes)))
        data.extend(uri_bytes)

        data.extend(struct.pack('<H', seller_fee_basis_points))

        data.append(1)
        data.extend(struct.pack('<I', 1))
        data.extend(bytes(self.treasury.pubkey()))
        data.append(1)
        data.append(100)

        data.append(0)

        data.append(0)

        data.append(1)

        data.append(0)

        accounts = [
            AccountMeta(metadata_pda, is_signer=False, is_writable=True),
            AccountMeta(mint, is_signer=False, is_writable=False),
            AccountMeta(mint_authority, is_signer=True, is_writable=False),
            AccountMeta(payer, is_signer=True, is_writable=True),
            AccountMeta(update_authority, is_signer=False, is_writable=False),
            AccountMeta(SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(SYSVAR_RENT_PUBKEY, is_signer=False, is_writable=False),
        ]

        return Instruction(TOKEN_METADATA_PROGRAM_ID, bytes(data), accounts)

    def _build_create_master_edition_instruction(
        self,
        master_edition_pda: Pubkey,
        mint: Pubkey,
        update_authority: Pubkey,
        mint_authority: Pubkey,
        payer: Pubkey,
        metadata_pda: Pubkey,
        max_supply: int
    ) -> Instruction:

        discriminator = bytes([17])

        data = bytearray(discriminator)

        if max_supply == 0:
            data.append(1)
            data.extend(struct.pack('<Q', 0))
        else:
            data.append(1)
            data.extend(struct.pack('<Q', max_supply))

        accounts = [
            AccountMeta(master_edition_pda, is_signer=False, is_writable=True),
            AccountMeta(mint, is_signer=False, is_writable=True),
            AccountMeta(update_authority, is_signer=True, is_writable=False),
            AccountMeta(mint_authority, is_signer=True, is_writable=False),
            AccountMeta(payer, is_signer=True, is_writable=True),
            AccountMeta(metadata_pda, is_signer=False, is_writable=True),
            AccountMeta(TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(SYSVAR_RENT_PUBKEY, is_signer=False, is_writable=False),
        ]

        return Instruction(TOKEN_METADATA_PROGRAM_ID, bytes(data), accounts)

    def _generate_deterministic_mint_address(self, horse_id: str, owner_wallet: str) -> str:

        seed = f"pixelrace-genesis-{horse_id}-{owner_wallet}".encode()

        hash_bytes = hashlib.sha256(seed).digest()

        fake_mint = base58.b58encode(hash_bytes).decode('utf-8')

        logger.debug(f"Generated deterministic mint address: {fake_mint}")
        return fake_mint

    async def transfer_sol(
        self,
        to_wallet: str,
        amount_sol: float,
        memo: Optional[str] = None
    ) -> str:

        if not self.treasury:
            raise Exception("Treasury wallet not loaded")

        try:
            logger.info(
                f"Transferring {amount_sol} SOL to {to_wallet[:8]}... "
                f"(priority_fee: {self.priority_fee_microlamports} micro-lamports)"
            )

            lamports = int(amount_sol * LAMPORTS_PER_SOL)

            recipient_pubkey = Pubkey.from_string(to_wallet)

            priority_fee_ix = set_compute_unit_price(self.priority_fee_microlamports)

            transfer_ix = transfer(
                TransferParams(
                    from_pubkey=self.treasury.pubkey(),
                    to_pubkey=recipient_pubkey,
                    lamports=lamports
                )
            )

            recent_blockhash_resp = self.client.get_latest_blockhash(commitment=Confirmed)
            recent_blockhash = recent_blockhash_resp.value.blockhash

            instructions = [priority_fee_ix, transfer_ix]

            if memo:
                memo_ix = Instruction(
                    program_id=MEMO_PROGRAM_ID,
                    data=memo.encode('utf-8'),
                    accounts=[]
                )
                instructions.append(memo_ix)

            transaction = Transaction.new_signed_with_payer(
                instructions,
                self.treasury.pubkey(),
                [self.treasury],
                recent_blockhash
            )

            signature = await self._send_transaction_with_retry(
                transaction,
                wait_for_confirmation=True
            )

            logger.info(
                f"✅ SOL transfer successful: {amount_sol} SOL to {to_wallet[:8]}... "
                f"(signature: {signature[:16]}...)"
            )

            return signature

        except Exception as e:
            logger.error(f"❌ SOL transfer failed: {type(e).__name__} - {e}")
            raise Exception(f"Failed to transfer SOL: {e}")

    def verify_ownership(self, nft_mint: str, wallet_address: str) -> bool:

        try:
            logger.debug(f"Verifying ownership of NFT {nft_mint[:16]}... by {wallet_address[:8]}...")

            mint_pubkey = Pubkey.from_string(nft_mint)
            wallet_pubkey = Pubkey.from_string(wallet_address)

            response = self.client.get_token_accounts_by_owner(
                wallet_pubkey,
                {"mint": mint_pubkey},
                commitment=Confirmed
            )

            if response.value and len(response.value) > 0:
                account_data = response.value[0]
                logger.debug(f"NFT ownership verified for {wallet_address[:8]}...")
                return True

            logger.debug(f"NFT {nft_mint[:16]}... not found in wallet {wallet_address[:8]}...")
            return False

        except Exception as e:
            logger.error(f"Ownership verification failed: {e}")
            return False

    def get_nft_metadata(self, nft_mint: str) -> Optional[Dict[str, Any]]:

        try:
            logger.debug(f"Fetching metadata for NFT {nft_mint[:16]}...")


            logger.warning("STUB: Metadata fetching not implemented")
            return None

        except Exception as e:
            logger.error(f"Metadata fetching failed: {e}")
            return None