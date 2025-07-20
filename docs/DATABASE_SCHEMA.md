# CashCompass - Database Schema Documentation

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))  
**Project:** Personal Finance Management Application  
**Database:** MongoDB  
**Version:** 1.0  
**Last Updated:** July 2025  

---

## 📋 Database Overview

CashCompass uses MongoDB as the primary database with Mongoose ODM for schema validation and relationships. The database is designed for optimal performance with proper indexing and data relationships.

### 🏗️ Database Architecture
- **Database Name:** `cashcompass`
- **Collections:** 4 primary collections
- **Relationships:** User-centric with referential integrity
- **Indexing Strategy:** Compound indexes for optimal query performance
- **Data Validation:** Schema-level validation with Mongoose

---

## 👤 User Collection

### Collection Name: `users`

The User collection stores user account information, authentication data, and preferences.

#### Schema Definition:
```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never return password in queries
  },
  
  profilePicture: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Profile picture must be a valid URL'
    }
  },
  
  preferences: {
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'KES'],
      default: 'USD'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de'],
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    budgetAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

#### Indexes:
```javascript
// Unique index on email for fast user lookup
userSchema.index({ email: 1 }, { unique: true });

// Compound index for active users
userSchema.index({ isActive: 1, email: 1 });

// Index for password reset token lookup
userSchema.index({ passwordResetToken: 1 });
```

#### Middleware:
```javascript
// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update lastLogin on authentication
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  next();
});
```

#### Virtual Fields:
```javascript
// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    preferences: this.preferences
  };
});
```

#### Sample Document:
```json
{
  "_id": "64a7b8c9d12e3f4567890123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "$2b$12$hash...", // bcrypt hashed
  "profilePicture": null,
  "preferences": {
    "currency": "USD",
    "theme": "dark",
    "language": "en",
    "notifications": true,
    "budgetAlerts": true
  },
  "isEmailVerified": true,
  "lastLogin": "2025-07-20T10:30:00.000Z",
  "isActive": true,
  "createdAt": "2025-01-15T08:00:00.000Z",
  "updatedAt": "2025-07-20T10:30:00.000Z"
}
```

---

## 💰 Transaction Collection

### Collection Name: `transactions`

The Transaction collection stores all financial transactions (income and expenses) for users.

#### Schema Definition:
```javascript
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    minlength: [2, 'Category must be at least 2 characters'],
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000, 'Amount cannot exceed 1,000,000'],
    validate: {
      validator: function(v) {
        return /^\d+(\.\d{1,2})?$/.test(v.toString());
      },
      message: 'Amount can have maximum 2 decimal places'
    }
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'bank', 'digital', 'check', 'other'],
      message: 'Invalid payment method'
    },
    default: 'card'
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  
  receiptUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Receipt URL must be valid'
    }
  },
  
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'],
      required: function() {
        return this.recurring.isRecurring;
      }
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(v) {
          return !this.recurring.isRecurring || (v && v > this.date);
        },
        message: 'End date must be after transaction date for recurring transactions'
      }
    },
    nextDue: {
      type: Date
    }
  },
  
  budgetImpact: {
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget'
    },
    categoryBudgetUsed: {
      type: Number,
      min: 0
    }
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

#### Indexes:
```javascript
// Compound index for user transactions with date sorting
transactionSchema.index({ userId: 1, date: -1 });

// Compound index for category filtering
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Compound index for type filtering
transactionSchema.index({ userId: 1, type: 1, date: -1 });

// Index for amount range queries
transactionSchema.index({ userId: 1, amount: 1 });

// Text index for description search
transactionSchema.index({ description: 'text', category: 'text' });

// Index for recurring transactions
transactionSchema.index({ 
  'recurring.isRecurring': 1, 
  'recurring.nextDue': 1 
});
```

#### Virtual Fields:
```javascript
// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD' // This would come from user preferences
  }).format(this.amount);
});

// Virtual for days ago
transactionSchema.virtual('daysAgo').get(function() {
  return Math.floor((new Date() - this.date) / (1000 * 60 * 60 * 24));
});
```

