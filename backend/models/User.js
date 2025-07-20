const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  // Financial Preferences
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'],
    default: 'KES'
  },
  timezone: {
    type: String,
    default: 'Africa/Nairobi'
  },
  language: {
    type: String,
    enum: ['en', 'sw'],
    default: 'en'
  },
  
  // Financial Goals
  monthlyIncomeTarget: {
    type: Number,
    min: [0, 'Monthly income target cannot be negative'],
    default: 0
  },
  monthlySavingsTarget: {
    type: Number,
    min: [0, 'Monthly savings target cannot be negative'],
    default: 0
  },
  
  // Account Settings
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockUntil: {
    type: Date
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  passwordChangedAt: {
    type: Date,
    select: false
  },
  
  // Email Verification
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        transactionAlerts: { type: Boolean, default: true },
        budgetAlerts: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        monthlyReports: { type: Boolean, default: true },
        securityAlerts: { type: Boolean, default: true }
      },
      push: {
        transactionAlerts: { type: Boolean, default: false },
        budgetAlerts: { type: Boolean, default: false },
        weeklyReports: { type: Boolean, default: false },
        monthlyReports: { type: Boolean, default: false }
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['private', 'friends', 'public'],
        default: 'private'
      },
      dataSharing: { type: Boolean, default: false },
      analyticsTracking: { type: Boolean, default: true }
    },
    dashboard: {
      defaultTimeRange: {
        type: String,
        enum: ['7d', '30d', '90d', '1y'],
        default: '30d'
      },
      defaultCurrency: { type: String, default: 'KES' },
      widgetOrder: {
        type: [String],
        default: ['balance', 'expenses', 'income', 'budget', 'savings']
      }
    }
  },
  
  // Statistics (computed fields)
  statistics: {
    totalTransactions: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    totalBudgets: { type: Number, default: 0 },
    lastTransactionDate: { type: Date },
    averageMonthlyIncome: { type: Number, default: 0 },
    averageMonthlyExpenses: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.twoFactorSecret;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'statistics.lastTransactionDate': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for current balance (will be calculated from transactions)
userSchema.virtual('currentBalance').get(function() {
  return this.statistics.totalIncome - this.statistics.totalExpenses;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set password changed timestamp
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to handle timing issues
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update statistics
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statistics = {
      totalTransactions: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalBudgets: 0,
      lastTransactionDate: null,
      averageMonthlyIncome: 0,
      averageMonthlyExpenses: 0
    };
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'CashCompass',
      audience: 'CashCompass-Users'
    }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
      issuer: 'CashCompass',
      audience: 'CashCompass-Users'
    }
  );
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiration (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  // Return unhashed token
  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  // Generate random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expiration (24 hours)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // Return unhashed token
  return verificationToken;
};

// Instance method to handle failed login attempts
userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method to find user by reset token
userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

// Static method to find user by email verification token
userSchema.statics.findByEmailVerificationToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

module.exports = mongoose.model('User', userSchema);
