const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    required: true,
    trim: true
  },
  monthlyBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  annualBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  monthlyActual: {
    type: Number,
    min: 0,
    default: 0
  },
  annualActual: {
    type: Number,
    min: 0,
    default: 0
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  // New field to specify if this is a monthly recurring item or annual item
  frequency: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  }
});

const monthlyTotalSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  budgeted: {
    type: Number,
    min: 0,
    default: 0
  },
  actual: {
    type: Number,
    min: 0,
    default: 0
  },
  difference: {
    type: Number,
    default: 0
  }
});

const monthlyBudgetSchema = new mongoose.Schema({
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
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true
  },
  
  // Monthly income
  income: {
    monthly: {
      type: Number,
      min: 0,
      default: 0
    },
    annual: {
      type: Number,
      min: 0,
      default: 0
    },
    sources: [{
      source: String,
      amount: Number,
      frequency: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly'
      }
    }]
  },

  // Categories and their budgets - monthly focused
  categories: [categoryBudgetSchema],

  // Monthly totals
  totals: {
    monthlyBudgetedExpenses: {
      type: Number,
      min: 0,
      default: 0
    },
    monthlyActualExpenses: {
      type: Number,
      min: 0,
      default: 0
    },
    monthlyDifference: {
      type: Number,
      default: 0
    },
    annualBudgetedExpenses: {
      type: Number,
      min: 0,
      default: 0
    },
    annualActualExpenses: {
      type: Number,
      min: 0,
      default: 0
    },
    annualDifference: {
      type: Number,
      default: 0
    }
  },

  // Performance tracking by month
  monthlyBreakdown: [monthlyTotalSchema],

  // Metadata
  creationMethod: {
    type: String,
    enum: ['manual', 'guided', 'template', 'imported'],
    default: 'manual'
  },
  userProfile: {
    lifeStage: String,
    livingSituation: String,
    dependents: Number,
    goals: [String]
  },
  priority: {
    type: String,
    enum: [
      'live-within-means',
      'increase-savings', 
      'detailed-tracking',
      'healthy-lifestyle',
      'responsible-spending',
      'specific-goal'
    ]
  },

  // Sharing and collaboration
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    shareCode: {
      type: String,
      unique: true,
      sparse: true
    },
    sharedWith: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Track if this budget is part of a yearly budget plan
  isPartOfYearlyPlan: {
    type: Boolean,
    default: false
  },
  yearlyPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YearlyPlan',
    default: null
  }
}, {
  timestamps: true,
  collection: 'monthlybudgets'
});

// Compound indexes
monthlyBudgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });
monthlyBudgetSchema.index({ user: 1, year: 1 });
monthlyBudgetSchema.index({ 'sharing.shareCode': 1 }, { sparse: true });

// Virtual for the budget period display
monthlyBudgetSchema.virtual('period').get(function() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[this.month - 1]} ${this.year}`;
});

// Virtual to calculate annual projection from monthly data
monthlyBudgetSchema.virtual('annualProjection').get(function() {
  const monthlyTotal = this.totals.monthlyBudgetedExpenses;
  const annualItems = this.categories
    .filter(cat => cat.frequency === 'annual')
    .reduce((sum, cat) => sum + cat.annualBudget, 0);
  
  return (monthlyTotal * 12) + annualItems;
});

// Method to recalculate totals
monthlyBudgetSchema.methods.recalculateTotals = function() {
  let monthlyBudgeted = 0;
  let monthlyActual = 0;
  let annualBudgeted = 0;
  let annualActual = 0;

  this.categories.forEach(category => {
    if (category.frequency === 'monthly') {
      monthlyBudgeted += category.monthlyBudget;
      monthlyActual += category.monthlyActual;
      annualBudgeted += category.monthlyBudget * 12;
      annualActual += category.monthlyActual * 12;
    } else {
      // Annual items are divided by 12 for monthly view
      monthlyBudgeted += category.annualBudget / 12;
      monthlyActual += category.annualActual / 12;
      annualBudgeted += category.annualBudget;
      annualActual += category.annualActual;
    }
  });

  this.totals.monthlyBudgetedExpenses = monthlyBudgeted;
  this.totals.monthlyActualExpenses = monthlyActual;
  this.totals.monthlyDifference = this.income.monthly - monthlyBudgeted;
  this.totals.annualBudgetedExpenses = annualBudgeted;
  this.totals.annualActualExpenses = annualActual;
  this.totals.annualDifference = this.income.annual - annualBudgeted;
};

// Method to sync with transactions for this specific month
monthlyBudgetSchema.methods.syncWithTransactions = async function() {
  const Transaction = mongoose.model('Transaction');
  
  const startDate = new Date(this.year, this.month - 1, 1);
  const endDate = new Date(this.year, this.month, 0);

  const transactions = await Transaction.find({
    user: this.user,
    date: {
      $gte: startDate,
      $lte: endDate
    },
    type: 'expense'
  });

  // Reset actual amounts
  this.categories.forEach(category => {
    category.monthlyActual = 0;
  });

  // Sum transactions by category and subcategory
  transactions.forEach(transaction => {
    const category = this.categories.find(c => 
      c.category === transaction.category && 
      c.subcategory === transaction.subcategory
    );
    
    if (category) {
      category.monthlyActual += Math.abs(transaction.amount);
    }
  });

  // Recalculate totals
  this.recalculateTotals();
  
  return this.save();
};

// Method to generate share code
monthlyBudgetSchema.methods.generateShareCode = function() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.sharing.shareCode = code;
  this.sharing.isShared = true;
  return this.save();
};

// Method to get performance data
monthlyBudgetSchema.methods.getPerformanceData = function() {
  const categories = this.categories.map(cat => ({
    category: cat.category,
    subcategory: cat.subcategory,
    budgeted: cat.monthlyBudget,
    actual: cat.monthlyActual,
    difference: cat.monthlyBudget - cat.monthlyActual,
    percentageUsed: cat.monthlyBudget > 0 ? (cat.monthlyActual / cat.monthlyBudget) * 100 : 0,
    frequency: cat.frequency
  }));

  return {
    overall: {
      totalBudgeted: this.totals.monthlyBudgetedExpenses,
      totalActual: this.totals.monthlyActualExpenses,
      difference: this.totals.monthlyDifference,
      percentageUsed: this.totals.monthlyBudgetedExpenses > 0 
        ? (this.totals.monthlyActualExpenses / this.totals.monthlyBudgetedExpenses) * 100 
        : 0
    },
    categories
  };
};

// Pre-save middleware to recalculate totals
monthlyBudgetSchema.pre('save', function(next) {
  if (this.isModified('categories') || this.isModified('income')) {
    this.recalculateTotals();
  }
  next();
});

// Export the model
module.exports = mongoose.model('MonthlyBudget', monthlyBudgetSchema);
