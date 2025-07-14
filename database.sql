-- Türkiye Adres API Database Schema

-- Şehirler tablosu
CREATE TABLE IF NOT EXISTS sehirler (
    sehir_id VARCHAR(10) PRIMARY KEY,
    sehir_adi VARCHAR(100) NOT NULL
);

-- İlçeler tablosu
CREATE TABLE IF NOT EXISTS ilceler (
    ilce_id VARCHAR(10) PRIMARY KEY,
    ilce_adi VARCHAR(100) NOT NULL,
    sehir_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (sehir_id) REFERENCES sehirler(sehir_id)
);

-- Mahalleler tablosu
CREATE TABLE IF NOT EXISTS mahalleler (
    mahalle_id VARCHAR(20) PRIMARY KEY,
    mahalle_adi VARCHAR(200) NOT NULL,
    ilce_id VARCHAR(10) NOT NULL,
    coordinates JSONB,
    posta_kodu VARCHAR(10),
    multilingual JSONB,
    FOREIGN KEY (ilce_id) REFERENCES ilceler(ilce_id)
);

-- Caddeler tablosu
CREATE TABLE IF NOT EXISTS caddeler (
    cadde_id VARCHAR(20) PRIMARY KEY,
    cadde_adi VARCHAR(200) NOT NULL,
    mahalle_id VARCHAR(20) NOT NULL,
    highway_type VARCHAR(50),
    coordinates JSONB,
    bounds JSONB,
    posta_kodu VARCHAR(10),
    bolgesi VARCHAR(20),
    plaka INTEGER,
    yarim_il INTEGER,
    osm_id BIGINT,
    multilingual JSONB,
    created_date DATE,
    FOREIGN KEY (mahalle_id) REFERENCES mahalleler(mahalle_id)
);

-- Sokaklar tablosu (gelecek için)
CREATE TABLE IF NOT EXISTS sokaklar (
    sokak_id VARCHAR(20) PRIMARY KEY,
    sokak_adi VARCHAR(200) NOT NULL,
    cadde_id VARCHAR(20) NOT NULL,
    coordinates JSONB,
    multilingual JSONB,
    FOREIGN KEY (cadde_id) REFERENCES caddeler(cadde_id)
);

-- Performans için indexler
CREATE INDEX IF NOT EXISTS idx_sehirler_adi ON sehirler(sehir_adi);
CREATE INDEX IF NOT EXISTS idx_ilceler_adi ON ilceler(ilce_adi);
CREATE INDEX IF NOT EXISTS idx_ilceler_sehir ON ilceler(sehir_id);
CREATE INDEX IF NOT EXISTS idx_mahalleler_adi ON mahalleler(mahalle_adi);
CREATE INDEX IF NOT EXISTS idx_mahalleler_ilce ON mahalleler(ilce_id);
CREATE INDEX IF NOT EXISTS idx_caddeler_adi ON caddeler(cadde_adi);
CREATE INDEX IF NOT EXISTS idx_caddeler_mahalle ON caddeler(mahalle_id);
CREATE INDEX IF NOT EXISTS idx_caddeler_highway ON caddeler(highway_type);
CREATE INDEX IF NOT EXISTS idx_caddeler_bolgesi ON caddeler(bolgesi);
CREATE INDEX IF NOT EXISTS idx_sokaklar_adi ON sokaklar(sokak_adi);
CREATE INDEX IF NOT EXISTS idx_sokaklar_cadde ON sokaklar(cadde_id);

-- Full-text search için indexler
CREATE INDEX IF NOT EXISTS idx_mahalleler_fulltext ON mahalleler USING gin(to_tsvector('turkish', mahalle_adi));
CREATE INDEX IF NOT EXISTS idx_sehirler_fulltext ON sehirler USING gin(to_tsvector('turkish', sehir_adi));
CREATE INDEX IF NOT EXISTS idx_ilceler_fulltext ON ilceler USING gin(to_tsvector('turkish', ilce_adi));
CREATE INDEX IF NOT EXISTS idx_caddeler_fulltext ON caddeler USING gin(to_tsvector('turkish', cadde_adi));
CREATE INDEX IF NOT EXISTS idx_sokaklar_fulltext ON sokaklar USING gin(to_tsvector('turkish', sokak_adi));

-- Türkçe karakter normalizasyonu için fonksiyon
CREATE OR REPLACE FUNCTION normalize_turkish(text_input text)
RETURNS text AS $$
BEGIN
    RETURN LOWER(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(text_input, 'ş', 's'), 
                                    'Ş', 's'), 
                                'ğ', 'g'), 
                            'Ğ', 'g'), 
                        'ı', 'i'), 
                    'İ', 'i'), 
                'ü', 'u'), 
            'Ü', 'u')
        );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normalizasyon için index
CREATE INDEX IF NOT EXISTS idx_mahalleler_normalized ON mahalleler(normalize_turkish(mahalle_adi));
CREATE INDEX IF NOT EXISTS idx_caddeler_normalized ON caddeler(normalize_turkish(cadde_adi));
CREATE INDEX IF NOT EXISTS idx_sokaklar_normalized ON sokaklar(normalize_turkish(sokak_adi));

-- Veri sayısı kontrol sorguları
-- SELECT COUNT(*) FROM sehirler;
-- SELECT COUNT(*) FROM ilceler;
-- SELECT COUNT(*) FROM mahalleler;
-- SELECT COUNT(*) FROM caddeler;
-- SELECT COUNT(*) FROM sokaklar;

-- Test arama sorguları
-- SELECT * FROM sehirler WHERE sehir_adi ILIKE '%ankara%';
-- SELECT * FROM mahalleler WHERE mahalle_adi ILIKE '%şirin%' OR normalize_turkish(mahalle_adi) LIKE '%sirin%' LIMIT 10;
-- SELECT * FROM caddeler WHERE cadde_adi ILIKE '%istiklal%' OR normalize_turkish(cadde_adi) LIKE '%istiklal%' LIMIT 10;

-- Join sorguları
-- SELECT s.sehir_adi, i.ilce_adi, m.mahalle_adi, c.cadde_adi 
-- FROM caddeler c 
-- JOIN mahalleler m ON c.mahalle_id = m.mahalle_id 
-- JOIN ilceler i ON m.ilce_id = i.ilce_id 
-- JOIN sehirler s ON i.sehir_id = s.sehir_id 
-- WHERE c.cadde_adi ILIKE '%barbaros%' LIMIT 10; 