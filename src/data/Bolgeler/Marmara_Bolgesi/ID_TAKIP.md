# Marmara Bölgesi ID Takip Dosyası - YENİ HİYERARŞİK SİSTEM

## 🆕 YENİ HİYERARŞİK KODLAMA SİSTEMİ

### 📋 Kod Yapısı
```
[İl Kodu: 2 hane] + [Yarım İl: 1 hane] + [Seviye: 1 hane] + [Sıra No: N hane]
```

### 🔢 Seviye Kodları ve Hane Sayıları
| Seviye | Kodu | Sabit Baş | Sıra No Hane | Toplam Hane |
|--------|------|-----------|--------------|-------------|
| İl | — | 34 | 6 | 8 |
| İlçe | 1 | 341/342 | 5 | 9 |
| Mahalle | 2 | 3412/3422 | 6 | 10 |
| Cadde | 3 | 3413/3423 | 7 | 11 |
| Sokak | 4 | 3414/3424 | 8 | 12 ← FINAL |

**📝 Not:** Bina ve POI bilgileri sokak seviyesinde metadata olarak tutulur.

### 🗺️ İstanbul Yarım İl Kodları
- **341** - İstanbul Anadolu Yakası
- **342** - İstanbul Avrupa Yakası
- **520** - Ordu (yarım il: 0)
- **380** - Kayseri (yarım il: 0)

---

## ✅ TAMAMLANAN VERILER

### 🏙️ İller (11 adet) - 8 Hane
- **34000000** - İstanbul (Plaka: 34) ✅
- **16000000** - Bursa (Plaka: 16) ⏳
- **10000000** - Balıkesir (Plaka: 10) ⏳
- **17000000** - Çanakkale (Plaka: 17) ⏳
- **22000000** - Edirne (Plaka: 22) ⏳
- **39000000** - Kırklareli (Plaka: 39) ⏳
- **59000000** - Tekirdağ (Plaka: 59) ⏳
- **77000000** - Yalova (Plaka: 77) ⏳
- **54000000** - Sakarya (Plaka: 54) ⏳
- **41000000** - Kocaeli (Plaka: 41) ⏳
- **11000000** - Bilecik (Plaka: 11) ⏳

### 🏘️ İstanbul İlçeleri (39 adet) - 9 Hane

#### 🌍 Avrupa Yakası (25 ilçe) ✅ TAMAMLANDI
**Kod Başlangıcı:** 342 (Yarım İl: 2, Seviye: 1)
**ID Aralığı:** 342100001 - 342100025

- 342100001 | Arnavutköy ✅
- 342100002 | Avcılar ✅
- 342100003 | Bağcılar ✅
- 342100004 | Bahçelievler ✅
- 342100005 | Bakırköy ✅
- 342100006 | Başakşehir ✅
- 342100007 | Bayrampaşa ✅
- 342100008 | Beşiktaş ✅
- 342100009 | Beylikdüzü ✅
- 342100010 | Beyoğlu ✅
- 342100011 | Büyükçekmece ✅
- 342100012 | Çatalca ✅
- 342100013 | Esenler ✅
- 342100014 | Esenyurt ✅
- 342100015 | Eyüpsultan ✅
- 342100016 | Fatih ✅
- 342100017 | Gaziosmanpaşa ✅
- 342100018 | Güngören ✅
- 342100019 | Kağıthane ✅
- 342100020 | Küçükçekmece ✅
- 342100021 | Sarıyer ✅
- 342100022 | Silivri ✅
- 342100023 | Şişli ✅
- 342100024 | Sultangazi ✅
- 342100025 | Zeytinburnu ✅

#### 🌏 Anadolu Yakası (14 ilçe) ✅ TAMAMLANDI
**Kod Başlangıcı:** 341 (Yarım İl: 1, Seviye: 1)
**ID Aralığı:** 341100001 - 341100014

- 341100001 | Adalar ✅
- 341100002 | Ataşehir ✅
- 341100003 | Beykoz ✅
- 341100004 | Çekmeköy ✅
- 341100005 | Kadıköy ✅
- 341100006 | Kartal ✅
- 341100007 | Maltepe ✅
- 341100008 | Pendik ✅
- 341100009 | Sancaktepe ✅
- 341100010 | Sultanbeyli ✅
- 341100011 | Şile ✅
- 341100012 | Tuzla ✅
- 341100013 | Ümraniye ✅
- 341100014 | Üsküdar ✅

---

## 🗺️ OSM ENTEGRASYONU

### ✅ İstanbul Her İki Yakası Özellikleri
- **Koordinat Sistemi:** WGS84 (Lat/Lon)
- **Sınır Bilgileri:** North/South/East/West bounds
- **OSM ID'ler:** Mevcut (updated_with_osm: true)
- **Veri Kaynağı:** turkey-latest.osm.pbf (568MB)

### 📊 Örnek Yeni Sistem Veri Yapısı
```json
{
  "id": 342100008,
  "name": "BEŞIKTAŞ",
  "parent_id": 34000000,
  "yarim_il": 2,
  "coordinates": {
    "lat": 41.07172095,
    "lon": 29.02351525
  },
  "bounds": {
    "north": 41.1066686,
    "south": 41.0367733,
    "east": 29.0551191,
    "west": 28.9919114
  },
  "osmId": 1765893,
  "updated_with_osm": true
}
```

---

## ⏳ BEKLEYEN VERILER

