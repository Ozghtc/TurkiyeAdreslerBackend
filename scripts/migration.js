const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Bolgeler data path
const bolgelereDataPath = path.join(__dirname, '../src/data/Bolgeler');

// PBF dosyaları ana workspace'de
const pbfDataPath = path.join(__dirname, '../../..');
const turkeyPbfPath = path.join(pbfDataPath, 'turkey-latest.osm.pbf');
const istanbulPbfPath = path.join(pbfDataPath, 'istanbul-only.osm.pbf');

class TurkiyeAdreslerMigration {
  constructor() {
    this.stats = {
      sehirler: 0,
      ilceler: 0,
      mahalleler: 0,
      caddeler: 0,
      errors: []
    };
  }

  async migrate() {
    try {
      console.log('🚀 Türkiye Adresler Migration Başlatılıyor...\n');
      
      // 1. Database tabloları oluştur
      await this.createTables();
      
      // 2. Bölgeleri tara ve veri import et
      await this.importFromBolgeler();
      
      // 3. İstatistikleri göster
      this.showStats();
      
      console.log('\n🎉 Migration tamamlandı!');
      
    } catch (error) {
      console.error('❌ Migration Hatası:', error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  async createTables() {
    console.log('📋 Database tabloları kontrol ediliyor...');
    
    // Database.sql dosyasını çalıştır
    const sqlFilePath = path.join(__dirname, '../database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL komutlarını ayır ve çalıştır
    const sqlCommands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'))
      .map(cmd => cmd.trim());

    for (const command of sqlCommands) {
      if (command) {
        try {
          await pool.query(command);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error('SQL Error:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Database tabloları hazır\n');
  }

  async importFromBolgeler() {
    console.log('🗺️ Bölgeler klasörü taranıyor...');
    
    // Bölgeleri listele
    const bolgeler = fs.readdirSync(bolgelereDataPath)
      .filter(item => fs.statSync(path.join(bolgelereDataPath, item)).isDirectory());
    
    console.log(`📁 Bulunan bölgeler: ${bolgeler.join(', ')}\n`);

    for (const bolge of bolgeler) {
      await this.processBolge(bolge);
    }
  }

  async processBolge(bolgeName) {
    console.log(`📍 ${bolgeName} işleniyor...`);
    const bolgePath = path.join(bolgelereDataPath, bolgeName);
    
    // Iller.json varsa oku
    const illerPath = path.join(bolgePath, 'Iller.json');
    if (fs.existsSync(illerPath)) {
      const illerData = JSON.parse(fs.readFileSync(illerPath, 'utf8'));
      await this.importIller(illerData);
    }

    // İl modüllerini tara
    const items = fs.readdirSync(bolgePath);
    for (const item of items) {
      const itemPath = path.join(bolgePath, item);
      if (fs.statSync(itemPath).isDirectory() && item.endsWith('_Modulu')) {
        await this.processIlModulu(itemPath, item);
      }
    }
  }

  async processIlModulu(modulePath, moduleName) {
    console.log(`  🏛️ ${moduleName} modülü işleniyor...`);
    
    // İl genel verisi
    const genelPath = path.join(modulePath, `${moduleName.replace('_Modulu', '')}_Genel.json`);
    if (fs.existsSync(genelPath)) {
      const genelData = JSON.parse(fs.readFileSync(genelPath, 'utf8'));
      await this.importIlGenel(genelData);
    }

    // Yakalar (Avrupa/Anadolu) veya doğrudan ilçeler
    const items = fs.readdirSync(modulePath);
    for (const item of items) {
      const itemPath = path.join(modulePath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        await this.processYaka(itemPath, item);
      } else if (item.endsWith('.json') && (item.includes('Ilceler') || item.includes('Mahalleler'))) {
        await this.processFile(itemPath);
      }
    }
  }

  async processYaka(yakaPath, yakaName) {
    console.log(`    🌊 ${yakaName} yakası işleniyor...`);
    
    const files = fs.readdirSync(yakaPath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(yakaPath, file);
      await this.processFile(filePath);
    }
  }

  async processFile(filePath) {
    const fileName = path.basename(filePath);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (fileName.includes('Ilceler')) {
        await this.importIlceler(data);
      } else if (fileName.includes('Mahalleler')) {
        await this.importMahalleler(data);
      } else if (fileName.includes('Caddeler')) {
        await this.importCaddeler(data);
      }
      
    } catch (error) {
      console.error(`❌ ${fileName} dosyası işlenirken hata:`, error.message);
      this.stats.errors.push(`${fileName}: ${error.message}`);
    }
  }

  async importIller(data) {
    if (!data.il_listesi) return;
    
    for (const il of data.il_listesi) {
      try {
        await pool.query(
          'INSERT INTO sehirler (sehir_id, sehir_adi) VALUES ($1, $2) ON CONFLICT (sehir_id) DO NOTHING',
          [il.id.toString(), il.name]
        );
        this.stats.sehirler++;
      } catch (error) {
        console.error(`İl import hatası (${il.name}):`, error.message);
      }
    }
  }

  async importIlGenel(data) {
    if (data.id && data.name) {
      try {
        await pool.query(
          'INSERT INTO sehirler (sehir_id, sehir_adi) VALUES ($1, $2) ON CONFLICT (sehir_id) DO NOTHING',
          [data.id.toString(), data.name]
        );
        this.stats.sehirler++;
      } catch (error) {
        console.error(`İl genel import hatası:`, error.message);
      }
    }
  }

  async importIlceler(data) {
    const ilceler = data.ilce_listesi || data.districts || [];
    
    for (const ilce of ilceler) {
      try {
        await pool.query(
          'INSERT INTO ilceler (ilce_id, ilce_adi, sehir_id) VALUES ($1, $2, $3) ON CONFLICT (ilce_id) DO NOTHING',
          [
            ilce.id.toString(),
            ilce.name,
            ilce.parent_id?.toString() || '34'
          ]
        );
        this.stats.ilceler++;
      } catch (error) {
        console.error(`İlçe import hatası (${ilce.name}):`, error.message);
      }
    }
  }

  async importMahalleler(data) {
    const mahalleler = data.mahalle_listesi || data.neighborhoods || [];
    
    for (const mahalle of mahalleler) {
      try {
        await pool.query(`
          INSERT INTO mahalleler (
            mahalle_id, mahalle_adi, ilce_id, coordinates, posta_kodu, multilingual
          ) VALUES ($1, $2, $3, $4, $5, $6) 
          ON CONFLICT (mahalle_id) DO UPDATE SET
            coordinates = EXCLUDED.coordinates,
            posta_kodu = EXCLUDED.posta_kodu,
            multilingual = EXCLUDED.multilingual
        `, [
          mahalle.id.toString(),
          mahalle.name,
          mahalle.parent_id?.toString() || mahalle.parent_ilce_id?.toString(),
          JSON.stringify(mahalle.coordinates || {}),
          mahalle.posta_kodu || null,
          JSON.stringify(mahalle.multilingual || {})
        ]);
        this.stats.mahalleler++;
      } catch (error) {
        console.error(`Mahalle import hatası (${mahalle.name}):`, error.message);
      }
    }
  }

  async importCaddeler(data) {
    const caddeler = data.cadde_listesi || data.streets || [];
    
    for (const cadde of caddeler) {
      try {
        await pool.query(`
          INSERT INTO caddeler (
            cadde_id, cadde_adi, mahalle_id, highway_type, coordinates, bounds,
            posta_kodu, bolgesi, plaka, yarim_il, osm_id, multilingual, created_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (cadde_id) DO UPDATE SET
            coordinates = EXCLUDED.coordinates,
            bounds = EXCLUDED.bounds,
            multilingual = EXCLUDED.multilingual
        `, [
          cadde.id.toString(),
          cadde.name,
          cadde.parent_id?.toString(),
          cadde.highway_type || null,
          JSON.stringify(cadde.coordinates || {}),
          JSON.stringify(cadde.bounds || {}),
          cadde.posta_kodu || null,
          cadde.bolgesi || null,
          cadde.plaka || null,
          cadde.yarim_il || null,
          cadde.osmId || null,
          JSON.stringify(cadde.multilingual || {}),
          cadde.created_date || new Date().toISOString().split('T')[0]
        ]);
        this.stats.caddeler++;
      } catch (error) {
        console.error(`Cadde import hatası (${cadde.name}):`, error.message);
      }
    }
  }

  showStats() {
    console.log('\n📊 MIGRATION İSTATİSTİKLERİ:');
    console.log(`🏛️ Şehirler: ${this.stats.sehirler}`);
    console.log(`🏘️ İlçeler: ${this.stats.ilceler}`);
    console.log(`🏠 Mahalleler: ${this.stats.mahalleler}`);
    console.log(`🛣️ Caddeler: ${this.stats.caddeler}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`❌ Hatalar: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => console.log(`   • ${error}`));
    }
  }
}

// Ana fonksiyon
async function main() {
  try {
    const migration = new TurkiyeAdreslerMigration();
    await migration.migrate();
  } catch (error) {
    console.error('❌ Migration başarısız:', error);
    process.exit(1);
  }
}

// Script çalıştırılırsa main fonksiyonu çağır
if (require.main === module) {
  main();
}

module.exports = TurkiyeAdreslerMigration; 