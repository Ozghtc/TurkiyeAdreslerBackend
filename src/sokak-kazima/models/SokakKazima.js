// Backend Sokak Kazıma Model

class SokakKazima {
    constructor() {
        this.id = null;
        this.isim = '';
        this.tip = ''; // cadde, sokak, bulvar, meydan, çıkmaz, diğer
        this.ilce = '';
        this.mahalle = '';
        this.koordinat = null;
        this.uzunluk = null;
        this.kaynak = ''; // wikipedia, google, yandex, ibb, tahmin
        this.onemDerecesi = ''; // low, medium, high, very-high
        this.aciklama = '';
        this.olusturmaTarihi = new Date();
        this.guncellenmeTarihi = new Date();
    }

    // JSON'dan model oluştur
    static fromJSON(data) {
        const sokak = new SokakKazima();
        sokak.id = data.id || null;
        sokak.isim = data.isim || '';
        sokak.tip = data.tip || 'diğer';
        sokak.ilce = data.ilce || '';
        sokak.mahalle = data.mahalle || '';
        sokak.koordinat = data.koordinat || null;
        sokak.uzunluk = data.uzunluk || null;
        sokak.kaynak = data.kaynak || 'tahmin';
        sokak.onemDerecesi = data.onemDerecesi || 'low';
        sokak.aciklama = data.aciklama || '';
        sokak.olusturmaTarihi = data.olusturmaTarihi ? new Date(data.olusturmaTarihi) : new Date();
        sokak.guncellenmeTarihi = data.guncellenmeTarihi ? new Date(data.guncellenmeTarihi) : new Date();
        return sokak;
    }

    // Model'i JSON'a çevir
    toJSON() {
        return {
            id: this.id,
            isim: this.isim,
            tip: this.tip,
            ilce: this.ilce,
            mahalle: this.mahalle,
            koordinat: this.koordinat,
            uzunluk: this.uzunluk,
            kaynak: this.kaynak,
            onemDerecesi: this.onemDerecesi,
            aciklama: this.aciklama,
            olusturmaTarihi: this.olusturmaTarihi,
            guncellenmeTarihi: this.guncellenmeTarihi
        };
    }

    // Benzersiz ID oluştur
    generateId() {
        const cleanName = this.isim.toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        this.id = `${this.ilce.toLowerCase()}-${cleanName}-${this.tip}`;
        return this.id;
    }

    // Validasyon
    validate() {
        const errors = [];
        
        if (!this.isim || this.isim.trim() === '') {
            errors.push('Sokak/cadde ismi gerekli');
        }
        
        if (!this.ilce || this.ilce.trim() === '') {
            errors.push('İlçe bilgisi gerekli');
        }
        
        if (!['cadde', 'sokak', 'bulvar', 'meydan', 'çıkmaz', 'diğer'].includes(this.tip)) {
            errors.push('Geçerli bir tip seçilmeli');
        }
        
        if (!['wikipedia', 'google', 'yandex', 'ibb', 'tahmin'].includes(this.kaynak)) {
            errors.push('Geçerli bir kaynak belirtilmeli');
        }
        
        if (!['low', 'medium', 'high', 'very-high'].includes(this.onemDerecesi)) {
            errors.push('Geçerli bir önem derecesi belirtilmeli');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Tip belirleme yardımcı fonksiyonu
    static tipBelirle(isim) {
        const cleanName = isim.toLowerCase();
        
        if (cleanName.includes('caddesi') || cleanName.includes('cad.')) {
            return 'cadde';
        } else if (cleanName.includes('sokak') || cleanName.includes('sk.') || cleanName.includes('sokağı')) {
            return 'sokak';
        } else if (cleanName.includes('bulvar') || cleanName.includes('bulv.')) {
            return 'bulvar';
        } else if (cleanName.includes('meydan') || cleanName.includes('meydanı')) {
            return 'meydan';
        } else if (cleanName.includes('çıkmazı') || cleanName.includes('çık.')) {
            return 'çıkmaz';
        } else {
            return 'diğer';
        }
    }

    // Önem derecesi belirleme
    static onemDerecesiBelirle(kaynak, koordinatVarMi = false, uzunlukVarMi = false) {
        let score = 0;
        
        // Kaynak bazında puan
        switch (kaynak) {
            case 'wikipedia':
                score += 4;
                break;
            case 'google':
                score += 3;
                break;
            case 'ibb':
                score += 3;
                break;
            case 'yandex':
                score += 2;
                break;
            case 'tahmin':
                score += 1;
                break;
        }
        
        // Koordinat varsa ekstra puan
        if (koordinatVarMi) score += 2;
        
        // Uzunluk bilgisi varsa ekstra puan
        if (uzunlukVarMi) score += 1;
        
        // Puana göre önem derecesi
        if (score >= 6) return 'very-high';
        else if (score >= 4) return 'high';
        else if (score >= 2) return 'medium';
        else return 'low';
    }
}

// İstatistik Model
class KazimaIstatistikleri {
    constructor() {
        this.toplamSokak = 0;
        this.ilceBazindaDagılım = {};
        this.tipBazindaDagılım = {};
        this.kaynakBazindaDagılım = {};
        this.onemBazindaDagılım = {};
        this.sonGuncelleme = new Date();
    }

    static fromData(sokaklar) {
        const istatistik = new KazimaIstatistikleri();
        istatistik.toplamSokak = sokaklar.length;
        
        sokaklar.forEach(sokak => {
            // İlçe bazında
            if (!istatistik.ilceBazindaDagılım[sokak.ilce]) {
                istatistik.ilceBazindaDagılım[sokak.ilce] = {
                    cadde: 0,
                    sokak: 0,
                    bulvar: 0,
                    diğer: 0,
                    toplam: 0
                };
            }
            istatistik.ilceBazindaDagılım[sokak.ilce][sokak.tip]++;
            istatistik.ilceBazindaDagılım[sokak.ilce].toplam++;
            
            // Tip bazında
            istatistik.tipBazindaDagılım[sokak.tip] = (istatistik.tipBazindaDagılım[sokak.tip] || 0) + 1;
            
            // Kaynak bazında
            istatistik.kaynakBazindaDagılım[sokak.kaynak] = (istatistik.kaynakBazindaDagılım[sokak.kaynak] || 0) + 1;
            
            // Önem bazında
            istatistik.onemBazindaDagılım[sokak.onemDerecesi] = (istatistik.onemBazindaDagılım[sokak.onemDerecesi] || 0) + 1;
        });
        
        return istatistik;
    }
}

module.exports = {
    SokakKazima,
    KazimaIstatistikleri
}; 