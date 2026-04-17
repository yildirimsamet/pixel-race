# Deployment Planı — pixel-race

Bu doküman, pixel-race projesinin production ortamına (pixelrace.online) alınması için gereken adımları ve güncel durumu sıralar.

## Kısa Cevap: Şu anda yayına alınabilir mi?

**Hayır.** Birkaç blocker var. Aşağıdaki adımlar uygulanmadan deploy edilirse:
- Backend CORS/cookie hataları verecek (yanlış domain)
- Alt-domain'ler çözülmeyecek (nginx + SSL yok)
- IPFS upload'ları kırık (nft.storage classic API 2024'te kapandı)
- Backend tek worker ile boğulur
- Zayıf DB parolası

İyi haber: Secret'lar git geçmişinde sızmamış (`.gitignore` doğru kurulmuş; `git ls-files | grep .env` sadece `.example` dosyalarını döndürüyor).

## Mimari

```
Internet
   │
   ├─ 443 ─→ host nginx (Let's Encrypt SSL)
   │           ├─ pixelrace.online, www.* ─→ 127.0.0.1:3001  (frontend)
   │           ├─ api.pixelrace.online     ─→ 127.0.0.1:8000  (backend)
   │           └─ socket.pixelrace.online  ─→ 127.0.0.1:3000  (socket-server, WS)
   │
   └─ docker-compose.prod.yml
        ├─ postgres:15-alpine (volume: postgres_data_prod)
        ├─ backend     (FastAPI + gunicorn)
        ├─ socket-server (Node.js + socket.io)
        └─ frontend    (Next.js standalone)
```

## Kararlar

