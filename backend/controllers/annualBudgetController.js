const AnnualBudget = require('../models/AnnualBudget');
const Transaction = require('../models/Transaction');

// Default budget template based on the CSV data
const DEFAULT_BUDGET_TEMPLATE = [
  // Housing
  { category: 'Housing', subcategory: 'Rent', monthlyBudget: 38000, annualBudget: 456000 },
  { category: 'Housing', subcategory: 'Phone', monthlyBudget: 2000, annualBudget: 24000 },
  { category: 'Housing', subcategory: 'Second Phone', monthlyBudget: 2500, annualBudget: 30000 },
  { category: 'Housing', subcategory: 'Electricity', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Housing', subcategory: 'Water and sewer', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Housing', subcategory: 'Internet', monthlyBudget: 4100, annualBudget: 49200 },
  { category: 'Housing', subcategory: 'Supplies Shopping', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Housing', subcategory: 'Rental Management', monthlyBudget: 1000, annualBudget: 12000 },

  // Transportation
  { category: 'Transportation', subcategory: 'Bus/taxi fare', monthlyBudget: 3000, annualBudget: 36000 },
  { category: 'Transportation', subcategory: 'Insurance', monthlyBudget: 0, annualBudget: 10085 },
  { category: 'Transportation', subcategory: 'Licensing', monthlyBudget: 0, annualBudget: 1300 },
  { category: 'Transportation', subcategory: 'Fuel', monthlyBudget: 9000, annualBudget: 108000 },

  // Loans
  { category: 'Loans', subcategory: 'Mortgage', monthlyBudget: 38473, annualBudget: 461676 },

  // Insurance
  { category: 'Insurance', subcategory: 'Health', monthlyBudget: 0, annualBudget: 7500 },
  { category: 'Insurance', subcategory: 'Second Health', monthlyBudget: 0, annualBudget: 7500 },

  // Entertainment
  { category: 'Entertainment', subcategory: 'Spotify', monthlyBudget: 439, annualBudget: 5268 },
  { category: 'Entertainment', subcategory: 'Netflix', monthlyBudget: 1100, annualBudget: 13200 },
  { category: 'Entertainment', subcategory: 'Showmax', monthlyBudget: 650, annualBudget: 7800 },
  { category: 'Entertainment', subcategory: 'Dates', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Entertainment', subcategory: 'Cinema', monthlyBudget: 2500, annualBudget: 30000 },

  // Food
  { category: 'Food', subcategory: 'Groceries Shopping', monthlyBudget: 20000, annualBudget: 240000 },
  { category: 'Food', subcategory: 'Dining out', monthlyBudget: 10000, annualBudget: 120000 },
  { category: 'Food', subcategory: 'Office lunch', monthlyBudget: 10000, annualBudget: 120000 },
  { category: 'Food', subcategory: 'Water', monthlyBudget: 1400, annualBudget: 16800 },
  { category: 'Food', subcategory: 'Energy drinks', monthlyBudget: 3360, annualBudget: 40320 },

  // Personal Care
  { category: 'Personal Care', subcategory: 'Medical', monthlyBudget: 7900, annualBudget: 94800 },
  { category: 'Personal Care', subcategory: 'Second Medical', monthlyBudget: 7200, annualBudget: 86400 },
  { category: 'Personal Care', subcategory: 'Hair/nails', monthlyBudget: 2000, annualBudget: 24000 },
  { category: 'Personal Care', subcategory: 'Second Hair/nails', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Personal Care', subcategory: 'Grooming Shopping', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Personal Care', subcategory: 'Clothing', monthlyBudget: 8000, annualBudget: 96000 },
  { category: 'Personal Care', subcategory: 'Haircare Products', monthlyBudget: 0, annualBudget: 14000 },
  { category: 'Personal Care', subcategory: 'Skincare Products', monthlyBudget: 8000, annualBudget: 96000 },

  // Pets
  { category: 'Pets', subcategory: 'Food', monthlyBudget: 3858, annualBudget: 46296 },
  { category: 'Pets', subcategory: 'Medical', monthlyBudget: 0, annualBudget: 5000 },
  { category: 'Pets', subcategory: 'Grooming', monthlyBudget: 4500, annualBudget: 54000 },
  { category: 'Pets', subcategory: 'Toys', monthlyBudget: 500, annualBudget: 6000 },

  // Savings/Investments
  { category: 'Savings/Investments', subcategory: 'Retirement account', monthlyBudget: 40000, annualBudget: 480000 },
  { category: 'Savings/Investments', subcategory: 'Second Investment account', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Savings/Investments', subcategory: 'Rainy Day Fund', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Savings/Investments', subcategory: 'Annual Payments Fund', monthlyBudget: 3782, annualBudget: 45384 }
];

// Get annual budget for a specific year
exports.getAnnualBudget = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    if (!year || year < 2020 || year > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Valid year is required (2020-2050)'
      });
    }

    let annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    // Create default budget if none exists
    if (!annualBudget) {
      annualBudget = await AnnualBudget.createFromTemplate(
        userId,
        parseInt(year),
        DEFAULT_BUDGET_TEMPLATE
      );
    }

    // Sync with current transactions
    await annualBudget.syncWithTransactions();

    res.json({
      success: true,
      data: annualBudget
    });
  } catch (error) {
    console.error('Error fetching annual budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch annual budget',
      error: error.message
    });
  }
};

