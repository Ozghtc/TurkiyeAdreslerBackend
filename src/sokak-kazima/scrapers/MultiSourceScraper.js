const axios = require('axios');
const cheerio = require('cheerio');
const { SokakKazima } = require('../models/SokakKazima');

// Çoklu Kaynak Sokak Kazıyıcısı
class MultiSourceScraper {
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            delayBetweenRequests: 1000,
            maxConcurrentRequests: 5,
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (compatible; SokakKazima/1.0)',
            ...config
        };
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            streetsFound: 0,
            sourcesUsed: new Set()
        };
        
        this.progressCallback = null;
    }

    // İlerleme callback'i ayarla
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    // Ana kazıma fonksiyonu
    async scrapeIlceStreets(ilceler, sources = ['wikipedia', 'google', 'yandex']) {
        console.log(`🚀 ${ilceler.length} ilçe için sokak kazıma başlıyor...`);
        
        const allStreets = new Map(); // Duplikasyon kontrolü için
        let processedCount = 0;
        
        for (const ilce of ilceler) {
            console.log(`📍 ${ilce} işleniyor...`);
            
            const ilceStreets = [];
            
            // Her kaynak için sokakları topla
            for (const source of sources) {
                try {
                    const streets = await this.scrapeFromSource(source, ilce);
                    ilceStreets.push(...streets);
                    this.stats.sourcesUsed.add(source);
                    
                    console.log(`   ${source}: ${streets.length} sokak bulundu`);
                    
                    // Rate limiting
                    await this.sleep(this.config.delayBetweenRequests);
                    
                } catch (error) {
                    console.error(`   ❌ ${source} hatası: ${error.message}`);
                    this.stats.failedRequests++;
                }
            }
            
            // Duplikasyon kontrolü ile ekle
            const uniqueStreets = this.removeDuplicates(ilceStreets);
            uniqueStreets.forEach(street => {
                const key = `${street.ilce}-${street.isim}-${street.tip}`;
                if (!allStreets.has(key)) {
                    allStreets.set(key, street);
                    this.stats.streetsFound++;
                }
            });
            
            processedCount++;
            
            // İlerleme callback'i çağır
            if (this.progressCallback) {
                this.progressCallback({
                    processed: processedCount,
                    total: ilceler.length,
                    currentIlce: ilce,
                    foundStreets: this.stats.streetsFound,
                    percentage: Math.round((processedCount / ilceler.length) * 100)
                });
            }
        }
        
        console.log(`✅ Kazıma tamamlandı: ${this.stats.streetsFound} sokak bulundu`);
        return Array.from(allStreets.values());
    }

    // Kaynak bazında kazıma
    async scrapeFromSource(source, ilce) {
        switch (source) {
            case 'wikipedia':
                return await this.scrapeFromWikipedia(ilce);
            case 'google':
                return await this.scrapeFromGoogle(ilce);
            case 'yandex':
                return await this.scrapeFromYandex(ilce);
            case 'ibb':
                return await this.scrapeFromIBB(ilce);
            default:
                throw new Error(`Bilinmeyen kaynak: ${source}`);
        }
    }

    // Wikipedia'dan sokak kazıma
    async scrapeFromWikipedia(ilce) {
        try {
            const categoryUrl = `https://tr.wikipedia.org/wiki/Kategori:${encodeURIComponent(ilce)}'deki_cadde_ve_sokaklar`;
            
            const response = await this.makeRequest(categoryUrl);
            if (!response) return [];
            
            const $ = cheerio.load(response);
            const streets = [];
            
            $('#mw-pages .mw-category-group li').each((i, elem) => {
                const link = $(elem).find('a');
                const name = link.text().trim();
                
                if (name) {
                    const street = new SokakKazima();
                    street.isim = name;
                    street.ilce = ilce;
                    street.tip = SokakKazima.tipBelirle(name);
                    street.kaynak = 'wikipedia';
                    street.onemDerecesi = SokakKazima.onemDerecesiBelirle('wikipedia');
                    street.generateId();
                    
                    streets.push(street);
                }
            });
            
            this.stats.successfulRequests++;
            return streets;
            
        } catch (error) {
            console.error(`Wikipedia ${ilce} hatası:`, error.message);
            return [];
        }
    }

    // Google Places API'dan sokak kazıma (mock implementation)
    async scrapeFromGoogle(ilce) {
        try {
            // Bu gerçek bir Google Places API implementasyonu olmalı
            // Şimdilik mock veri döndürüyoruz
            
            const mockStreets = this.generateMockStreets(ilce, 'google');
            
            this.stats.successfulRequests++;
            return mockStreets;
            
        } catch (error) {
            console.error(`Google ${ilce} hatası:`, error.message);
            return [];
        }
    }

    // Yandex Maps'ten sokak kazıma (mock implementation)
    async scrapeFromYandex(ilce) {
        try {
            // Bu gerçek bir Yandex Maps API implementasyonu olmalı
            // Şimdilik mock veri döndürüyoruz
            
            const mockStreets = this.generateMockStreets(ilce, 'yandex');
            
            this.stats.successfulRequests++;
            return mockStreets;
            
        } catch (error) {
            console.error(`Yandex ${ilce} hatası:`, error.message);
            return [];
        }
    }

    // İBB Açık Veri'den sokak kazıma
    async scrapeFromIBB(ilce) {
        try {
            // İBB açık veri API'si implementasyonu
            const ibbUrl = `https://data.ibb.gov.tr/api/dataset/roads?district=${encodeURIComponent(ilce)}`;
            
            const response = await this.makeRequest(ibbUrl);
            if (!response) return [];
            
            const data = JSON.parse(response);
            const streets = [];
            
            if (data.result && Array.isArray(data.result)) {
                data.result.forEach(road => {
                    const street = new SokakKazima();
                    street.isim = road.name || road.road_name || '';
                    street.ilce = ilce;
                    street.tip = SokakKazima.tipBelirle(street.isim);
                    street.kaynak = 'ibb';
                    
                    if (road.coordinates) {
                        street.koordinat = {
                            lat: road.coordinates.lat,
                            lng: road.coordinates.lng
                        };
                    }
                    
                    if (road.length) {
                        street.uzunluk = {
                            deger: road.length,
                            birim: road.length_unit || 'm'
                        };
                    }
                    
                    street.onemDerecesi = SokakKazima.onemDerecesiBelirle(
                        'ibb', 
                        !!street.koordinat, 
                        !!street.uzunluk
                    );
                    street.generateId();
                    
                    streets.push(street);
                });
            }
            
            this.stats.successfulRequests++;
            return streets;
            
        } catch (error) {
            console.error(`İBB ${ilce} hatası:`, error.message);
            return [];
        }
    }

    // Mock sokak oluşturucu (test için)
    generateMockStreets(ilce, source) {
        const mockNames = [
            'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'İstiklal Caddesi',
            'Fatih Sokağı', 'Mehmet Akif Sokağı', 'Namık Kemal Sokağı',
            'Sakarya Caddesi', 'Ankara Caddesi', 'İzmir Caddesi'
        ];
        
        const streets = [];
        const count = Math.floor(Math.random() * 5) + 3; // 3-7 arası
        
        for (let i = 0; i < count; i++) {
            const name = mockNames[Math.floor(Math.random() * mockNames.length)];
            
            const street = new SokakKazima();
            street.isim = `${ilce} ${name}`;
            street.ilce = ilce;
            street.tip = SokakKazima.tipBelirle(name);
            street.kaynak = source;
            street.onemDerecesi = SokakKazima.onemDerecesiBelirle(source);
            street.generateId();
            
            streets.push(street);
        }
        
        return streets;
    }

    // HTTP isteği yapma
    async makeRequest(url, options = {}) {
        try {
            this.stats.totalRequests++;
            
            const config = {
                url,
                method: 'GET',
                timeout: this.config.timeout,
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                ...options
            };
            
            const response = await axios(config);
            return response.data;
            
        } catch (error) {
            console.error(`İstek hatası (${url}):`, error.message);
            return null;
        }
    }

    // Duplikasyon temizleme
    removeDuplicates(streets) {
        const seen = new Set();
        return streets.filter(street => {
            const key = `${street.ilce}-${street.isim.toLowerCase()}-${street.tip}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Bekleme fonksiyonu
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // İstatistikleri getir
    getStats() {
        return {
            ...this.stats,
            sourcesUsed: Array.from(this.stats.sourcesUsed),
            successRate: this.stats.totalRequests > 0 ? 
                Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) : 0
        };
    }

    // İstatistikleri sıfırla
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            streetsFound: 0,
            sourcesUsed: new Set()
        };
    }
}

module.exports = MultiSourceScraper; 