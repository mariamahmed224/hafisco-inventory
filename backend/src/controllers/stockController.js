const { query, withTransaction } = require('../config/db');
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
    params.push(rowLimit);

    const { rows } = await query(
      `SELECT
         sm.id, sm.product_id, sm.movement_type, sm.quantity, sm.remarks, sm.created_at,
         p.product_name, p.product_code
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       ${where}
       ORDER BY sm.created_at DESC, sm.id DESC
       LIMIT ?`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createMovement(req, res, next) {
  try {
    const { product_id, movement_type, quantity, remarks } = req.body;
    const type = String(movement_type).toUpperCase();
    const qty = Number(quantity);

    const movement = await withTransaction(async (tx) => {
      const products = await tx(
        'SELECT id, quantity FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );
      if (!products.rows.length) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
      }

      const current = Number(products.rows[0].quantity);
      let nextQty = current;

      if (type === 'IN') {
        nextQty = current + qty;
      } else if (type === 'OUT') {
        if (qty > current) {
          const err = new Error(
            'Insufficient stock. Stock Out would make quantity negative.'
          );
          err.status = 400;
          err.payload = { current_quantity: current, requested: qty };
          throw err;
        }
        nextQty = current - qty;
      } else if (type === 'ADJUSTMENT') {
        nextQty = qty;
      } else {
        const err = new Error('Invalid movement type');
        err.status = 400;
        throw err;
      }

      let movementQty = qty;
      let movementRemarks = remarks || null;

      if (type === 'ADJUSTMENT') {
        const delta = Math.abs(nextQty - current);
        movementQty = delta > 0 ? delta : 1;
        movementRemarks = [movementRemarks, `Adjusted from ${current} to ${nextQty}`]
          .filter(Boolean)
          .join(' — ');
      }

      await tx('UPDATE products SET quantity = ? WHERE id = ?', [nextQty, product_id]);

      const inserted = await tx(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, remarks)
         VALUES (?, ?, ?, ?)
         RETURNING id`,
        [product_id, type, movementQty, movementRemarks]
      );

      const full = await tx(
        `SELECT
           sm.id, sm.product_id, sm.movement_type, sm.quantity, sm.remarks, sm.created_at,
           p.product_name, p.product_code, p.quantity AS product_quantity, p.minimum_stock_level
         FROM stock_movements sm
         JOIN products p ON p.id = sm.product_id
         WHERE sm.id = ?`,
        [inserted.rows[0].id]
      );
      return full.rows[0];
    });

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
    if (err.status === 400 && err.payload) {
      return res.status(400).json({ error: err.message, ...err.payload });
    }
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    return next(err);
  }
}

module.exports = { listMovements, createMovement };
