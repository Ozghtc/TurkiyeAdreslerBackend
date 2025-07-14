# 🇹🇷 Türkiye Adresler Backend API v2.0

Express.js + PostgreSQL tabanlı kapsamlı Türkiye adres API'si. Şehir, ilçe, mahalle ve cadde verilerini hiyerarşik yapıda sunar.

## 🆕 v2.0 Yenilikleri

- ✅ **Cadde Desteği**: 18,859+ cadde verisi eklendi
- ✅ **4 Seviyeli Arama**: Şehir/İlçe/Mahalle/Cadde arama
- ✅ **Multilingual Support**: TR, EN, AR, KU, HY, EL dil desteği
- ✅ **OSM Integration**: OpenStreetMap verilerinden zenginleştirme
- ✅ **Koordinat Desteği**: Lat/Lng bilgileri
- ✅ **Advanced Search**: Full-text ve normalized arama

## 🚀 Railway Deploy

### 1. GitHub'a Push
```bash
git init
git add .
git commit -m "v2.0 - Cadde desteği eklendi"
git remote add origin https://github.com/yourusername/turkiye-adresler-backend.git
git push -u origin main
```

### 2. Railway'de Deploy
```bash
# Railway CLI install
npm install -g @railway/cli

# Login ve deploy
railway login
railway init
railway add postgresql
railway up
```

### 3. Database & Migration
```bash
# Migration çalıştır (yeni v2.0 veri yapısı)
railway run npm run migrate

# Veya eski veri yapısı için
railway run npm run seed
```

## 🛠️ Local Development

### 1. Install
```bash
npm install
```

### 2. PostgreSQL Setup
```bash
# PostgreSQL kur ve çalıştır
brew install postgresql
brew services start postgresql

# Database oluştur
createdb turkiye_adresler

# Schema oluştur
psql -d turkiye_adresler -f database.sql
```

### 3. Environment
```bash
cp env.example .env
# .env dosyasını düzenle
```

### 4. Veri Import (v2.0)
```bash
# Yeni migration system (önerilen)
npm run migrate

# Veya eski system
npm run seed
```

### 5. Start
```bash
npm run dev
```

## 📡 API Endpoints v2.0

### 🔍 Gelişmiş Arama
```bash
# Genel arama (tüm seviyeler)
GET /api/search?q=beşiktaş&limit=10&type=all

# Specific type arama
GET /api/search?q=istanbul&type=city
GET /api/search?q=beyoğlu&type=district  
GET /api/search?q=cihangir&type=neighborhood
GET /api/search?q=istiklal&type=street

# Cadde arama (yeni!)
GET /api/search/streets?q=barbaros&city=34&district=342100008&limit=20
```

### 📊 İstatistikler
```bash
GET /api/stats                    # Veri sayıları
GET /health                       # Sistem durumu
```

### 🗺️ Hiyerarşik Endpoints
```bash
GET /api/regions                              # 7 coğrafi bölge
GET /api/cities                               # 81 şehir
GET /api/districts/:cityId                    # İlçeler
GET /api/neighborhoods/:districtId            # Mahalleler
GET /api/streets/:neighborhoodId              # Caddeler (YENİ!)

# Tam hiyerarşi (yeni!)
GET /api/address/:cityId/:districtId/:neighborhoodId/streets
```

### 📍 Örnek API Kullanımları
```bash
# İstanbul'daki ilçeleri getir
curl "https://your-app.up.railway.app/api/districts/34"

# Beyoğlu'ndaki mahalleleri getir  
curl "https://your-app.up.railway.app/api/neighborhoods/342100010"

# Cihangir'deki caddeleri getir (YENİ!)
curl "https://your-app.up.railway.app/api/streets/3422000001?limit=50"

# İstiklal Caddesi'ni ara (YENİ!)
curl "https://your-app.up.railway.app/api/search?q=istiklal&type=street"

# Sistem istatistikleri
curl "https://your-app.up.railway.app/api/stats"
```

## 🗂️ Veri Yapısı v2.0

### Database Schema
```sql
sehirler    # 81 şehir
├── ilceler      # ~970 ilçe  
    ├── mahalleler    # ~50,000 mahalle
        ├── caddeler       # ~1M+ cadde (YENİ!)
            └── sokaklar        # ~10M+ sokak (HAZIR)
```

