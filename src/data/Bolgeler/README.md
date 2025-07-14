# TÜRKİYE ADRES VERİ SİSTEMİ - MODÜLER BÖLGE YAPISI

## 🇹🇷 Proje Genel Tanımı

Bu proje, Türkiye'nin tüm adres verilerini (il, ilçe, mahalle, cadde, sokak) modüler ve OSM entegrasyonlu bir sistemle organize etmek amacıyla geliştirilmiştir.

---

## 🗺️ Coğrafi Bölgeler

Türkiye'nin 7 coğrafi bölgesi modüler olarak organize edilmiştir:

### 📁 Bölge Klasörleri

1. **🏙️ Marmara_Bolgesi** - İstanbul, Bursa, Kocaeli, Tekirdağ, Balıkesir, Çanakkale, Edirne, Kırklareli, Sakarya, Yalova, Bilecik
2. **🌊 Ege_Bolgesi** - İzmir, Aydın, Manisa, Muğla, Denizli, Uşak, Afyon, Kütahya  
3. **🏖️ Akdeniz_Bolgesi** - Antalya, Mersin, Adana, Hatay, Osmaniye, Kahramanmaraş, Isparta, Burdur
4. **🏛️ Ic_Anadolu_Bolgesi** - Ankara, Konya, Kayseri, Eskişehir, Sivas, Yozgat, Kırıkkale, Kırşehir, Nevşehir, Niğde, Aksaray, Karaman, Çankırı
5. **🌲 Karadeniz_Bolgesi** - Samsun, Trabzon, Ordu, Rize, Giresun, Artvin, Gümüşhane, Bayburt, Amasya, Tokat, Sinop, Kastamonu, Çorum, Bartın, Karabük, Düzce, Bolu, Zonguldak
6. **🏔️ Dogu_Anadolu_Bolgesi** - Erzurum, Erzincan, Kars, Ağrı, Iğdır, Ardahan, Malatya, Elazığ, Tunceli, Bingöl, Muş, Bitlis, Van, Hakkari
7. **🏜️ Guneydogu_Anadolu_Bolgesi** - Gaziantep, Şanlıurfa, Diyarbakır, Mardin, Batman, Şırnak, Siirt, Kilis, Adıyaman

---

## 🔧 Hiyerarşik Kodlama Sistemi

### 📊 Veri Hiyerarşisi

```
🇹🇷 Türkiye
├── 🗺️ Bölge (7 adet)
│   ├── 🏙️ İl (81 adet)
│   │   ├── 🏘️ İlçe (Level 1 - 9 hane)
│   │   │   ├── 🏠 Mahalle (Level 2 - 10 hane)
│   │   │   │   ├── 🛣️ Cadde (Level 3 - 11 hane)
│   │   │   │   └── 🏃 Sokak (Level 4 - 12 hane) ← FINAL
│   │   │   │       └── 🏢 Binalar + POI (Metadata)
```

### 🔢 ID Sistemi

**Format:** `[İL KODU][YARIM İL][SEVİYE][SIRA NO]`

- **İL KODU:** 2 hane (01-81 plaka)
- **YARIM İL:** 1 hane (İstanbul: 1=Anadolu, 2=Avrupa; Diğer: 0)
- **SEVİYE:** 1 hane (1=İlçe, 2=Mahalle, 3=Cadde, 4=Sokak FINAL)
- **SIRA NO:** 5-8 hane (seviyeye göre değişen)

#### 📝 Örnek ID'ler:
- **İl ID:** `34000000` (İstanbul - 8 hane)
- **İlçe ID:** `342100008` (İstanbul Avrupa > Beşiktaş - 9 hane)
- **Mahalle ID:** `3422000001` (İstanbul Avrupa > Mahalle - 10 hane)
- **Cadde ID:** `34230000001` (İstanbul Avrupa > Cadde - 11 hane)
- **Sokak ID:** `342400000001` (İstanbul Avrupa > Sokak - 12 hane)

---

## 🗂️ Dosya Yapısı

### 📁 Klasör Organizasyonu

```
📁 Bolgeler/
├── 📄 README.md (Bu dosya)
├── 📁 Marmara_Bolgesi/
│   ├── 📄 README.md (Bölge özeti)
│   ├── 📄 Iller.json (Bölge illeri)
│   ├── 📄 Iller.tsx (Bölge komponenti)
│   ├── 📁 Istanbul_Modulu/
│   │   ├── 📄 README.md (İl detayları)
│   │   ├── 📄 Istanbul_Genel.json (İl genel bilgisi)
│   │   ├── 📁 Istanbul_Avrupa/
│   │   │   ├── 📄 Ilceler.json (25 ilçe) ✅
│   │   │   ├── 📄 Mahalleler.json (Planlanmış) 🔄
│   │   │   └── 📁 Detay_Katmanlar/ (Gelişmiş)
│   │   │       ├── 📄 Binalar.json (500K+ kayıt)
│   │   │       ├── 📄 POI.json (100K+ kayıt)
│   │   │       ├── 📄 Parklar.json (10K+ kayıt)
│   │   │       ├── 📄 Ulasim.json
│   │   │       └── 📄 Su_Yollari.json
│   │   └── 📁 Istanbul_Anadolu/
│   │       ├── 📄 Ilceler.json (14 ilçe) ✅
│   │       ├── 📄 Mahalleler.json (Planlanmış) 🔄
│   │       └── 📁 Detay_Katmanlar/ (Gelişmiş)
│   └── 📁 Diger_Il_Modulleri/ (Planlanmış)
└── 📁 Diger_Bolgeler/ (Planlanmış)
```

