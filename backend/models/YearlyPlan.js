const mongoose = require('mongoose');

const yearlyGoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  currentAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  deadline: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  achieved: {
    type: Boolean,
    default: false
  }
});

const yearlyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050,
    index: true
  },
  
  // Overall yearly financial overview
  yearlyOverview: {
    totalIncome: {
      type: Number,
      min: 0,
      default: 0
    },
    totalExpenses: {
      type: Number,
      min: 0,
      default: 0
    },
    totalSavings: {
      type: Number,
      default: 0
    },
    monthsWithBudgets: {
      type: Number,
      min: 0,
      max: 12,
      default: 0
    }
  },

  // Annual goals and targets
  yearlyGoals: [yearlyGoalSchema],

  // Monthly summary (references to monthly budgets)
  monthlySummaries: [{
    month: {
      type: Number,
      min: 1,
      max: 12,
      required: true
    },
    monthlyBudgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyBudget'
    },
    income: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    },
    savings: {
      type: Number,
      default: 0
    },
    budgetedExpenses: {
      type: Number,
      default: 0
    },
    actualExpenses: {
      type: Number,
      default: 0
    },
    variance: {
      type: Number,
      default: 0
    }
  }],

  // Category trends across the year
  categoryTrends: [{
    category: String,
    monthlyData: [{
      month: Number,
      budgeted: Number,
      actual: Number
    }],
    yearlyTotal: {
      budgeted: Number,
      actual: Number
    },
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable', 'volatile']
    }
  }],

  // Annual budget template/defaults for creating new monthly budgets
  defaultMonthlyTemplate: [{
    category: String,
    subcategory: String,
    defaultMonthlyAmount: Number,
    frequency: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly'
    }
  }],

  // Settings and preferences for the year
  settings: {
    autoCreateMonthlyBudgets: {
      type: Boolean,
      default: false
    },
    defaultCurrency: {
      type: String,
      default: 'KES'
    },
    budgetingMethod: {
      type: String,
      enum: ['50-30-20', 'zero-based', 'envelope', 'custom'],
      default: '50-30-20'
    }
  }
}, {
  timestamps: true,
  collection: 'yearlyplans'
});

// Compound index
yearlyPlanSchema.index({ user: 1, year: 1 }, { unique: true });

// Virtual for progress percentage
yearlyPlanSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.yearlyOverview.monthsWithBudgets / 12) * 100);
});

// Method to update monthly summary
yearlyPlanSchema.methods.updateMonthlySummary = async function(month, monthlyBudgetData) {
  const existingSummary = this.monthlySummaries.find(s => s.month === month);
  
  if (existingSummary) {
    existingSummary.income = monthlyBudgetData.income.monthly;
    existingSummary.expenses = monthlyBudgetData.totals.monthlyActualExpenses;
    existingSummary.savings = monthlyBudgetData.income.monthly - monthlyBudgetData.totals.monthlyActualExpenses;
    existingSummary.budgetedExpenses = monthlyBudgetData.totals.monthlyBudgetedExpenses;
    existingSummary.actualExpenses = monthlyBudgetData.totals.monthlyActualExpenses;
    existingSummary.variance = monthlyBudgetData.totals.monthlyDifference;
    existingSummary.monthlyBudgetId = monthlyBudgetData._id;
  } else {
    this.monthlySummaries.push({
      month,
      monthlyBudgetId: monthlyBudgetData._id,
      income: monthlyBudgetData.income.monthly,
      expenses: monthlyBudgetData.totals.monthlyActualExpenses,
      savings: monthlyBudgetData.income.monthly - monthlyBudgetData.totals.monthlyActualExpenses,
      budgetedExpenses: monthlyBudgetData.totals.monthlyBudgetedExpenses,
      actualExpenses: monthlyBudgetData.totals.monthlyActualExpenses,
      variance: monthlyBudgetData.totals.monthlyDifference
    });
  }

  // Update yearly overview
  this.recalculateYearlyOverview();
  
  return this.save();
};

// Method to recalculate yearly overview
yearlyPlanSchema.methods.recalculateYearlyOverview = function() {
  const summaries = this.monthlySummaries;
  
  this.yearlyOverview.totalIncome = summaries.reduce((sum, s) => sum + s.income, 0);
  this.yearlyOverview.totalExpenses = summaries.reduce((sum, s) => sum + s.expenses, 0);
  this.yearlyOverview.totalSavings = this.yearlyOverview.totalIncome - this.yearlyOverview.totalExpenses;
  this.yearlyOverview.monthsWithBudgets = summaries.length;
};

// Method to generate category trends
yearlyPlanSchema.methods.generateCategoryTrends = async function() {
  const MonthlyBudget = mongoose.model('MonthlyBudget');
  
  const monthlyBudgets = await MonthlyBudget.find({
    user: this.user,
    year: this.year
  }).sort({ month: 1 });

  const categoryMap = new Map();

  monthlyBudgets.forEach(budget => {
    budget.categories.forEach(cat => {
      const key = cat.category;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category: key,
          monthlyData: [],
          yearlyTotal: { budgeted: 0, actual: 0 }
        });
      }

      const trend = categoryMap.get(key);
      trend.monthlyData.push({
        month: budget.month,
        budgeted: cat.monthlyBudget,
        actual: cat.monthlyActual
      });
      trend.yearlyTotal.budgeted += cat.monthlyBudget;
      trend.yearlyTotal.actual += cat.monthlyActual;
    });
  });

  this.categoryTrends = Array.from(categoryMap.values());
  
  // Calculate trend direction for each category
  this.categoryTrends.forEach(trend => {
    if (trend.monthlyData.length >= 3) {
      const amounts = trend.monthlyData.map(d => d.budgeted);
      const avgFirst = amounts.slice(0, Math.floor(amounts.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(amounts.length / 2);
      const avgLast = amounts.slice(Math.ceil(amounts.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(amounts.length / 2);
      
      const variance = amounts.reduce((acc, val) => {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        return acc + Math.pow(val - avg, 2);
      }, 0) / amounts.length;
      
      if (variance > avgFirst * 0.2) {
        trend.trend = 'volatile';
      } else if (avgLast > avgFirst * 1.1) {
        trend.trend = 'increasing';
      } else if (avgLast < avgFirst * 0.9) {
        trend.trend = 'decreasing';
      } else {
        trend.trend = 'stable';
      }
    } else {
      trend.trend = 'stable';
    }
  });
};

// Method to create monthly budget template
yearlyPlanSchema.methods.createMonthlyTemplate = function(priorityData, incomeData, selectedCategories) {
  // This will be used to create default monthly budgets
  this.defaultMonthlyTemplate = [];
  
  // Add logic to create template based on yearly planning
  // This can be filled with default categories and amounts
  
  return this.save();
};

module.exports = mongoose.model('YearlyPlan', yearlyPlanSchema);