### Veri Özellikleri
- **Hierarchical IDs**: 12 haneli ID sistemi (34230000001)
- **Multilingual**: OSM'den çıkarılan çok dilli isimler
- **Coordinates**: Latitude/Longitude bilgileri
- **OSM Integration**: highway_type, osm_id bilgileri
- **Turkish Normalization**: ş→s, ğ→g, ı→i dönüşümü

## 📈 API Response Örnekleri

### Arama Response
```json
{
  "results": [
    {
      "type": "street",
      "id": "34230000001", 
      "name": "İSTİKLAL CADDESİ",
      "parent_name": "Cihangir, Beyoğlu, İstanbul",
      "parent_id": "3422000001"
    }
  ],
  "total": 1,
  "query": "istiklal",
  "normalized_query": "istiklal"
}
```

### Cadde Listesi Response
```json
{
  "streets": [
    {
      "cadde_id": "34230000001",
      "cadde_adi": "İSTİKLAL CADDESİ", 
      "mahalle_id": "3422000001",
      "highway_type": "pedestrian",
      "coordinates": {
        "start_lat": 41.0362,
        "start_lon": 28.9742,
        "end_lat": 41.0368,
        "end_lon": 28.9755
      },
      "bolgesi": "Avrupa",
      "plaka": 34,
      "osm_id": 4471927,
      "multilingual": {
        "tr": "İstiklal Caddesi",
        "en": "Independence Avenue",
        "available_languages": ["tr", "en"]
      }
    }
  ],
  "total": 18859,
  "limit": 50,
  "offset": 0
}
```

### Stats Response
```json
{
  "cities": 81,
  "districts": 970, 
  "neighborhoods": 50000,
  "streets": 18859,
  "total": 69910
}
```

## 🔧 Teknik Özellikler

- **Node.js + Express.js** - Modern web framework
- **PostgreSQL with JSONB** - JSON veri desteği
- **Full-text Search Indexing** - Türkçe arama optimizasyonu
- **CORS & Security** - Cross-origin ve güvenlik headers
- **Compression** - Response compression
- **Pagination** - Büyük veri setleri için sayfalama
- **Error Handling** - Kapsamlı hata yönetimi

## 🌐 URLs

- **Development**: http://localhost:3001
- **Production**: https://rare-courage-production.up.railway.app
- **Health Check**: /health
- **Stats**: /api/stats
- **Search**: /api/search?q=istanbul

## 📊 Database Performance

- **1M+ Cadde** verisi (İstanbul: 18,859)
- **50,000+ Mahalle** verisi
- **970+ İlçe** verisi  
- **81 Şehir** verisi
- **PostgreSQL indexing** ile optimized queries
- **Turkish character normalization** function
- **Full-text search** with GIN indexes
- **JSONB support** for multilingual and coordinate data

## 🎯 API Kullanım İpuçları

### Arama Optimizasyonu
```bash
# Hızlı arama için type belirtin
GET /api/search?q=kadıköy&type=district

# Pagination kullanın
GET /api/streets/3422000001?limit=20&offset=40

# Normalize edilmiş arama
GET /api/search?q=besiktas  # (ş→s dönüşümü otomatik)
```

### Rate Limiting & Performance
- **Pagination**: Büyük veri setleri için limit/offset kullanın
- **Type filtering**: Arama tipini belirleyerek performansı artırın
- **Caching**: Response'ları cache'leyebilirsiniz
- **Indexes**: Full-text ve normalization indexleri aktif

## 🔄 Migration Guide v1→v2

### Yeni Endpoint'ler
```bash
# v1
GET /api/search?q=term

# v2 (backward compatible + new features)
GET /api/search?q=term&type=street     # YENİ: Type filtering
GET /api/streets/:neighborhoodId       # YENİ: Cadde listesi
GET /api/search/streets                # YENİ: Cadde arama
GET /api/stats                         # YENİ: İstatistikler
```

### Database Migration
```bash
# Eski veri varsa migration çalıştır
npm run migrate

# Temiz kurulum
npm run seed
```

## 📝 Lisans

MIT License - Türkiye Adres Sistemi v2.0 