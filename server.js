require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Probar conexión al arrancar
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ No se pudo conectar a Postgres:', err.message);
    console.error('   Revisá los datos en tu archivo .env');
  } else {
    console.log('✅ Conectado a Postgres correctamente');
  }
});

// GET /api/categories -> lista de categorías (para el <select> del form)
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, slug, name, spec_schema FROM categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products -> lista de todos los productos cargados (para la tabla de abajo)
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.brand, p.name, p.sku, p.price, p.currency,
             p.stock_status, p.active, c.name AS category_name, p.created_at
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id -> trae un producto puntual con sus specs (para el form de edición)
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, category_id, brand, name, sku, price, currency,
              stock_status, description, specs, datasheet_url
       FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id -> actualiza un producto existente
app.put('/api/products/:id', async (req, res) => {
  const {
    category_id, brand, name, sku, price, currency,
    stock_status, description, specs, datasheet_url,
  } = req.body;

  let parsedSpecs;
  try {
    parsedSpecs = typeof specs === 'string' ? JSON.parse(specs || '{}') : (specs || {});
  } catch (e) {
    return res.status(400).json({ error: 'El campo "specs" no es un JSON válido: ' + e.message });
  }

  try {
    const result = await pool.query(
      `UPDATE products SET
         category_id=$1, brand=$2, name=$3, sku=$4, price=$5, currency=$6,
         stock_status=$7, description=$8, specs=$9, datasheet_url=$10
       WHERE id=$11
       RETURNING id`,
      [
        category_id, brand, name, sku || null, price,
        currency || 'ARS', stock_status || 'disponible',
        description || null, parsedSpecs, datasheet_url || null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products -> borra TODOS los productos (ojo, irreversible)
app.delete('/api/products', async (req, res) => {
  try {
    await pool.query('DELETE FROM products');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id -> borra un solo producto
app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products -> inserta un producto nuevo
app.post('/api/products', async (req, res) => {
  const {
    category_id, brand, name, sku, price, currency,
    stock_status, description, specs, datasheet_url,
  } = req.body;

  if (!category_id || !brand || !name || !price) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: category_id, brand, name, price',
    });
  }

  let parsedSpecs;
  try {
    parsedSpecs = typeof specs === 'string' ? JSON.parse(specs || '{}') : (specs || {});
  } catch (e) {
    return res.status(400).json({ error: 'El campo "specs" no es un JSON válido: ' + e.message });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products
        (category_id, brand, name, sku, price, currency, stock_status, description, specs, datasheet_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        category_id, brand, name, sku || null, price,
        currency || 'ARS', stock_status || 'disponible',
        description || null, parsedSpecs, datasheet_url || null,
      ]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
