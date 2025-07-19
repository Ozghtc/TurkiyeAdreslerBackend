# 🗺️ Google Streets Verilerini Çekme ve Kullanma Kılavuzu

## 📋 Genel Bakış

Bu kılavuz, Google'dan cadde/sokak verilerini **bir kez çekip veritabanına kaydetmek** ve sonra bu verileri API üzerinden kullanmak için yazılmıştır.

## 🎯 Adım Adım Süreç

### 1️⃣ **Veri Çekme (Bir Kez)**

#### **Seçenek A: Google Maps API ile (Önerilen)**
```bash
# 1. Google Cloud Console'dan API key al
# 2. .env dosyasına ekle
GOOGLE_MAPS_API_KEY=your_api_key_here

# 3. Import scriptini çalıştır
node scripts/import-google-streets.js
```

#### **Seçenek B: Web Scraping ile (Dikkatli)**
```bash
# 1. Scraping scriptini çalıştır
node src/sokak-kazima/services/GoogleMapsStreetScraper.js

# 2. Oluşan JSON dosyasını import et
node scripts/import-google-streets.js
```

### 2️⃣ **Veri Kaydetme**

Import scripti otomatik olarak:
- `google_streets` tablosunu oluşturur
- Google'dan çekilen verileri PostgreSQL'e kaydeder
- Duplicate kayıtları önler (UPSERT)
- İndeksler oluşturur

### 3️⃣ **API ile Kullanma**

Veriler kaydedildikten sonra API endpoint'leri ile erişebilirsiniz:

## 🔌 API Endpoint'leri

### **1. Google Streets Listesi**
```http
GET /api/google-streets?city=İstanbul&district=Kadıköy&search=Atatürk&limit=20
```

**Parametreler:**
- `city`: Şehir adı (opsiyonel)
- `district`: İlçe adı (opsiyonel)  
- `search`: Cadde/sokak arama (opsiyonel)
- `limit`: Sonuç sayısı (varsayılan: 50)

**Örnek Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "city_name": "İstanbul",
      "district_name": "Kadıköy",
      "street_name": "Atatürk Caddesi",
      "full_address": "Atatürk Caddesi, Kadıköy/İstanbul",
      "latitude": 40.99,
      "longitude": 29.1,
      "place_id": "ChIJ...",
      "street_type": "Cd.",
      "postal_code": "34710",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "filters": {
    "city": "İstanbul",
    "district": "Kadıköy", 
    "search": "Atatürk",
    "limit": 20
  }
}
```

### **2. Google Streets İstatistikleri**
```http
GET /api/google-streets/stats
```

**Örnek Yanıt:**
```json
{
  "success": true,
  "stats": {
    "total_streets": 1250,
    "total_cities": 5,
    "total_districts": 25,
    "total_city_districts": 125,
    "first_import": "2024-01-15T10:00:00Z",
    "last_import": "2024-01-15T12:30:00Z"
  }
}
```

## 🚀 Kullanım Örnekleri

### **Frontend'de Kullanım**
```javascript
// Google streets arama
const searchGoogleStreets = async (searchTerm, city, district) => {
  const params = new URLSearchParams({
    search: searchTerm,
    city: city,
    district: district,
    limit: 20
  });
  
  const response = await fetch(`/api/google-streets?${params}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  return [];
};

// Kullanım
const streets = await searchGoogleStreets('Atatürk', 'İstanbul', 'Kadıköy');
console.log(streets);
```

### **Backend'de Kullanım**
```javascript
// Express route örneği
app.get('/api/search/google-streets', async (req, res) => {
  const { q, city, district } = req.query;
  
  const query = `
    SELECT * FROM google_streets 
    WHERE street_name ILIKE $1 
    AND city_name ILIKE $2 
    AND district_name ILIKE $3
    LIMIT 20
  `;
  
  const result = await pool.query(query, [
    `%${q}%`, 
    `%${city || ''}%`, 
    `%${district || ''}%`
  ]);
  
  res.json({ results: result.rows });
});
```

## 📊 Veri Yapısı

### **google_streets Tablosu**
```sql
CREATE TABLE google_streets (
  id SERIAL PRIMARY KEY,
  city_name VARCHAR(100) NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  street_name VARCHAR(200) NOT NULL,
  full_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  place_id VARCHAR(255),
  street_type VARCHAR(50),
  postal_code VARCHAR(10),
  osm_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(city_name, district_name, street_name)
);
```

### **İndeksler**
```sql
CREATE INDEX idx_google_streets_city ON google_streets(city_name);
CREATE INDEX idx_google_streets_district ON google_streets(district_name);
CREATE INDEX idx_google_streets_coords ON google_streets(latitude, longitude);
```

## 🔧 Yönetim Komutları

### **Import Script Çalıştırma**
```bash
# Tüm verileri import et
node scripts/import-google-streets.js

# Sadece belirli şehirleri import et (script içinde değiştir)
# cities array'ini düzenle
```

### **Veritabanı Temizleme**
```sql
-- Tüm Google streets verilerini sil
DELETE FROM google_streets;

-- Belirli şehri sil
DELETE FROM google_streets WHERE city_name = 'İstanbul';

-- Eski verileri sil (30 günden eski)
DELETE FROM google_streets 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### **İstatistik Sorguları**
```sql
-- Şehir bazında cadde sayıları
SELECT city_name, COUNT(*) as street_count 
FROM google_streets 
GROUP BY city_name 
ORDER BY street_count DESC;

-- İlçe bazında cadde sayıları
SELECT city_name, district_name, COUNT(*) as street_count 
FROM google_streets 
GROUP BY city_name, district_name 
ORDER BY street_count DESC;

-- Koordinat bilgisi olan cadde sayısı
SELECT COUNT(*) as with_coordinates 
FROM google_streets 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

## ⚠️ Önemli Notlar

### **Rate Limiting**
- Google API: 2500 request/gün (ücretsiz)
- Scraping: 2 saniye bekleme arası
- Veritabanı: UPSERT ile duplicate önleme

### **Veri Güncelleme**
- Veriler bir kez çekilir
- Güncelleme için scripti tekrar çalıştır
- Eski veriler otomatik güncellenir (UPSERT)

### **Performans**
- İndeksler otomatik oluşturulur
- Arama hızlı (ILIKE ile)
- Koordinat bazlı arama desteklenir

### **Güvenlik**
- API key'i güvenli tutun
- Rate limiting uygulayın
- Error handling yapın

## 🎯 Sonuç

Bu sistem ile:
1. ✅ Google'dan verileri **bir kez** çekersiniz
2. ✅ Veritabanına **güvenli** şekilde kaydedersiniz  
3. ✅ API ile **hızlı** erişim sağlarsınız
4. ✅ **Sürekli** Google'a istek atmazsınız
5. ✅ **Maliyet** kontrolü yaparsınız

**Artık Google'dan çektiğiniz cadde/sokak verilerini kendi veritabanınızda saklayıp, API üzerinden hızlıca erişebilirsiniz!** 🎉 