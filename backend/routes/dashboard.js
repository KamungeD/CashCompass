const express = require('express');
const router = express.Router();
const { authenticate: protect } = require('../middleware/auth');

// Import controllers (we'll create these functions)
const transactionController = require('../controllers/transactionController');
const budgetController = require('../controllers/budgetController');

// Protect all dashboard routes
router.use(protect);

// @route   GET /api/v1/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get financial stats for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // You'll need to implement these in your controllers
    const [
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      recentTransactions,
      budgetSummary
    ] = await Promise.all([
      // Calculate total balance (sum of all transactions)
      transactionController.getTotalBalance(userId),
      // Calculate monthly income
      transactionController.getMonthlyIncome(userId, startOfMonth, endOfMonth),
      // Calculate monthly expenses
      transactionController.getMonthlyExpenses(userId, startOfMonth, endOfMonth),
      // Get recent transactions
      transactionController.getRecentTransactions(userId, 5),
      // Get budget summary
      budgetController.getBudgetSummary(userId)
    ]);
    
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBalance,
          monthlyIncome,
          monthlyExpenses,
          savingsRate
        },
        recentTransactions,
        budgetSummary
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   GET /api/v1/dashboard/stats
// @desc    Get financial statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Calculate monthly and yearly stats
    const currentDate = new Date();
    const currentMonth = {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    };
    
    const previousMonth = {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    };
    
    // Get current and previous month data for comparison
    const [currentStats, previousStats] = await Promise.all([
      transactionController.getMonthlyStats(userId, currentMonth.start, currentMonth.end),
      transactionController.getMonthlyStats(userId, previousMonth.start, previousMonth.end)
    ]);
    
    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };
    
    const stats = {
      totalBalance: {
        value: currentStats.totalBalance || 0,
        change: calculateChange(currentStats.totalBalance, previousStats.totalBalance),
        trend: currentStats.totalBalance >= previousStats.totalBalance ? 'up' : 'down'
      },
      monthlyIncome: {
        value: currentStats.income || 0,
        change: calculateChange(currentStats.income, previousStats.income),
        trend: currentStats.income >= previousStats.income ? 'up' : 'down'
      },
      monthlyExpenses: {
        value: currentStats.expenses || 0,
        change: calculateChange(currentStats.expenses, previousStats.expenses),
        trend: currentStats.expenses <= previousStats.expenses ? 'up' : 'down' // Less expenses is better
      },
      savingsRate: {
        value: currentStats.income > 0 ? ((currentStats.income - currentStats.expenses) / currentStats.income) * 100 : 0,
        change: calculateChange(
          currentStats.income > 0 ? ((currentStats.income - currentStats.expenses) / currentStats.income) * 100 : 0,
          previousStats.income > 0 ? ((previousStats.income - previousStats.expenses) / previousStats.income) * 100 : 0
        ),
        trend: 'up' // Will be calculated based on change
      }
    };
    
    // Adjust savings rate trend
    stats.savingsRate.trend = stats.savingsRate.change >= 0 ? 'up' : 'down';
    
    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

module.exports = router;
