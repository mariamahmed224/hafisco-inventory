require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const dashboardRoutes = require('./routes/dashboard');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`HAFISCO inventory API listening on http://localhost:${PORT}`);
});
