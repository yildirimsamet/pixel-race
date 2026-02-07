# Proactive Refactoring Protocol

## Temel Kural
- **Kullanıcı açıkça istemediği sürece dokümantasyon oluşturma**
**Bir sorun tespit edildiğinde önce tara, sonra refactor et**

## Adım 1: Duplicate Detection

Her kod değişikliğinde benzer pattern'ları tara:

```bash
# Backend patterns
Grep "Horse\(" backend/              # At oluşturma yerleri
Grep "HorseStats\(" backend/         # Stat oluşturma yerleri
Grep "from.*import.*HorseFactory" backend/

# Frontend patterns
Grep "sendTransaction" frontend/    # Transaction logic
Grep "useTransaction" frontend/     # Transaction hooks
Grep "import.*HorseCard" frontend/
```

## Adım 2: Impact Analysis

Her değişiklikten sonra kontrol et:

- Aynı function kullanan yerler?
- Backend değişti → Frontend API type'ları güncel mi?
- Model değişti → Migration gerekli mi?
- Service değişti → Test dosyaları güncel mi?

## Adım 3: DRY Check & Auto-Refactor

**2+ yerde aynı kod → Sormadan refactor et**

| Duplicate Tipi | Çözüm | Lokasyon |
|----------------|-------|----------|
| Backend business logic | Factory/Service class | `backend/app/services/` |
| Frontend UI components | Shared component | `frontend/components/` |
| Frontend hooks/logic | Custom hook | `frontend/hooks/` |
| API call patterns | API utility | `frontend/lib/api/` |
| Validation logic | Utility function | `backend/app/utils/` |

## Adım 4: Proactive Report

```
❌ TESPIT: [pattern] 3 dosyada duplicate
   - dosya1.py (satır 45-67)
   - dosya2.py (satır 123-145)
   - dosya3.tsx (satır 89-102)

✅ ÇÖZÜM: [ServiceName] oluşturarak refactor ediyorum
   → Yeni servis: backend/app/services/[service_name].py
   → Güncellenen dosyalar: 3
   → Silinen duplicate kod: ~120 satır
```

## Asla Yapma

- Sadece söylenen dosyayı düzelt
- "Kullanıcı demedi" bahanesi
- Benzer sorunları görmezden gel
- Refactor sonrası eski duplicate'ları bırak

## Gerçek Örnekler

### Örnek 1: Horse Creation (2025-10-26)

**Sorun**: At oluşturma logic'i `buy_horse_use_case.py`, `rewards.py`, `bot_service.py` dosyalarında duplicate

**Aksiyon**: `HorseFactory` servisi oluşturuldu, 3 dosya refactor edildi

**Sonuç**: ~150 satır duplicate kod silindi, merkezi yönetim sağlandı

### Örnek 2: HorseCard Component (2025-10-26)

**Sorun**: At kartı UI'ı 5 farklı sayfada farklı şekilde implement edilmiş

**Aksiyon**: `HorseCard` component'i 5 variant desteğiyle güçlendirildi

**Sonuç**: ~100 satır duplicate kod silindi, tutarlı UI sağlandı
