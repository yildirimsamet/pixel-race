# Development Guide

## Quick Start
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
```bash
# Tüm servisleri başlat
docker-compose up --build

# Logları izle
docker-compose logs -f backend
docker-compose logs -f socket-server
docker-compose logs -f frontend
```

**Ports:**
- Backend: http://localhost:8000
- Socket Server: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL: localhost:5432

## Backend (FastAPI)

### Setup

```bash
cd backend

# Virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Dependencies
pip install -r requirements.txt
```

### Development Server

```bash
# Auto-reload enabled
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Migrations

```bash
# Create migration
./backend/migrate.sh create "add_new_field"

# Apply migrations
./backend/migrate.sh upgrade

# Rollback
./backend/migrate.sh downgrade 1

# History
./backend/migrate.sh history
```

**Detaylı bilgi:** `backend/MIGRATIONS.md`

### Testing

```bash
# Test endpoints
python test_endpoints.py

# Shell script
./test_all_endpoints.sh
```

## Socket Server (Node.js)

### Setup

```bash
cd socket-server

# Dependencies
npm install
```

### Development

```bash
# Auto-reload (nodemon)
npm run dev

# Production
npm start
```

### Environment

```bash
PORT=3000
BACKEND_URL=http://backend:8000
CORS_ORIGIN=*
PROGRESS_UPDATE_INTERVAL=100  # ms
RACE_CLEANUP_DELAY=60000      # ms
```

## Frontend (Next.js)

### Setup

```bash
cd frontend

# Dependencies
npm install
```

### Development

```bash
# Development server (port 3001)
npm run dev

# Production build
npm run build
npm run start

# Lint
npm run lint

# Type check
npm run type-check
```

### Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Database (PostgreSQL)

### Docker Container

```bash
# Bağlan
docker exec -it pixel-race-postgres psql -U postgres -d pixel_race

# Komutlar
\dt                              # List tables
\d horses                        # Table schema
\q                               # Quit
```

### Useful Queries

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

-- User stats
SELECT * FROM users LIMIT 5;
```

## Docker Commands

### Full Stack

```bash
# Build & start
docker-compose up --build

# Start (detached)
docker-compose up -d

# Stop
docker-compose down

# Stop & remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild specific service
docker-compose up --build backend
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Filter
docker-compose logs -f backend | grep "ERROR\|WARNING"
docker-compose logs -f backend | grep "Solana\|Transaction"
docker-compose logs -f backend | grep "Scheduler\|Race"
```

### Container Management

```bash
# List containers
docker ps

# Exec into container
docker exec -it pixel-race-backend bash
docker exec -it pixel-race-postgres psql -U postgres -d pixel_race

# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a
```

## Environment Variables

### Backend

`docker-compose.yml` veya `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pixel_race

# Security
SECRET_KEY=secret-key-for-jwt-tokens-only-change-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Services
SOCKET_SERVER_URL=http://socket-server:3000

# Game Config
RACE_CREATE_INTERVAL_MINUTES=3
RACE_START_DELAY_MINUTES=3

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=base58_encoded_treasury_key

# Pricing
HORSE_PRICE_LEVEL_1=0.5
HORSE_PRICE_LEVEL_2=1.5
HORSE_PRICE_LEVEL_3=3.0
```

## Debugging

### Backend Logs

```bash
# Docker logs
docker-compose logs -f backend | grep "ERROR\|WARNING"

# Specific patterns
docker-compose logs -f backend | grep "Solana\|Transaction"
docker-compose logs -f backend | grep "Scheduler\|Race"
```

### Frontend Debug

```javascript
// localStorage'daki token
console.log(localStorage.getItem('token'))

// Wallet connection
console.log(useWallet()) // {connected, publicKey, signMessage, ...}

// API errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data)
    return Promise.reject(error)
  }
)
```

### Database Inspection

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

## Git Workflow

### Branch Strategy

- `master` - Main branch (deployment)
- Feature branches - `feature/nft-minting`, `feature/race-ui`

### Commit Convention

```
feat: Add Metaplex NFT minting
fix: Resolve race segment calculation bug
docs: Update documentation
refactor: Centralize horse creation with HorseFactory
```

**Refactoring commit'leri:**

```
refactor: Centralize horse creation logic

- Created HorseFactory service
- Refactored buy_horse_use_case.py, bot_service.py, rewards.py
- Removed ~150 lines of duplicate code
- All horses now have bond/fame/instinct stats
```

## Test Scenarios

### 1. At Satın Alma + Yarışa Katılma

```bash
# 1. Health check
curl http://localhost:8000/health
curl http://localhost:3000/health

# 2. Wallet bağla (frontend)
# 3. At satın al
POST /horses/boxes/buy {max_level: 1, transaction_signature: "..."}

# 4. Waiting yarışı bul
GET /races/?status_filter=waiting

# 5. Yarışa katıl
POST /races/{id}/join {horse_id: "...", transaction_signature: "..."}

# 6. Yarış başlayana kadar bekle (scheduler)
# 7. Socket.io ile yarışı izle
```

### 2. Full Race Cycle

```bash
cd backend
python test_endpoints.py
```

## Production Deployment

### Backend
- [ ] Gerçek Metaplex NFT minting
- [ ] IPFS/Arweave metadata storage
- [ ] Paid RPC provider (QuickNode/Helius)
- [ ] Rate limiting middleware
- [ ] Sentry/LogRocket error tracking
- [ ] Database connection pooling
- [ ] Redis caching layer
- [ ] Multi-sig treasury wallet

### Frontend
- [ ] Production RPC endpoints
- [ ] Error boundary improvements
- [ ] Loading state UX
- [ ] Transaction retry logic
- [ ] Explorer link integration
- [ ] Mobile responsiveness
- [ ] PWA support

### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Mainnet deployment config
- [ ] SSL certificates
- [ ] Database backups
- [ ] Monitoring & alerting (Grafana/Prometheus)
- [ ] Log aggregation (ELK/Loki)

## Useful Links

### Docs
- [FastAPI](https://fastapi.tiangolo.com)
- [Next.js](https://nextjs.org/docs)
- [Socket.io](https://socket.io/docs)
- [SQLAlchemy](https://docs.sqlalchemy.org)

### Solana
- [Devnet Faucet](https://faucet.solana.com)
- [Explorer](https://explorer.solana.com/?cluster=devnet)
- [Metaplex](https://docs.metaplex.com)
