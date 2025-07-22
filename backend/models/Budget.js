const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Budget must belong to a user'],
    index: true
  },
  
  // Basic budget information
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Budget amount and currency
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'],
    required: [true, 'Currency is required'],
    default: 'KES'
  },
  
  // Budget period and timing
  period: {
    type: String,
    enum: {
      values: ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      message: 'Invalid budget period'
    },
    required: [true, 'Budget period is required'],
    index: true
  },
  startDate: {
    type: Date,
    required: [true, 'Budget start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, 'Budget end date is required'],
    index: true
  },
  
  // Categories and scope
  categories: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: [0, 'Allocated amount cannot be negative']
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingAmount: {
      type: Number,
      default: function() {
        return this.allocatedAmount - this.spentAmount;
      }
    }
  }],
  
  // Budget type and behavior
  type: {
    type: String,
    enum: {
      values: ['expense', 'income', 'savings', 'debt_payment'],
      message: 'Invalid budget type'
    },
    required: [true, 'Budget type is required'],
    index: true
  },
  
  // Auto-adjustment settings
  autoAdjust: {
    enabled: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'rolling_average'],
      default: 'percentage'
    },
    adjustmentValue: {
      type: Number,
      min: 0,
      default: 10
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    }
  },
  
  // Rollover settings
  rollover: {
    enabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['unused_to_next', 'overspent_from_next', 'both'],
      default: 'unused_to_next'
    },
    maxRolloverPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    }
  },
  
  // Status and tracking
  status: {
    type: String,
    enum: {
      values: ['active', 'paused', 'completed', 'cancelled'],
      message: 'Invalid budget status'
    },
    default: 'active',
    index: true
  },
  isRecurring: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Spending tracking
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining: {
    type: Number,
    default: function() {
      return Math.max(0, this.amount - this.spent);
    }
  },
  percentageUsed: {
    type: Number,
    default: 0,
    min: 0,
    max: 200 // Allow over-budget scenarios
  },
  
  // Alerts and notifications
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: {
      warning: {
        type: Number,
        min: 0,
        max: 100,
        default: 75
      },
      critical: {
        type: Number,
        min: 0,
        max: 100,
        default: 90
      },
      exceeded: {
        type: Boolean,
        default: true
      }
    },
    notificationMethods: [{
      type: String,
      enum: ['email', 'push', 'sms']
    }],
    lastWarningAlert: {
      type: Date
    },
    lastCriticalAlert: {
      type: Date
    },
    lastExceededAlert: {
      type: Date
    }
  },
  
  // Goals and targets
  goals: {
    targetSavings: {
      type: Number,
      min: 0,
      default: 0
    },
    targetReduction: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    customGoals: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      targetValue: {
        type: Number,
        required: true,
        min: 0
      },
      currentValue: {
        type: Number,
        default: 0,
        min: 0
      },
      unit: {
        type: String,
        enum: ['amount', 'percentage', 'count'],
        default: 'amount'
      },
      achieved: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Historical data
  history: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'amount_changed', 'category_added', 'category_removed', 'status_changed'],
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    amount: {
      type: Number
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200
    }
  }],
  
  // Tags and metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Sharing and collaboration
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit', 'admin'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    shareCode: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  
  // Integration and automation
  automation: {
    enabled: {
      type: Boolean,
      default: false
    },
    rules: [{
      condition: {
        type: String,
        enum: ['amount_exceeded', 'percentage_reached', 'date_reached', 'category_limit'],
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      action: {
        type: String,
        enum: ['send_alert', 'pause_budget', 'adjust_amount', 'create_report'],
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Add computed fields for frontend
      ret.daysRemaining = ret.daysUntilEnd;
      ret.isOverBudget = ret.spent > ret.amount;
      ret.averageDailySpending = ret.averageDaily;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Pre-validation hook for date validation
budgetSchema.pre('validate', function(next) {
  // Handle date validation for both new documents and updates
  if (this.startDate && this.endDate) {
    if (this.endDate <= this.startDate) {
      const error = new Error('End date must be after start date');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Pre-validation hook for updates specifically
budgetSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  
  // If both dates are being updated, validate them
  if (update.startDate && update.endDate) {
    if (new Date(update.endDate) <= new Date(update.startDate)) {
      const error = new Error('End date must be after start date');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  next();
});

// Indexes for performance
budgetSchema.index({ user: 1, period: 1, startDate: -1 });
budgetSchema.index({ user: 1, status: 1, endDate: -1 });
budgetSchema.index({ user: 1, type: 1, status: 1 });
budgetSchema.index({ endDate: 1, status: 1 });
budgetSchema.index({ startDate: 1, endDate: 1 });
budgetSchema.index({ 'categories.category': 1 });
budgetSchema.index({ 'sharing.shareCode': 1 }, { sparse: true });

// Virtual for budget health status
budgetSchema.virtual('healthStatus').get(function() {
  if (this.percentageUsed <= 50) return 'healthy';
  if (this.percentageUsed <= 75) return 'moderate';
  if (this.percentageUsed <= 90) return 'warning';
  if (this.percentageUsed <= 100) return 'critical';
  return 'exceeded';
});

// Virtual for days remaining
budgetSchema.virtual('daysUntilEnd').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  if (endDate <= now) return 0;
  
  return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
});

// Virtual for days elapsed
budgetSchema.virtual('daysElapsed').get(function() {
  const now = new Date();
  const startDate = new Date(this.startDate);
  if (startDate > now) return 0;
  
  return Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
});

// Virtual for total days in budget period
budgetSchema.virtual('totalDays').get(function() {
  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for average daily spending
budgetSchema.virtual('averageDaily').get(function() {
  if (this.daysElapsed === 0) return 0;
  return this.spent / this.daysElapsed;
});

// Virtual for projected spending
budgetSchema.virtual('projectedSpending').get(function() {
  if (this.daysElapsed === 0) return 0;
  return (this.spent / this.daysElapsed) * this.totalDays;
});

// Virtual for spending velocity (compared to budget pace)
budgetSchema.virtual('spendingVelocity').get(function() {
  const budgetPace = this.amount / this.totalDays;
  const actualPace = this.averageDaily;
  if (budgetPace === 0) return 0;
  return (actualPace / budgetPace) * 100;
});

// Pre-save middleware to update calculated fields
budgetSchema.pre('save', function(next) {
  // Update percentage used
  this.percentageUsed = this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
  
  // Update remaining amount
  this.remaining = Math.max(0, this.amount - this.spent);
  
  // Update category remaining amounts
  if (this.categories && this.categories.length > 0) {
    this.categories.forEach(cat => {
      cat.remainingAmount = Math.max(0, cat.allocatedAmount - cat.spentAmount);
    });
  }
  
  next();
});

// Pre-save middleware to generate share code if sharing is enabled
budgetSchema.pre('save', function(next) {
  if (this.sharing.isShared && !this.sharing.shareCode) {
    this.sharing.shareCode = require('crypto').randomBytes(16).toString('hex');
  }
  next();
});

// Pre-save middleware to validate categories allocation
budgetSchema.pre('save', function(next) {
  if (this.categories && this.categories.length > 0) {
    const totalAllocated = this.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    if (totalAllocated > this.amount * 1.1) { // Allow 10% tolerance
      return next(new Error('Total category allocation cannot exceed budget amount by more than 10%'));
    }
  }
  next();
});

// Instance method to add transaction impact
budgetSchema.methods.addTransaction = function(transaction) {
  if (transaction.type !== 'expense') return this;
  
  // Update overall spent amount
  this.spent += Math.abs(transaction.amount);
  
  // Update category-specific spending
  if (this.categories && this.categories.length > 0) {
    const categoryIndex = this.categories.findIndex(
      cat => cat.category.toString() === transaction.category.toString()
    );
    
    if (categoryIndex !== -1) {
      this.categories[categoryIndex].spentAmount += Math.abs(transaction.amount);
    }
  }
  
  // Add to history
  this.history.push({
    date: new Date(),
    action: 'transaction_added',
    details: {
      transactionId: transaction._id,
      amount: transaction.amount,
      category: transaction.category
    },
    amount: Math.abs(transaction.amount),
    note: `Transaction: ${transaction.description}`
  });
  
  return this.save();
};

// Instance method to remove transaction impact
budgetSchema.methods.removeTransaction = function(transaction) {
  if (transaction.type !== 'expense') return this;
  
  // Update overall spent amount
  this.spent = Math.max(0, this.spent - Math.abs(transaction.amount));
  
  // Update category-specific spending
  if (this.categories && this.categories.length > 0) {
    const categoryIndex = this.categories.findIndex(
      cat => cat.category.toString() === transaction.category.toString()
    );
    
    if (categoryIndex !== -1) {
      this.categories[categoryIndex].spentAmount = Math.max(
        0, 
        this.categories[categoryIndex].spentAmount - Math.abs(transaction.amount)
      );
    }
  }
  
  // Add to history
  this.history.push({
    date: new Date(),
    action: 'transaction_removed',
    details: {
      transactionId: transaction._id,
      amount: transaction.amount,
      category: transaction.category
    },
    amount: -Math.abs(transaction.amount),
    note: `Transaction removed: ${transaction.description}`
  });
  
  return this.save();
};

// Instance method to check if alerts should be triggered
budgetSchema.methods.checkAlerts = function() {
  if (!this.alerts.enabled) return [];
  
  const alertsToSend = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Warning threshold
  if (this.percentageUsed >= this.alerts.thresholds.warning && 
      this.percentageUsed < this.alerts.thresholds.critical &&
      (!this.alerts.lastWarningAlert || this.alerts.lastWarningAlert < oneDayAgo)) {
    alertsToSend.push({
      type: 'warning',
      message: `Budget "${this.name}" is ${this.percentageUsed.toFixed(1)}% used`,
      threshold: this.alerts.thresholds.warning
    });
    this.alerts.lastWarningAlert = now;
  }
  
  // Critical threshold
  if (this.percentageUsed >= this.alerts.thresholds.critical && 
      this.percentageUsed <= 100 &&
      (!this.alerts.lastCriticalAlert || this.alerts.lastCriticalAlert < oneDayAgo)) {
    alertsToSend.push({
      type: 'critical',
      message: `Budget "${this.name}" is ${this.percentageUsed.toFixed(1)}% used - approaching limit`,
      threshold: this.alerts.thresholds.critical
    });
    this.alerts.lastCriticalAlert = now;
  }
  
  // Exceeded threshold
  if (this.percentageUsed > 100 && 
      this.alerts.thresholds.exceeded &&
      (!this.alerts.lastExceededAlert || this.alerts.lastExceededAlert < oneDayAgo)) {
    alertsToSend.push({
      type: 'exceeded',
      message: `Budget "${this.name}" has been exceeded by ${(this.percentageUsed - 100).toFixed(1)}%`,
      overage: this.spent - this.amount
    });
    this.alerts.lastExceededAlert = now;
  }
  
  if (alertsToSend.length > 0) {
    this.save();
  }
  
  return alertsToSend;
};

// Instance method to reset budget for new period
budgetSchema.methods.resetForNewPeriod = function(newStartDate, newEndDate) {
  const oldSpent = this.spent;
  
  // Handle rollover if enabled
  if (this.rollover.enabled) {
    if (this.rollover.type === 'unused_to_next' || this.rollover.type === 'both') {
      if (this.remaining > 0) {
        const rolloverAmount = Math.min(
          this.remaining,
          this.amount * (this.rollover.maxRolloverPercentage / 100)
        );
        this.amount += rolloverAmount;
      }
    }
  }
  
  // Reset tracking fields
  this.spent = 0;
  this.percentageUsed = 0;
  this.remaining = this.amount;
  this.startDate = newStartDate;
  this.endDate = newEndDate;
  
  // Reset category spending
  if (this.categories && this.categories.length > 0) {
    this.categories.forEach(cat => {
      cat.spentAmount = 0;
      cat.remainingAmount = cat.allocatedAmount;
    });
  }
  
  // Reset alert timestamps
  this.alerts.lastWarningAlert = undefined;
  this.alerts.lastCriticalAlert = undefined;
  this.alerts.lastExceededAlert = undefined;
  
  // Add to history
  this.history.push({
    date: new Date(),
    action: 'period_reset',
    details: {
      previousSpent: oldSpent,
      newPeriod: {
        startDate: newStartDate,
        endDate: newEndDate
      }
    },
    note: `Budget reset for new period`
  });
  
  return this.save();
};

// Static method to get active budgets for user
budgetSchema.statics.getActiveBudgets = function(userId) {
  const now = new Date();
  return this.find({
    user: userId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('categories.category');
};

// Static method to get budget summary for user
budgetSchema.statics.getBudgetSummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      }
    },
    {
      $group: {
        _id: '$type',
        totalBudgeted: { $sum: '$amount' },
        totalSpent: { $sum: '$spent' },
        count: { $sum: 1 },
        avgUtilization: { $avg: '$percentageUsed' }
      }
    }
  ]);
};

module.exports = mongoose.model('Budget', budgetSchema);
