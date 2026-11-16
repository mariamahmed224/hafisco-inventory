-- Sample seed data for HAFISCO inventory demo (PostgreSQL)

INSERT INTO categories (category_name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Apparel and wearables'),
  ('Furniture', 'Office and home furniture'),
  ('Office Supplies', 'Stationery and workplace supplies'),
  ('Accessories', 'General accessories and add-ons');

INSERT INTO products (
  product_name, product_code, category_id, description, colour, size, quantity, minimum_stock_level
) VALUES
  ('Wireless Mouse', 'ELE-MOUSE-01', 1, 'Ergonomic 2.4GHz wireless mouse', 'Black', NULL, 45, 10),
  ('USB-C Hub', 'ELE-HUB-01', 1, '7-in-1 USB-C multiport adapter', 'Silver', NULL, 8, 10),
  ('Cotton T-Shirt', 'CLT-TS-01', 2, 'Unisex cotton crew-neck tee', 'Navy', 'M', 120, 20),
  ('Office Desk Chair', 'FUR-CHR-01', 3, 'Adjustable mesh back office chair', 'Grey', NULL, 0, 5),
  ('A4 Copy Paper', 'OFF-PAP-01', 4, '500-sheet ream of A4 paper', 'White', 'A4', 60, 15),
  ('Laptop Sleeve', 'ACC-SLV-01', 5, 'Neoprene protective laptop sleeve', 'Charcoal', '15"', 3, 8),
  ('Bluetooth Keyboard', 'ELE-KB-01', 1, 'Compact Bluetooth keyboard', 'White', NULL, 22, 5),
  ('Storage Cabinet', 'FUR-CAB-01', 3, 'Two-door metal storage cabinet', 'Beige', NULL, 4, 3);

INSERT INTO stock_movements (product_id, movement_type, quantity, remarks) VALUES
  (1, 'IN', 45, 'Initial stock'),
  (2, 'IN', 8, 'Initial stock'),
  (3, 'IN', 120, 'Initial stock'),
  (5, 'IN', 60, 'Initial stock'),
  (6, 'IN', 3, 'Initial stock'),
  (7, 'IN', 22, 'Initial stock'),
  (8, 'IN', 4, 'Initial stock');
