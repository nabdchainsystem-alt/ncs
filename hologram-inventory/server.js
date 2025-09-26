'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

const app = express();
const rootDir = path.join(__dirname, 'public');

const ALLOWED_STATUSES = new Set(['in_stock', 'low', 'out_of_stock', 'discontinued']);
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.use(
  express.static(rootDir, {
    extensions: ['html'],
    maxAge: '1h',
    setHeaders(res) {
      if (!res.getHeader('Cache-Control')) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  })
);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
}

async function runQuery(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    error.isDbError = true;
    throw error;
  }
}

function parseFilters(rawQuery) {
  const filters = {};
  if (typeof rawQuery.q === 'string') {
    const trimmed = rawQuery.q.trim().slice(0, 120);
    if (trimmed) {
      filters.q = trimmed;
    }
  }

  if (typeof rawQuery.status === 'string' && rawQuery.status) {
    const status = rawQuery.status.toLowerCase();
    if (!ALLOWED_STATUSES.has(status)) {
      throw httpError(400, 'Invalid status filter.');
    }
    filters.status = status;
  }

  if (typeof rawQuery.minQty !== 'undefined' && rawQuery.minQty !== '') {
    const minQty = Number.parseInt(rawQuery.minQty, 10);
    if (!Number.isInteger(minQty) || minQty < 0) {
      throw httpError(400, 'minQty must be a positive integer.');
    }
    filters.minQty = minQty;
  }

  const limitCandidate = Number.parseInt(rawQuery.limit, 10);
  if (!Number.isNaN(limitCandidate)) {
    if (limitCandidate <= 0) {
      throw httpError(400, 'limit must be greater than zero.');
    }
    filters.limit = Math.min(limitCandidate, MAX_LIMIT);
  } else {
    filters.limit = DEFAULT_LIMIT;
  }

  if (typeof rawQuery.cursor !== 'undefined' && rawQuery.cursor !== '') {
    const cursor = Number.parseInt(rawQuery.cursor, 10);
    if (!Number.isInteger(cursor) || cursor < 0) {
      throw httpError(400, 'cursor must be a positive integer.');
    }
    filters.cursor = cursor;
  }

  return filters;
}

async function fetchInventory(filters) {
  const conditions = [];
  const params = [];

  if (typeof filters.cursor === 'number') {
    conditions.push('id > ?');
    params.push(filters.cursor);
  }

  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push('(sku LIKE ? OR name LIKE ? OR description LIKE ? OR status LIKE ? )');
    params.push(like, like, like, like);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (typeof filters.minQty === 'number') {
    conditions.push('quantity >= ?');
    params.push(filters.minQty);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      id,
      sku,
      name,
      description,
      quantity,
      price,
      image_url AS imageUrl,
      status,
      updated_at AS updatedAt
    FROM inventory
    ${whereClause}
    ORDER BY id ASC
    LIMIT ?
  `.trim();

  params.push(filters.limit + 1);

  const rows = await runQuery(sql, params);
  let nextCursor = null;

  if (rows.length > filters.limit) {
    const nextItem = rows.pop();
    nextCursor = nextItem.id;
  }

  rows.forEach((row) => {
    row.quantity = Number.parseInt(row.quantity, 10);
    row.price = Number.parseFloat(row.price);
  });

  return { rows, nextCursor };
}

app.get('/api/inventory', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const { rows, nextCursor } = await fetchInventory(filters);
    res.set('Cache-Control', 'public, max-age=15');
    res.json({ items: rows, nextCursor, count: rows.length });
  } catch (error) {
    next(error);
  }
});

app.get('/api/inventory/:id', async (req, res, next) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid inventory id.' });
  }

  try {
    const rows = await runQuery(
      `
        SELECT
          id,
          sku,
          name,
          description,
          quantity,
          price,
          image_url AS imageUrl,
          status,
          updated_at AS updatedAt
        FROM inventory
        WHERE id = ?
      `.trim(),
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    const item = rows[0];
    item.quantity = Number.parseInt(item.quantity, 10);
    item.price = Number.parseFloat(item.price);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  return res.sendFile(path.join(rootDir, 'index.html'));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || (err.isDbError ? 503 : 500);
  const message = err.publicMessage || (err.isDbError ? 'Database temporarily unavailable.' : 'Internal server error.');
  if (err.isDbError) {
    console.error('Database error:', err);
  } else {
    console.error('Unhandled error:', err);
  }
  return res.status(status).json({ error: message });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}, closing server...`);
  server.close(() => {
    pool.end().finally(() => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
