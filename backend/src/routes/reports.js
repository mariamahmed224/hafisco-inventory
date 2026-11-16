const express = require('express');
const {
  allProductsReport,
  lowStockReport,
  outOfStockReport,
  movementsReport,
} = require('../controllers/reportsController');

const router = express.Router();

router.get('/products', allProductsReport);
router.get('/low-stock', lowStockReport);
router.get('/out-of-stock', outOfStockReport);
router.get('/movements', movementsReport);

module.exports = router;
