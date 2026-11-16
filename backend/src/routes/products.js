const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productsController');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid product id')];

const productBody = (isCreate) => [
  body('product_name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name must be at most 200 characters'),
  body('product_code')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Product code must be at most 100 characters'),
  body('category_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Invalid category'),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 5000 })
    .withMessage('Description is too long'),
  body('colour')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Colour must be at most 100 characters'),
  body('size')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Size must be at most 50 characters'),
  ...(isCreate
    ? [
        body('quantity')
          .exists()
          .withMessage('Quantity is required')
          .isInt({ min: 0 })
          .withMessage('Quantity must be a non-negative integer'),
      ]
    : []),
  body('minimum_stock_level')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
];

router.get('/', listProducts);
router.get('/:id', idParam, validate, getProduct);
router.post('/', productBody(true), validate, createProduct);
router.put('/:id', [...idParam, ...productBody(false)], validate, updateProduct);
router.delete('/:id', idParam, validate, deleteProduct);

module.exports = router;
