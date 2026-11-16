const pool = require('../config/db');
const { withStockStatus } = require('../utils/stockStatus');

async function listMovements(req, res, next) {
  try {
    const { product_id, movement_type, limit } = req.query;
    const clauses = [];
    const params = [];

    if (product_id) {
      clauses.push('sm.product_id = ?');
      params.push(Number(product_id));
    }
    if (movement_type) {
      clauses.push('sm.movement_type = ?');
      params.push(String(movement_type).toUpperCase());
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rowLimit = Math.min(Number(limit) || 200, 1000);

    const [rows] = await pool.query(
      `SELECT
         sm.id, sm.product_id, sm.movement_type, sm.quantity, sm.remarks, sm.created_at,
         p.product_name, p.product_code
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       ${where}
       ORDER BY sm.created_at DESC, sm.id DESC
       LIMIT ${rowLimit}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createMovement(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { product_id, movement_type, quantity, remarks } = req.body;
    const type = String(movement_type).toUpperCase();
    const qty = Number(quantity);

    await conn.beginTransaction();

    const [products] = await conn.query(
      'SELECT id, quantity FROM products WHERE id = ? FOR UPDATE',
      [product_id]
    );
    if (!products.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const current = Number(products[0].quantity);
    let nextQty = current;

    if (type === 'IN') {
      nextQty = current + qty;
    } else if (type === 'OUT') {
      if (qty > current) {
        await conn.rollback();
        return res.status(400).json({
          error: 'Insufficient stock. Stock Out would make quantity negative.',
          current_quantity: current,
          requested: qty,
        });
      }
      nextQty = current - qty;
    } else if (type === 'ADJUSTMENT') {
      // Adjustment quantity is the absolute new stock level (may be 0)
      nextQty = qty;
    } else {
      await conn.rollback();
      return res.status(400).json({ error: 'Invalid movement type' });
    }

    // Movement rows require quantity > 0; for ADJUSTMENT record the change magnitude.
    let movementQty = qty;
    let movementRemarks = remarks || null;

    if (type === 'ADJUSTMENT') {
      const delta = Math.abs(nextQty - current);
      movementQty = delta > 0 ? delta : 1;
      movementRemarks = [
        movementRemarks,
        `Adjusted from ${current} to ${nextQty}`,
      ]
        .filter(Boolean)
        .join(' — ');
    }

    await conn.query(
      'UPDATE products SET quantity = ? WHERE id = ?',
      [nextQty, product_id]
    );

    const [result] = await conn.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, remarks)
       VALUES (?, ?, ?, ?)`,
      [product_id, type, movementQty, movementRemarks]
    );

    await conn.commit();

    const [movements] = await pool.query(
      `SELECT
         sm.id, sm.product_id, sm.movement_type, sm.quantity, sm.remarks, sm.created_at,
         p.product_name, p.product_code, p.quantity AS product_quantity, p.minimum_stock_level
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       WHERE sm.id = ?`,
      [result.insertId]
    );

    const movement = movements[0];
    return res.status(201).json({
      ...movement,
      product: withStockStatus({
        id: movement.product_id,
        product_name: movement.product_name,
        product_code: movement.product_code,
        quantity: movement.product_quantity,
        minimum_stock_level: movement.minimum_stock_level,
      }),
    });
  } catch (err) {
    await conn.rollback();
    return next(err);
  } finally {
    conn.release();
  }
}

module.exports = { listMovements, createMovement };
