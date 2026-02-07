# API Reference
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
Base URL: `http://localhost:8000`

## Authentication

### POST /auth/wallet-login

Wallet signature ile login.

**Request:**
```json
{
  "wallet_address": "base58_pubkey",
  "signature": "base64_signature",
  "message": "original_message"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

## Users

### GET /users/me

Authenticated user bilgisi.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "wallet_address": "base58_address",
  "created_at": "2025-01-01T00:00:00",
  "last_login": "2025-01-01T00:00:00"
}
```

## Horses

### GET /horses/

User'ın tüm atları.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Thunder",
    "color": "#FF5733",
    "birthdate": "2024-01-01",
    "age": 1,
    "in_race": false,
    "nft_mint_address": "base58_mint",
    "stats": {
      "level": 2,
      "weight": 450,
      "determination": 75,
      "energy": 100,
      "satiety": 80,
      "bond": 10,
      "fame": 25,
      "instinct": 15,
      "total_races": 5,
      "total_wins": 2,
      "total_earnings": 0.5
    }
  }
]
```

### POST /horses/boxes/buy

At satın alma (mystery box).

**Request:**
```json
{
  "max_level": 2,
  "transaction_signature": "base58_signature"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Lightning",
  "color": "#00FF00",
  "level": 2,
  "stats": {...}
}
```

### GET /horses/{id}/stats

At istatistikleri.

**Response:**
```json
{
  "level": 2,
  "weight": 450,
  "determination": 75,
  "energy": 100,
  "satiety": 80,
  "bond": 10,
  "fame": 25,
  "instinct": 15,
  "total_races": 5,
  "total_wins": 2,
  "total_earnings": 0.5
}
```

### POST /horses/{id}/mint-nft

NFT mint (şu an stub).

**Response:**
```json
{
  "nft_mint_address": "base58_mint",
  "nft_metadata_uri": "ipfs://..."
}
```

## Races

### GET /races/

Tüm yarışlar (filtrelenebilir).

**Query Parameters:**
- `status_filter`: waiting | racing | done

**Response:**
```json
[
  {
    "id": "uuid",
    "entry_fee": 0.03,
    "max_horses": 6,
    "min_horses": 5,
    "status": "waiting",
    "start_time": "2025-01-01T12:00:00",
    "level_requirement": 2,
    "prize_pool_sol": 0.15,
    "registered_horses_count": 4
  }
]
```

### POST /races/{id}/join

Yarışa katıl.

**Request:**
```json
{
  "horse_id": "uuid",
  "transaction_signature": "base58_signature"
}
```

**Response:**
```json
{
  "race_id": "uuid",
  "horse_id": "uuid",
  "status": "registered",
  "prize_pool_sol": 0.18
}
```

### GET /races/{id}/results

Yarış sonuçları.

**Response:**
```json
[
  {
    "id": "uuid",
    "horse_id": "uuid",
    "horse_name": "Thunder",
    "finish_position": 1,
    "finish_time_ms": 18500,
    "reward_amount": 0.09,
    "reward_tx_signature": "base58_signature"
  }
]
```

### POST /races/{id}/end

Yarış sonu (socket server'dan çağrılır).

**Request:**
```json
{
  "results": [
    {
      "horse_id": "uuid",
      "position": 1,
      "finish_time_ms": 18500
    }
  ]
}
```

**Response:**
```json
{
  "message": "Race ended successfully",
  "race_id": "uuid",
  "prize_distribution": {
    "1": 0.09,
    "2": 0.054,
    "3": 0.036
  }
}
```

## Admin Endpoints

**Tüm admin endpoint'leri `is_admin=True` olan kullanıcı gerektirir.**

### GET /admin/dashboard/stats

Dashboard için platform istatistikleri.

**Response:**
```json
{
  "total_users": 150,
  "new_users_today": 5,
  "new_users_this_week": 23,
  "total_horses": 320,
  "horses_nft_minted": 45,
  "horses_in_race": 18,
  "total_races": 567,
  "active_races": 3,
  "completed_races_today": 12,
  "total_prize_pool_sol": 1.25,
  "total_feedback": 28,
  "unreviewed_feedback": 5,
  "feedback_by_type": {
    "SUGGESTION": 10,
    "BUG_REPORT": 8,
    "COMPLAINT": 5,
    "QUESTION": 3,
    "OTHER": 2
  }
}
```

### GET /admin/dashboard/activity

Son aktiviteler (varsayılan 24 saat).

**Query Parameters:**
- `hours`: Kaç saat geriye bakılacak (varsayılan: 24)
- `limit`: Maksimum kayıt sayısı (varsayılan: 100)

**Response:**
```json
{
  "recent_users": [
    {
      "id": "uuid",
      "wallet_address": "base58_address",
      "created_at": "2025-01-01T12:00:00",
      "is_bot": false,
      "horse_count": 3
    }
  ],
  "recent_horses": [
    {
      "id": "uuid",
      "name": "Thunder",
      "color": "#FF5733",
      "level": 2,
      "created_at": "2025-01-01T12:00:00",
      "nft_mint_address": "base58_mint",
      "owner_wallet": "base58_address"
    }
  ],
  "recent_races": [
    {
      "id": "uuid",
      "status": "done",
      "level_requirement": 2,
      "entry_fee": 0.03,
      "prize_pool_sol": 0.15,
      "created_at": "2025-01-01T12:00:00",
      "winner_horse_name": "Thunder"
    }
  ],
  "recent_errors": []
}
```

**ÖNEMLİ:**
- `Horse.user_id` kullanılır (owner_id değil)
- `HorseStats.level` kullanılır (Horse.level yok)
- Kazanan at `RaceResult.finish_position = 1` ile bulunur (Race.winner_horse_id yok)

### GET /admin/dashboard/transactions

Transaction metrikleri (varsayılan 24 saat).

**Query Parameters:**
- `hours`: Kaç saat geriye bakılacak (varsayılan: 24)

**Response:**
```json
{
  "total_volume_24h": 2.5,
  "horse_purchases": {
    "count": 15,
    "volume": 1.2
  },
  "race_entries": {
    "count": 45,
    "volume": 0.9
  },
  "prizes_distributed": {
    "count": 12,
    "volume": 0.4
  },
  "failed_transactions": 2
}
```

### GET /admin/logs/errors/recent

Son hata logları (MongoDB'den).

**Query Parameters:**
- `limit`: Maksimum log sayısı (varsayılan: 50, max: 200)
- `hours`: Kaç saat geriye bakılacak (varsayılan: 24, max: 168)

**Response:**
```json
{
  "errors_count": 5,
  "period_hours": 24,
  "errors": [
    {
      "id": "object_id",
      "timestamp": "2025-01-01T12:00:00",
      "level": "ERROR",
      "message": "Transaction failed",
      "action": "BUY_HORSE",
      "step": "VERIFY_TX",
      "request_id": "uuid",
      "user_id": "uuid",
      "metadata": {}
    }
  ]
}
```

### GET /admin/feedback

Tüm kullanıcı feedback'leri.

**Query Parameters:**
- `status_filter`: NEW | REVIEWED | RESOLVED | CLOSED
- `type_filter`: SUGGESTION | BUG_REPORT | COMPLAINT | QUESTION | OTHER
- `limit`: Maksimum kayıt (varsayılan: 50, max: 500)
- `offset`: Başlangıç offset'i (varsayılan: 0)

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "BUG_REPORT",
    "subject": "Race not starting",
    "message": "Race stuck in waiting...",
    "email": "user@example.com",
    "status": "NEW",
    "admin_notes": null,
    "user_id": "uuid",
    "user_wallet": "base58_address",
    "created_at": "2025-01-01T12:00:00",
    "updated_at": "2025-01-01T12:00:00"
  }
]
```

