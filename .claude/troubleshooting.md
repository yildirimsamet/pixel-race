# Troubleshooting
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## Yaygın Hatalar ve Çözümler

### 1. "Race segments must be calculated server-side"

**Hata:** Client'a yarış segmentleri gönderilmiş.

**Yanlış:**
```python
# Client'a segment gönderme
return {"horses": [{..., "segments": segments}]}
```

**Doğru:**
```python
# Sadece metadata gönder
public_horses = [{
    "horse_id": h.horse_id,
    "horse_name": h.horse_name,
    "color": h.color
}]
# Segments socket server'da kalır
```

**Neden?**
- Hile önleme - Client finish time'ı göremez
- Adil yarış - Tüm clientlar aynı anda final sonucu görür

### 2. "Race already exists and is active"

**Hata:** Manuel yarış oluşturulmaya çalışılmış ama scheduler zaten oluşturmuş.

**Çözüm:**
```python
existing = await race_repo.get_by_level_and_status(level, RaceStatus.waiting)
if existing:
    return existing  # Mevcut yarışı kullan
```

Scheduler otomatik yarış oluşturur (her 3 dakikada).

### 3. "Transaction verification failed"

**Hata:** SOL transfer signature doğrulaması başarısız.

**Yanlış:**
```typescript
// Signature eksik veya yanlış format
await api.horses.buyBox({
    max_level: 2,
    transaction_signature: null  // ❌
})
```

**Doğru:**
```typescript
// Frontend
const signature = await sendAndConfirmTransaction(...)
await api.horses.buyBox({
    max_level: 2,
    transaction_signature: signature  // base58 string ✅
})
```

**Kontrol edilenler:**
- Sender wallet adresi
- Receiver (treasury) adresi
- Amount (expected_amount_sol ± tolerance)
- Confirmations

### 4. "Horse stats not initialized"

**Hata:** At oluşturulmuş ama statlar eksik (bond, fame, instinct yok).

**Yanlış (Manuel oluşturma):**
```python
horse = Horse(...)
db.add(horse)
await db.flush()

stats = HorseStats(horse_id=horse.id, ...)  # Eksik statlar! ❌
db.add(stats)
```

**Doğru (HorseFactory kullan):**
```python
from app.services.horse_factory import HorseFactory

factory = HorseFactory()
horse, stats = await factory.create_horse(
    db=db,
    user_id=user.id,
    level=2
)
# Bond, fame, instinct otomatik eklendi! ✅
```

### 5. "Database migration failed"

**Hata:** Migration alembic revision conflict.

**Çözüm:**
```bash
# Mevcut migration'ları kontrol et
./backend/migrate.sh history

# Conflicting revision'ı düzelt
# alembic/versions/ klasöründe down_revision'ları kontrol et

# Yeniden dene
./backend/migrate.sh upgrade
```

**Önleme:**
- Her zaman `./backend/migrate.sh create` kullan
- Manuel revision düzenleme
- Migration'ları sırayla uygula

### 6. "Docker volume permission denied"

**Hata:** PostgreSQL container başlamıyor.

**Çözüm:**
```bash
# Volume'leri temizle
docker-compose down -v

# Yeniden başlat
docker-compose up --build
```

**Not:** `-v` bayrağı tüm veriyi siler. Production'da kullanma!

### 7. "Wallet not connected"

**Hata:** Frontend'de wallet bağlantısı yok.

**Kontrol et:**
```javascript
const { connected, publicKey } = useWallet();

if (!connected) {
  // Wallet bağlama UI göster
}
```

**Yaygın nedenler:**
- Phantom/Solflare extension yüklü değil
- Network mismatch (devnet vs mainnet)
- Popup blocker

### 8. "Race not starting automatically"

**Hata:** Scheduler yarışı başlatmıyor.

**Kontrol et:**
```bash
# Scheduler logs
docker-compose logs -f backend | grep "Scheduler"

# Race status
curl http://localhost:8000/races/?status_filter=waiting
```

**Yaygın nedenler:**
- `min_horses` karşılanmamış
- `start_time` henüz gelmemiş
- Scheduler job disabled

**Çözüm:**
```bash
# Bot atları ekle
POST /races/{id}/auto-register-horses

# Manuel başlat (test için)
POST /races/{id}/start
```

### 9. "Socket connection failed"

**Hata:** Frontend socket server'a bağlanamıyor.

**Kontrol et:**
```javascript
console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
```

**Çözüm:**
```bash
# Socket server çalışıyor mu?
curl http://localhost:3000/health

# CORS ayarları
# socket-server/.env
CORS_ORIGIN=*  # veya http://localhost:3001
```

### 10. "NFT minting failed"

**Hata:** NFT mint edilemiyor.

**Not:** NFT minting şu an **STUB**. Production için implement edilmeli:

```python
# ⚠️ ŞU AN PLACEHOLDER DÖNER
async def mint_horse_nft(...):
    # TODO: Implement Metaplex integration
    return f"mock_mint_{horse_id}"
```

**Production için gerekli:**
- Metaplex Token Metadata Program
- IPFS/Arweave metadata upload
- Master Edition creation
- Associated Token Account setup

Detaylar: [web3-integration.md](web3-integration.md)

### 11. "Duplicate code detected"

**Sorun:** Aynı logic birden fazla dosyada.

**Çözüm:** Proactive refactoring protocol uygula.

Detaylar: [refactoring-protocol.md](refactoring-protocol.md)

### 12. "API 500 Internal Server Error"

**Kontrol et:**
```bash
# Backend logs
docker-compose logs -f backend | tail -50

# Database connection
docker exec -it pixel-race-postgres psql -U postgres -d pixel_race -c "SELECT 1;"

# Environment variables
docker exec -it pixel-race-backend env | grep DATABASE_URL
```

**Yaygın nedenler:**
- Database connection failed
- Environment variable eksik
- Unhandled exception

## Debug Workflows

### Backend Debug

```bash
# 1. Logs
docker-compose logs -f backend

# 2. Database
docker exec -it pixel-race-postgres psql -U postgres -d pixel_race

# 3. API test
curl http://localhost:8000/health
curl http://localhost:8000/races/
```

### Frontend Debug

```javascript
// 1. Console logs
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);

// 2. Network tab (Chrome DevTools)
// Check API requests/responses

// 3. React DevTools
// Component state inspection
```

### Database Debug

```sql
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
```

## Emergency Recovery

### Reset Everything (⚠️ Development Only)

```bash
# Stop all containers
docker-compose down -v

# Remove all Docker artifacts
docker system prune -a --volumes

# Rebuild
docker-compose up --build
```

**UYARI:** Tüm veriyi siler!

### Database Recovery

```bash
# Backup
docker exec -it pixel-race-postgres pg_dump -U postgres pixel_race > backup.sql

# Restore
cat backup.sql | docker exec -i pixel-race-postgres psql -U postgres pixel_race
```

## Performance Issues

### Slow API Responses

**Kontrol et:**
- Database indexes
- N+1 queries (SQLAlchemy eager loading)
- Connection pooling

### Socket Lag

**Kontrol et:**
- `PROGRESS_UPDATE_INTERVAL` (default 100ms)
- Network latency
- Client-side rendering performance

### High Memory Usage

**Kontrol et:**
- Memory leaks (backend/frontend)
- Database connection leaks
- Large response payloads

## Daha Fazla Yardım

- [Architecture](architecture.md) - Sistem mimarisi
- [Database](database.md) - Database schema
- [Development](development.md) - Setup ve komutlar
- [API Reference](api-reference.md) - Endpoint'ler
