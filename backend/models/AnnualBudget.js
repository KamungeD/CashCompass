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
  variance: {
    type: Number,
    default: 0
  }
}, { _id: false });

const annualBudgetSchema = new mongoose.Schema({
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
    max: 2050
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: function() {
      return `Annual Budget ${this.year}`;
    }
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'],
    required: true,
    default: 'KES'
  },
  
  // Income tracking
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
    actualMonthly: {
      type: Number,
      min: 0,
      default: 0
    },
    actualAnnual: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // Category budgets and tracking
  categories: [categoryBudgetSchema],
  
  // Monthly totals for tracking
  monthlyTotals: [monthlyTotalSchema],
  
  // Overall budget totals
  totalMonthlyBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAnnualBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  totalActualSpending: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Budget status
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
annualBudgetSchema.index({ user: 1, year: 1 }, { unique: true });
annualBudgetSchema.index({ user: 1, isActive: 1 });
annualBudgetSchema.index({ createdAt: -1 });

// Virtual for progress calculation
annualBudgetSchema.virtual('progress').get(function() {
  if (this.totalAnnualBudget === 0) return 0;
  return Math.round((this.totalActualSpending / this.totalAnnualBudget) * 100);
});

// Virtual for remaining budget
annualBudgetSchema.virtual('remainingBudget').get(function() {
  return Math.max(0, this.totalAnnualBudget - this.totalActualSpending);
});

// Virtual for budget variance
annualBudgetSchema.virtual('variance').get(function() {
  return this.totalActualSpending - this.totalAnnualBudget;
});

// Virtual for months elapsed
annualBudgetSchema.virtual('monthsElapsed').get(function() {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  if (currentYear !== this.year) {
    return currentYear > this.year ? 12 : 0;
  }
  
  return now.getMonth() + 1; // 1-based month
});

// Pre-save middleware to calculate totals
annualBudgetSchema.pre('save', function(next) {
  // Calculate total monthly and annual budgets
  this.totalMonthlyBudget = this.categories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
  this.totalAnnualBudget = this.categories.reduce((sum, cat) => sum + cat.annualBudget, 0);
  this.totalActualSpending = this.categories.reduce((sum, cat) => sum + cat.annualActual, 0);
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Method to sync with transactions
annualBudgetSchema.methods.syncWithTransactions = async function() {
  try {
    const Transaction = mongoose.model('Transaction');
    const startOfYear = new Date(this.year, 0, 1);
    const endOfYear = new Date(this.year, 11, 31, 23, 59, 59);
    
    // Get all transactions for this year
    const transactions = await Transaction.find({
      user: this.user,
      date: { $gte: startOfYear, $lte: endOfYear },
      type: 'expense'
    }).populate('category');
    
    // Reset actual amounts
    this.categories.forEach(cat => {
      cat.monthlyActual = 0;
      cat.annualActual = 0;
    });
    
    // Calculate actual spending by category
    transactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Other';
      const amount = Math.abs(transaction.amount);
      
      // Find matching category/subcategory
      const category = this.categories.find(cat => 
        cat.category.toLowerCase().includes(categoryName.toLowerCase()) ||
        cat.subcategory.toLowerCase().includes(categoryName.toLowerCase())
      );
      
      if (category) {
        category.annualActual += amount;
      }
    });
    
    // Calculate monthly averages
    const monthsElapsed = this.monthsElapsed;
    if (monthsElapsed > 0) {
      this.categories.forEach(cat => {
        cat.monthlyActual = cat.annualActual / monthsElapsed;
      });
    }
    
    this.lastSyncDate = new Date();
    await this.save();
    
    return this;
  } catch (error) {
    throw new Error(`Failed to sync with transactions: ${error.message}`);
  }
};

// Method to get category performance
annualBudgetSchema.methods.getCategoryPerformance = function() {
  return this.categories.map(cat => ({
    category: cat.category,
    subcategory: cat.subcategory,
    monthlyBudget: cat.monthlyBudget,
    monthlyActual: cat.monthlyActual,
    annualBudget: cat.annualBudget,
    annualActual: cat.annualActual,
    monthlyVariance: cat.monthlyActual - cat.monthlyBudget,
    annualVariance: cat.annualActual - cat.annualBudget,
    monthlyProgress: cat.monthlyBudget > 0 ? (cat.monthlyActual / cat.monthlyBudget) * 100 : 0,
    annualProgress: cat.annualBudget > 0 ? (cat.annualActual / cat.annualBudget) * 100 : 0,
    isOverBudget: cat.annualActual > cat.annualBudget,
    remainingBudget: Math.max(0, cat.annualBudget - cat.annualActual)
  }));
};

// Static method to create from template
annualBudgetSchema.statics.createFromTemplate = async function(userId, year, templateData) {
  const categories = templateData.map(item => ({
    category: item.category,
    subcategory: item.subcategory,
    monthlyBudget: item.monthlyBudget || 0,
    annualBudget: item.annualBudget || (item.monthlyBudget * 12) || 0,
    monthlyActual: 0,
    annualActual: 0,
    isRecurring: item.isRecurring !== false
  }));
  
  const annualBudget = new this({
    user: userId,
    year,
    categories,
    isActive: true
  });
  
  return await annualBudget.save();
};

module.exports = mongoose.model('AnnualBudget', annualBudgetSchema);
