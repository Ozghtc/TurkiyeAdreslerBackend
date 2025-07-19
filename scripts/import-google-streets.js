const { Pool } = require('pg');
const GoogleMapsAPIService = require('../src/sokak-kazima/services/GoogleMapsAPIService');
const fs = require('fs');
const path = require('path');

class GoogleStreetsImporter {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/turkiye_adresler'
    });
    
    this.apiService = new GoogleMapsAPIService();
    this.importedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    try {
      console.log('🗄️ Veritabanı bağlantısı test ediliyor...');
      await this.pool.query('SELECT NOW()');
      console.log('✅ Veritabanı bağlantısı başarılı');
      
      // Cadde/sokak tablosunu oluştur
      await this.createStreetsTable();
      
    } catch (error) {
      console.error('❌ Veritabanı bağlantı hatası:', error);
      throw error;
    }
  }

  async createStreetsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS google_streets (
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
      
      CREATE INDEX IF NOT EXISTS idx_google_streets_city ON google_streets(city_name);
      CREATE INDEX IF NOT EXISTS idx_google_streets_district ON google_streets(district_name);
      CREATE INDEX IF NOT EXISTS idx_google_streets_coords ON google_streets(latitude, longitude);
    `;
    
    await this.pool.query(createTableQuery);
    console.log('✅ Google streets tablosu oluşturuldu');
  }

  async importStreetData(streetData) {
    try {
      const {
        city_name,
        district_name,
        street_name,
        full_address,
        latitude,
        longitude,
        place_id,
        street_type,
        postal_code,
        osm_id
      } = streetData;

      const insertQuery = `
        INSERT INTO google_streets 
        (city_name, district_name, street_name, full_address, latitude, longitude, place_id, street_type, postal_code, osm_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (city_name, district_name, street_name) 
        DO UPDATE SET 
          full_address = EXCLUDED.full_address,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          place_id = EXCLUDED.place_id,
          street_type = EXCLUDED.street_type,
          postal_code = EXCLUDED.postal_code,
          osm_id = EXCLUDED.osm_id,
          created_at = CURRENT_TIMESTAMP
      `;

      await this.pool.query(insertQuery, [
        city_name, district_name, street_name, full_address,
        latitude, longitude, place_id, street_type, postal_code, osm_id
      ]);

      this.importedCount++;
      console.log(`✅ ${street_name} - ${district_name}/${city_name} kaydedildi`);

    } catch (error) {
      this.errorCount++;
      console.error(`❌ ${streetData.street_name} kaydetme hatası:`, error.message);
    }
  }

  async processGoogleResults(results, cityName, districtName) {
    for (const result of results) {
      try {
        // Google API sonucunu parse et
        const streetData = this.parseGoogleResult(result, cityName, districtName);
        
        if (streetData) {
          await this.importStreetData(streetData);
        }
        
        // Rate limiting
        await this.delay(100);
        
      } catch (error) {
        console.error('❌ Sonuç işleme hatası:', error);
      }
    }
  }

  parseGoogleResult(result, cityName, districtName) {
    try {
      const addressComponents = result.address_components || [];
      const geometry = result.geometry || {};
      
      // Cadde/sokak adını bul
      let streetName = '';
      let streetType = '';
      let postalCode = '';
      
      for (const component of addressComponents) {
        const types = component.types || [];
        
        if (types.includes('route')) {
          streetName = component.long_name;
          streetType = component.short_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      }
      
      // Eğer cadde/sokak bulunamadıysa, formatted_address'ten çıkar
      if (!streetName && result.formatted_address) {
        const addressParts = result.formatted_address.split(',');
        streetName = addressParts[0]?.trim() || '';
      }
      
      if (!streetName) {
        return null; // Cadde/sokak değilse atla
      }
      
      return {
        city_name: cityName,
        district_name: districtName,
        street_name: streetName,
        full_address: result.formatted_address,
        latitude: geometry.location?.lat || null,
        longitude: geometry.location?.lng || null,
        place_id: result.place_id,
        street_type: streetType,
        postal_code: postalCode,
        osm_id: null // Google'dan OSM ID alamayız
      };
      
    } catch (error) {
      console.error('❌ Google sonuç parse hatası:', error);
      return null;
    }
  }

  async importFromGoogleAPI() {
    const cities = [
      { name: 'İstanbul', districts: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Fatih', 'Beyoğlu'] },
      { name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Mamak', 'Yenimahalle'] },
      { name: 'İzmir', districts: ['Konak', 'Karşıyaka', 'Bornova', 'Buca'] },
      { name: 'Bursa', districts: ['Nilüfer', 'Osmangazi', 'Yıldırım'] },
      { name: 'Antalya', districts: ['Muratpaşa', 'Kepez', 'Konyaaltı'] }
    ];

    const commonStreetNames = [
      'Atatürk', 'Cumhuriyet', 'İstiklal', 'Hürriyet', 'Barış', 'Çiçek',
      'Gül', 'Lale', 'Menekşe', 'Papatya', 'Zambak', 'Karanfil',
      'Mevlana', 'Yunus Emre', 'Fatih', 'Yavuz', 'Kanuni', 'Osman',
      'Orhan', 'Murat', 'Beyazıt', 'Selim', 'Süleyman', 'Ahmet'
    ];

    console.log('🚀 Google API'den cadde/sokak verileri çekiliyor...');

    for (const city of cities) {
      console.log(`\n🏙️ ${city.name} şehri işleniyor...`);
      
      for (const district of city.districts) {
        console.log(`\n🏛️ ${district} ilçesi işleniyor...`);
        
        for (const streetName of commonStreetNames) {
          try {
            console.log(`📍 ${streetName} aranıyor...`);
            
            const results = await this.apiService.searchStreetInCity(city.name, district, streetName);
            
            if (results.length > 0) {
              await this.processGoogleResults(results, city.name, district);
            }
            
            // Cadde arası bekleme
            await this.delay(500);
            
          } catch (error) {
            console.error(`❌ ${streetName} arama hatası:`, error);
          }
        }
        
        // İlçe arası bekleme
        await this.delay(2000);
      }
      
      // Şehir arası bekleme
      await this.delay(5000);
    }
  }

  async importFromJSONFile(filePath) {
    try {
      console.log(`📁 JSON dosyasından veri yükleniyor: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Dosya bulunamadı: ${filePath}`);
      }
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.data && Array.isArray(data.data)) {
        for (const cityData of data.data) {
          const cityName = cityData.city;
          const districtName = cityData.district;
          
          console.log(`\n🏙️ ${cityName} - ${districtName} işleniyor...`);
          
          if (cityData.streets && Array.isArray(cityData.streets)) {
            for (const streetData of cityData.streets) {
              if (streetData.results && Array.isArray(streetData.results)) {
                await this.processGoogleResults(streetData.results, cityName, districtName);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ JSON dosya import hatası:', error);
    }
  }

  async getImportStats() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_streets,
          COUNT(DISTINCT city_name) as total_cities,
          COUNT(DISTINCT district_name) as total_districts,
          COUNT(DISTINCT CONCAT(city_name, district_name)) as total_city_districts
        FROM google_streets
      `;
      
      const result = await this.pool.query(statsQuery);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ İstatistik sorgulama hatası:', error);
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔒 Veritabanı bağlantısı kapatıldı');
    }
  }
}

