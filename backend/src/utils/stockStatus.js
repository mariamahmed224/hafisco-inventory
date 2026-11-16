function getStockStatus(quantity, minimumStockLevel) {
  const qty = Number(quantity) || 0;
  const min = Number(minimumStockLevel) || 0;
  if (qty <= 0) return 'Out of Stock';
  if (qty <= min) return 'Low Stock';
  return 'In Stock';
}

function withStockStatus(product) {
  if (!product) return product;
  return {
    ...product,
    stock_status: getStockStatus(product.quantity, product.minimum_stock_level),
  };
}

module.exports = { getStockStatus, withStockStatus };
