const YearlyPlan = require('../models/YearlyPlan');
const MonthlyBudget = require('../models/MonthlyBudget');

// Get yearly plan overview
exports.getYearlyPlan = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    if (!year || year < 2020 || year > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Valid year is required (2020-2050)'
      });
    }

    let yearlyPlan = await YearlyPlan.findOne({
      user: userId,
      year: parseInt(year)
    }).populate('monthlySummaries.monthlyBudgetId');

    if (!yearlyPlan) {
      // Create a new yearly plan if it doesn't exist
      yearlyPlan = new YearlyPlan({
        user: userId,
        year: parseInt(year),
        yearlyOverview: {
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          monthsWithBudgets: 0
        },
        monthlySummaries: [],
        categoryTrends: [],
        yearlyGoals: []
      });

      // Check if there are any monthly budgets for this year
      const monthlyBudgets = await MonthlyBudget.find({
        user: userId,
        year: parseInt(year)
      }).sort({ month: 1 });

      // If monthly budgets exist, update the yearly plan
      if (monthlyBudgets.length > 0) {
        for (const budget of monthlyBudgets) {
          await yearlyPlan.updateMonthlySummary(budget.month, budget);
        }
        await yearlyPlan.generateCategoryTrends();
      }

      await yearlyPlan.save();
    } else {
      // Update category trends for existing plan
      await yearlyPlan.generateCategoryTrends();
      await yearlyPlan.save();
    }

    res.json({
      success: true,
      data: yearlyPlan
    });
  } catch (error) {
    console.error('Error fetching yearly plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update yearly goals
exports.updateYearlyGoals = async (req, res) => {
  try {
    const { year } = req.params;
    const { goals } = req.body;
    const userId = req.user.id;

    let yearlyPlan = await YearlyPlan.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!yearlyPlan) {
      yearlyPlan = new YearlyPlan({
        user: userId,
        year: parseInt(year),
        yearlyOverview: {
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          monthsWithBudgets: 0
        },
        monthlySummaries: [],
        categoryTrends: [],
        yearlyGoals: goals || []
      });
    } else {
      yearlyPlan.yearlyGoals = goals || [];
    }

    await yearlyPlan.save();

    res.json({
      success: true,
      message: 'Yearly goals updated successfully',
      data: yearlyPlan
    });
  } catch (error) {
    console.error('Error updating yearly goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update yearly goals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get yearly financial summary
exports.getYearlySummary = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const yearlyPlan = await YearlyPlan.findOne({
      user: userId,
      year: parseInt(year)
    });

    const monthlyBudgets = await MonthlyBudget.find({
      user: userId,
      year: parseInt(year)
    }).sort({ month: 1 });

    // Calculate comprehensive yearly summary
    let totalIncome = 0;
    let totalBudgetedExpenses = 0;
    let totalActualExpenses = 0;
    let monthlyData = [];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Create data for all 12 months
    for (let month = 1; month <= 12; month++) {
      const budget = monthlyBudgets.find(b => b.month === month);
      
      if (budget) {
        totalIncome += budget.income.monthly;
        totalBudgetedExpenses += budget.totals.monthlyBudgetedExpenses;
        totalActualExpenses += budget.totals.monthlyActualExpenses;
        
        monthlyData.push({
          month,
          monthName: monthNames[month - 1],
          income: budget.income.monthly,
          budgeted: budget.totals.monthlyBudgetedExpenses,
          actual: budget.totals.monthlyActualExpenses,
          savings: budget.income.monthly - budget.totals.monthlyActualExpenses,
          variance: budget.totals.monthlyBudgetedExpenses - budget.totals.monthlyActualExpenses,
          hasBudget: true
        });
      } else {
        monthlyData.push({
          month,
          monthName: monthNames[month - 1],
          income: 0,
          budgeted: 0,
          actual: 0,
          savings: 0,
          variance: 0,
          hasBudget: false
        });
      }
    }

    // Category performance across the year
    const categoryPerformance = new Map();
    
    monthlyBudgets.forEach(budget => {
      budget.categories.forEach(cat => {
        const key = `${cat.category} - ${cat.subcategory}`;
        if (!categoryPerformance.has(key)) {
          categoryPerformance.set(key, {
            category: cat.category,
            subcategory: cat.subcategory,
            totalBudgeted: 0,
            totalActual: 0,
            months: []
          });
        }
        
        const perf = categoryPerformance.get(key);
        perf.totalBudgeted += cat.monthlyBudget;
        perf.totalActual += cat.monthlyActual;
        perf.months.push({
          month: budget.month,
          budgeted: cat.monthlyBudget,
          actual: cat.monthlyActual
        });
      });
    });

    const summary = {
      year: parseInt(year),
      overview: {
        totalIncome,
        totalBudgetedExpenses,
        totalActualExpenses,
        totalSavings: totalIncome - totalActualExpenses,
        budgetedSavings: totalIncome - totalBudgetedExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalActualExpenses) / totalIncome * 100) : 0,
        monthsWithBudgets: monthlyBudgets.length,
        avgMonthlyIncome: monthlyBudgets.length > 0 ? totalIncome / monthlyBudgets.length : 0,
        avgMonthlyExpenses: monthlyBudgets.length > 0 ? totalActualExpenses / monthlyBudgets.length : 0
      },
      monthlyData,
      categoryPerformance: Array.from(categoryPerformance.values()),
      goals: yearlyPlan ? yearlyPlan.yearlyGoals : [],
      trends: yearlyPlan ? yearlyPlan.categoryTrends : []
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching yearly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create monthly budget template from yearly plan
exports.createMonthlyTemplate = async (req, res) => {
  try {
    const { year } = req.params;
    const { templateData } = req.body;
    const userId = req.user.id;

    let yearlyPlan = await YearlyPlan.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!yearlyPlan) {
      yearlyPlan = new YearlyPlan({
        user: userId,
        year: parseInt(year),
        yearlyOverview: {
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          monthsWithBudgets: 0
        },
        monthlySummaries: [],
        categoryTrends: [],
        yearlyGoals: []
      });
    }

    yearlyPlan.defaultMonthlyTemplate = templateData || [];
    await yearlyPlan.save();

    res.json({
      success: true,
      message: 'Monthly template created successfully',
      data: yearlyPlan.defaultMonthlyTemplate
    });
  } catch (error) {
    console.error('Error creating monthly template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create monthly template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update yearly plan settings
exports.updateYearlySettings = async (req, res) => {
  try {
    const { year } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;

    let yearlyPlan = await YearlyPlan.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!yearlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Yearly plan not found'
      });
    }

    yearlyPlan.settings = { ...yearlyPlan.settings, ...settings };
    await yearlyPlan.save();

    res.json({
      success: true,
      message: 'Yearly settings updated successfully',
      data: yearlyPlan
    });
  } catch (error) {
    console.error('Error updating yearly settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update yearly settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get category trends for the year
exports.getCategoryTrends = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const yearlyPlan = await YearlyPlan.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!yearlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Yearly plan not found'
      });
    }

    await yearlyPlan.generateCategoryTrends();
    await yearlyPlan.save();

    res.json({
      success: true,
      data: yearlyPlan.categoryTrends
    });
  } catch (error) {
    console.error('Error fetching category trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete yearly plan
exports.deleteYearlyPlan = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const yearlyPlan = await YearlyPlan.findOneAndDelete({
      user: userId,
      year: parseInt(year)
    });

    if (!yearlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Yearly plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Yearly plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting yearly plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete yearly plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