// Create or update annual budget
exports.createOrUpdateAnnualBudget = async (req, res) => {
  try {
    const { year, categories, income } = req.body;
    const userId = req.user.id;

    if (!year || !categories) {
      return res.status(400).json({
        success: false,
        message: 'Year and categories are required'
      });
    }

    let annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (annualBudget) {
      // Update existing budget
      annualBudget.categories = categories;
      if (income) {
        annualBudget.income = income;
      }
      await annualBudget.save();
    } else {
      // Create new budget
      annualBudget = new AnnualBudget({
        user: userId,
        year: parseInt(year),
        categories,
        income: income || { monthly: 0, annual: 0 }
      });
      await annualBudget.save();
    }

    res.json({
      success: true,
      data: annualBudget,
      message: annualBudget.isNew ? 'Annual budget created successfully' : 'Annual budget updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating annual budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update annual budget',
      error: error.message
    });
  }
};

// Get budget performance analysis
exports.getBudgetPerformance = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found for the specified year'
      });
    }

    // Sync with latest transactions
    await annualBudget.syncWithTransactions();

    const performance = annualBudget.getCategoryPerformance();
    
    // Calculate summary statistics
    const summary = {
      totalBudgeted: annualBudget.totalAnnualBudget,
      totalSpent: annualBudget.totalActualSpending,
      variance: annualBudget.variance,
      progress: annualBudget.progress,
      remainingBudget: annualBudget.remainingBudget,
      monthsElapsed: annualBudget.monthsElapsed,
      averageMonthlySpending: annualBudget.monthsElapsed > 0 ? 
        annualBudget.totalActualSpending / annualBudget.monthsElapsed : 0,
      projectedAnnualSpending: annualBudget.monthsElapsed > 0 ? 
        (annualBudget.totalActualSpending / annualBudget.monthsElapsed) * 12 : 0
    };

    // Group performance by category
    const categoryGroups = performance.reduce((groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = {
          category: item.category,
          totalBudgeted: 0,
          totalSpent: 0,
          subcategories: []
        };
      }
      
      groups[item.category].totalBudgeted += item.annualBudget;
      groups[item.category].totalSpent += item.annualActual;
      groups[item.category].subcategories.push(item);
      
      return groups;
    }, {});

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        summary,
        categoryGroups: Object.values(categoryGroups),
        performance,
        lastSyncDate: annualBudget.lastSyncDate
      }
    });
  } catch (error) {
    console.error('Error fetching budget performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget performance',
      error: error.message
    });
  }
};

// Get monthly breakdown
exports.getMonthlyBreakdown = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found'
      });
    }

    // Get monthly transaction data
    const startOfYear = new Date(parseInt(year), 0, 1);
    const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);

    const monthlyData = [];
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(parseInt(year), month, 1);
      const endOfMonth = new Date(parseInt(year), month + 1, 0, 23, 59, 59);
      
      const transactions = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            type: 'expense'
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' }
          }
        }
      ]);

      const monthlyBudget = annualBudget.totalMonthlyBudget;
      const monthlySpent = transactions.length > 0 ? Math.abs(transactions[0].totalSpent) : 0;

      monthlyData.push({
        month: month + 1,
        monthName: new Date(parseInt(year), month).toLocaleString('default', { month: 'long' }),
        budgeted: monthlyBudget,
        actual: monthlySpent,
        variance: monthlySpent - monthlyBudget,
        progress: monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0
      });
    }

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyData,
        annualSummary: {
          totalBudgeted: annualBudget.totalAnnualBudget,
          totalSpent: annualBudget.totalActualSpending,
          averageMonthlyBudget: annualBudget.totalMonthlyBudget,
          averageMonthlySpent: monthlyData.reduce((sum, m) => sum + m.actual, 0) / 12
        }
      }
    });
  } catch (error) {
    console.error('Error fetching monthly breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly breakdown',
      error: error.message
    });
  }
};

// Sync budget with transactions
exports.syncBudgetWithTransactions = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found'
      });
    }

    await annualBudget.syncWithTransactions();

    res.json({
      success: true,
      data: annualBudget,
      message: 'Budget synced with transactions successfully'
    });
  } catch (error) {
    console.error('Error syncing budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync budget with transactions',
      error: error.message
    });
  }
};

// Get default budget template
exports.getBudgetTemplate = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        template: DEFAULT_BUDGET_TEMPLATE,
        categories: [...new Set(DEFAULT_BUDGET_TEMPLATE.map(item => item.category))],
        totalMonthlyBudget: DEFAULT_BUDGET_TEMPLATE.reduce((sum, item) => sum + item.monthlyBudget, 0),
        totalAnnualBudget: DEFAULT_BUDGET_TEMPLATE.reduce((sum, item) => sum + item.annualBudget, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching budget template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget template',
      error: error.message
    });
  }
};

// Delete annual budget
exports.deleteAnnualBudget = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOneAndDelete({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Annual budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting annual budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete annual budget',
      error: error.message
    });
  }
};
