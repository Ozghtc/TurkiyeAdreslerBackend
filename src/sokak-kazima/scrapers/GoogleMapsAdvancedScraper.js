const axios = require('axios');
const { SokakKazima } = require('../models/SokakKazima');

// Google Maps Gelişmiş Adres Bilgi Kazıyıcısı
class GoogleMapsAdvancedScraper {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
        this.endpoints = {
            geocoding: '/geocode/json',
            places: '/place/nearbysearch/json',
            placeDetails: '/place/details/json',
            streetView: '/streetview',
            directions: '/directions/json'
        };
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            detailedAddresses: 0
        };
    }

    // Gelişmiş adres analizi
    async getAdvancedAddressInfo(adres, ilce) {
        try {
            console.log(`🔍 ${adres}, ${ilce} için gelişmiş bilgi toplanıyor...`);
            
            const fullAddress = `${adres}, ${ilce}, İstanbul, Türkiye`;
            
            // 1. Temel geocoding
            const geocodingData = await this.geocodeAddress(fullAddress);
            if (!geocodingData) return null;
            
            // 2. Detaylı konum bilgileri
            const locationDetails = this.extractLocationDetails(geocodingData);
            
            // 3. Yakındaki yerler
            const nearbyPlaces = await this.getNearbyPlaces(locationDetails.coordinates);
            
            // 4. Street View bilgisi
            const streetViewInfo = await this.getStreetViewInfo(locationDetails.coordinates);
            
            // 5. Tam adres komponenti oluştur
            const advancedAddress = this.buildAdvancedAddress({
                geocodingData,
                locationDetails,
                nearbyPlaces,
                streetViewInfo,
                originalQuery: { adres, ilce }
            });
            
            this.stats.detailedAddresses++;
            console.log(`   ✅ ${advancedAddress.sokakIsmi} için detaylı bilgi toplandı`);
            
            return advancedAddress;
            
        } catch (error) {
            console.error(`❌ ${adres} için gelişmiş bilgi toplama hatası:`, error.message);
            return null;
        }
    }

    // Google Geocoding API
    async geocodeAddress(address) {
        try {
            const url = `${this.baseUrl}${this.endpoints.geocoding}`;
            const params = {
                address: address,
                key: this.apiKey,
                language: 'tr',
                region: 'tr'
            };
            
            const response = await this.makeRequest(url, { params });
            
            if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
                return response.data.results[0];
            }
            
            return null;
            
        } catch (error) {
            console.error('Geocoding hatası:', error.message);
            return null;
        }
    }

    // Konum detaylarını çıkar
    extractLocationDetails(geocodingData) {
        const result = geocodingData;
        const components = result.address_components || [];
        const geometry = result.geometry || {};
        
        const details = {
            coordinates: {
                lat: geometry.location?.lat,
                lng: geometry.location?.lng
            },
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            plusCode: result.plus_code?.global_code,
            addressComponents: {},
            boundingBox: geometry.bounds || geometry.viewport
        };
        
        // Adres bileşenlerini organize et
        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
                details.addressComponents.sokakNo = component.long_name;
            }
            if (types.includes('route')) {
                details.addressComponents.sokakIsmi = component.long_name;
            }
            if (types.includes('neighborhood') || types.includes('sublocality')) {
                details.addressComponents.mahalle = component.long_name;
            }
            if (types.includes('administrative_area_level_2')) {
                details.addressComponents.ilce = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
                details.addressComponents.il = component.long_name;
            }
            if (types.includes('postal_code')) {
                details.addressComponents.postaKodu = component.long_name;
            }
            if (types.includes('country')) {
                details.addressComponents.ulke = component.long_name;
            }
        });
        
        return details;
    }

    // Yakındaki yerler
    async getNearbyPlaces(coordinates, radius = 500) {
        if (!coordinates.lat || !coordinates.lng) return [];
        
        try {
            const url = `${this.baseUrl}${this.endpoints.places}`;
            const params = {
                location: `${coordinates.lat},${coordinates.lng}`,
                radius: radius,
                key: this.apiKey,
                language: 'tr'
            };
            
            const response = await this.makeRequest(url, { params });
            
            if (response.data && response.data.status === 'OK') {
                return response.data.results.slice(0, 10).map(place => ({
                    isim: place.name,
                    tip: place.types[0],
                    puan: place.rating,
                    mesafe: this.calculateDistance(coordinates, place.geometry.location),
                    placeId: place.place_id
                }));
            }
            
            return [];
            
        } catch (error) {
            console.error('Yakın yerler hatası:', error.message);
            return [];
        }
    }

    // Street View bilgisi
    async getStreetViewInfo(coordinates) {
        if (!coordinates.lat || !coordinates.lng) return null;
        
        try {
            // Street View metadata API (ücretsiz)
            const metadataUrl = `${this.baseUrl}/streetview/metadata`;
            const params = {
                location: `${coordinates.lat},${coordinates.lng}`,
                key: this.apiKey
            };
            
            const response = await this.makeRequest(metadataUrl, { params });
            
            if (response.data && response.data.status === 'OK') {
                return {
                    available: true,
                    date: response.data.date,
                    location: response.data.location,
                    imageUrl: `${this.baseUrl}${this.endpoints.streetView}?location=${coordinates.lat},${coordinates.lng}&size=400x300&key=${this.apiKey}`
                };
            }
            
            return { available: false };
            
        } catch (error) {
            console.error('Street View hatası:', error.message);
            return { available: false };
        }
    }

    // Gelişmiş adres objesi oluştur
    buildAdvancedAddress({ geocodingData, locationDetails, nearbyPlaces, streetViewInfo, originalQuery }) {
        const details = locationDetails.addressComponents;
        
        return {
            // Temel bilgiler
            sokakIsmi: details.sokakIsmi || originalQuery.adres,
            sokakNo: details.sokakNo || null,
            mahalle: details.mahalle || '',
            ilce: details.ilce || originalQuery.ilce,
            il: details.il || 'İstanbul',
            postaKodu: details.postaKodu || null,
            
            // Konum bilgileri  
            koordinat: locationDetails.coordinates,
            plusCode: locationDetails.plusCode,
            placeId: locationDetails.placeId,
            formattedAddress: locationDetails.formattedAddress,
            boundingBox: locationDetails.boundingBox,
            
            // Street View
            streetView: streetViewInfo,
            
            // Yakın yerler
            yakinYerler: nearbyPlaces,
            
            // Metadata
            kaynak: 'google_advanced',
            onemDerecesi: this.calculateImportanceLevel(geocodingData, nearbyPlaces, streetViewInfo),
            olusturmaTarihi: new Date(),
            
            // Google özgü bilgiler
            googleData: {
                placeId: locationDetails.placeId,
                geocodingAccuracy: geocodingData.geometry?.location_type,
                addressTypes: geocodingData.types || []
            }
        };
    }

    // Önem seviyesi hesapla
    calculateImportanceLevel(geocodingData, nearbyPlaces, streetViewInfo) {
        let score = 0;
        
        // Geocoding doğruluğu
        const locationType = geocodingData.geometry?.location_type;
        if (locationType === 'ROOFTOP') score += 4;
        else if (locationType === 'RANGE_INTERPOLATED') score += 3;
        else if (locationType === 'GEOMETRIC_CENTER') score += 2;
        else score += 1;
        
        // Yakın yer sayısı
        if (nearbyPlaces.length > 15) score += 3;
        else if (nearbyPlaces.length > 8) score += 2;
        else if (nearbyPlaces.length > 3) score += 1;
        
        // Street View mevcudiyeti
        if (streetViewInfo.available) score += 2;
        
        // Adres bileşenleri eksiksizliği
        const components = geocodingData.address_components?.length || 0;
        if (components > 6) score += 2;
        else if (components > 4) score += 1;
        
        // Puan aralığına göre seviye
        if (score >= 10) return 'very-high';
        else if (score >= 7) return 'high';
        else if (score >= 4) return 'medium';
        else return 'low';
    }

    // Mesafe hesaplama (Haversine formula)
    calculateDistance(coord1, coord2) {
        const R = 6371; // Dünya yarıçapı (km)
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return Math.round(distance * 1000); // metre cinsinden
    }

    // HTTP isteği
    async makeRequest(url, options = {}) {
        try {
            this.stats.totalRequests++;
            
            const response = await axios({
                url,
                method: 'GET',
                timeout: 10000,
                ...options
            });
            
            this.stats.successfulRequests++;
            return response;
            
        } catch (error) {
            console.error(`API isteği hatası: ${error.message}`);
            throw error;
        }
    }

    // İstatistikleri getir
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 ? 
                Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) : 0
        };
    }

    // Çoklu adres işleme
    async processMultipleAddresses(adresler, ilce) {
        console.log(`🚀 ${adresler.length} adres için gelişmiş bilgi toplama başlıyor...`);
        
        const results = [];
        
        for (let i = 0; i < adresler.length; i++) {
            const adres = adresler[i];
            console.log(`📍 ${i + 1}/${adresler.length}: ${adres}`);
            
            const result = await this.getAdvancedAddressInfo(adres, ilce);
            if (result) {
                results.push(result);
            }
            
            // Rate limiting - Google API günlük limitini aşmamak için
            await this.sleep(100);
        }
        
        console.log(`✅ Toplam ${results.length} adres için detaylı bilgi toplandı`);
        return results;
    }

    // Bekleme fonksiyonu
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = GoogleMapsAdvancedScraper; 