const express = require('express');
const router = express.Router();

// Import route modules (temporarily commented for testing)
// const authRoutes = require('./auth');
// const transactionRoutes = require('./transactions');
// const categoryRoutes = require('./categories');
// const budgetRoutes = require('./budgets');

// Mount routes (temporarily commented for testing)
// router.use('/auth', authRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/categories', categoryRoutes);
// router.use('/budgets', budgetRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CashCompass API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CashCompass API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth (coming soon)',
      transactions: '/api/transactions (coming soon)',
      categories: '/api/categories (coming soon)',
      budgets: '/api/budgets (coming soon)',
      health: '/api/health'
    },
    documentation: '/docs'
  });
});

module.exports = router;
