const Transaction = require('../models/Transaction');
const AnnualBudget = require('../models/AnnualBudget');
const MonthlyBudget = require('../models/Budget');
const mongoose = require('mongoose');
const { startOfMonth, endOfMonth, subMonths, format } = require('date-fns');

// Helper function to get date range based on period
const getDateRange = (period, customStart, customEnd) => {
  if (customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(customEnd) };
  }

  const now = new Date();
  switch (period) {
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'last3Months':
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case 'last6Months':
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
    case 'thisYear':
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

// Get spending analytics by category
exports.getSpendingByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'thisMonth', startDate, endDate } = req.query;
    
    const { start, end } = getDateRange(period, startDate, endDate);
    
    console.log('📊 Fetching spending by category:', { userId, period, start, end });

    // Debug: Check if we have any transactions in this period
    const totalTransactions = await Transaction.countDocuments({
      user: userId,
      type: 'expense',
      date: { $gte: start, $lte: end }
    });
    
    console.log('🔍 Debug - Total expense transactions in period:', totalTransactions);

    // Debug: Check a sample transaction structure
    const sampleTransaction = await Transaction.findOne({
      user: userId,
      type: 'expense'
    }).populate('category');
    
    console.log('🔍 Debug - Sample transaction:', sampleTransaction);

    const spendingData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          categoryName: {
            $cond: {
              if: { $gt: [{ $size: '$categoryInfo' }, 0] },
              then: { $arrayElemAt: ['$categoryInfo.name', 0] },
              else: 'Uncategorized'
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          category: { $first: '$categoryName' },
          totalAmount: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: { $abs: '$amount' } }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $project: {
          category: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          transactionCount: 1,
          averageAmount: { $round: ['$averageAmount', 2] },
          _id: 0
        }
      }
    ]);

    console.log('🔍 Debug - Aggregation result:', spendingData);

    const totalSpending = spendingData.reduce((sum, item) => sum + item.totalAmount, 0);
    
    const dataWithPercentages = spendingData.map(item => ({
      ...item,
      percentage: totalSpending > 0 ? ((item.totalAmount / totalSpending) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        categories: dataWithPercentages,
        totalSpending: Math.round(totalSpending),
        period,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spending analytics',
      error: error.message
    });
  }
};

// Get income analytics by source
exports.getIncomeBySource = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'thisMonth', startDate, endDate } = req.query;
    
    const { start, end } = getDateRange(period, startDate, endDate);
    
    console.log('💰 Fetching income by source:', { userId, period, start, end });

    const incomeData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: 'income',
          date: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          sourceName: {
            $cond: {
              if: { $gt: [{ $size: '$categoryInfo' }, 0] },
              then: { $arrayElemAt: ['$categoryInfo.name', 0] },
              else: 'Other'
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          source: { $first: '$sourceName' },
          totalAmount: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: { $abs: '$amount' } }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $project: {
          source: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          transactionCount: 1,
          averageAmount: { $round: ['$averageAmount', 2] },
          _id: 0
        }
      }
    ]);

    const totalIncome = incomeData.reduce((sum, item) => sum + item.totalAmount, 0);
    
    const dataWithPercentages = incomeData.map(item => ({
      ...item,
      percentage: totalIncome > 0 ? ((item.totalAmount / totalIncome) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        sources: dataWithPercentages,
        totalIncome: Math.round(totalIncome),
        period,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching income by source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income analytics',
      error: error.message
    });
  }
};

