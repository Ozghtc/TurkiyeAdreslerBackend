// Modüler Adres Arama Servisi - Google Tarzı
class ModularAddressSearch {
  constructor() {
    this.provinces = [];
    this.districts = [];
    this.neighborhoods = [];
    this.streets = [];
    this.searchCache = new Map();
  }

  // Türkçe karakter normalizasyonu
  normalizeQuery(query) {
    return query
      .toUpperCase()
      .replace(/Ş/g, 'S')
      .replace(/Ğ/g, 'G')
      .replace(/Ü/g, 'U')
      .replace(/Ö/g, 'O')
      .replace(/Ç/g, 'C')
      .replace(/İ/g, 'I')
      .trim();
  }

  // Veri yükleme
  async loadData() {
    try {
      // İl verilerini yükle
      const provincesData = await import('./Iller.json');
      this.provinces = provincesData.iller || [];

      // İstanbul ilçelerini yükle
      const istanbulAvrupaData = await import('./Istanbul_Modulu/Istanbul_Avrupa/Ilceler.json');
      const istanbulAnadoluData = await import('./Istanbul_Modulu/Istanbul_Anadolu/Ilceler.json');
      
      this.districts = [
        ...(istanbulAvrupaData.ilce_listesi || []),
        ...(istanbulAnadoluData.ilce_listesi || [])
      ];

      console.log('✅ Modüler veri yüklendi:', {
        provinces: this.provinces.length,
        districts: this.districts.length
      });
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
    }
  }

  // İl arama
  searchProvinces(query) {
    const normalized = this.normalizeQuery(query);
    return this.provinces
      .filter(province => {
        const provinceName = this.normalizeQuery(province.name);
        return provinceName.includes(normalized);
      })
      .map(province => ({
        id: province.id,
        name: province.name,
        type: 'İl',
        fullAddress: province.name,
        score: this.calculateScore(province.name, query),
        exactMatch: this.normalizeQuery(province.name) === normalized,
        path: `${province.parent} > ${province.name}`,
        icon: '🏙️'
      }));
  }

  // İlçe arama
  searchDistricts(query) {
    const normalized = this.normalizeQuery(query);
    return this.districts
      .filter(district => {
        const districtName = this.normalizeQuery(district.name);
        return districtName.includes(normalized);
      })
      .map(district => ({
        id: district.id,
        name: district.name,
        type: 'İlçe',
        fullAddress: `İstanbul > ${district.name}`,
        score: this.calculateScore(district.name, query),
        exactMatch: this.normalizeQuery(district.name) === normalized,
        path: `Marmara > İstanbul > ${district.name}`,
        side: district.bolgesi, // Avrupa/Anadolu
        icon: '🏘️'
      }));
  }

  // Skor hesaplama
  calculateScore(text, query) {
    const normalizedText = this.normalizeQuery(text);
    const normalizedQuery = this.normalizeQuery(query);
    
    // Tam eşleşme
    if (normalizedText === normalizedQuery) return 100;
    
    // Başlangıç eşleşmesi
    if (normalizedText.startsWith(normalizedQuery)) return 90;
    
    // İçerik eşleşmesi
    if (normalizedText.includes(normalizedQuery)) return 80;
    
    // Fuzzy match (gelecekte daha gelişmiş olabilir)
    return 70;
  }

  // Sonuç sıralama
  rankResults(results) {
    return results.sort((a, b) => {
      // Tam eşleşme en üstte
      if (a.exactMatch && !b.exactMatch) return -1;
      if (!a.exactMatch && b.exactMatch) return 1;
      
      // Skor bazlı sıralama
      if (a.score !== b.score) return b.score - a.score;
      
      // Popüler şehirler (İstanbul, Ankara, İzmir)
      const popularCities = ['İSTANBUL', 'ANKARA', 'İZMİR'];
      const aPopular = popularCities.includes(this.normalizeQuery(a.name));
      const bPopular = popularCities.includes(this.normalizeQuery(b.name));
      
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;
      
      // Alfabetik sıralama
      return a.name.localeCompare(b.name, 'tr');
    });
  }

  // Ana arama fonksiyonu
  async search(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    // Cache kontrolü
    const cacheKey = `${query}-${limit}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    const results = [];
    
    // İl arama
    results.push(...this.searchProvinces(query));
    
    // İlçe arama
    results.push(...this.searchDistricts(query));
    
    // Sıralama ve limit
    const rankedResults = this.rankResults(results).slice(0, limit);
    
    // Cache'e kaydet
    this.searchCache.set(cacheKey, rankedResults);
    
    return rankedResults;
  }

  // Detaylı arama (gelecekte)
  async detailedSearch(query, options = {}) {
    const { type, region, limit = 10 } = options;
    
    let results = await this.search(query, limit * 2);
    
    // Tip filtreleme
    if (type) {
      results = results.filter(r => r.type === type);
    }
    
    // Bölge filtreleme
    if (region) {
      results = results.filter(r => r.path.includes(region));
    }
    
    return results.slice(0, limit);
  }

  // İstatistikler
  getStats() {
    return {
      totalProvinces: this.provinces.length,
      totalDistricts: this.districts.length,
      totalNeighborhoods: this.neighborhoods.length,
      totalStreets: this.streets.length,
      cacheSize: this.searchCache.size
    };
  }
}

// Test örnekleri
async function testSearch() {
  console.log('🔍 Modüler Arama Testi Başlıyor...');
  
  const searchService = new ModularAddressSearch();
  await searchService.loadData();
  
  // Test 1: İl arama
  console.log('\n📍 Test 1: İl arama - "istanbul"');
  const test1 = await searchService.search('istanbul');
  console.log(test1);
  
  // Test 2: İlçe arama
  console.log('\n📍 Test 2: İlçe arama - "kadikoy"');
  const test2 = await searchService.search('kadikoy');
  console.log(test2);
  
  // Test 3: Fuzzy search
  console.log('\n📍 Test 3: Fuzzy search - "besiktas"');
  const test3 = await searchService.search('besiktas');
  console.log(test3);
  
  // Test 4: Çoklu sonuç
  console.log('\n📍 Test 4: Çoklu sonuç - "merkez"');
  const test4 = await searchService.search('merkez');
  console.log(test4);
  
  // Test 5: Detaylı arama
  console.log('\n📍 Test 5: Sadece ilçe arama - "ata"');
  const test5 = await searchService.detailedSearch('ata', { type: 'İlçe' });
  console.log(test5);
  
  // İstatistikler
  console.log('\n📊 İstatistikler:');
  console.log(searchService.getStats());
}

// Export
export default ModularAddressSearch;
export { testSearch };

// Kullanım örneği
/*
import ModularAddressSearch from './ModularSearchService.js';

const searchService = new ModularAddressSearch();
await searchService.loadData();

// Basit arama
const results = await searchService.search('kadıköy');

// Detaylı arama
const districts = await searchService.detailedSearch('ata', { 
  type: 'İlçe', 
  region: 'İstanbul' 
});
*/ 