### 📄 JSON Dosya Formatı

#### İlçe Kayıt Örneği:
```json
{
  "id": 342100008,
  "name": "BEŞIKTAŞ",
  "parent_id": 34000000,
  "status": "aktif",
  "bolgesi": "Avrupa",
  "plaka": 34,
  "yarim_il": 2,
  "level": "01",
  "posta_kodlari": ["34357", "34365", "34349"],
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

## 🗺️ OSM Entegrasyonu

### 🔗 OpenStreetMap Özellikleri

- **Koordinat Sistemi:** WGS84 (Lat/Lon)
- **Sınır Bilgileri:** North/South/East/West bounds
- **OSM ID'ler:** Doğrudan OSM veri referansları
- **Güncellik:** `updated_with_osm: true` ile işaretleme
- **Veri Kaynağı:** `turkey-latest.osm.pbf` (568MB)

### 🎯 Avantajlar

- **Hassas Konum:** Gerçek coğrafi koordinatlar
- **Sınır Bilgileri:** Kesin alan sınırları
- **Güncel Veri:** OSM topluluğu tarafından güncellenen
- **Uluslararası Standart:** WGS84 koordinat sistemi

---

## 🛣️ BÜYÜK VERİ YOL HARİTASI

### 📊 İstanbul OSM Verisi Kapsamı (3-4 GB)
- **🏠 Mahalleler:** ~1,000 adet
- **🛣️ Tüm sokaklar:** ~50,000+ adet
- **🏢 Binalar:** ~500,000+ adet
- **📍 POI (İlgi noktaları):** ~100,000+ adet
- **🌳 Parklar, alanlar:** ~10,000+ adet
- **🚇 Ulaşım hatları:** Metro, otobüs vs.
- **💧 Su yolları:** Dereler, sahil çizgileri

### 🚀 GELİŞTİRME FAZLARI

#### **FAZ 1: Temel Hiyerarşi** ✅ (Kısmen Tamamlandı)
- ✅ İl sistemi (8 hane)
- ✅ İlçe sistemi (9 hane) - İstanbul 39 ilçe
- ✅ Mahalle sistemi (10 hane) - İstanbul 226 mahalle
- 🔄 Cadde sistemi (11 hane) - Planlanmış
- 🔄 Sokak sistemi (12 hane) - Final seviye

#### **FAZ 2: Sokak Tamamlama** 🔄 (Hazırlanıyor)
- **Level 3-4 - Cadde/Sokak (11-12 hane):**
  - OSM highway verilerinden otomatik çıkarım
  - Koordinat ve sınır bilgileri
  - Sokak metadata'sında bina ve POI bilgileri

#### **FAZ 3: Metadata Zenginleştirme** 🔄 (Planlanmış)
- **Sokak seviyesinde detaylar:**
  - Kapı numaraları ve bina tipleri
  - POI'ler (mağaza, hastane, okul, vb.)
  - Posta kodları ve hizmet bilgileri

#### **FAZ 4: Coğrafi Özellikler** 🔄 (Gelecek)
- **Level 7 - Alanlar:**
  - Parklar ve yeşil alanlar
  - Spor tesisleri
  - Ulaşım hatları (metro, otobüs)
  - Su yolları ve sahiller

#### **FAZ 5: Türkiye Geneli** 🔄 (Uzun Vadeli)
- 81 il için sistem yaygınlaştırması
- Tüm bölgelerde pilot uygulamalar
- Ulusal adres veri tabanı

### 📈 Performans Hedefleri

#### **Veri Boyutu Yönetimi:**
- **İlçe seviyesi:** ~50KB per il
- **Mahalle seviyesi:** ~500KB per il
- **Cadde seviyesi:** ~2MB per il
- **Sokak seviyesi:** ~20MB per il (metadata ile birlikte)

#### **Arama Performansı:**
- **Basit arama:** <100ms
- **Coğrafi arama:** <500ms
- **Detaylı filtreleme:** <1000ms

---

## 📱 Teknik Özellikler

### 🔧 Sistem Gereksinimleri

- **Frontend:** React TypeScript
- **Veri Formatı:** JSON + Gzip sıkıştırma
- **Encoding:** UTF-8
- **Koordinat Sistemi:** WGS84
- **Dil Standardı:** Türkçe (otomatik büyük harf)

### 📐 Mobil Uyumluluk

- **Responsive Design:** Tüm cihazlarda uyumlu
- **Hover Efektleri:** Mobil dokunma desteği
- **Form Inputs:** Otomatik büyük harf dönüşümü
- **İstisnalar:** Email, T.C. Kimlik, Telefon

### 🚀 Performans

- **Modüler Yapı:** Gerektiğinde yükleme
- **JSON Optimizasyonu:** Hızlı veri erişimi
- **Koordinat Hassasiyeti:** Optimize edilmiş precision
- **Lazy Loading:** Büyük veri setleri için

---

## 📊 Proje Durumu

### ✅ Tamamlanan Modüller

| Bölge | İl | İlçe | Mahalle | Durum |
|-------|----|----- |---------|--------|
| Marmara | İstanbul | Avrupa (25) + Anadolu (14) | - | ✅ Tamamlandı |
| Diğer | - | - | - | 🔄 Beklemede |

### 🔄 Devam Eden İşler

1. **İstanbul Mahalle Katmanı** - JSON yapısı hazırlanıyor
2. **Posta Kodları Entegrasyonu** - İlçe seviyesinde ekleniyor
3. **Diğer İller** - Öncelik sıralaması yapılıyor

### 🎯 Sonraki Hedefler

1. **Marmara Bölgesi Tamamlama:**
   - Bursa, Kocaeli, Tekirdağ modülleri
   - OSM entegrasyonu
   - Mahalle seviyesi detaylar

2. **Büyük Veri Hazırlığı:**
   - İstanbul için 50K+ sokak verisi
   - 500K+ bina verisi hazırlığı
   - POI veri katmanı planlaması

3. **Diğer Bölgeler:**
   - Pilot il seçimi (Ankara, İzmir)
   - Veri yapısı standardizasyonu
   - Otomatik veri işleme araçları

---

## 📋 Veri Kalitesi Standartları

### ✅ Kontrol Listesi

- **ID Benzersizliği:** Her kayıt unique ID'ye sahip
- **Parent-Child İlişkisi:** Hiyerarşik bağlantılar doğru
- **Koordinat Doğrulaması:** Türkiye sınırları içinde
- **OSM Entegrasyonu:** Güncel OSM ID'leri
- **Posta Kodu Kontrolü:** Gerçek posta kodları
- **Metadata Takibi:** Versiyon ve tarih bilgileri
- **Encoding:** UTF-8 karakterler doğru

### 📈 Versiyon Takibi

- **v1.0:** Temel yapı oluşturuldu
- **v2.0:** OSM entegrasyonu eklendi
- **v2.1:** İstanbul Avrupa yakası tamamlandı
- **v3.0:** Yeni hiyerarşik sistem uygulandı
- **v3.1:** Posta kodları eklendi (Güncel)
- **v4.0:** Büyük veri katmanları (Planlanmış)

---

## 🔍 Gelişmiş Arama Sistemi

### 🎯 Arama Türleri

1. **Hiyerarşik Arama:** "İstanbul > Beşiktaş > Moda"
2. **Fuzzy Arama:** "besiktas" → "Beşiktaş"
3. **Posta Kodu Arama:** "34710" → Kadıköy bölgesi
4. **Koordinat Arama:** Lat/Lon ile yakınlık
5. **POI Arama:** "Beşiktaş hastane" → Yakın sağlık tesisleri

### 📊 Arama API Örnekleri

```javascript
// Basit il/ilçe arama
search("Beşiktaş") → {id: 342100008, name: "BEŞIKTAŞ", ...}

