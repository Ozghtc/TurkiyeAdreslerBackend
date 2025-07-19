const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class GoogleMapsStreetScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.streets = [];
    this.delay = 2000; // 2 saniye bekleme
  }

  async initialize() {
    try {
      console.log('🌐 Google Maps scraper başlatılıyor...');
      
      this.browser = await puppeteer.launch({
        headless: false, // Debug için görünür
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // User agent ayarla
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Viewport ayarla
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      console.log('✅ Browser başlatıldı');
      
    } catch (error) {
      console.error('❌ Browser başlatma hatası:', error);
      throw error;
    }
  }

  async searchStreetInCity(cityName, districtName, streetName) {
    try {
      console.log(`🔍 Arama: ${streetName}, ${districtName}, ${cityName}`);
      
      // Google Maps'e git
      const searchQuery = `${streetName} ${districtName} ${cityName} Turkey`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      await this.delay(3000);
      
      // Sonuçları topla
      const results = await this.page.evaluate(() => {
        const streetResults = [];
        
        // Cadde/sokak sonuçlarını bul
        const elements = document.querySelectorAll('[data-result-index]');
        
        elements.forEach((element, index) => {
          try {
            const titleElement = element.querySelector('h3, .fontHeadlineSmall');
            const addressElement = element.querySelector('.fontBodyMedium');
            
            if (titleElement && addressElement) {
              const title = titleElement.textContent.trim();
              const address = addressElement.textContent.trim();
              
              // Sadece cadde/sokak sonuçlarını al
              if (title.includes('Cadde') || title.includes('Sokak') || 
                  title.includes('Caddesi') || title.includes('Sokağı') ||
                  address.includes('Cadde') || address.includes('Sokak')) {
                
                streetResults.push({
                  title: title,
                  address: address,
                  index: index
                });
              }
            }
          } catch (error) {
            console.log('Element parse hatası:', error);
          }
        });
        
        return streetResults;
      });
      
      console.log(`✅ ${results.length} cadde/sokak sonucu bulundu`);
      return results;
      
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      return [];
    }
  }

  async scrapeStreetsForDistrict(cityName, districtName, streetNames) {
    const districtStreets = [];
    
    for (const streetName of streetNames) {
      try {
        console.log(`\n📍 ${streetName} aranıyor...`);
        
        const results = await this.searchStreetInCity(cityName, districtName, streetName);
        
        if (results.length > 0) {
          districtStreets.push({
            district: districtName,
            street: streetName,
            results: results
          });
        }
        
        // Rate limiting - Google'ı rahatsız etmemek için
        await this.delay(this.delay);
        
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
          streets: districtResults
        });
        
        // Şehirler arası bekleme
        await this.delay(5000);
      }
    }

    return allResults;
  }

  async saveResults(results, filename = 'google-streets-data.json') {
    try {
      const filePath = path.join(__dirname, '../../data', filename);
      
      // Dizin yoksa oluştur
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
      console.log(`✅ Veriler kaydedildi: ${filePath}`);
      
    } catch (error) {
      console.error('❌ Dosya kaydetme hatası:', error);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser kapatıldı');
    }
  }
}

// Kullanım örneği
async function main() {
  const scraper = new GoogleMapsStreetScraper();
  
  try {
    await scraper.initialize();
    
    // Test araması
    console.log('🧪 Test araması yapılıyor...');
    const testResults = await scraper.searchStreetInCity('İstanbul', 'Kadıköy', 'Atatürk Caddesi');
    console.log('Test sonuçları:', testResults);
    
    // Tüm şehirleri scrape et (dikkatli kullanın!)
    // const allResults = await scraper.scrapeAllCities();
    // await scraper.saveResults(allResults);
    
  } catch (error) {
    console.error('❌ Ana hata:', error);
  } finally {
    await scraper.close();
  }
}

// Script çalıştırma
if (require.main === module) {
  main();
}

module.exports = GoogleMapsStreetScraper; 