// Ana fonksiyon
async function main() {
  const importer = new GoogleStreetsImporter();
  
  try {
    await importer.initialize();
    
    console.log('🎯 Import seçenekleri:');
    console.log('1. Google API\'den çek (API key gerekli)');
    console.log('2. JSON dosyasından yükle');
    console.log('3. Sadece istatistikleri göster');
    
    // Şimdilik JSON dosyasından yüklemeyi test edelim
    const jsonFilePath = path.join(__dirname, '../src/data/google-api-streets-data.json');
    
    if (fs.existsSync(jsonFilePath)) {
      console.log('\n📁 Mevcut JSON dosyası bulundu, yükleniyor...');
      await importer.importFromJSONFile(jsonFilePath);
    } else {
      console.log('\n⚠️ JSON dosyası bulunamadı, Google API kullanılacak...');
      console.log('⚠️ API key gerekli! .env dosyasına GOOGLE_MAPS_API_KEY ekleyin');
      // await importer.importFromGoogleAPI();
    }
    
    // İstatistikleri göster
    const stats = await importer.getImportStats();
    if (stats) {
      console.log('\n📊 Import İstatistikleri:');
      console.log(`✅ Toplam cadde/sokak: ${stats.total_streets}`);
      console.log(`🏙️ Toplam şehir: ${stats.total_cities}`);
      console.log(`🏛️ Toplam ilçe: ${stats.total_districts}`);
      console.log(`📍 Toplam şehir-ilçe kombinasyonu: ${stats.total_city_districts}`);
    }
    
    console.log(`\n📈 İşlem Tamamlandı:`);
    console.log(`✅ Başarılı: ${importer.importedCount}`);
    console.log(`❌ Hatalı: ${importer.errorCount}`);
    
  } catch (error) {
    console.error('❌ Ana hata:', error);
  } finally {
    await importer.close();
  }
}

// Script çalıştırma
if (require.main === module) {
  main();
}

module.exports = GoogleStreetsImporter; 