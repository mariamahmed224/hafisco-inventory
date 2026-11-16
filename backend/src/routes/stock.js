const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { listMovements, createMovement } = require('../controllers/stockController');

const router = express.Router();

router.get('/movements', listMovements);

router.post(
  '/movements',
  [
    body('product_id').isInt({ min: 1 }).withMessage('Product is required'),
    body('movement_type')
      .isIn(['IN', 'OUT', 'ADJUSTMENT', 'in', 'out', 'adjustment'])
      .withMessage('Movement type must be IN, OUT, or ADJUSTMENT'),
    body('quantity')
      .custom((value, { req }) => {
        const type = String(req.body.movement_type || '').toUpperCase();
        const num = Number(value);
        if (!Number.isInteger(num)) {
          throw new Error('Quantity must be an integer');
        }
        if (type === 'ADJUSTMENT') {
          if (num < 0) throw new Error('Adjustment quantity must be 0 or greater');
        } else if (num <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        return true;
      }),
    body('remarks')
      .optional({ nullable: true })
      .isLength({ max: 500 })
      .withMessage('Remarks must be at most 500 characters'),
  ],
  validate,
  createMovement
);

module.exports = router;
