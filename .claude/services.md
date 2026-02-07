# Backend Services
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## HorseFactory Service

`backend/app/services/horse_factory.py`

**Amaç**: Tüm at oluşturma logic'ini merkezi hale getirmek

### Kullanım Yerleri

- `buy_horse_use_case.py` - At satın alma
- `bot_service.py` - Bot atları
- `rewards.py` - Welcome box

### API

```python
from app.services.horse_factory import HorseFactory

factory = HorseFactory()

# At oluştur (tüm statlar otomatik)
horse, stats = await factory.create_horse(
    db=db,
    user_id=user.id,
    level=2,
    auto_commit=False  # Caller kontrol eder
)

# Stats içinde:
# - bond: 0 (her yarışta +2)
# - fame: 0 (derece ile artar)
# - instinct: random(0-30) (artabilir)
# - weight, determination, energy, satiety, level
```

### Avantajlar

- Tutarlı at oluşturma (vibrant color, HORSE_NAMES)
- Tüm statlar otomatik (bond, fame, instinct)
- Tek değişiklik → tüm yerler güncellenir
- Test edilebilir

## Scheduler Service

`backend/app/services/scheduler.py`

APScheduler jobs ile otomatik yarış yönetimi.

### 1. auto_create_races (Her 3 dakikada)

```python
# Her çalıştırmada 3 yarış oluşturur (kademeli):
- Level 1: T+1min başlangıç, entry_fee=0.01 SOL
- Level 2: T+2min başlangıç, entry_fee=0.03 SOL
- Level 3: T+3min başlangıç, entry_fee=0.05 SOL
```

### 2. auto_start_or_cancel_races (Her 5 saniyede)

```python
# Waiting durumundaki yarışları kontrol et:
if registered_count >= min_horses:
    _start_race()  # Segmentleri hesapla, socket'e gönder
else:
    _cancel_race()  # Entry fee'leri iade et
```

### 3. cleanup_stuck_races (Her 5 dakikada)

```python
# 10 dakikadan fazla "racing" durumunda kalan yarışları:
- Sonuçları zorla hesapla
- Ödülleri dağıt
- Status = done
```

### 4. cleanup_old_races (Her 10 dakikada)

```python
# Eski finished/cancelled yarışları sil
# Sadece son 100 tanesini tut (SCHEDULER_CONFIG)
```

## Race Logic Service

`backend/app/services/race_logic.py`

Segment hesaplama ve yarış mekaniği.

### calculate_race_segments()

```python
def calculate_race_segments(
    horses: List[Horse],
    level: int
) -> Dict[str, List[Segment]]
```

Her at için 10 segment hesaplar. Faktörler:
- Base time (level'a göre)
- Age, weight, determination
- Segment özellikleri (başlangıç sprint, final spurt, vb.)

Detaylar: [race-mechanics.md](race-mechanics.md)

## Solana Service

`backend/app/services/solana_service.py`

Web3 entegrasyonu.

### verify_transaction()
On-chain transaction doğrulama

### transfer_sol()
Treasury'den ödül transferi

### mint_horse_nft()
NFT minting (şu an stub)

### get_wallet_balance()
Wallet bakiyesi

Detaylar: [web3-integration.md](web3-integration.md)

## Bot Service

`backend/app/services/bot_service.py`

Otomatik bot at oluşturma ve yarışlara katılma.

### create_bot_horse()

HorseFactory kullanarak bot atı oluşturur:

```python
from app.services.bot_service import create_bot_horse

horse = await create_bot_horse(db, level=2)
```

### auto_register_bot_horses()

Yarış için gereken minimum at sayısına ulaşılana kadar bot atları ekler.

## Game Mechanics

`backend/app/core/game_mechanics.py`

### calculate_performance_modifier()

```python
def calculate_performance_modifier(stats: HorseStats) -> float:
    # Optimal ağırlık: 400-500kg
    # Tokluk cezası: >50 satiety
    # Enerji cezası: >50 energy
    # Return: 0.7-1.0 (düşük = daha yavaş)
```

HorseStats durumuna göre performans modifikatörü hesaplar.

## Configuration

`backend/app/core/config.py`

Environment variables ve settings yönetimi.

```python
from app.core.config import settings

# Access environment variables
settings.DATABASE_URL
settings.SOLANA_RPC_URL
settings.SECRET_KEY
```

## Constants

`backend/app/core/constants.py`

Game mechanics sabit değerleri:

- `RACE_CONFIG` - Level bazlı yarış ayarları
- `REWARD_DISTRIBUTION` - Ödül dağılımı
- `HORSE_ATTRIBUTES` - At özellikleri range'leri
- `RACE_LOGIC` - Yarış mekaniği parametreleri

Detaylar: [race-mechanics.md](race-mechanics.md)
