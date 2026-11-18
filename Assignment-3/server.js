require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Inventory and Data Management System API is running' });
});

app.use('/api/products', productRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
