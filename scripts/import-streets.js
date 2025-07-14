const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cadde verilerini import et
async function importStreets() {
  try {
    console.log('🛣️ Cadde verilerini import ediliyor...');
    
    // İstanbul Anadolu caddeleri
    const anadoluPath = path.join(__dirname, '../src/data/Bolgeler/Marmara_Bolgesi/Istanbul_Modulu/Istanbul_Anadolu/Caddeler.json');
    if (fs.existsSync(anadoluPath)) {
      const anadoluData = JSON.parse(fs.readFileSync(anadoluPath, 'utf8'));
      console.log(`📍 İstanbul Anadolu: ${anadoluData.cadde_listesi.length} cadde`);
      
      for (const cadde of anadoluData.cadde_listesi) {
        await pool.query(`
          INSERT INTO caddeler (
            cadde_id, cadde_adi, mahalle_id, highway_type, 
            bolgesi, plaka, yarim_il, created_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (cadde_id) DO UPDATE SET
            cadde_adi = EXCLUDED.cadde_adi,
            highway_type = EXCLUDED.highway_type
        `, [
          cadde.id.toString(),
          cadde.name,
          cadde.parent_id.toString(),
          cadde.highway_type || 'unclassified',
          cadde.bolgesi,
          cadde.plaka,
          cadde.yarim_il,
          new Date().toISOString().split('T')[0]
        ]);
      }
      
      console.log(`✅ İstanbul Anadolu caddeleri import edildi`);
    }
    
    // İstanbul Avrupa caddeleri
    const avrupaPath = path.join(__dirname, '../src/data/Bolgeler/Marmara_Bolgesi/Istanbul_Modulu/Istanbul_Avrupa/Caddeler.json');
    if (fs.existsSync(avrupaPath)) {
      const avrupaData = JSON.parse(fs.readFileSync(avrupaPath, 'utf8'));
      console.log(`📍 İstanbul Avrupa: ${avrupaData.cadde_listesi.length} cadde`);
      
      for (const cadde of avrupaData.cadde_listesi) {
        await pool.query(`
          INSERT INTO caddeler (
            cadde_id, cadde_adi, mahalle_id, highway_type, 
            bolgesi, plaka, yarim_il, created_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (cadde_id) DO UPDATE SET
            cadde_adi = EXCLUDED.cadde_adi,
            highway_type = EXCLUDED.highway_type
        `, [
          cadde.id.toString(),
          cadde.name,
          cadde.parent_id.toString(),
          cadde.highway_type || 'unclassified',
          cadde.bolgesi,
          cadde.plaka,
          cadde.yarim_il,
          new Date().toISOString().split('T')[0]
        ]);
      }
      
      console.log(`✅ İstanbul Avrupa caddeleri import edildi`);
    }
    
    // Toplam cadde sayısını kontrol et
    const totalCount = await pool.query('SELECT COUNT(*) FROM caddeler');
    console.log(`📊 Toplam cadde sayısı: ${totalCount.rows[0].count}`);
    
    // Test arama yap
    const testResult = await pool.query(`
      SELECT c.cadde_adi, m.mahalle_adi, i.ilce_adi, s.sehir_adi
      FROM caddeler c
      JOIN mahalleler m ON c.mahalle_id = m.mahalle_id
      JOIN ilceler i ON m.ilce_id = i.ilce_id
      JOIN sehirler s ON i.sehir_id = s.sehir_id
      WHERE c.cadde_adi ILIKE '%ATATÜRK%'
      LIMIT 5
    `);
    
    console.log('🔍 Test arama (ATATÜRK caddesi):');
    testResult.rows.forEach(row => {
      console.log(`  - ${row.cadde_adi} (${row.mahalle_adi}, ${row.ilce_adi}, ${row.sehir_adi})`);
    });
    
    console.log('🎉 Cadde import işlemi tamamlandı!');
    
  } catch (error) {
    console.error('❌ Cadde import hatası:', error);
  } finally {
    await pool.end();
  }
}

// Script çalıştırma
if (require.main === module) {
  importStreets();
}

module.exports = { importStreets }; 