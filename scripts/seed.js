const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JSON dosyalarının konumu (parent directory)
const dataPath = path.join(__dirname, '../../src/data');

async function importData() {
  try {
    console.log('🚀 Veri import işlemi başlatılıyor...');
    
    // 1. Şehirler import et
    console.log('📍 Şehirler import ediliyor...');
    const sehirlerPath = path.join(dataPath, 'sehirler.json');
    const sehirlerData = JSON.parse(fs.readFileSync(sehirlerPath, 'utf8'));
    
    for (const sehir of sehirlerData) {
      await pool.query(
        'INSERT INTO sehirler (sehir_id, sehir_adi) VALUES ($1, $2) ON CONFLICT (sehir_id) DO NOTHING',
        [sehir.sehir_id, sehir.sehir_adi]
      );
    }
    console.log(`✅ ${sehirlerData.length} şehir import edildi`);

    // 2. İlçeler import et
    console.log('🏛️ İlçeler import ediliyor...');
    const ilcelerPath = path.join(dataPath, 'ilceler.json');
    const ilcelerData = JSON.parse(fs.readFileSync(ilcelerPath, 'utf8'));
    
    for (const ilce of ilcelerData) {
      await pool.query(
        'INSERT INTO ilceler (ilce_id, ilce_adi, sehir_id) VALUES ($1, $2, $3) ON CONFLICT (ilce_id) DO NOTHING',
        [ilce.ilce_id, ilce.ilce_adi, ilce.sehir_id]
      );
    }
    console.log(`✅ ${ilcelerData.length} ilçe import edildi`);

    // 3. Mahalleler import et (4 dosyadan)
    console.log('🏘️ Mahalleler import ediliyor...');
    let totalMahalleler = 0;
    
    for (let i = 1; i <= 4; i++) {
      const mahallelerPath = path.join(dataPath, `mahalleler-${i}.json`);
      
      if (fs.existsSync(mahallelerPath)) {
        const mahallelerData = JSON.parse(fs.readFileSync(mahallelerPath, 'utf8'));
        
        console.log(`📄 mahalleler-${i}.json işleniyor... (${mahallelerData.length} kayıt)`);
        
        // Batch insert için
        const batchSize = 1000;
        for (let j = 0; j < mahallelerData.length; j += batchSize) {
          const batch = mahallelerData.slice(j, j + batchSize);
          
          for (const mahalle of batch) {
            await pool.query(
              'INSERT INTO mahalleler (mahalle_id, mahalle_adi, ilce_id) VALUES ($1, $2, $3) ON CONFLICT (mahalle_id) DO NOTHING',
              [mahalle.mahalle_id, mahalle.mahalle_adi, mahalle.ilce_id]
            );
          }
          
          console.log(`   📊 ${Math.min(j + batchSize, mahallelerData.length)}/${mahallelerData.length} işlendi`);
        }
        
        totalMahalleler += mahallelerData.length;
      }
    }
    
    console.log(`✅ ${totalMahalleler} mahalle import edildi`);

    // 4. Veri sayısını kontrol et
    console.log('📊 Veri sayısı kontrolü...');
    const sehirCount = await pool.query('SELECT COUNT(*) FROM sehirler');
    const ilceCount = await pool.query('SELECT COUNT(*) FROM ilceler');
    const mahalleCount = await pool.query('SELECT COUNT(*) FROM mahalleler');
    
    console.log(`📍 Şehir sayısı: ${sehirCount.rows[0].count}`);
    console.log(`🏛️ İlçe sayısı: ${ilceCount.rows[0].count}`);
    console.log(`🏘️ Mahalle sayısı: ${mahalleCount.rows[0].count}`);

    // 5. Test arama yap
    console.log('🔍 Test arama yapılıyor...');
    const testResult = await pool.query(
      "SELECT COUNT(*) FROM mahalleler WHERE mahalle_adi ILIKE '%şirin%'"
    );
    console.log(`🧪 'şirin' araması: ${testResult.rows[0].count} sonuç`);

    const testResult2 = await pool.query(
      "SELECT COUNT(*) FROM mahalleler WHERE normalize_turkish(mahalle_adi) LIKE '%sirin%'"
    );
    console.log(`🧪 'sirin' (normalize) araması: ${testResult2.rows[0].count} sonuç`);

    console.log('🎉 Import işlemi tamamlandı!');
    
  } catch (error) {
    console.error('❌ Import hatası:', error);
  } finally {
    await pool.end();
  }
}

// Script çalıştırma
if (require.main === module) {
  importData();
}

module.exports = { importData }; 