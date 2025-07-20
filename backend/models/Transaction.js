const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Transaction must belong to a user'],
    index: true
  },
  
  // Basic transaction information
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    validate: {
      validator: function(value) {
        return value !== 0;
      },
      message: 'Transaction amount cannot be zero'
    }
  },
  type: {
    type: String,
    enum: {
      values: ['income', 'expense', 'transfer'],
      message: 'Transaction type must be income, expense, or transfer'
    },
    required: [true, 'Transaction type is required'],
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Transaction category is required'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Subcategory cannot exceed 100 characters']
  },
  
  // Description and notes
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Date and timing
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    index: true,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  
  // Payment method and account information
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'mobile_money', 'cheque', 'other'],
      message: 'Invalid payment method'
    },
    required: [true, 'Payment method is required'],
    index: true
  },
  accountNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Account number cannot exceed 50 characters']
  },
  referenceNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference number cannot exceed 100 characters'],
    index: true
  },
  
  // Location information
  location: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Location name cannot exceed 200 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  
  // Currency and exchange rate
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'],
    required: [true, 'Currency is required'],
    default: 'KES'
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate must be positive']
  },
  baseCurrencyAmount: {
    type: Number,
    required: true
  },
  
  // Recurring transaction information
  isRecurring: {
    type: Boolean,
    default: false,
    index: true
  },
  recurringInfo: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: function() { return this.isRecurring; }
    },
    interval: {
      type: Number,
      min: 1,
      default: 1,
      required: function() { return this.isRecurring; }
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value > this.date;
        },
        message: 'Recurring end date must be after transaction date'
      }
    },
    nextDueDate: {
      type: Date,
      index: true
    },
    parentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  },
  
  // Budget tracking
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    index: true
  },
  budgetImpact: {
    type: Number,
    default: 0
  },
  
  // Status and flags
  status: {
    type: String,
    enum: {
      values: ['completed', 'pending', 'cancelled', 'failed'],
      message: 'Invalid transaction status'
    },
    default: 'completed',
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  isFlagged: {
    type: Boolean,
    default: false,
    index: true
  },
  flagReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Flag reason cannot exceed 200 characters']
  },
  
  // Attachments and receipts
  attachments: [{
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags for better organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'api', 'recurring', 'bank_sync'],
      default: 'manual'
    },
    importBatchId: {
      type: String,
      trim: true
    },
    originalData: {
      type: mongoose.Schema.Types.Mixed
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'not_applicable'],
      default: 'not_applicable'
    },
    lastSyncAt: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Convert amount to absolute value for display
      ret.displayAmount = Math.abs(ret.amount);
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, status: 1, date: -1 });
transactionSchema.index({ user: 1, isRecurring: 1, 'recurringInfo.nextDueDate': 1 });
transactionSchema.index({ user: 1, budget: 1, date: -1 });
transactionSchema.index({ referenceNumber: 1 }, { sparse: true });
transactionSchema.index({ 'metadata.importBatchId': 1 }, { sparse: true });

// Virtual for absolute amount (for display purposes)
transactionSchema.virtual('absoluteAmount').get(function() {
  return Math.abs(this.amount);
});

// Virtual for transaction direction
transactionSchema.virtual('direction').get(function() {
  if (this.type === 'income') return 'inflow';
  if (this.type === 'expense') return 'outflow';
  return 'transfer';
});

// Virtual for formatted amount with currency
transactionSchema.virtual('formattedAmount').get(function() {
  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: this.currency || 'KES'
  });
  return formatter.format(Math.abs(this.amount));
});

// Pre-save middleware to calculate base currency amount
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('exchangeRate')) {
    this.baseCurrencyAmount = this.amount * (this.exchangeRate || 1);
  }
  next();
});

// Pre-save middleware to set next due date for recurring transactions
transactionSchema.pre('save', function(next) {
  if (this.isRecurring && this.recurringInfo && this.isModified('recurringInfo.frequency')) {
    const nextDate = new Date(this.date);
    
    switch (this.recurringInfo.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (this.recurringInfo.interval || 1));
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * (this.recurringInfo.interval || 1)));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + (this.recurringInfo.interval || 1));
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * (this.recurringInfo.interval || 1)));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + (this.recurringInfo.interval || 1));
        break;
    }
    
    this.recurringInfo.nextDueDate = nextDate;
  }
  next();
});

// Pre-save middleware to validate and process tags
transactionSchema.pre('save', function(next) {
  if (this.tags && this.tags.length > 0) {
    // Remove duplicates and clean tags
    this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase().trim()))];
    
    // Limit to maximum 10 tags
    if (this.tags.length > 10) {
      this.tags = this.tags.slice(0, 10);
    }
  }
  next();
});

// Instance method to duplicate transaction for recurring
transactionSchema.methods.createRecurringTransaction = function() {
  const nextTransaction = new this.constructor({
    user: this.user,
    amount: this.amount,
    type: this.type,
    category: this.category,
    subcategory: this.subcategory,
    description: this.description,
    notes: this.notes,
    date: this.recurringInfo.nextDueDate,
    paymentMethod: this.paymentMethod,
    accountNumber: this.accountNumber,
    currency: this.currency,
    exchangeRate: this.exchangeRate,
    isRecurring: this.isRecurring,
    recurringInfo: {
      ...this.recurringInfo,
      parentTransactionId: this.recurringInfo.parentTransactionId || this._id
    },
    budget: this.budget,
    tags: [...this.tags],
    metadata: {
      source: 'recurring',
      originalData: {
        parentTransactionId: this._id
      }
    }
  });
  
  return nextTransaction;
};

// Instance method to flag transaction
transactionSchema.methods.flag = function(reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  return this.save();
};

// Instance method to unflag transaction
transactionSchema.methods.unflag = function() {
  this.isFlagged = false;
  this.flagReason = undefined;
  return this.save();
};

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$baseCurrencyAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$baseCurrencyAmount' }
      }
    }
  ]);
};

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
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
      $unwind: '$categoryInfo'
    },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryInfo.name' },
        categoryIcon: { $first: '$categoryInfo.icon' },
        totalAmount: { $sum: { $abs: '$baseCurrencyAmount' } },
        count: { $sum: 1 },
        avgAmount: { $avg: { $abs: '$baseCurrencyAmount' } }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