### PATCH /admin/feedback/{feedback_id}

Feedback güncelleme.

**Request:**
```json
{
  "status": "RESOLVED",
  "admin_notes": "Fixed in v1.2.0"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "RESOLVED",
  "admin_notes": "Fixed in v1.2.0",
  "updated_at": "2025-01-01T13:00:00"
}
```

## Test Endpoints

### POST /races/create-test-race

Test yarışı oluştur.

**Query Parameters:**
- `level`: 1 | 2 | 3

**Response:**
```json
{
  "id": "uuid",
  "level_requirement": 1,
  "status": "waiting"
}
```

### POST /races/{id}/auto-register-horses

Otomatik bot atları ekle.

**Response:**
```json
{
  "message": "Auto-registered horses",
  "registered_count": 3
}
```

### POST /races/{id}/start

Yarışı manuel başlat.

**Response:**
```json
{
  "message": "Race started",
  "race_id": "uuid"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid transaction signature"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Race not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "max_level"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

## Treasury Protection

**Bot Speed Boost Mechanism** - Automatic treasury balance protection

When treasury balance falls below `TREASURY_LOW_BALANCE_THRESHOLD` (default: 5 SOL):
- Bot horses receive automatic speed boost (2-4 seconds faster)
- Increases bot win rate to recover entry fees
- Prevents treasury depletion during low balance periods
- Automatically deactivates when balance recovers

Configuration:
- `TREASURY_LOW_BALANCE_THRESHOLD`: Activation threshold (SOL)
- `TREASURY_PROTECTION_CONFIG.bot_speed_boost_min_seconds`: Min boost (2s)
- `TREASURY_PROTECTION_CONFIG.bot_speed_boost_max_seconds`: Max boost (4s)

This mechanism ensures platform sustainability during low liquidity periods.

## Rate Limiting

Şu an yok. Production için eklenecek.

Detaylar: [web3-integration.md](web3-integration.md) - Production Checklist
