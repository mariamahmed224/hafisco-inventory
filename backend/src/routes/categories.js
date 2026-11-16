const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoriesController');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid category id')];

const categoryBody = [
  body('category_name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name must be at most 100 characters'),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 2000 })
    .withMessage('Description is too long'),
];

router.get('/', listCategories);
router.get('/:id', idParam, validate, getCategory);
router.post('/', categoryBody, validate, createCategory);
router.put('/:id', [...idParam, ...categoryBody], validate, updateCategory);
router.delete('/:id', idParam, validate, deleteCategory);

module.exports = router;