#### Middleware:
```javascript
// Update budget spending when transaction is saved
transactionSchema.post('save', async function() {
  if (this.type === 'expense') {
    await updateBudgetSpending(this.userId, this.category, this.amount);
  }
});

// Soft delete implementation
transactionSchema.pre(/^find/, function() {
  this.find({ isDeleted: { $ne: true } });
});
```

#### Sample Document:
```json
{
  "_id": "64a7b8c9d12e3f4567890124",
  "userId": "64a7b8c9d12e3f4567890123",
  "type": "expense",
  "category": "Food",
  "amount": 25.50,
  "description": "Lunch at downtown cafe",
  "date": "2025-07-20T12:00:00.000Z",
  "paymentMethod": "card",
  "tags": ["lunch", "cafe"],
  "location": "Downtown Cafe",
  "recurring": {
    "isRecurring": false
  },
  "budgetImpact": {
    "budgetId": "64a7b8c9d12e3f4567890126",
    "categoryBudgetUsed": 650.50
  },
  "isDeleted": false,
  "createdAt": "2025-07-20T12:30:00.000Z",
  "updatedAt": "2025-07-20T12:30:00.000Z"
}
```

---

## 📊 Budget Collection

### Collection Name: `budgets`

The Budget collection stores monthly budget allocations and tracking information.

#### Schema Definition:
```javascript
const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  month: {
    type: String,
    required: [true, 'Month is required'],
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    validate: {
      validator: function(v) {
        const [year, month] = v.split('-');
        const date = new Date(year, month - 1);
        return date instanceof Date && !isNaN(date);
      },
      message: 'Invalid month format'
    }
  },
  
  categories: [{
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    limit: {
      type: Number,
      required: [true, 'Category limit is required'],
      min: [0, 'Category limit cannot be negative'],
      max: [100000, 'Category limit cannot exceed 100,000']
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    },
    alertThreshold: {
      type: Number,
      min: [1, 'Alert threshold must be at least 1%'],
      max: [100, 'Alert threshold cannot exceed 100%'],
      default: 80
    },
    _id: false // Disable automatic _id generation for subdocuments
  }],
  
  totalBudget: {
    type: Number,
    min: [0, 'Total budget cannot be negative'],
    max: [1000000, 'Total budget cannot exceed 1,000,000']
  },
  
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  rolloverEnabled: {
    type: Boolean,
    default: false
  },
  
  rolloverAmount: {
    type: Number,
    default: 0,
    validate: {
      validator: function(v) {
        return !this.rolloverEnabled || v >= 0;
      },
      message: 'Rollover amount must be non-negative when enabled'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

#### Indexes:
```javascript
// Unique compound index to prevent duplicate budgets per user per month
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

// Index for active budgets
budgetSchema.index({ userId: 1, isActive: 1 });

// Index for month queries
budgetSchema.index({ month: 1 });
```

#### Virtual Fields:
```javascript
// Virtual for remaining budget
budgetSchema.virtual('remainingBudget').get(function() {
  return this.totalBudget - this.totalSpent;
});

// Virtual for budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  return this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) * 100 : 0;
});

// Virtual for categories with calculated fields
budgetSchema.virtual('categoriesWithStats').get(function() {
  return this.categories.map(category => ({
    ...category.toObject(),
    remaining: category.limit - category.spent,
    utilizationPercentage: category.limit > 0 ? (category.spent / category.limit) * 100 : 0,
    status: getBudgetStatus(category.spent, category.limit, category.alertThreshold)
  }));
});
```

#### Middleware:
```javascript
// Calculate total budget before saving
budgetSchema.pre('save', function(next) {
  this.totalBudget = this.categories.reduce((sum, cat) => sum + cat.limit, 0);
  next();
});

