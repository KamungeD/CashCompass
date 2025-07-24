const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const transactionRoutes = require('./transactions');
const categoryRoutes = require('./categories');
const budgetRoutes = require('./budgets');
const annualBudgetRoutes = require('./annualBudgets'); // Keep for backward compatibility
const monthlyBudgetRoutes = require('./monthlyBudgets');
const yearlyPlanRoutes = require('./yearlyPlans');
const dashboardRoutes = require('./dashboard');

// Mount routes
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/annual-budgets', annualBudgetRoutes); // Keep for backward compatibility
router.use('/monthly-budgets', monthlyBudgetRoutes);
router.use('/yearly-plans', yearlyPlanRoutes);
router.use('/dashboard', dashboardRoutes);

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
      auth: '/api/auth',
      transactions: '/api/transactions',
      categories: '/api/categories',
      budgets: '/api/budgets (coming soon)',
      health: '/api/health'
    },
    documentation: '/docs'
  });
});

module.exports = router;
