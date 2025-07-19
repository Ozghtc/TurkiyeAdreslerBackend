const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Türkçe karakter normalizasyonu
const normalizeText = (text) => {
  const turkishMap = {
    'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i', 'İ': 'i', 'ü': 'u', 'Ü': 'u',
    'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
  };
  
  return text
    .toLowerCase()
    .replace(/[şŞğĞıIİüÜöÖçÇ]/g, (match) => turkishMap[match] || match);
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ana arama endpoint'i (tüm seviyeler)
app.get('/api/search', async (req, res) => {
  try {
    const { q: query, limit = 10, type = 'all' } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const normalizedQuery = normalizeText(query);
    const searchResults = [];

    // Şehir arama
    if (type === 'all' || type === 'city') {
      const cityResults = await pool.query(`
        SELECT 'city' as type, sehir_id as id, sehir_adi as name, null as parent_name, null as parent_id
        FROM sehirler 
        WHERE sehir_adi ILIKE $1 OR normalize_turkish(sehir_adi) LIKE $2
        ORDER BY sehir_adi LIMIT $3
      `, [`%${query}%`, `%${normalizedQuery}%`, Math.ceil(limit/4)]);
      searchResults.push(...cityResults.rows);
    }

    // İlçe arama
    if (type === 'all' || type === 'district') {
      const districtResults = await pool.query(`
        SELECT 'district' as type, i.ilce_id as id, i.ilce_adi as name, s.sehir_adi as parent_name, s.sehir_id as parent_id
        FROM ilceler i
        JOIN sehirler s ON i.sehir_id = s.sehir_id
        WHERE i.ilce_adi ILIKE $1 OR normalize_turkish(i.ilce_adi) LIKE $2
        ORDER BY i.ilce_adi LIMIT $3
      `, [`%${query}%`, `%${normalizedQuery}%`, Math.ceil(limit/4)]);
      searchResults.push(...districtResults.rows);
    }

    // Mahalle arama
    if (type === 'all' || type === 'neighborhood') {
      const neighborhoodResults = await pool.query(`
        SELECT 'neighborhood' as type, m.mahalle_id as id, m.mahalle_adi as name, 
               CONCAT(i.ilce_adi, ', ', s.sehir_adi) as parent_name, i.ilce_id as parent_id
        FROM mahalleler m
        JOIN ilceler i ON m.ilce_id = i.ilce_id
        JOIN sehirler s ON i.sehir_id = s.sehir_id
        WHERE m.mahalle_adi ILIKE $1 OR normalize_turkish(m.mahalle_adi) LIKE $2
        ORDER BY m.mahalle_adi LIMIT $3
      `, [`%${query}%`, `%${normalizedQuery}%`, Math.ceil(limit/4)]);
      searchResults.push(...neighborhoodResults.rows);
    }

    // Cadde arama
    if (type === 'all' || type === 'street') {
      const streetResults = await pool.query(`
        SELECT 'street' as type, c.cadde_id as id, c.cadde_adi as name,
               CONCAT(m.mahalle_adi, ', ', i.ilce_adi, ', ', s.sehir_adi) as parent_name, m.mahalle_id as parent_id
        FROM caddeler c
        JOIN mahalleler m ON c.mahalle_id = m.mahalle_id
        JOIN ilceler i ON m.ilce_id = i.ilce_id
        JOIN sehirler s ON i.sehir_id = s.sehir_id
        WHERE c.cadde_adi ILIKE $1 OR normalize_turkish(c.cadde_adi) LIKE $2
        ORDER BY c.cadde_adi LIMIT $3
      `, [`%${query}%`, `%${normalizedQuery}%`, Math.ceil(limit/4)]);
      searchResults.push(...streetResults.rows);
    }

    // Sonuçları sırala ve limitle
    const sortedResults = searchResults
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      .slice(0, limit);

    res.json({ 
      results: sortedResults,
      total: sortedResults.length,
      query: query,
      normalized_query: normalizedQuery
    });

  } catch (error) {
    console.error('❌ Arama Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Şehirler endpoint'i
app.get('/api/cities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sehirler ORDER BY sehir_adi');
    res.json({ cities: result.rows });
  } catch (error) {
    console.error('❌ Şehirler Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// İlçeler endpoint'i
app.get('/api/districts/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const result = await pool.query(
      'SELECT * FROM ilceler WHERE sehir_id = $1 ORDER BY ilce_adi',
      [cityId]
    );
    res.json({ districts: result.rows });
  } catch (error) {
    console.error('❌ İlçeler Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mahalleler endpoint'i
app.get('/api/neighborhoods/:districtId', async (req, res) => {
  try {
    const { districtId } = req.params;
    const result = await pool.query(
      'SELECT * FROM mahalleler WHERE ilce_id = $1 ORDER BY mahalle_adi',
      [districtId]
    );
    res.json({ neighborhoods: result.rows });
  } catch (error) {
    console.error('❌ Mahalleler Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Caddeler endpoint'i
app.get('/api/streets/:neighborhoodId', async (req, res) => {
  try {
    const { neighborhoodId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(
      'SELECT * FROM caddeler WHERE mahalle_id = $1 ORDER BY cadde_adi LIMIT $2 OFFSET $3',
      [neighborhoodId, parseInt(limit), parseInt(offset)]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM caddeler WHERE mahalle_id = $1',
      [neighborhoodId]
    );
    
    res.json({ 
      streets: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Caddeler Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Hiyerarşik adres endpoint'i (tüm seviyeler)
app.get('/api/address/:cityId/:districtId/:neighborhoodId/streets', async (req, res) => {
  try {
    const { cityId, districtId, neighborhoodId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        m.mahalle_adi,
        i.ilce_adi,
        s.sehir_adi
      FROM caddeler c
      JOIN mahalleler m ON c.mahalle_id = m.mahalle_id
      JOIN ilceler i ON m.ilce_id = i.ilce_id
      JOIN sehirler s ON i.sehir_id = s.sehir_id
      WHERE s.sehir_id = $1 AND i.ilce_id = $2 AND m.mahalle_id = $3
      ORDER BY c.cadde_adi
      LIMIT $4 OFFSET $5
    `, [cityId, districtId, neighborhoodId, parseInt(limit), parseInt(offset)]);
    
    res.json({ 
      streets: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Hiyerarşik Adres Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bölgeler endpoint'i
app.get('/api/regions', async (req, res) => {
  try {
    // Statik bölge listesi (Bolgeler klasöründen)
    const regions = [
      { id: 'marmara', name: 'Marmara Bölgesi' },
      { id: 'ege', name: 'Ege Bölgesi' },
      { id: 'akdeniz', name: 'Akdeniz Bölgesi' },
      { id: 'ic_anadolu', name: 'İç Anadolu Bölgesi' },
      { id: 'karadeniz', name: 'Karadeniz Bölgesi' },
      { id: 'dogu_anadolu', name: 'Doğu Anadolu Bölgesi' },
      { id: 'guneydogu_anadolu', name: 'Güneydoğu Anadolu Bölgesi' }
    ];
    
    res.json({ regions });
  } catch (error) {
    console.error('❌ Bölgeler Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cadde arama endpoint'i
app.get('/api/search/streets', async (req, res) => {
  try {
    const { q: query, city, district, limit = 20 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const normalizedQuery = normalizeText(query);
    let sql = `
      SELECT 
        c.*,
        m.mahalle_adi,
        i.ilce_adi,
        s.sehir_adi
      FROM caddeler c
      JOIN mahalleler m ON c.mahalle_id = m.mahalle_id
      JOIN ilceler i ON m.ilce_id = i.ilce_id
      JOIN sehirler s ON i.sehir_id = s.sehir_id
      WHERE (
        c.cadde_adi ILIKE $1 OR 
        normalize_turkish(c.cadde_adi) LIKE $2
      )
    `;
    
    const params = [`%${query}%`, `%${normalizedQuery}%`];
    let paramIndex = 3;
    
    if (city) {
      sql += ` AND s.sehir_id = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }
    
    if (district) {
      sql += ` AND i.ilce_id = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }
    
    sql += ` ORDER BY c.cadde_adi LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(sql, params);
    res.json({ results: result.rows });
    
  } catch (error) {
    console.error('❌ Cadde Arama Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// İstatistik endpoint'i
app.get('/api/stats', async (req, res) => {
  try {
    const [cities, districts, neighborhoods, streets] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM sehirler'),
      pool.query('SELECT COUNT(*) as count FROM ilceler'),
      pool.query('SELECT COUNT(*) as count FROM mahalleler'),
      pool.query('SELECT COUNT(*) as count FROM caddeler')
    ]);

    res.json({
      cities: parseInt(cities.rows[0].count),
      districts: parseInt(districts.rows[0].count),
      neighborhoods: parseInt(neighborhoods.rows[0].count),
      streets: parseInt(streets.rows[0].count),
      total: parseInt(cities.rows[0].count) + parseInt(districts.rows[0].count) + 
             parseInt(neighborhoods.rows[0].count) + parseInt(streets.rows[0].count)
    });
  } catch (error) {
    console.error('❌ İstatistik Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google Streets endpoint'i - Google'dan çekilen cadde/sokak verileri
app.get('/api/google-streets', async (req, res) => {
  try {
    const { city, district, search, limit = 50 } = req.query;
    
    let query = `
      SELECT id, city_name, district_name, street_name, full_address,
             latitude, longitude, place_id, street_type, postal_code,
             created_at
      FROM google_streets
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (city) {
      query += ` AND city_name ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }
    
    if (district) {
      query += ` AND district_name ILIKE $${paramIndex}`;
      params.push(`%${district}%`);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (street_name ILIKE $${paramIndex} OR full_address ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY city_name, district_name, street_name LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      filters: { city, district, search, limit }
    });
    
  } catch (error) {
    console.error('Google streets arama hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Google streets arama hatası'
    });
  }
});

// Google Streets istatistikleri
app.get('/api/google-streets/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_streets,
        COUNT(DISTINCT city_name) as total_cities,
        COUNT(DISTINCT district_name) as total_districts,
        COUNT(DISTINCT CONCAT(city_name, district_name)) as total_city_districts,
        MIN(created_at) as first_import,
        MAX(created_at) as last_import
      FROM google_streets
    `;
    
    const result = await pool.query(statsQuery);
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
    
  } catch (error) {
    console.error('Google streets istatistik hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Google streets istatistik hatası'
    });
  }
});

// Cities endpoint - Şehirler listesi
app.get('/api/cities', async (req, res) => {
  try {
    console.log('🏙️ Şehirler listesi talep edildi');
    
    const result = await pool.query(`
      SELECT sehir_id as id, sehir_adi as name, sehir_kodu as code
      FROM sehirler 
      ORDER BY sehir_adi ASC
    `);
    
    res.json({ 
      success: true,
      cities: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Şehirler API Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Districts endpoint - İlçeler listesi
app.get('/api/districts/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    console.log(`🏘️ İlçeler listesi talep edildi - Şehir ID: ${cityId}`);
    
    const result = await pool.query(`
      SELECT i.ilce_id as id, i.ilce_adi as name, i.sehir_id as city_id, s.sehir_adi as city_name
      FROM ilceler i
      JOIN sehirler s ON i.sehir_id = s.sehir_id
      WHERE i.sehir_id = $1
      ORDER BY i.ilce_adi ASC
    `, [cityId]);
    
    res.json({ 
      success: true,
      districts: result.rows,
      count: result.rows.length,
      cityId: cityId
    });
  } catch (error) {
    console.error('❌ İlçeler API Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Neighborhoods endpoint - Mahalleler listesi
app.get('/api/neighborhoods/:districtId', async (req, res) => {
  try {
    const { districtId } = req.params;
    console.log(`🏠 Mahalleler listesi talep edildi - İlçe ID: ${districtId}`);
    
    const result = await pool.query(`
      SELECT m.mahalle_id as id, m.mahalle_adi as name, m.ilce_id as district_id, 
             i.ilce_adi as district_name, s.sehir_adi as city_name
      FROM mahalleler m
      JOIN ilceler i ON m.ilce_id = i.ilce_id
      JOIN sehirler s ON i.sehir_id = s.sehir_id
      WHERE m.ilce_id = $1
      ORDER BY m.mahalle_adi ASC
    `, [districtId]);
    
    res.json({ 
      success: true,
      neighborhoods: result.rows,
      count: result.rows.length,
      districtId: districtId
    });
  } catch (error) {
    console.error('❌ Mahalleler API Hatası:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Türkiye Adres API çalışıyor: http://localhost:${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=istanbul`);
});

module.exports = app; 