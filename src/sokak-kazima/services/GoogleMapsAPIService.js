const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GoogleMapsAPIService {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY;
    this.baseURL = 'https://maps.googleapis.com/maps/api';
    this.requests = 0;
    this.maxRequestsPerDay = 2500; // Ücretsiz limit
    this.delay = 100; // Rate limiting
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async geocodeAddress(address) {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key gerekli');
      }

      if (this.requests >= this.maxRequestsPerDay) {
        throw new Error('Günlük API limiti doldu');
      }

      const url = `${this.baseURL}/geocode/json`;
      const params = {
        address: address,
        key: this.apiKey,
        language: 'tr',
        region: 'tr'
      };

      const response = await axios.get(url, { params });
      this.requests++;

      if (response.data.status === 'OK') {
        return response.data.results;
      } else {
        console.warn(`⚠️ Geocoding hatası: ${response.data.status}`);
        return [];
      }

    } catch (error) {
      console.error('❌ Geocoding API hatası:', error.message);
      return [];
    }
  }

  async searchStreetInCity(cityName, districtName, streetName) {
    try {
      console.log(`🔍 API Arama: ${streetName}, ${districtName}, ${cityName}`);
      
      const searchQuery = `${streetName} ${districtName} ${cityName} Turkey`;
      const results = await this.geocodeAddress(searchQuery);
      
      const streetResults = results.filter(result => {
        const types = result.types || [];
        const address = result.formatted_address || '';
        
        // Sadece cadde/sokak sonuçlarını filtrele
        return types.includes('route') || 
               address.includes('Cadde') || 
               address.includes('Sokak') ||
               address.includes('Caddesi') || 
               address.includes('Sokağı');
      });

      console.log(`✅ ${streetResults.length} cadde/sokak sonucu bulundu`);
      return streetResults;

    } catch (error) {
      console.error('❌ Street search hatası:', error);
      return [];
    }
  }

  async getStreetDetails(placeId) {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key gerekli');
      }

      const url = `${this.baseURL}/place/details/json`;
      const params = {
        place_id: placeId,
        key: this.apiKey,
        language: 'tr',
        fields: 'name,formatted_address,geometry,types,address_components'
      };

      const response = await axios.get(url, { params });
      this.requests++;

      if (response.data.status === 'OK') {
        return response.data.result;
      } else {
        console.warn(`⚠️ Place details hatası: ${response.data.status}`);
        return null;
      }

    } catch (error) {
      console.error('❌ Place details API hatası:', error.message);
      return null;
    }
  }

  async scrapeStreetsForDistrict(cityName, districtName, streetNames) {
    const districtStreets = [];
    
    for (const streetName of streetNames) {
      try {
        console.log(`\n📍 ${streetName} aranıyor...`);
        
        const results = await this.searchStreetInCity(cityName, districtName, streetName);
        
        if (results.length > 0) {
          // Her sonuç için detay bilgileri al
          const detailedResults = [];
          
          for (const result of results) {
            if (result.place_id) {
              const details = await this.getStreetDetails(result.place_id);
              if (details) {
                detailedResults.push({
                  ...result,
                  details: details
                });
              }
            }
            
            // Rate limiting
            await this.delay(this.delay);
          }
          
          districtStreets.push({
            district: districtName,
            street: streetName,
            results: detailedResults
          });
        }
        
        // Cadde arası bekleme
        await this.delay(500);
        
      } catch (error) {
        console.error(`❌ ${streetName} arama hatası:`, error);
      }
    }
    
    return districtStreets;
  }

  async scrapeAllCities() {
    const cities = [
      { name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Mamak', 'Yenimahalle'] },
      { name: 'İzmir', districts: ['Konak', 'Karşıyaka', 'Bornova', 'Buca'] },
      { name: 'Bursa', districts: ['Nilüfer', 'Osmangazi', 'Yıldırım'] },
      { name: 'Antalya', districts: ['Muratpaşa', 'Kepez', 'Konyaaltı'] },
      { name: 'Adana', districts: ['Seyhan', 'Çukurova', 'Sarıçam'] }
    ];

    const commonStreetNames = [
      'Atatürk', 'Cumhuriyet', 'İstiklal', 'Hürriyet', 'Barış', 'Çiçek',
      'Gül', 'Lale', 'Menekşe', 'Papatya', 'Zambak', 'Karanfil',
      'Mevlana', 'Yunus Emre', 'Fatih', 'Yavuz', 'Kanuni', 'Osman',
      'Orhan', 'Murat', 'Beyazıt', 'Selim', 'Süleyman', 'Ahmet'
    ];

    const allResults = [];

    for (const city of cities) {
      console.log(`\n🏙️ ${city.name} şehri işleniyor...`);
      
      for (const district of city.districts) {
        console.log(`\n🏛️ ${district} ilçesi işleniyor...`);
        
        const districtResults = await this.scrapeStreetsForDistrict(
          city.name, 
          district, 
          commonStreetNames
        );
        
        allResults.push({
          city: city.name,
          district: district,
          streets: districtResults,
          timestamp: new Date().toISOString()
        });
        
        // Şehirler arası bekleme
        await this.delay(2000);
      }
    }

    return allResults;
  }

  async saveResults(results, filename = 'google-api-streets-data.json') {
    try {
      const filePath = path.join(__dirname, '../../data', filename);
      
      // Dizin yoksa oluştur
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const dataToSave = {
        metadata: {
          totalRequests: this.requests,
          maxRequestsPerDay: this.maxRequestsPerDay,
          remainingRequests: this.maxRequestsPerDay - this.requests,
          timestamp: new Date().toISOString(),
          source: 'Google Maps API'
        },
        data: results
      };
      
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
      console.log(`✅ Veriler kaydedildi: ${filePath}`);
      console.log(`📊 Kalan API isteği: ${this.maxRequestsPerDay - this.requests}`);
      
    } catch (error) {
      console.error('❌ Dosya kaydetme hatası:', error);
    }
  }

  getUsageStats() {
    return {
      requests: this.requests,
      maxRequests: this.maxRequestsPerDay,
      remaining: this.maxRequestsPerDay - this.requests,
      percentage: ((this.requests / this.maxRequestsPerDay) * 100).toFixed(2)
    };
  }
}

// Kullanım örneği
async function main() {
  const apiService = new GoogleMapsAPIService();
  
  try {
    // Test araması
    console.log('🧪 Test araması yapılıyor...');
    const testResults = await apiService.searchStreetInCity('İstanbul', 'Kadıköy', 'Atatürk Caddesi');
    console.log('Test sonuçları:', testResults);
    
    // Kullanım istatistikleri
    const stats = apiService.getUsageStats();
    console.log('📊 API Kullanım:', stats);
    
    // Tüm şehirleri scrape et (API key gerekli!)
    // const allResults = await apiService.scrapeAllCities();
    // await apiService.saveResults(allResults);
    
  } catch (error) {
    console.error('❌ Ana hata:', error);
  }
}

// Script çalıştırma
if (require.main === module) {
  main();
}

module.exports = GoogleMapsAPIService; 