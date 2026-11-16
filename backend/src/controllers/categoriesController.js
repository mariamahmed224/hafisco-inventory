const pool = require('../config/db');

async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.category_name ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { category_name, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name.trim(), description || null]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { category_name, description } = req.body;
    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await pool.query(
      'UPDATE categories SET category_name = ?, description = ? WHERE id = ?',
      [category_name.trim(), description || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Category deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
