const pool = require('../config/db');
const { withStockStatus } = require('../utils/stockStatus');

async function getDashboard(req, res, next) {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        COUNT(*) AS total_products,
        COALESCE(SUM(quantity), 0) AS total_stock_qty,
        SUM(CASE WHEN quantity > 0 AND quantity <= minimum_stock_level THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count
      FROM products
    `);

    const [recent] = await pool.query(`
      SELECT
        p.id, p.product_name, p.product_code, p.quantity, p.minimum_stock_level,
        p.colour, p.size, p.created_at, c.category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.json({
      total_products: Number(totals.total_products) || 0,
      total_stock_qty: Number(totals.total_stock_qty) || 0,
      low_stock_count: Number(totals.low_stock_count) || 0,
      out_of_stock_count: Number(totals.out_of_stock_count) || 0,
      recently_added: recent.map(withStockStatus),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
