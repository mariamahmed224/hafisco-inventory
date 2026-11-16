-- HAFISCO Simple Inventory Management System
-- PostgreSQL schema (stock/inventory only — no pricing or financial fields)

-- Create database separately if needed, e.g.:
--   CREATE DATABASE hafisco_inventory;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
    CREATE TYPE movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_categories_name UNIQUE (category_name)
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(100) NULL,
  category_id INTEGER NULL REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  description TEXT NULL,
  colour VARCHAR(100) NULL,
  size VARCHAR(50) NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_products_code UNIQUE (product_code),
  CONSTRAINT chk_products_quantity CHECK (quantity >= 0),
  CONSTRAINT chk_products_min_stock CHECK (minimum_stock_level >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products (product_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  remarks VARCHAR(500) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_movements_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON stock_movements (movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements (created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