// Get monthly trends
exports.getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year = new Date().getFullYear(), months = 6 } = req.query;
    
    console.log('📈 Fetching monthly trends:', { userId, year, months });

    const startDate = new Date(year, new Date().getMonth() - (months - 1), 1);
    const endDate = new Date(year, new Date().getMonth() + 1, 0);

    const trendsData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'income'] },
                '$totalAmount',
                0
              ]
            }
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'expense'] },
                '$totalAmount',
                0
              ]
            }
          },
          totalTransactions: { $sum: '$transactionCount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          },
          income: { $round: ['$income', 2] },
          expenses: { $round: ['$expenses', 2] },
          netIncome: { $round: [{ $subtract: ['$income', '$expenses'] }, 2] },
          totalTransactions: 1,
          savingsRate: {
            $cond: [
              { $gt: ['$income', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$income', '$expenses'] }, '$income'] }, 100] },
              0
            ]
          },
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends: trendsData,
        period: `${months} months`,
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly trends',
      error: error.message
    });
  }
};

// Get financial summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'thisMonth' } = req.query;
    
    const { start, end } = getDateRange(period);
    
    console.log('📋 Fetching financial summary:', { userId, period, start, end });

    // Get current period data
    const currentPeriodData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: { $abs: '$amount' } }
        }
      }
    ]);

    // Get previous period for comparison
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(end.getTime() - periodLength);

    const previousPeriodData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: prevStart, $lte: prevEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: { $abs: '$amount' } }
        }
      }
    ]);

    // Process data
    const current = {
      income: currentPeriodData.find(d => d._id === 'income')?.totalAmount || 0,
      expenses: currentPeriodData.find(d => d._id === 'expense')?.totalAmount || 0,
      transactions: currentPeriodData.reduce((sum, d) => sum + d.transactionCount, 0)
    };

    const previous = {
      income: previousPeriodData.find(d => d._id === 'income')?.totalAmount || 0,
      expenses: previousPeriodData.find(d => d._id === 'expense')?.totalAmount || 0
    };

    const netIncome = current.income - current.expenses;
    const savingsRate = current.income > 0 ? ((netIncome / current.income) * 100) : 0;

    // Calculate changes
    const incomeChange = previous.income > 0 ? 
      (((current.income - previous.income) / previous.income) * 100) : 0;
    const expenseChange = previous.expenses > 0 ? 
      (((current.expenses - previous.expenses) / previous.expenses) * 100) : 0;

    res.json({
      success: true,
      data: {
        current: {
          income: Math.round(current.income),
          expenses: Math.round(current.expenses),
          netIncome: Math.round(netIncome),
          savingsRate: Math.round(savingsRate * 100) / 100,
          totalTransactions: current.transactions
        },
        changes: {
          income: Math.round(incomeChange * 100) / 100,
          expenses: Math.round(expenseChange * 100) / 100
        },
        period,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
      error: error.message
    });
  }
};

// Get savings analysis
exports.getSavingsAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year = new Date().getFullYear() } = req.query;
    
    console.log('💎 Fetching savings analysis:', { userId, year });

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const savingsData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: { $abs: '$amount' } }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          income: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'income'] },
                '$totalAmount',
                0
              ]
            }
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'expense'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          month: '$_id',
          income: { $round: ['$income', 2] },
          expenses: { $round: ['$expenses', 2] },
          savings: { $round: [{ $subtract: ['$income', '$expenses'] }, 2] },
          savingsRate: {
            $cond: [
              { $gt: ['$income', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$income', '$expenses'] }, '$income'] }, 100] },
              0
            ]
          },
          _id: 0
        }
      },
      {
        $sort: { month: 1 }
      }
    ]);

    // Calculate yearly totals
    const yearlyTotals = savingsData.reduce((acc, month) => ({
      income: acc.income + month.income,
      expenses: acc.expenses + month.expenses,
      savings: acc.savings + month.savings
    }), { income: 0, expenses: 0, savings: 0 });

    const yearlySavingsRate = yearlyTotals.income > 0 ? 
      (yearlyTotals.savings / yearlyTotals.income) * 100 : 0;

    res.json({
      success: true,
      data: {
        monthlyData: savingsData,
        yearlyTotals: {
          ...yearlyTotals,
          savingsRate: Math.round(yearlySavingsRate * 100) / 100
        },
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('Error fetching savings analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings analysis',
      error: error.message
    });
  }
};
