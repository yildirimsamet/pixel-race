# Sistem Mimarisi
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## Genel Bakış

**Pixel Race**: Web3 tabanlı at yarışı oyunu. Solana blockchain üzerinde NFT atlar, gerçek zamanlı yarışlar ve SOL ödülleri.

### Temel Özellikler

- Gerçek zamanlı at yarışları (Socket.io)
- SOL ödemeleri (at satın alma, yarış katılımı)
- NFT atlar (Solana blockchain)
- Segment tabanlı yarış mekaniği
- Wallet tabanlı kimlik doğrulama

## Üç Servis Mimarisi

### 1. Backend (FastAPI - Port 8000)

**Görevler:**
- REST API endpoints
- PostgreSQL veritabanı yönetimi
- APScheduler ile otomatik yarış oluşturma
- Solana entegrasyonu (ödeme doğrulama, NFT minting, ödül dağıtımı)
- Yarış mekaniği hesaplamaları

**Teknolojiler:**
- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL
- APScheduler
- Solana.py

### 2. Socket Server (Node.js - Port 3000)

**Görevler:**
- Socket.io ile gerçek zamanlı iletişim
- Yarış ilerleme güncellemeleri (100ms intervals)
- Segment tabanlı ilerleme hesaplamaları
- Yarış başlangıç ve bitiş event'leri

**Teknolojiler:**
- Express.js
- Socket.io
- Axios (backend communication)

### 3. Frontend (Next.js - Port 3001)

**Görevler:**
- React 18 + TypeScript + Tailwind CSS
- Solana wallet entegrasyonu (Phantom, Solflare)
- Gerçek zamanlı yarış görselleştirme
- At yönetimi ve satın alma arayüzü

**Teknolojiler:**
- Next.js 14
- TypeScript
- Tailwind CSS
- @solana/web3.js
- Socket.io-client

## Ana Veri Akışı

### 1. Yarış Oluşturma

```
Scheduler (her 3 dk)
  → PostgreSQL'e race ekle
  → Race waiting durumunda
```

### 2. Yarış Başlangıcı

```
Scheduler (min_horses karşılandıysa)
  → At segmentlerini hesapla (race_logic.py)
  → Socket server'a gönder (POST /races/:id/start)
  → Socket server 100ms'de bir ilerleme broadcast eder
```

### 3. Yarış Bitişi

```
Socket server (max_duration sonra)
  → Backend'e sonuçları gönder (POST /races/:id/end)
  → Backend ödülleri hesaplar ve SOL transfer eder
  → Race done durumuna geçer
```

## Önemli Dosya Referansları

### Backend Core

- `backend/app/main.py` - FastAPI app, middleware, exception handlers
- `backend/app/core/config.py` - Environment configuration
- `backend/app/core/constants.py` - Game mechanics constants
- `backend/app/core/security.py` - Auth & signature verification
- `backend/app/core/game_mechanics.py` - Performance modifiers

### Backend Services

- `backend/app/services/horse_factory.py` - Centralized horse creation
- `backend/app/services/race_logic.py` - Segment calculation
- `backend/app/services/scheduler.py` - APScheduler jobs
- `backend/app/services/solana_service.py` - Blockchain integration
- `backend/app/services/bot_service.py` - Bot auto-registration

### Backend API

- `backend/app/api/auth.py` - Wallet authentication
- `backend/app/api/horses.py` - Horse management + NFT minting
- `backend/app/api/races.py` - Race operations + prize distribution
- `backend/app/api/users.py` - User endpoints

### Frontend Core

- `frontend/lib/api.ts` - API client with retry & auth
- `frontend/lib/solana-transactions.ts` - SOL transfers
- `frontend/components/WalletProvider.tsx` - Solana wallet setup

### Frontend Hooks

- `frontend/hooks/useAuth.ts` - Authentication hook
- `frontend/hooks/useTransaction.ts` - Transaction hook
- `frontend/hooks/useRaceSocket.ts` - Real-time race updates

### Frontend Components

- `frontend/components/HorseCard.tsx` - Unified horse card (5 variants)
- `frontend/components/JoinRaceSection.tsx` - Race join UI
- `frontend/components/RaceCanvas.tsx` - Live race visualization

### Socket Server

- `socket-server/server.js` - Real-time race broadcasting

## Konfigürasyon

Detaylı environment variables için: [development.md](development.md)

### Backend
- `DATABASE_URL` - PostgreSQL connection
- `SOLANA_RPC_URL` - Blockchain RPC endpoint
- `SOLANA_PRIVATE_KEY` - Treasury wallet
- `SOCKET_SERVER_URL` - Socket server URL

### Socket Server
- `PORT` - Server port (3000)
- `BACKEND_URL` - Backend API URL
- `PROGRESS_UPDATE_INTERVAL` - Update frequency (100ms)

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - Socket server URL
- `NEXT_PUBLIC_SOLANA_NETWORK` - devnet/mainnet

## Security

### Implemented
- Wallet signature verification (PyNaCl Ed25519)
- JWT token authentication
- Transaction verification (amount, sender, receiver)
- Environment variable secrets
- SQL injection protection (SQLAlchemy ORM)
- CORS configuration

### Production İçin Eklenecek
- Rate limiting
- Treasury balance monitoring
- Multi-sig wallet for treasury
- Hardware wallet integration
- RPC endpoint authentication
- Transaction replay attack prevention

Detaylar: [web3-integration.md](web3-integration.md)
