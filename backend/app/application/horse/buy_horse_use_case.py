from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NFTMintError, ValidationError
from app.core.logging_config import get_logger
from app.core.game_config import get_horse_price
from app.services.horse_factory import HorseFactory
from app.services.notification_service import NotificationService
from app.services.solana_service import SolanaService
from app.services.transaction_verification_service import TransactionVerificationService
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service
from app.models.horse import Horse
import random

logger = get_logger(__name__)


@dataclass
class BuyHorseCommand:

    max_level: int
    transaction_signature: str
    user_id: UUID
    user_wallet: str
    request_id: Optional[UUID] = None


@dataclass
class HorseCreatedResult:

    horse: Horse
    nft_mint: str
    metadata_uri: str
    metadata_gateway_url: str
    explorer_url: str
    message: str
    transaction_signature: str


class BuyHorseUseCase:


    def __init__(
        self,
        notification_service: NotificationService,
        transaction_verifier: TransactionVerificationService,
        solana_service: SolanaService
    ):
        self.notification_service = notification_service
        self.transaction_verifier = transaction_verifier
        self.solana_service = solana_service

    async def execute(self, db: AsyncSession, command: BuyHorseCommand) -> HorseCreatedResult:

        logger.info(
            f"User {command.user_id} purchasing horse box with max_level {command.max_level}"
        )

        if command.max_level not in [1, 2, 3]:
            logger.warning(f"Invalid max_level {command.max_level} requested")

            await logging_service.log_action(
                user_id=command.user_id,
                action=LogAction.BUY_HORSE,
                step=LogStep.VALIDATION,
                level=LogLevel.ERROR,
                message=f"Invalid max_level: {command.max_level}",
                metadata={"max_level": command.max_level},
                request_id=command.request_id,
                wallet_address=command.user_wallet,
            )

            raise ValidationError(
                "Invalid max_level. Must be 1, 2, or 3",
                details={"max_level": command.max_level},
            )

        if not command.transaction_signature:
            logger.warning(f"No transaction signature provided by user {command.user_id}")
            raise ValidationError(
                "Transaction signature is required for horse purchase",
                details={"field": "transaction_signature"}
            )

        horse_level = command.max_level
        logger.debug(f"Horse level set to: {horse_level}")

        required_sol = get_horse_price(command.max_level)
        logger.debug(f"Required SOL for horse level {command.max_level}: {required_sol}")

        await self.transaction_verifier.verify_payment_transaction(
            db=db,
            from_wallet=command.user_wallet,
            transaction_signature=command.transaction_signature,
            expected_amount_sol=required_sol
        )

        factory = HorseFactory()
        new_horse, initial_stats = await factory.create_horse(
            db=db,
            user_id=command.user_id,
            level=horse_level
        )

        metadata = {
            "name": new_horse.name,
            "birthdate": str(new_horse.birthdate),
            "color": new_horse.color,
            "level": horse_level,
        }


        try:
            nft_mint, metadata_uri = await self.solana_service.mint_horse_nft(
                horse_id=str(new_horse.id),
                owner_wallet=command.user_wallet,
                metadata=metadata,
            )

            new_horse.nft_mint_address = nft_mint
            new_horse.nft_metadata_uri = metadata_uri
            new_horse.minted_at = datetime.utcnow()
            new_horse.purchase_tx_signature = command.transaction_signature

            await self.notification_service.notify_horse_purchased(
                db=db,
                user_id=command.user_id,
                horse_name=new_horse.name,
                horse_level=horse_level,
                horse_id=new_horse.id,
                nft_mint=nft_mint,
                transaction_signature=command.transaction_signature
            )

            await db.commit()
            await db.refresh(new_horse)

            logger.info(
                f"Successfully minted NFT {nft_mint} for horse {new_horse.id}. "
                f"Metadata: {metadata_uri}"
            )

            cid = metadata_uri.replace("ipfs://", "")
            ipfs_gateway_url = f"https://ipfs.filebase.io/ipfs/{cid}"

            return HorseCreatedResult(
                horse=new_horse,
                nft_mint=nft_mint,
                metadata_uri=metadata_uri,
                metadata_gateway_url=ipfs_gateway_url,
                explorer_url=f"https://explorer.solana.com/address/{nft_mint}?cluster={self.solana_service.network}",
                message="Horse NFT purchased and minted successfully! (Phase 1: Metadata on IPFS)",
                transaction_signature=command.transaction_signature
            )

        except Exception as e:
            await db.rollback()
            logger.error(f"NFT minting failed for horse {new_horse.id}: {str(e)}")

            await logging_service.log_action(
                user_id=command.user_id,
                action=LogAction.BUY_HORSE,
                step=LogStep.ERROR,
                level=LogLevel.ERROR,
                message=f"NFT minting failed: {str(e)}",
                metadata={
                    "horse_id": str(new_horse.id),
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                request_id=command.request_id,
                wallet_address=command.user_wallet,
            )

            try:
                refund_signature = await self.solana_service.transfer_sol(
                    to_wallet=command.user_wallet,
                    amount_sol=required_sol,
                    memo="Pixel Race - Horse Purchase Refund"
                )
                logger.info(
                    f"Refunded {required_sol} SOL to {command.user_wallet[:8]}... "
                    f"after NFT minting failure: {refund_signature}"
                )
            except Exception as refund_error:
                logger.critical(
                    f"CRITICAL: Failed to refund user {command.user_wallet} "
                    f"for failed horse purchase. Amount: {required_sol} SOL. "
                    f"Original error: {str(e)}. Refund error: {str(refund_error)}. "
                    f"MANUAL INTERVENTION REQUIRED!"
                )

            raise NFTMintError(f"NFT minting failed: {str(e)}")