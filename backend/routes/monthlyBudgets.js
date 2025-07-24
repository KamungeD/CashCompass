const express = require('express');
const router = express.Router();
const monthlyBudgetController = require('../controllers/monthlyBudgetController');
const { authenticate: protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Get monthly budget for specific month and year
router.get('/:year/:month', monthlyBudgetController.getMonthlyBudget);

// Create or update monthly budget
router.post('/', monthlyBudgetController.createOrUpdateMonthlyBudget);

// Generate monthly budget recommendations
router.post('/recommendations', monthlyBudgetController.generateMonthlyBudgetRecommendations);

// Get monthly budget performance
router.get('/:year/:month/performance', monthlyBudgetController.getMonthlyBudgetPerformance);

// Get all monthly budgets for a year
router.get('/:year', monthlyBudgetController.getYearlyMonthlyBudgets);

// Sync monthly budget with transactions
router.post('/:year/:month/sync', monthlyBudgetController.syncMonthlyBudgetWithTransactions);

// Delete monthly budget
router.delete('/:year/:month', monthlyBudgetController.deleteMonthlyBudget);

module.exports = router;
