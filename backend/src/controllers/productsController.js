const { query, withTransaction } = require('../config/db');
const { withStockStatus } = require('../utils/stockStatus');

const PRODUCT_SELECT = `
  SELECT
    p.id, p.product_name, p.product_code, p.category_id, p.description,
    p.colour, p.size, p.quantity, p.minimum_stock_level, p.created_at, p.updated_at,
    c.category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

async function listProducts(req, res, next) {
  try {
    const { search, category_id, status } = req.query;
    const clauses = [];
    const params = [];

    if (search && String(search).trim()) {
      clauses.push('(p.product_name ILIKE ? OR p.product_code ILIKE ?)');
      const term = `%${String(search).trim()}%`;
      params.push(term, term);
    }
    if (category_id) {
      clauses.push('p.category_id = ?');
      params.push(Number(category_id));
    }
    if (status === 'in_stock') {
      clauses.push('p.quantity > p.minimum_stock_level');
    } else if (status === 'low_stock') {
      clauses.push('p.quantity > 0 AND p.quantity <= p.minimum_stock_level');
    } else if (status === 'out_of_stock') {
      clauses.push('p.quantity <= 0');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(
      `${PRODUCT_SELECT} ${where} ORDER BY p.product_name ASC`,
      params
    );
    res.json(rows.map(withStockStatus));
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = ?`, [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(withStockStatus(rows[0]));
  } catch (err) {
    return next(err);
  }
}

function normalizeCode(code) {
  if (code === undefined || code === null || String(code).trim() === '') return null;
  return String(code).trim();
}

async function createProduct(req, res, next) {
  try {
    const {
      product_name,
      product_code,
      category_id,
      description,
      colour,
      size,
      quantity,
      minimum_stock_level,
    } = req.body;

    const qty = Number(quantity);
    const minLevel =
      minimum_stock_level === undefined || minimum_stock_level === ''
        ? 0
        : Number(minimum_stock_level);

    const product = await withTransaction(async (tx) => {
      const inserted = await tx(
        `INSERT INTO products
          (product_name, product_code, category_id, description, colour, size, quantity, minimum_stock_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
        [
          product_name.trim(),
          normalizeCode(product_code),
          category_id || null,
          description || null,
          colour || null,
          size || null,
          qty,
          minLevel,
        ]
      );
      const newId = inserted.rows[0].id;

      if (qty > 0) {
        await tx(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, remarks)
           VALUES (?, 'IN', ?, ?)`,
          [newId, qty, 'Initial stock on product create']
        );
      }

      const full = await tx(`${PRODUCT_SELECT} WHERE p.id = ?`, [newId]);
      return full.rows[0];
    });

    res.status(201).json(withStockStatus(product));
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const existing = await query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      product_name,
      product_code,
      category_id,
      description,
      colour,
      size,
      minimum_stock_level,
    } = req.body;

    await query(
      `UPDATE products SET
        product_name = ?,
        product_code = ?,
        category_id = ?,
        description = ?,
        colour = ?,
        size = ?,
        minimum_stock_level = ?
       WHERE id = ?`,
      [
        product_name.trim(),
        normalizeCode(product_code),
        category_id || null,
        description || null,
        colour || null,
        size || null,
        minimum_stock_level === undefined || minimum_stock_level === ''
          ? 0
          : Number(minimum_stock_level),
        req.params.id,
      ]
    );

    const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = ?`, [req.params.id]);
    return res.json(withStockStatus(rows[0]));
  } catch (err) {
    return next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const existing = await query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await query('DELETE FROM products WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
