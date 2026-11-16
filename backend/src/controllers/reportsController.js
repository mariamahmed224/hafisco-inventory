const { query } = require('../config/db');
const { withStockStatus } = require('../utils/stockStatus');

function toCsv(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  );
  return [header, ...lines].join('\n');
}

async function allProductsReport(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT
        p.id, p.product_name, p.product_code, p.colour, p.size, p.quantity,
        p.minimum_stock_level, p.created_at, c.category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.product_name ASC
    `);
    const data = rows.map(withStockStatus);

    if (req.query.format === 'csv') {
      const csv = toCsv(data, [
        { label: 'ID', key: 'id' },
        { label: 'Product Name', key: 'product_name' },
        { label: 'SKU', key: 'product_code' },
        { label: 'Category', key: 'category_name' },
        { label: 'Colour', key: 'colour' },
        { label: 'Size', key: 'size' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Min Stock', key: 'minimum_stock_level' },
        { label: 'Status', key: 'stock_status' },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="all-products.csv"');
      return res.send(csv);
    }
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function lowStockReport(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT
        p.id, p.product_name, p.product_code, p.colour, p.size, p.quantity,
        p.minimum_stock_level, c.category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.quantity > 0 AND p.quantity <= p.minimum_stock_level
      ORDER BY p.quantity ASC, p.product_name ASC
    `);
    const data = rows.map(withStockStatus);

    if (req.query.format === 'csv') {
      const csv = toCsv(data, [
        { label: 'ID', key: 'id' },
        { label: 'Product Name', key: 'product_name' },
        { label: 'SKU', key: 'product_code' },
        { label: 'Category', key: 'category_name' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Min Stock', key: 'minimum_stock_level' },
        { label: 'Status', key: 'stock_status' },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="low-stock.csv"');
      return res.send(csv);
    }
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function outOfStockReport(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT
        p.id, p.product_name, p.product_code, p.colour, p.size, p.quantity,
        p.minimum_stock_level, c.category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.quantity <= 0
      ORDER BY p.product_name ASC
    `);
    const data = rows.map(withStockStatus);

    if (req.query.format === 'csv') {
      const csv = toCsv(data, [
        { label: 'ID', key: 'id' },
        { label: 'Product Name', key: 'product_name' },
        { label: 'SKU', key: 'product_code' },
        { label: 'Category', key: 'category_name' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Min Stock', key: 'minimum_stock_level' },
        { label: 'Status', key: 'stock_status' },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="out-of-stock.csv"');
      return res.send(csv);
    }
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function movementsReport(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT
        sm.id, sm.product_id, sm.movement_type, sm.quantity, sm.remarks, sm.created_at,
        p.product_name, p.product_code
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT 1000
    `);

    if (req.query.format === 'csv') {
      const csv = toCsv(rows, [
        { label: 'ID', key: 'id' },
        { label: 'Product', key: 'product_name' },
        { label: 'SKU', key: 'product_code' },
        { label: 'Type', key: 'movement_type' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Remarks', key: 'remarks' },
        { label: 'DateTime', key: 'created_at' },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="stock-movements.csv"');
      return res.send(csv);
    }
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  allProductsReport,
  lowStockReport,
  outOfStockReport,
  movementsReport,
};