// Validate unique month per user
budgetSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne({
      userId: this.userId,
      month: this.month
    });
    if (existing) {
      throw new Error('Budget already exists for this month');
    }
  }
  next();
});
```

#### Sample Document:
```json
{
  "_id": "64a7b8c9d12e3f4567890126",
  "userId": "64a7b8c9d12e3f4567890123",
  "month": "2025-07",
  "categories": [
    {
      "name": "Food",
      "limit": 800.00,
      "spent": 650.00,
      "alertThreshold": 80
    },
    {
      "name": "Transport",
      "limit": 300.00,
      "spent": 250.00,
      "alertThreshold": 75
    },
    {
      "name": "Entertainment",
      "limit": 200.00,
      "spent": 150.00,
      "alertThreshold": 85
    }
  ],
  "totalBudget": 1300.00,
  "totalSpent": 1050.00,
  "notes": "Increased food budget for July due to vacation",
  "isActive": true,
  "rolloverEnabled": false,
  "rolloverAmount": 0,
  "createdAt": "2025-07-01T00:00:00.000Z",
  "updatedAt": "2025-07-20T14:30:00.000Z"
}
```

---

## 🏷️ Category Collection

### Collection Name: `categories`

The Category collection stores both default system categories and user-created custom categories.

#### Schema Definition:
```javascript
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Category type must be either income or expense'
    }
  },
  
  icon: {
    type: String,
    trim: true,
    maxlength: [50, 'Icon name cannot exceed 50 characters'],
    default: 'circle'
  },
  
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color'],
    default: '#6b7280'
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  isDefault: {
    type: Boolean,
    default: false,
    immutable: true // Cannot be changed after creation
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(v) {
        // If it's a default category, userId should be null
        // If it's a custom category, userId is required
        return this.isDefault ? !v : !!v;
      },
      message: 'Default categories should not have userId, custom categories require userId'
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  
  lastUsed: {
    type: Date
  },
  
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

#### Indexes:
```javascript
// Compound index for user categories
categorySchema.index({ userId: 1, type: 1, isActive: 1 });

// Index for default categories
categorySchema.index({ isDefault: 1, type: 1, isActive: 1 });

// Text index for category search
categorySchema.index({ name: 'text', description: 'text' });

// Index for sorting
categorySchema.index({ type: 1, sortOrder: 1, name: 1 });

// Unique index for default category names
categorySchema.index(
  { name: 1, type: 1, isDefault: 1 },
  { 
    unique: true,
    partialFilterExpression: { isDefault: true }
  }
);

// Unique index for user custom category names
categorySchema.index(
  { name: 1, type: 1, userId: 1 },
  { 
    unique: true,
    partialFilterExpression: { isDefault: false }
  }
);
```

#### Virtual Fields:
```javascript
// Virtual for category hierarchy
categorySchema.virtual('fullPath').get(function() {
  return this.parentCategory ? 
    `${this.parentCategory.name} > ${this.name}` : 
    this.name;
});

// Virtual for usage statistics
categorySchema.virtual('usageStats').get(function() {
  return {
    count: this.usageCount,
    lastUsed: this.lastUsed,
    isPopular: this.usageCount > 10
  };
});
```

#### Middleware:
```javascript
// Update usage count when category is used
categorySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Validate parent-child relationship
categorySchema.pre('save', function(next) {
  if (this.parentCategory && this.parentCategory.equals(this._id)) {
    throw new Error('Category cannot be its own parent');
  }
  next();
});
```

#### Sample Documents:

**Default Category:**
```json
{
  "_id": "64a7b8c9d12e3f4567890128",
  "name": "Food",
  "type": "expense",
  "icon": "utensils",
  "color": "#f59e0b",
  "description": "Food and dining expenses",
  "isDefault": true,
  "userId": null,
  "isActive": true,
  "sortOrder": 1,
  "usageCount": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Custom Category:**
```json
{
  "_id": "64a7b8c9d12e3f4567890129",
  "name": "Pet Expenses",
  "type": "expense",
  "icon": "heart",
  "color": "#8b5cf6",
  "description": "Expenses for pet care and supplies",
  "isDefault": false,
  "userId": "64a7b8c9d12e3f4567890123",
  "isActive": true,
  "sortOrder": 0,
  "usageCount": 5,
  "lastUsed": "2025-07-15T10:00:00.000Z",
  "createdAt": "2025-07-01T09:00:00.000Z",
  "updatedAt": "2025-07-15T10:00:00.000Z"
}
```

---

## 🔗 Relationships and References

### User → Transactions (One-to-Many)
```javascript
// In Transaction schema
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}

