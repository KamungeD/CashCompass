const express = require('express');
const router = express.Router();
const {
  getAnnualBudget,
  createOrUpdateAnnualBudget,
  getBudgetPerformance,
  getMonthlyBreakdown,
  syncBudgetWithTransactions,
  getBudgetTemplate,
  deleteAnnualBudget
} = require('../controllers/annualBudgetController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get budget template
router.get('/template', getBudgetTemplate);

// Get annual budget for specific year
router.get('/:year', getAnnualBudget);

// Create or update annual budget
router.post('/', createOrUpdateAnnualBudget);
router.put('/', createOrUpdateAnnualBudget);

// Get budget performance analysis
router.get('/:year/performance', getBudgetPerformance);

// Get monthly breakdown
router.get('/:year/monthly', getMonthlyBreakdown);

// Sync budget with transactions
router.post('/:year/sync', syncBudgetWithTransactions);

// Delete annual budget
router.delete('/:year', deleteAnnualBudget);

module.exports = router;
