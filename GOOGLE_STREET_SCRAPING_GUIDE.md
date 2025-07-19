# 🗺️ Google'dan Cadde/Sokak Verilerini Çekme Kılavuzu

## 📋 Genel Bakış

Bu kılavuz, Google Maps'ten Türkiye'deki cadde/sokak verilerini çekmek için iki farklı yöntemi açıklar:

1. **Google Maps API** (Önerilen - Yasal ve Güvenli)
2. **Web Scraping** (Dikkatli Kullanım - Riskli)

## 🎯 Yöntem 1: Google Maps API (Önerilen)

### ✅ Avantajlar
- **Yasal**: Google'ın resmi API'si
- **Güvenilir**: Kararlı ve güncel
- **Detaylı**: Koordinat, posta kodu, tip bilgileri
- **Hızlı**: API tabanlı hızlı erişim

### ❌ Dezavantajlar
- **Ücretli**: $5/1000 request (ücretsiz limit: 2500/gün)
- **Limit**: Günlük API limiti
- **API Key**: Google Cloud hesabı gerekli

### 🚀 Kurulum

#### 1. Google Cloud Console'da API Key Oluştur
```bash
# 1. https://console.cloud.google.com adresine git
# 2. Yeni proje oluştur
# 3. Maps JavaScript API'yi etkinleştir
# 4. API Key oluştur
# 5. API Key'i kısıtla (sadece Maps API)
```

#### 2. Environment Variable Ekle
```bash
# .env dosyasına ekle
GOOGLE_MAPS_API_KEY=your_api_key_here
```

#### 3. Bağımlılıkları Yükle
```bash
npm install axios
```

#### 4. Servisi Kullan
```javascript
const GoogleMapsAPIService = require('./src/sokak-kazima/services/GoogleMapsAPIService');

const apiService = new GoogleMapsAPIService();

// Test araması
const results = await apiService.searchStreetInCity('İstanbul', 'Kadıköy', 'Atatürk Caddesi');
console.log(results);

// Tüm şehirleri scrape et
const allResults = await apiService.scrapeAllCities();
await apiService.saveResults(allResults);
```

### 📊 API Kullanım İstatistikleri
```javascript
const stats = apiService.getUsageStats();
console.log(stats);
// {
//   requests: 150,
//   maxRequests: 2500,
//   remaining: 2350,
//   percentage: "6.00"
// }
```

## ⚠️ Yöntem 2: Web Scraping (Dikkatli Kullanım)

### ✅ Avantajlar
- **Ücretsiz**: API ücreti yok
- **Limit Yok**: Rate limiting yok
- **Tüm Veriler**: Erişilebilir tüm veriler

### ❌ Dezavantajlar
- **Yasal Risk**: Google ToS ihlali
- **IP Ban**: Google tarafından engellenme riski
- **Kararsızlık**: Captcha, layout değişiklikleri
- **Yavaş**: Browser tabanlı yavaş işlem

### 🚀 Kurulum

#### 1. Bağımlılıkları Yükle
```bash
npm install puppeteer
```

#### 2. Servisi Kullan
```javascript
const GoogleMapsStreetScraper = require('./src/sokak-kazima/services/GoogleMapsStreetScraper');

const scraper = new GoogleMapsStreetScraper();

await scraper.initialize();

// Test araması
const results = await scraper.searchStreetInCity('İstanbul', 'Kadıköy', 'Atatürk Caddesi');
console.log(results);

// Tüm şehirleri scrape et (DİKKAT!)
// const allResults = await scraper.scrapeAllCities();
// await scraper.saveResults(allResults);

await scraper.close();
```

## 📈 Veri Çekme Stratejileri

### 🎯 Strateji 1: Popüler Cadde İsimleri
```javascript
const commonStreetNames = [
  'Atatürk', 'Cumhuriyet', 'İstiklal', 'Hürriyet', 'Barış',
  'Çiçek', 'Gül', 'Lale', 'Menekşe', 'Papatya',
  'Mevlana', 'Yunus Emre', 'Fatih', 'Yavuz', 'Kanuni'
];
```

### 🎯 Strateji 2: İlçe Bazlı Arama
```javascript
const cities = [
  { name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Mamak'] },
  { name: 'İzmir', districts: ['Konak', 'Karşıyaka', 'Bornova'] },
  { name: 'Bursa', districts: ['Nilüfer', 'Osmangazi', 'Yıldırım'] }
];
```

### 🎯 Strateji 3: Koordinat Bazlı Grid Arama
```javascript
// İstanbul koordinat sınırları
const istanbulBounds = {
  north: 41.2,
  south: 40.8,
  east: 29.5,
  west: 28.5
};
```

## 🔧 Rate Limiting ve Güvenlik

### API Rate Limiting
```javascript
// Her istek arası bekleme
await this.delay(100); // 100ms

// Şehirler arası bekleme
await this.delay(2000); // 2 saniye

// Günlük limit kontrolü
if (this.requests >= this.maxRequestsPerDay) {
  throw new Error('Günlük API limiti doldu');
}
```

### Scraping Rate Limiting
```javascript
// Her arama arası bekleme
await this.delay(2000); // 2 saniye

// User agent rotasyonu
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];
```

## 📊 Veri Formatı

### API Sonuç Formatı
```json
{
  "formatted_address": "Atatürk Caddesi, Kadıköy/İstanbul",
  "geometry": {
    "location": {
      "lat": 40.99,
      "lng": 29.1
    }
  },
  "place_id": "ChIJ...",
  "types": ["route"],
  "address_components": [
    {
      "long_name": "Atatürk Caddesi",
      "short_name": "Atatürk Cd.",
      "types": ["route"]
    }
  ]
}
```

### Scraping Sonuç Formatı
```json
{
  "title": "Atatürk Caddesi",
  "address": "Atatürk Caddesi, Kadıköy, İstanbul",
  "index": 0
}
```

## 🚨 Önemli Uyarılar

### ⚠️ Yasal Uyarılar
- **API Kullanımı**: Google Maps API ToS'ye uygun kullanın
- **Scraping**: Google'ın ToS'sini ihlal edebilir
- **Rate Limiting**: Google'ı rahatsız etmeyin
- **Veri Kullanımı**: Çekilen verilerin telif haklarına dikkat edin

### ⚠️ Teknik Uyarılar
- **API Key Güvenliği**: API key'i public repo'larda paylaşmayın
- **Rate Limiting**: Limitleri aşmayın
- **Error Handling**: Hata durumlarını handle edin
- **Backup**: Verileri düzenli yedekleyin

## 🎯 Önerilen Yaklaşım

### 1. Başlangıç: API ile Test
```javascript
// Küçük ölçekte test et
const testResults = await apiService.searchStreetInCity('İstanbul', 'Kadıköy', 'Atatürk Caddesi');
```

### 2. Orta Ölçek: Hibrit Yaklaşım
```javascript
// API + Mevcut verileri birleştir
// Eksik verileri manuel tamamla
```

### 3. Büyük Ölçek: Çoklu Kaynak
```javascript
// API + Scraping + Manuel veri toplama
// Farklı kaynakları birleştir
```

## 📞 Destek

Sorularınız için:
- GitHub Issues: [Proje Repository'si]
- Email: [İletişim bilgileri]
- Documentation: [Dokümantasyon linki]

---

**Not**: Bu kılavuz sadece eğitim amaçlıdır. Kullanım öncesi yasal ve etik kuralları kontrol edin. 