### 🏘️ Diğer İl İlçeleri (9 Hane)
- **160100001+** - Bursa İlçeleri (17 adet beklemede)
- **100100001+** - Balıkesir İlçeleri (20 adet beklemede)
- **170100001+** - Çanakkale İlçeleri (12 adet beklemede)
- **220100001+** - Edirne İlçeleri (9 adet beklemede)
- **390100001+** - Kırklareli İlçeleri (8 adet beklemede)
- **590100001+** - Tekirdağ İlçeleri (11 adet beklemede)
- **770100001+** - Yalova İlçeleri (6 adet beklemede)
- **540100001+** - Sakarya İlçeleri (16 adet beklemede)
- **410100001+** - Kocaeli İlçeleri (12 adet beklemede)
- **110100001+** - Bilecik İlçeleri (8 adet beklemede)

### 🏠 İstanbul Mahalleler (10 Hane)
- **3412000001+** - İstanbul Avrupa Mahalleri (seviye 2) ⏳
- **3412000001+** - İstanbul Anadolu Mahalleri (seviye 2) ⏳

### 🛣️ İstanbul Caddeler (11 Hane)
- **34130000001+** - İstanbul Avrupa Caddeleri (seviye 3) ⏳
- **34230000001+** - İstanbul Anadolu Caddeleri (seviye 3) ⏳

### 🏃 İstanbul Sokaklar (12 Hane)
- **341400000001+** - İstanbul Avrupa Sokakları (seviye 4) ⏳
- **342400000001+** - İstanbul Anadolu Sokakları (seviye 4) ⏳

---

## 📊 SİSTEM İSTATİSTİKLERİ

### ✅ Tamamlanan
- **İller:** 11 adet (8 hane ID atanmış)
- **İstanbul Avrupa İlçeleri:** 25 adet (9 hane, OSM entegrasyonu)
- **İstanbul Anadolu İlçeleri:** 14 adet (9 hane, OSM entegrasyonu)
- **Toplam Kullanılan ID:** 50 adet

### ⏳ Bekleyen
- **Diğer İl İlçeleri:** ~119 adet
- **Mahalleler:** ~32,000+ adet (10 hane)
- **Caddeler:** Belirsiz (11 hane)
- **Sokaklar:** Belirsiz (12 hane)

### 🔢 Sonraki Boş ID'ler
- **İstanbul Avrupa Mahalle:** 3422000001 (10 hane, hazır)
- **İstanbul Anadolu Mahalle:** 3412000001 (10 hane, hazır)
- **Bursa İlçe:** 160100001 (9 hane, hazır)
- **Balıkesir İlçe:** 100100001 (9 hane, hazır)

---

## 💡 YENİ SİSTEMİN AVANTAJLARI

### ✅ Hiyerarşik Mükemmellik
- `342100008` → "İstanbul Avrupa yakası, ilçe, 8. sırada"
- `341100005` → "İstanbul Anadolu yakası, ilçe, 5. sırada (Kadıköy)"
- `3422000001` → "İstanbul Avrupa yakası, mahalle, 1. sırada"

### ✅ Çakışmasızlık
- **Farklı hane sayıları** → Çakışma imkansız
- **Seviye ayrımı** → 1=İlçe, 2=Mahalle, 3=Cadde, 4=Sokak
- **Yarım il ayrımı** → İstanbul'da 1=Anadolu, 2=Avrupa
- **Ölçeklenebilirlik** → Sınırsız büyüme

### ✅ Uluslararası Uyumluluk
- **8-12 hane final** → Database friendly ve makul boyut
- **Sokakta bitiyor** → Bina/POI metadata olarak
- **Sıfır doldurma** → Tutarlı format  
- **OSM entegrasyonu** → Dünya standardı
- **Makine + İnsan** okunabilir

---

## 🔄 ESKİ SİSTEMDEN GEÇİŞ

### ❌ Eski ID'ler (Kaldırıldı)
```
34000001 | İstanbul (7 hane)
34010001-34010025 | İstanbul Avrupa ilçeleri
34010026-34010039 | İstanbul Anadolu ilçeleri
```

### ✅ Yeni Hiyerarşik ID'ler
```
34000000 | İstanbul (8 hane)
342100001-342100025 | İstanbul Avrupa ilçeleri (9 hane)
341100001-341100014 | İstanbul Anadolu ilçeleri (9 hane)
3422000001+ | İstanbul Avrupa mahalleler (10 hane)
3412000001+ | İstanbul Anadolu mahalleler (10 hane)
```

---

## 🔧 KOD ÜRETİM FORMÜLÜ

```javascript
function generateHierarchicalCode(ilKodu, yarimIlKodu, seviyeKodu, siraNo) {
  const sabitBas = `${ilKodu}${yarimIlKodu}${seviyeKodu}`
  const haneSayisi = {
    0: 6,  // İl
    1: 5,  // İlçe  
    2: 6,  // Mahalle
    3: 7,  // Cadde
    4: 8   // Sokak (FINAL)
  }[parseInt(seviyeKodu)]
  
  const siraStr = siraNo.toString().padStart(haneSayisi, '0')
  return sabitBas + siraStr
}

// Örnekler:
// generateHierarchicalCode(34, 2, 1, 8) → "342100008" (Beşiktaş)
// generateHierarchicalCode(34, 1, 1, 5) → "341100005" (Kadıköy)
// generateHierarchicalCode(34, 2, 2, 1) → "3422000001" (İlk Avrupa mahalle)
// generateHierarchicalCode(34, 2, 3, 1) → "34230000001" (İlk Avrupa cadde)
// generateHierarchicalCode(34, 2, 4, 1) → "342400000001" (İlk Avrupa sokak) ← FINAL
```

---

## 🗓️ Güncelleme Tarihi
**Son güncelleme:** 2025-07-13 (12 hane final sistem belirlendi)  
**Versiyon:** 4.1  
**Durum:** İstanbul mahalle seviyesi tamamlandı ✅  
**Sistem:** 12 hane ile biten final hiyerarşik kodlama ✅  
**Sonraki:** Cadde/Sokak seviyeleri (11-12 hane) 🔄 