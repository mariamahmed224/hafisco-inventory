const { Pool } = require('pg');
require('dotenv').config();

function shouldUseSsl(connectionString) {
  if (process.env.DB_SSL === 'true') return true;
  if (process.env.DB_SSL === 'false') return false;
  if (connectionString && /sslmode=require/i.test(connectionString)) return true;
  // External Render hostnames typically require TLS
  if (connectionString && /\.render\.com/i.test(connectionString)) return true;
  return false;
}

function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    const useSsl = shouldUseSsl(process.env.DATABASE_URL);
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 10,
  };
}

const pool = new Pool(buildPoolConfig());

/** Convert MySQL-style `?` placeholders to PostgreSQL `$1, $2, ...` */
function toPgParams(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function query(sql, params = []) {
  return pool.query(toPgParams(sql), params);
}

async function withTransaction(fn) {
  const client = await pool.connect();
  const txQuery = (sql, params = []) => client.query(toPgParams(sql), params);
  try {
    await client.query('BEGIN');
    const result = await fn(txQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