- **Reverse proxy**: Host üzerinde nginx + certbot (compose içinde değil).
- **IPFS**: Filebase (credential'lar hazır).
- **MongoDB logging**: Disable — no-op modda çalışacak.
- **SSL**: Let's Encrypt (`certbot --nginx`).

## Durum

### ✅ Hazır

- `.gitignore` `.env.*` hariç tutuyor, secret'lar commit'li değil
- Next.js 14 + `output: 'standalone'`, TypeScript strict
- FastAPI + SQLAlchemy 2.0 + Alembic (11+ migration), JWT wallet auth, rate limiter
- socket.io + CORS + graceful shutdown + `/health`
- Docker multi-stage build'ler, non-root user'lar
- `docker-compose.prod.yml`: healthcheck, restart: always, JSON log rotation, bridge network, postgres volume
- `frontend/.env.production` zaten `pixelrace.online` domain'lerine ayarlı

### 🔴 Blocker'lar

| # | Sorun | Konum |
|---|---|---|
| B1 | Backend URL/CORS `cafeqrmenu.online` (copy-paste artığı) | `backend/.env.production:42-45` |
| B2 | Compose port'ları public'e açık (8000, 3000, 3001) | `docker-compose.prod.yml:46,83,120` |
| B3 | Sunucuda nginx + SSL kurulu değil | host |
| B4 | DNS kayıtları yok | DNS paneli |
| B5 | Backend gunicorn `--workers 1` | `backend/Dockerfile:47` |
| B6 | IPFS provider `nft_storage` (kapanmış) | `backend/.env.production:31` |
| B7 | Zayıf `POSTGRES_PASSWORD=h1j3k5l7` | `backend/.env.production:10-11`, `.env.production:10`, `socket-server/.env.production:1` |
| B8 | `MONGODB_URL` yokken backend'in no-op çalıştığının doğrulanmamış olması | `backend/app/` |

### 🟡 Sonraki iterasyon (blocker değil)

- Access token TTL muhtemelen 30 gün (43200 dk) → 7–14 güne düşür
- `frontend/lib/api/client.ts:3` ve `frontend/hooks/useRaceSocket.ts:71` → env yüklenmezse sessizce `localhost`'a düşüyor
- `backend/alembic/env.py:27` → `localhost:5432` fallback
- Socket-server'da helmet yok
- `nginx.conf`'ta CSP header yok
- Env validation yok
- CI/CD, deployment script, test suite yok
- Lokal diskteki `backend/.env.production` gerçek Solana mainnet private key içeriyor — sunucuya scp ile güvenli aktar

---

## Adım Adım Deploy

### 1. DNS Kayıtları *(ilk başlat, yayılım zaman alır)*

Domain registrar (veya Cloudflare) panelinde A kayıtları:

| Ana | Değer |
|---|---|
| `pixelrace.online` | sunucu IP |
| `www.pixelrace.online` | sunucu IP |
| `api.pixelrace.online` | sunucu IP |
| `socket.pixelrace.online` | sunucu IP |

TTL 300s yap. Doğrula:

```bash
dig api.pixelrace.online +short
dig socket.pixelrace.online +short
```

Sertifika alımı DNS yayılmadan başarısız olur.

### 2. `backend/.env.production` Düzelt (B1 + B6 + B7)

```diff
- POSTGRES_PASSWORD=h1j3k5l7
+ POSTGRES_PASSWORD=<openssl rand -hex 24>

- IPFS_PROVIDER=nft_storage
+ IPFS_PROVIDER=filebase

- BACKEND_URL=https://api.cafeqrmenu.online
- SOCKET_SERVER_URL=https://socket.cafeqrmenu.online
- FRONTEND_URL=https://cafeqrmenu.online
- CORS_ORIGINS=https://cafeqrmenu.online,https://www.cafeqrmenu.online
+ BACKEND_URL=https://api.pixelrace.online
+ SOCKET_SERVER_URL=https://socket.pixelrace.online
+ FRONTEND_URL=https://pixelrace.online
+ CORS_ORIGINS=https://pixelrace.online,https://www.pixelrace.online
```

Aynı yeni `POSTGRES_PASSWORD` değerini şu üç dosyada senkron tut — `docker-compose.prod.yml:39` `${POSTGRES_PASSWORD}` olarak expand ediyor:
- `backend/.env.production:10-11`
- `.env.production:10` (root)
- `socket-server/.env.production:1`

### 3. MongoDB No-op Doğrula (B8)

`backend/app/` altındaki mongo logging modülünü (`services/mongo_logger.py` veya benzeri) oku:

- `MONGODB_URL` boşken startup exception atıyor mu? Atıyorsa guard ekle (`if not settings.MONGODB_URL: return`).
- Log yazma çağrıları sessizce bypass oluyor mu?

### 4. Backend Worker Sayısı (B5)

`backend/Dockerfile:47`:

```diff
- CMD ["gunicorn", "app.main:app", "--workers", "1", ...]
+ CMD ["gunicorn", "app.main:app", "--workers", "4", ...]
```

Sunucu CPU'suna göre: 2 vCPU → 3, 4 vCPU → 5. Kural: `(2 × CPU) + 1`.

### 5. Compose Port'larını Localhost'a Bind Et (B2)

`docker-compose.prod.yml`:

```diff
  backend:
-     - "8000:8000"
+     - "127.0.0.1:8000:8000"
  socket-server:
-     - "3000:3000"
+     - "127.0.0.1:3000:3000"
  frontend:
-     - "3001:3001"
+     - "127.0.0.1:3001:3001"
```

### 6. Sunucuda Host Nginx + Certbot (B3)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/pixelrace` dosyasını mevcut `nginx.conf`'u baz alarak oluştur:

```nginx
# Frontend
server {
    listen 80;
    server_name pixelrace.online www.pixelrace.online;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.pixelrace.online;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Socket server (WebSocket)
server {
    listen 80;
    server_name socket.pixelrace.online;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Aktif et:

```bash
sudo ln -s /etc/nginx/sites-available/pixelrace /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # varsa
sudo nginx -t && sudo systemctl reload nginx
```

### 7. SSL (Let's Encrypt)

DNS yayılımı doğrulandıktan sonra:

```bash
sudo certbot --nginx \
  -d pixelrace.online -d www.pixelrace.online \
  -d api.pixelrace.online -d socket.pixelrace.online
```

Certbot nginx config'ine SSL bloklarını otomatik ekler ve yenileme cron'unu kurar. Doğrula:

```bash
sudo certbot renew --dry-run
```

### 8. Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect için gerekli)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 9. Deploy

```bash
cd /path/to/pixel-race
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml ps
```

Alembic migration otomatik koşmuyorsa:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Doğrulama (Deploy Sonrası)

Bu checklist'i sırayla geç — herhangi biri başarısızsa durdur.

1. `dig api.pixelrace.online +short` → sunucu IP
2. `docker compose -f docker-compose.prod.yml ps` → tüm servisler `healthy`
3. `curl -fsS https://api.pixelrace.online/health` → 200
4. `curl -fsS https://pixelrace.online/api/health` → 200
5. WebSocket testi: `wscat -c "wss://socket.pixelrace.online/socket.io/?EIO=4&transport=websocket"`
6. Tarayıcıda `https://pixelrace.online`:
   - Cüzdan bağla, imzalayarak login ol — DevTools Network'te CORS hatası yok
   - Login cookie `Secure; HttpOnly; SameSite=Lax` ile set edildi
7. Test yarışına katıl:
   - Socket üzerinden `progress` event'leri akıyor (DevTools → Network → WS)
   - NFT mint tetiklenen durumda Filebase console'da yeni obje görünüyor
8. Küçük miktarla (örn. 0.001 SOL) mainnet transaction dene:
   - Backend log'unda `pending → confirmed` geçişi
   - `docker logs pixel-race-backend-prod --tail=200` hatasız
9. Güvenlik:
   - SSL Labs: `https://www.ssllabs.com/ssltest/analyze.html?d=pixelrace.online` → A/A+
   - `curl -I https://pixelrace.online` → HSTS, X-Frame-Options, X-Content-Type-Options
   - `curl -I http://pixelrace.online` → `301` → `https://`
10. Port tarama (yerel makineden):
    ```bash
    nmap -p 80,443,3000,3001,8000 <sunucu-ip>
    ```
    Sadece `80/443` açık olmalı; `3000/3001/8000` `closed`.

---

## Acil Durum

Sorun varsa:

```bash
# Logları incele
docker compose -f docker-compose.prod.yml logs -f --tail=200 backend
docker compose -f docker-compose.prod.yml logs -f --tail=200 socket-server
docker compose -f docker-compose.prod.yml logs -f --tail=200 frontend

# Bakım moduna geç (maintenance.html'i servis et)
sudo ln -sf /path/to/pixel-race/maintenance.html /var/www/html/index.html
# nginx'te proxy_pass yerine geçici static serve config'i

# Son sağlam image'a geri al
docker compose -f docker-compose.prod.yml down
git checkout <son-calisan-commit>
docker compose -f docker-compose.prod.yml up -d --build
```
