/**
 * Apply schema.sql + seed.sql once (safe to re-run schema; seed skips if data exists).
 * Usage: node scripts/init-db.js
 * Requires DATABASE_URL (or DB_* envs).
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

function buildConfig() {
  if (process.env.DATABASE_URL) {
    const useSsl =
      process.env.DB_SSL === 'true' ||
      /sslmode=require/i.test(process.env.DATABASE_URL) ||
      /\.render\.com/i.test(process.env.DATABASE_URL);
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

async function main() {
  const pool = new Pool(buildConfig());
  // Prefer backend/sql (always present when rootDir=backend on Render)
  const localSql = path.join(__dirname, '../sql');
  const repoSql = path.join(__dirname, '../../database');
  const schemaPath = fs.existsSync(path.join(localSql, 'schema.sql'))
    ? path.join(localSql, 'schema.sql')
    : path.join(repoSql, 'schema.sql');
  const seedPath = fs.existsSync(path.join(localSql, 'seed.sql'))
    ? path.join(localSql, 'seed.sql')
    : path.join(repoSql, 'seed.sql');

  const client = await pool.connect();
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema.sql…');
    await client.query(schemaSql);

    const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM categories');
    if (rows[0].n > 0) {
      console.log(`Seed skipped (${rows[0].n} categories already present).`);
    } else {
      console.log('Applying seed.sql…');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('Seed complete.');
    }
    console.log('Database ready.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
