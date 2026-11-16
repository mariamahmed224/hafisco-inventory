const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

function resolveSqlPaths() {
  const localSql = path.join(__dirname, '../../sql');
  const repoSql = path.join(__dirname, '../../../database');
  const schemaPath = fs.existsSync(path.join(localSql, 'schema.sql'))
    ? path.join(localSql, 'schema.sql')
    : path.join(repoSql, 'schema.sql');
  const seedPath = fs.existsSync(path.join(localSql, 'seed.sql'))
    ? path.join(localSql, 'seed.sql')
    : path.join(repoSql, 'seed.sql');
  return { schemaPath, seedPath };
}

async function initDatabase() {
  const { schemaPath, seedPath } = resolveSqlPaths();
  const client = await pool.connect();
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);

    const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM categories');
    let seeded = false;
    if (rows[0].n === 0) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      seeded = true;
    }

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM categories) AS categories,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM stock_movements) AS movements
    `);

    return {
      schemaApplied: true,
      seeded,
      ...counts.rows[0],
    };
  } finally {
    client.release();
  }
}

module.exports = { initDatabase };