// Posta kodu arama  
searchByPostcode("34357") → [Beşiktaş mahalleleri]

// Koordinat bazlı yakınlık
searchNearby(41.0717, 29.0235, 1000) → [1km içindeki yerler]

// Kategorik arama (gelecek)
searchPOI("Beşiktaş", "hastane") → [Sağlık tesisleri]
```

---

## 🗓️ Güncelleme Bilgileri

**Son Güncelleme:** 2025-07-12  
**Güncel Versiyon:** 3.1  
**Toplam Kayıt:** 39 İlçe (İstanbul)  
**OSM Entegrasyonu:** Aktif  
**Büyük Veri Hazırlığı:** Planlanmış  
**Sonraki Hedef:** Mahalle katmanı + Posta kodları

---

## 📞 İletişim ve Katkı

Bu proje açık kaynaklı ve topluluk katkılarına açıktır. Veri güncellemeleri, hata raporları ve öneriler için GitHub repository'sini kullanabilirsiniz.

**Katkıda Bulunma Kuralları:**
- OSM veri standardına uygun
- JSON format kontrolü
- Koordinat doğrulaması
- Türkçe karakter desteği
- Metadata güncellemesi
- Performans odaklı çözümler

**Büyük Veri Katkıları:**
- 500K+ bina verisi için özel süreçler
- POI veri kalitesi kontrolleri
- Coğrafi doğrulama algoritmaları 