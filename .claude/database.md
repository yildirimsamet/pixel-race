# Database Schema
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## Core Models

### User
`backend/app/models/user.py`

```python
- id: UUID (PK)
- wallet_address: str (unique) - Solana cüzdan adresi
- wallet_connected_at: DateTime
- nonce: str - Authentication nonce
- last_login: DateTime
- created_at: DateTime

İlişkiler:
  horses: One-to-Many → Horse
```

### Horse
`backend/app/models/horse.py`

```python
- id: UUID (PK)
- name: str - At adı
- birthdate: Date - Doğum tarihi (age hesaplanır)
- color: str - Hex renk (#RRGGBB)
- user_id: UUID (FK → users) ⚠️ owner_id DEĞİL!
- in_race: bool - Yarışta mı?

NFT Fields:
- nft_mint_address: str (unique) - Solana NFT mint adresi
- nft_metadata_uri: str - IPFS/Arweave URI
- minted_at: DateTime

İlişkiler:
  owner: Many-to-One → User
  stats: One-to-One → HorseStats
  race_results: One-to-Many → RaceResult

Properties:
  @property age -> int (birthdate'ten hesaplanır)

⚠️ NOTLAR:
  - Horse.user_id kullan (owner_id yok)
  - Horse.level YOK, HorseStats.level kullan
```

### HorseStats
`backend/app/models/horse_stats.py`

```python
Statik Fiziksel Özellikler:
- weight: int (300-1000 kg) - Ağırlık
- determination: int (0-100) - Kararlılık
- level: int (1-3) - At seviyesi

Dinamik Durum Özellikleri:
- energy: int (0-100) - Enerji (yarış sonrası azalır)
- satiety: int (0-100) - Tokluk (yarış sonrası azalır)

Deneyim Statları (Artabilir):
- bond: int (0+) - Bağ (her yarışta +2)
- fame: int (0+) - Ün (derece ile artar: 1st:+10, 2nd:+5, 3rd:+3)
- instinct: int (0-100) - İçgüdü (başlangıç: 0-30, yarışlarda artabilir)

Performans Takibi:
- total_races: int - Toplam yarış sayısı
- total_wins: int - Toplam galibiyet
- total_earnings: float (SOL) - Kazanılan toplam ödül

İlişkiler:
  horse: One-to-One → Horse

Not: HorseFactory servisi tüm stat'ları otomatik oluşturur
```

### Race
`backend/app/models/race.py`

```python
- id: UUID (PK)
- entry_fee: float - SOL cinsinden giriş ücreti
- max_horses: int - Maksimum at sayısı
- min_horses: int - Minimum at sayısı
- status: Enum (waiting/racing/done/cancelled)
- start_time: DateTime
- level_requirement: int (1-3)
- prize_pool_sol: float - Biriken ödül havuzu (SOL)
- created_at: DateTime

İlişkiler:
  race_results: One-to-Many → RaceResult

⚠️ NOTLAR:
  - Race.winner_horse_id YOK
  - Kazanan bulmak için: RaceResult.finish_position = 1 ile JOIN
```

### RaceResult
`backend/app/models/race.py`

```python
- id: UUID (PK)
- race_id: UUID (FK → races)
- horse_id: UUID (FK → horses)
- finish_position: int - Bitiş sırası
- finish_time_ms: int - Toplam süre (ms)
- race_segments: str - JSON segment verisi (replay için)
- reward_amount: float - Kazanılan ödül (SOL)
- reward_tx_signature: str - Solana transfer imzası
- created_at: DateTime

İlişkiler:
  race: Many-to-One → Race
  horse: Many-to-One → Horse
```

## Migrations (Alembic)

**KRITIK: Database schema değişiklikleri SADECE migration ile yapılmalıdır!**

### Yanlış Yöntem (Kullanma!)

```bash
# Model değiştir → docker volume sil → yeniden build
docker-compose down -v  # ⚠️ Tüm veriyi kaybedersin!
```

### Doğru Yöntem (Production-Ready)

```bash
# 1. Model değişikliği yap (örn: Horse model'e yeni field)
# 2. Migration oluştur
./backend/migrate.sh create "add_horse_new_field"

# 3. Migration dosyasını gözden geçir
cat backend/alembic/versions/*_add_horse_new_field.py

# 4. Migration'ı uygula
./backend/migrate.sh upgrade

# 5. Sorun olursa rollback
./backend/migrate.sh downgrade 1
```

**Detaylı bilgi:** `backend/MIGRATIONS.md`

## Database Queries (Debugging)

```bash
# Docker container'a bağlan
docker exec -it pixel-race-postgres psql -U postgres -d pixel_race
```

### Useful Queries

```sql
-- List tables
\dt

-- Active races
SELECT id, level_requirement, status,
       (SELECT COUNT(*) FROM race_results WHERE race_id = races.id) as horses_count
FROM races WHERE status != 'done' ORDER BY created_at DESC;

-- Recent transactions
SELECT h.name, rr.finish_position, rr.reward_amount, rr.reward_tx_signature
FROM race_results rr
JOIN horses h ON h.id = rr.horse_id
WHERE rr.reward_amount > 0
ORDER BY rr.created_at DESC LIMIT 10;

-- User stats
SELECT * FROM users LIMIT 5;

-- Horse inventory
SELECT h.name, h.color, hs.level, hs.total_races, hs.total_wins
FROM horses h
JOIN horse_stats hs ON hs.horse_id = h.id
WHERE h.user_id = 'USER_UUID';
```

## Transaction Safety

User balance güncellemeleri **mutlaka** RaceResult ile aynı transaction'da:

```python
async with db.begin():
    # Update user balance
    # Create race result
    # Update horse stats
    # All or nothing
```

Bu atomik transaction'lar veri tutarlılığını garanti eder.
