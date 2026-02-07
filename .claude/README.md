# Pixel Race - Claude Code Rehberi

Web3 tabanlı at yarışı oyunu. FastAPI (backend), Next.js (frontend), Socket.io (real-time).

## Kritik Kurallar

- **Proje Docker'da çalışıyor**
- **Yapılması isteneni yap; ne fazla, ne eksik**
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
- **Frontend işleri → frontend agent, Backend işleri → backend agent, DevOps işleri → devops agent**

## Proactive Refactoring

**2+ yerde aynı kod görürsen → sormadan refactor et**

Detaylar: [refactoring-protocol.md](refactoring-protocol.md)

## En Sık Kullanılanlar

### At Oluşturma
```python
from app.services.horse_factory import HorseFactory
factory = HorseFactory()
horse, stats = await factory.create_horse(db, user_id, level=2)
```

### At Kartı Gösterme
```typescript
import HorseCard from '@/components/HorseCard';
<HorseCard horse={horse} variant="default" />
```

### Transaction Doğrulama
```python
from app.services.solana_service import solana_service
verified = await solana_service.verify_transaction(
    tx_signature, from_wallet, to_wallet, amount_sol
)
```

### Database Migration
```bash
./backend/migrate.sh create "add_new_field"
./backend/migrate.sh upgrade
```

### Duplicate Tespit
```bash
Grep "Horse\(" backend/              # Backend patterns
Grep "sendTransaction" frontend/    # Frontend patterns
```

## Dokümantasyon Yapısı

| Dosya | İçerik |
|-------|--------|
| [architecture.md](architecture.md) | Sistem mimarisi, servisler, veri akışı |
| [database.md](database.md) | Modeller, ilişkiler, migrations |
| [race-mechanics.md](race-mechanics.md) | Yarış sistemi, segment hesaplama |
| [web3-integration.md](web3-integration.md) | Solana, NFT, transaction'lar |
| [services.md](services.md) | Backend servisler (HorseFactory, Scheduler) |
| [api-reference.md](api-reference.md) | API endpoint'leri |
| [frontend.md](frontend.md) | Hooks, components, patterns |
| [development.md](development.md) | Setup, komutlar, debugging |
| [refactoring-protocol.md](refactoring-protocol.md) | Proactive refactoring kuralları |
| [troubleshooting.md](troubleshooting.md) | Yaygın hatalar ve çözümler |

## Hızlı Başlangıç

```bash
# Tüm servisleri başlat
docker-compose up --build

# Logları izle
docker-compose logs -f backend

# Database migration
./backend/migrate.sh upgrade
```

Detaylı bilgi için: [development.md](development.md)

## Önemli Dosyalar

**Backend:**
- `backend/app/services/horse_factory.py` - Merkezi at oluşturma
- `backend/app/services/race_logic.py` - Yarış segment hesaplama
- `backend/app/services/scheduler.py` - Otomatik yarış yönetimi
- `backend/app/services/solana_service.py` - Web3 entegrasyonu

**Frontend:**
- `frontend/components/HorseCard.tsx` - Merkezi at kartı (5 variant)
- `frontend/hooks/useAuth.ts` - Wallet authentication
- `frontend/hooks/useRaceSocket.ts` - Real-time yarış
- `frontend/lib/solana-transactions.ts` - SOL transfer'leri

Tam liste: [architecture.md](architecture.md)
