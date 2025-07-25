const express = require('express');
const router = express.Router();
const {
  getSpendingByCategory,
  getIncomeBySource,
  getMonthlyTrends,
  getFinancialSummary,
  getSavingsAnalysis
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Analytics routes
router.get('/spending-by-category', getSpendingByCategory);
router.get('/income-by-source', getIncomeBySource);
router.get('/monthly-trends', getMonthlyTrends);
router.get('/summary', getFinancialSummary);
router.get('/savings', getSavingsAnalysis);

module.exports = router;
