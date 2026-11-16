# HAFISCO Simple Inventory Management System

Stock-only inventory app: React frontend, Node/Express REST API, MySQL.

**Scope:** products, categories, stock movements, and stock reports. No prices, profit, or financial features.

## Requirements

- Node.js 18+
- MySQL 8+
- npm

## Project structure

```
/agent
  database/
    schema.sql      # tables + constraints
    seed.sql        # sample categories & products
  backend/          # Express API (port 4000)
  frontend/         # React (Vite) UI (port 5173)
  README.md
```

## Database setup

1. Start MySQL.
2. Create the schema and seed data:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Or create a dedicated user (example):

```sql
CREATE DATABASE IF NOT EXISTS hafisco_inventory
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hafisco'@'localhost' IDENTIFIED BY 'hafisco_pass';
GRANT ALL PRIVILEGES ON hafisco_inventory.* TO 'hafisco'@'localhost';
FLUSH PRIVILEGES;
```

Then load `database/schema.sql` and `database/seed.sql`.

### Tables

- `categories` — id, category_name, description, created_at
- `products` — id, product_name, product_code, category_id, description, colour, size, quantity, minimum_stock_level, created_at, updated_at
- `stock_movements` — id, product_id, movement_type (`IN` | `OUT` | `ADJUSTMENT`), quantity, remarks, created_at

## Backend setup

```bash
cd backend
cp .env.example .env
# edit DB_* credentials in .env
npm install
npm start
```

API base: `http://localhost:4000/api`

Health check: `GET /api/health`

### Main endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Summary cards + recently added |
| GET/POST | `/api/categories` | List / create |
| GET/PUT/DELETE | `/api/categories/:id` | Read / update / delete |
| GET/POST | `/api/products` | List (search, category filter) / create |
| GET/PUT/DELETE | `/api/products/:id` | Detail / update / delete |
| GET/POST | `/api/stock/movements` | History / Stock In, Out, Adjustment |
| GET | `/api/reports/products` | All products (+ `?format=csv`) |
| GET | `/api/reports/low-stock` | Low stock report |
| GET | `/api/reports/out-of-stock` | Out of stock report |
| GET | `/api/reports/movements` | Movement history report |

Stock Out is rejected when it would make quantity negative. Product quantity is updated only through stock movements (and initial qty on create).

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

`VITE_API_BASE_URL` defaults to `http://localhost:4000/api`.

## Features

- **Dashboard** — total products, total stock qty, low-stock count, out-of-stock count, recently added
- **Products** — CRUD, search, category filter, detail view, In Stock / Low Stock / Out of Stock badges
- **Categories** — CRUD (seed includes Electronics, Clothing, Furniture, Office Supplies, Accessories)
- **Stock** — Stock In, Stock Out, Adjustment + movement history
- **Reports** — all / low / out-of-stock / movements with CSV export (opens in Excel)

## Notes

- Colour is free-text (not a preset list).
- SKU / `product_code` is optional but unique when set.
- Prepared statements are used throughout to avoid SQL injection.