// Population example
const userTransactions = await Transaction.find({ userId })
  .populate('userId', 'name email preferences.currency');
```

### User → Budgets (One-to-Many)
```javascript
// In Budget schema
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}

// Population example
const userBudgets = await Budget.find({ userId })
  .populate('userId', 'name preferences.currency');
```

### User → Categories (One-to-Many for custom categories)
```javascript
// In Category schema
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  validate: { /* custom validation */ }
}

// Get user categories (default + custom)
const categories = await Category.find({
  $or: [
    { isDefault: true },
    { userId: userId, isDefault: false }
  ]
});
```

### Budget → Transactions (Soft relationship via category and month)
```javascript
// Get transactions for a budget period
const budgetTransactions = await Transaction.find({
  userId: budget.userId,
  date: {
    $gte: new Date(`${budget.month}-01`),
    $lt: new Date(`${budget.month}-31`)
  },
  category: { $in: budget.categories.map(c => c.name) }
});
```

---

## 📈 Performance Optimization

### Index Strategy
1. **User Queries**: Compound indexes on `{ userId: 1, date: -1 }` for chronological data
2. **Category Filtering**: Indexes on `{ userId: 1, category: 1, date: -1 }`
3. **Amount Queries**: Indexes for range queries on amount fields
4. **Text Search**: Text indexes on description and category fields
5. **Unique Constraints**: Prevent duplicate data with unique compound indexes

### Query Optimization
```javascript
// Efficient transaction queries with proper indexing
const getTransactionsSummary = async (userId, startDate, endDate) => {
  return await Transaction.aggregate([
    {
      $match: {
        userId: ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: { 
          type: '$type',
          category: '$category'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};
```

### Pagination
```javascript
// Efficient pagination with proper indexing
const getPaginatedTransactions = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [transactions, total] = await Promise.all([
    Transaction.find({ userId, isDeleted: { $ne: true } })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(), // Use lean() for better performance when not modifying
    Transaction.countDocuments({ userId, isDeleted: { $ne: true } })
  ]);
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

---

## 🔒 Data Security and Validation

### Password Security
```javascript
// bcrypt configuration
const SALT_ROUNDS = 12;

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});
```

### Input Validation
```javascript
// Custom validators for financial data
const currencyValidator = {
  validator: function(v) {
    return /^\d+(\.\d{1,2})?$/.test(v.toString());
  },
  message: 'Amount must have maximum 2 decimal places'
};

// Sanitization middleware
const sanitizeInput = (schema) => {
  schema.pre('save', function(next) {
    // Sanitize string fields
    for (const key in this.toObject()) {
      if (typeof this[key] === 'string') {
        this[key] = this[key].trim();
      }
    }
    next();
  });
};
```

### Data Integrity
```javascript
// Referential integrity for transactions
transactionSchema.pre('save', async function(next) {
  // Verify user exists
  const user = await mongoose.model('User').findById(this.userId);
  if (!user) {
    throw new Error('Invalid user reference');
  }
  next();
});
```

---

## 📊 Aggregation Pipelines

### Monthly Spending Summary
```javascript
const getMonthlySpendingSummary = (userId, year) => {
  return Transaction.aggregate([
    {
      $match: {
        userId: ObjectId(userId),
        type: 'expense',
        date: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          category: '$category'
        },
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        categories: {
          $push: {
            category: '$_id.category',
            totalAmount: '$totalAmount',
            transactionCount: '$transactionCount',
            averageAmount: '$averageAmount'
          }
        },
        monthlyTotal: { $sum: '$totalAmount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};
```

### Budget Performance Analysis
```javascript
const getBudgetPerformance = (userId, months) => {
  return Budget.aggregate([
    {
      $match: {
        userId: ObjectId(userId),
        month: { $in: months }
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { 
          userId: '$userId', 
          month: '$month' 
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$userId'] },
                  { $eq: [
                    { $dateToString: { format: '%Y-%m', date: '$date' } },
                    '$$month'
                  ]},
                  { $eq: ['$type', 'expense'] }
                ]
              }
            }
          },
          {
            $group: {
              _id: '$category',
              actualSpent: { $sum: '$amount' },
              transactionCount: { $sum: 1 }
            }
          }
        ],
        as: 'actualSpending'
      }
    },
    {
      $project: {
        month: 1,
        totalBudget: 1,
        totalSpent: 1,
        categories: 1,
        actualSpending: 1,
        variance: { $subtract: ['$totalBudget', '$totalSpent'] },
        utilizationRate: {
          $cond: {
            if: { $gt: ['$totalBudget', 0] },
            then: { $multiply: [{ $divide: ['$totalSpent', '$totalBudget'] }, 100] },
            else: 0
          }
        }
      }
    }
  ]);
};
```

---

## 🚀 Migration Scripts

### Initial Default Categories
```javascript
const defaultCategories = [
  // Expense Categories
  { name: 'Food', type: 'expense', icon: 'utensils', color: '#f59e0b', sortOrder: 1 },
  { name: 'Transport', type: 'expense', icon: 'car', color: '#3b82f6', sortOrder: 2 },
  { name: 'Housing', type: 'expense', icon: 'home', color: '#8b5cf6', sortOrder: 3 },
  { name: 'Utilities', type: 'expense', icon: 'zap', color: '#f97316', sortOrder: 4 },
  { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#ef4444', sortOrder: 5 },
  { name: 'Entertainment', type: 'expense', icon: 'film', color: '#06b6d4', sortOrder: 6 },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899', sortOrder: 7 },
  { name: 'Education', type: 'expense', icon: 'book', color: '#8b5cf6', sortOrder: 8 },
  
  // Income Categories
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10b981', sortOrder: 1 },
  { name: 'Freelance', type: 'income', icon: 'user', color: '#059669', sortOrder: 2 },
  { name: 'Investments', type: 'income', icon: 'trending-up', color: '#0891b2', sortOrder: 3 },
  { name: 'Business', type: 'income', icon: 'building', color: '#7c3aed', sortOrder: 4 },
  { name: 'Other Income', type: 'income', icon: 'plus', color: '#6b7280', sortOrder: 5 }
];

const seedDefaultCategories = async () => {
  try {
    for (const category of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: category.name, type: category.type, isDefault: true },
        { ...category, isDefault: true },
        { upsert: true, new: true }
      );
    }
    console.log('Default categories seeded successfully');
  } catch (error) {
    console.error('Error seeding default categories:', error);
  }
};
```

---

## 📋 Backup and Recovery

### Backup Strategy
```javascript
// MongoDB dump command for backup
const backupCommand = `mongodump --uri="${process.env.MONGO_URI}" --out="/backups/$(date +%Y%m%d_%H%M%S)"`;

// Automated backup script
const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/backups/cashcompass_${timestamp}`;
  
  try {
    await exec(`mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`);
    console.log(`Backup created successfully at ${backupPath}`);
  } catch (error) {
    console.error('Backup failed:', error);
  }
};
```

### Data Recovery
```javascript
// MongoDB restore command
const restoreCommand = `mongorestore --uri="${process.env.MONGO_URI}" --drop /path/to/backup/directory`;
```

---

## 📊 Database Monitoring

### Performance Metrics
```javascript
// MongoDB profiling for slow queries
db.setProfilingLevel(2, { slowms: 100 });

// Index usage statistics
db.collection.aggregate([
  { $indexStats: {} }
]);

// Collection statistics
db.users.stats();
db.transactions.stats();
db.budgets.stats();
db.categories.stats();
```

### Health Checks
```javascript
const checkDatabaseHealth = async () => {
  try {
    // Check connection
    await mongoose.connection.db.admin().ping();
    
    // Check collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const requiredCollections = ['users', 'transactions', 'budgets', 'categories'];
    const missing = requiredCollections.filter(
      name => !collections.find(col => col.name === name)
    );
    
    if (missing.length > 0) {
      throw new Error(`Missing collections: ${missing.join(', ')}`);
    }
    
    console.log('Database health check passed');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
```

---

This comprehensive database schema documentation provides the foundation for CashCompass's data layer, ensuring optimal performance, data integrity, and scalability.

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))
