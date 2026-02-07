# Web3/Solana Entegrasyonu
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## Solana Service

`backend/app/services/solana_service.py`

### Temel Metodlar

#### 1. Transaction Verification

```python
verify_transaction(
    tx_signature: str,
    from_wallet: str,
    to_wallet: str,
    expected_amount_sol: float,
    tolerance_sol: float = 0.005
) -> bool
```

- On-chain transaction verification
- Sender, receiver ve amount kontrolü
- Confirmations check

#### 2. SOL Transfer (Prize Distribution)

```python
async transfer_sol(
    to_wallet: str,
    amount_sol: float,
    memo: Optional[str] = None
) -> str  # Returns tx signature
```

- Treasury'den kazanana SOL transfer
- System Program kullanır
- Transaction signature döner

#### 3. NFT Minting

```python
async mint_horse_nft(
    horse_id: str,
    owner_wallet: str,
    metadata: Dict[str, Any]
) -> str  # Returns mint address
```

**⚠️ ŞU AN STUB - Production için gerekli:**
- Metaplex Token Metadata Program entegrasyonu
- IPFS/Arweave metadata upload
- Master Edition oluşturma
- Associated Token Account setup

#### 4. Balance Check

```python
get_wallet_balance(wallet_address: str) -> float
```

## Wallet Tabanlı Authentication

### Akış

1. **Frontend** - Kullanıcı cüzdan bağlar (Phantom/Solflare)
2. **Frontend** - Mesaj imzalar: `"Sign this message to authenticate with Pixel Race"`
3. **Frontend → Backend** - POST /auth/wallet-login:
   ```json
   {
     "wallet_address": "base58_pubkey",
     "signature": "base64_signature",
     "message": "original_message"
   }
   ```
4. **Backend** - Signature doğrular (`backend/app/core/security.py:35`):
   ```python
   verify_solana_signature(wallet_address, message, signature)
   # PyNaCl ile Ed25519 signature verification
   ```
5. **Backend → Frontend** - JWT token döner
6. **Frontend** - Token localStorage'a kaydedilir
7. **Sonraki istekler** - `Authorization: Bearer <token>` header'ı

## Transaction Flows

### At Satın Alma

```
1. Frontend: createHorsePurchaseTransaction()
   - User → Treasury: 0.5/1.5/3.0 SOL transfer

2. Frontend → Backend: POST /horses/boxes/buy
   {
     "max_level": 2,
     "transaction_signature": "..."
   }

3. Backend: verify_transaction()
   - TX doğrula: amount, sender, receiver

4. Backend: mint_horse_nft()
   - NFT mint et (şu an stub)

5. Backend → DB: Horse + HorseStats kaydet

6. Backend → Frontend: Horse object döner
```

### Yarışa Katılma

```
1. Frontend: createRaceEntryTransaction()
   - User → Treasury: entry_fee SOL transfer

2. Frontend → Backend: POST /races/{id}/join
   {
     "horse_id": "...",
     "transaction_signature": "..."
   }

3. Backend: verify_transaction()
   - Entry fee doğrula

4. Backend: Race.prize_pool_sol += entry_fee

5. Backend: Horse.in_race = True

6. Backend → DB: RaceResult kaydet
```

### Ödül Dağıtımı

```
1. Socket Server → Backend: POST /races/{id}/end
   {
     "results": [
       {"horse_id": "...", "finish_time_ms": 25000, "position": 1},
       ...
     ]
   }

2. Backend: calculate_rewards()
   - Prize pool × %50 (1st) / %30 (2nd) / %20 (3rd)

3. Backend: transfer_sol() - Her kazanan için
   - Treasury → Winner SOL transfer
   - TX signature kaydet

4. Backend → DB: Update RaceResult
   - finish_position
   - reward_amount
   - reward_tx_signature

5. Backend: Race.status = done
```

## Frontend Integration

### Transaction Hook

`frontend/hooks/useTransaction.ts`:

```typescript
const { sendTransaction, isLoading, error } = useTransaction()

// At satın alma
const signature = await sendTransaction(
  createHorsePurchaseTransaction(connection, wallet, treasury, amount)
)
```

### Balance Hook

`frontend/hooks/useSolanaBalance.ts`:

```typescript
const { balance, refetch } = useSolanaBalance(walletAddress)
```

### Transaction Utilities

`frontend/lib/solana-transactions.ts`:

```typescript
// Horse purchase
createHorsePurchaseTransaction(connection, wallet, treasury, level)

// Race entry
createRaceEntryTransaction(connection, wallet, treasury, entry_fee)
```

## Environment Variables

### Backend

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=base58_encoded_treasury_key

# Pricing
HORSE_PRICE_LEVEL_1=0.5
HORSE_PRICE_LEVEL_2=1.5
HORSE_PRICE_LEVEL_3=3.0
```

### Frontend

```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Security

### Implemented

- Wallet signature verification (PyNaCl Ed25519)
- JWT token authentication
- Transaction verification (amount, sender, receiver)
- Environment variable secrets

### Production İçin Eklenecek

- Rate limiting (transaction spam prevention)
- Treasury balance monitoring & alerts
- Multi-sig wallet for treasury
- Hardware wallet integration (Ledger)
- RPC endpoint authentication
- Transaction replay attack prevention

## Production Checklist

### Backend
- [ ] Gerçek Metaplex NFT minting implement et
- [ ] IPFS/Arweave metadata storage
- [ ] Paid RPC provider (QuickNode/Helius)
- [ ] Multi-sig treasury wallet

### Frontend
- [ ] Production RPC endpoints
- [ ] Transaction retry logic
- [ ] Explorer link integration

## Useful Links

- [Solana Devnet Faucet](https://faucet.solana.com)
- [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
- [Metaplex Docs](https://docs.metaplex.com)
