# Yarış Mekaniği
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
## Segment Tabanlı Sistem

Her at için **10 segment** hesaplanır (`backend/app/services/race_logic.py`):

```python
Segment = {
    "checkpoint": 10,  # 10%, 20%, ..., 100%
    "time": 2500       # Bu segment için ms
}
```

## Segment Hesaplama Faktörleri

### 1. Temel Faktörler

- **Base time** (seviyeye göre):
  - Level 1: 30s
  - Level 2: 20s
  - Level 3: 15s

- **Age factor**: Yaş → daha yavaş (özellikle >15 yaş)
- **Weight factor**: Ağırlık → daha yavaş (optimal: 400-500kg)
- **Determination factor**: Yüksek kararlılık → daha hızlı

### 2. Segment Özellikleri

```python
# Yüksek kararlılık (>70): Son segmentlerde hız artışı
if segment > 7 and determination > 70:
    speed_boost = 1.0 + ((determination - 70) / 100)

# Yaşlı atlar (>15): Son segmentlerde yorgunluk
if segment > 6 and age > 15:
    energy_penalty = 1.0 + ((age - 15) / 20)

# Genç atlar (<5): Orta segmentlerde hız artışı
if 4 <= segment <= 7 and age < 5:
    youth_boost = 1.0 - ((5 - age) / 20)

# Ağır atlar (>700kg): Yokuşta yavaşlama (segment 3-5)
if 3 <= segment <= 5 and weight > 700:
    weight_penalty = 1.0 + ((weight - 700) / 1000)
```

### 3. HorseStats Modifiers

`backend/app/core/game_mechanics.py`:

```python
def calculate_performance_modifier(stats: HorseStats) -> float:
    # Optimal ağırlık: 400-500kg
    # Tokluk cezası: >50 satiety
    # Enerji cezası: >50 energy
    # Return: 0.7-1.0 (düşük = daha yavaş)
```

## Socket Server İlerleme Hesaplama

Client-side segment interpolation (`socket-server/server.js:118`):

```javascript
calculateProgressFromSegments(elapsed, segments) {
    let accumulatedTime = 0;
    let lastCheckpoint = 0;

    for (segment of segments) {
        if (elapsed <= accumulatedTime + segment.time) {
            // Bu segmentteyiz - interpolate et
            segmentProgress = (elapsed - accumulatedTime) / segment.time
            segmentDistance = segment.checkpoint - lastCheckpoint
            return lastCheckpoint + (segmentDistance * segmentProgress)
        }
        accumulatedTime += segment.time
        lastCheckpoint = segment.checkpoint
    }
    return 100 // Yarış bitti
}
```

## Game Constants

`backend/app/core/constants.py`:

```python
RACE_CONFIG = {
    1: {"entry_fee": 0.01, "max_horses": 8, "min_horses": 6, "base_time_ms": 30000},
    2: {"entry_fee": 0.03, "max_horses": 6, "min_horses": 5, "base_time_ms": 20000},
    3: {"entry_fee": 0.05, "max_horses": 6, "min_horses": 5, "base_time_ms": 15000}
}

REWARD_DISTRIBUTION = {1: 0.5, 2: 0.3, 3: 0.2}  # %50/%30/%20

HORSE_ATTRIBUTES = {
    "age": {"min": 1, "max": 20},
    "weight": {"min": 300, "max": 1000},
    "determination": {"min": 0, "max": 100}
}

RACE_LOGIC = {
    "num_segments": 10,
    "segment_speed_variation": {"min": 0.6, "max": 1.4},
    "high_determination_threshold": 70,
    "old_age_threshold": 15,
    "young_age_threshold": 5,
    "heavy_weight_threshold": 700
}
```

## Kritik Implementation Detayları

### 1. Yarış Segmentleri - Server Side Only

**KRITIK:** Yarış segmentleri ve finish time'lar client'a GÖNDERİLMEZ.

**Neden?**
- Hile önleme - Client finish time'ı göremez
- Adil yarış - Tüm clientlar aynı anda final sonucu görür

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

### 2. Scheduler Race Creation Logic

Manuel yarış oluşturmadan önce scheduler mantığını kontrol et:

```python
# Her 3 dakikada otomatik oluşturulur
# 3 level için kademeli start time (0, 60, 120 saniye delay)

existing = await race_repo.get_by_level_and_status(level, RaceStatus.waiting)
if existing:
    return existing  # Mevcut yarışı kullan
```

## Socket.io Events

### Client → Server
```javascript
socket.emit('joinRace', { race_id })
socket.emit('leaveRace', { race_id })
```

### Server → Client
```javascript
// Yarış başladı
socket.on('raceStart', (data) => {
  // data: {race_id, horses: [{horse_id, horse_name, color}], start_time}
})

// İlerleme güncelleme (100ms intervals)
socket.on('raceProgress', (data) => {
  // data: {race_id, elapsed, horses: [{horse_id, progress, finished}]}
})

// Yarış bitti
socket.on('raceEnd', (data) => {
  // data: {race_id, results: [{horse_id, position, finish_time_ms}]}
})

// Mevcut durum (geç katılanlar için)
socket.on('raceState', (data) => {
  // data: {race_id, start_time, elapsed, finished}
})
```

Detaylar: [services.md](services.md) - Scheduler Jobs
