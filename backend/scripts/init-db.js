/**
 * Apply schema.sql + seed.sql (seed skips if categories already exist).
 * Usage: node scripts/init-db.js
 */
require('dotenv').config();
const { initDatabase } = require('../src/utils/initDb');

initDatabase()
  .then((result) => {
    console.log('Database ready:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
