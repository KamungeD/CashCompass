const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Visual representation
  icon: {
    type: String,
    trim: true,
    maxlength: [50, 'Icon identifier cannot exceed 50 characters'],
    default: 'default'
  },
  color: {
    type: String,
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    default: '#6B7280'
  },
  
  // Category type and classification
  type: {
    type: String,
    enum: {
      values: ['income', 'expense', 'both'],
      message: 'Category type must be income, expense, or both'
    },
    required: [true, 'Category type is required'],
    index: true
  },
  
  // Hierarchy and organization
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  level: {
    type: Number,
    min: [0, 'Category level cannot be negative'],
    max: [3, 'Category level cannot exceed 3'],
    default: 0,
    index: true
  },
  path: {
    type: String,
    trim: true,
    index: true
  },
  
  // User and system categories
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Budget integration
  defaultBudgetAmount: {
    type: Number,
    min: [0, 'Default budget amount cannot be negative'],
    default: 0
  },
  budgetPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  // Usage statistics
  usage: {
    transactionCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: null
    },
    averageAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Subcategories
  subcategories: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Subcategory name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Subcategory description cannot exceed 300 characters']
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Subcategory icon cannot exceed 50 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usage: {
      transactionCount: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      lastUsed: { type: Date, default: null }
    }
  }],
  
  // Category limits and rules
  limits: {
    dailyLimit: {
      type: Number,
      min: 0,
      default: null
    },
    weeklyLimit: {
      type: Number,
      min: 0,
      default: null
    },
    monthlyLimit: {
      type: Number,
      min: 0,
      default: null
    },
    yearlyLimit: {
      type: Number,
      min: 0,
      default: null
    }
  },
  
  // Alerts and notifications
  alerts: {
    enabled: {
      type: Boolean,
      default: false
    },
    thresholdPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    notificationMethods: [{
      type: String,
      enum: ['email', 'push', 'sms']
    }]
  },
  
  // Tags and keywords
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  keywords: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Keyword cannot exceed 50 characters']
  }],
  
  // Metadata
  metadata: {
    createdBy: {
      type: String,
      enum: ['user', 'system', 'import'],
      default: 'user'
    },
    source: {
      type: String,
      trim: true,
      maxlength: [100, 'Source cannot exceed 100 characters']
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Add computed fields for frontend
      ret.hasSubcategories = ret.subcategories && ret.subcategories.length > 0;
      ret.activeSubcategories = ret.subcategories ? ret.subcategories.filter(sub => sub.isActive) : [];
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
categorySchema.index({ name: 1, user: 1 }, { unique: true });
categorySchema.index({ type: 1, isActive: 1 });
categorySchema.index({ user: 1, isActive: 1 });
categorySchema.index({ parentCategory: 1, level: 1 });
categorySchema.index({ isSystem: 1, type: 1 });
categorySchema.index({ 'usage.transactionCount': -1 });
categorySchema.index({ 'usage.lastUsed': -1 });
categorySchema.index({ path: 1 });

// Virtual for full path display
categorySchema.virtual('fullPath').get(function() {
  if (this.path) {
    return this.path.split('/').join(' > ');
  }
  return this.name;
});

// Virtual for hierarchy depth
categorySchema.virtual('depth').get(function() {
  return this.level;
});

// Virtual for usage rate (transactions per month since creation)
categorySchema.virtual('usageRate').get(function() {
  if (!this.createdAt || this.usage.transactionCount === 0) return 0;
  
  const monthsSinceCreation = Math.max(1, 
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  return this.usage.transactionCount / monthsSinceCreation;
});

// Pre-save middleware to build category path
categorySchema.pre('save', async function(next) {
  if (this.isModified('parentCategory') || this.isModified('name') || this.isNew) {
    await this.buildPath();
  }
  next();
});

// Pre-save middleware to validate hierarchy
categorySchema.pre('save', async function(next) {
  try {
    if (this.parentCategory) {
      const parent = await this.constructor.findById(this.parentCategory);
      if (!parent) {
        return next(new Error('Parent category not found'));
      }
      
      if (parent.level >= 2) {
        return next(new Error('Categories can only be nested 3 levels deep'));
      }
      
      // Check for circular reference
      if (await this.hasCircularReference()) {
        return next(new Error('Circular reference detected in category hierarchy'));
      }
      
      this.level = parent.level + 1;
    } else {
      this.level = 0;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to clean and validate tags
categorySchema.pre('save', function(next) {
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase().trim()))];
    if (this.tags.length > 20) {
      this.tags = this.tags.slice(0, 20);
    }
  }
  
  if (this.keywords && this.keywords.length > 0) {
    this.keywords = [...new Set(this.keywords.map(keyword => keyword.toLowerCase().trim()))];
    if (this.keywords.length > 50) {
      this.keywords = this.keywords.slice(0, 50);
    }
  }
  
  next();
});

// Instance method to build category path
categorySchema.methods.buildPath = async function() {
  const path = [];
  let current = this;
  
  while (current) {
    path.unshift(current.name);
    if (current.parentCategory && current.parentCategory.toString() !== current._id.toString()) {
      current = await this.constructor.findById(current.parentCategory);
    } else {
      current = null;
    }
  }
  
  this.path = path.join('/');
  return this.path;
};

// Instance method to check for circular references
categorySchema.methods.hasCircularReference = async function() {
  if (!this.parentCategory) return false;
  
  const visited = new Set();
  let current = this.parentCategory;
  
  while (current && !visited.has(current.toString())) {
    if (current.toString() === this._id.toString()) {
      return true;
    }
    
    visited.add(current.toString());
    const parent = await this.constructor.findById(current);
    current = parent ? parent.parentCategory : null;
  }
  
  return false;
};

// Instance method to get all child categories
categorySchema.methods.getChildren = function() {
  return this.constructor.find({ parentCategory: this._id, isActive: true });
};

// Instance method to get all descendants
categorySchema.methods.getDescendants = function() {
  return this.constructor.find({ 
    path: new RegExp(`^${this.path}/`),
    isActive: true 
  });
};

// Instance method to update usage statistics
categorySchema.methods.updateUsage = function(amount, isIncrease = true) {
  if (isIncrease) {
    this.usage.transactionCount += 1;
    this.usage.totalAmount += Math.abs(amount);
    this.usage.lastUsed = new Date();
    this.usage.averageAmount = this.usage.totalAmount / this.usage.transactionCount;
  } else {
    this.usage.transactionCount = Math.max(0, this.usage.transactionCount - 1);
    this.usage.totalAmount = Math.max(0, this.usage.totalAmount - Math.abs(amount));
    this.usage.averageAmount = this.usage.transactionCount > 0 
      ? this.usage.totalAmount / this.usage.transactionCount 
      : 0;
  }
  
  return this.save();
};

// Instance method to add subcategory
categorySchema.methods.addSubcategory = function(subcategoryData) {
  const subcategory = {
    name: subcategoryData.name,
    description: subcategoryData.description || '',
    icon: subcategoryData.icon || 'default',
    isActive: true,
    usage: {
      transactionCount: 0,
      totalAmount: 0,
      lastUsed: null
    }
  };
  
  this.subcategories.push(subcategory);
  return this.save();
};

// Instance method to remove subcategory
categorySchema.methods.removeSubcategory = function(subcategoryId) {
  this.subcategories = this.subcategories.filter(
    sub => sub._id.toString() !== subcategoryId.toString()
  );
  return this.save();
};

// Static method to get category tree for user
categorySchema.statics.getCategoryTree = function(userId, type = null) {
  const query = {
    $or: [
      { user: userId },
      { isSystem: true }
    ],
    isActive: true,
    level: 0
  };
  
  if (type) {
    query.$and = [
      { $or: [{ type: type }, { type: 'both' }] }
    ];
  }
  
  return this.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'categories',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$parentCategory', '$$categoryId'] },
              isActive: true
            }
          },
          {
            $lookup: {
              from: 'categories',
              let: { subcategoryId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$parentCategory', '$$subcategoryId'] },
                    isActive: true
                  }
                }
              ],
              as: 'children'
            }
          }
        ],
        as: 'children'
      }
    },
    { $sort: { 'usage.transactionCount': -1, name: 1 } }
  ]);
};

// Static method to get popular categories for user
categorySchema.statics.getPopularCategories = function(userId, type = null, limit = 10) {
  const query = {
    $or: [
      { user: userId },
      { isSystem: true }
    ],
    isActive: true,
    'usage.transactionCount': { $gt: 0 }
  };
  
  if (type) {
    query.$and = [
      { $or: [{ type: type }, { type: 'both' }] }
    ];
  }
  
  return this.find(query)
    .sort({ 'usage.transactionCount': -1, 'usage.lastUsed': -1 })
    .limit(limit);
};

// Static method to search categories
categorySchema.statics.searchCategories = function(userId, searchTerm, type = null) {
  const query = {
    $or: [
      { user: userId },
      { isSystem: true }
    ],
    isActive: true,
    $and: [
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          { keywords: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };
  
  if (type) {
    query.$and.push({
      $or: [{ type: type }, { type: 'both' }]
    });
  }
  
  return this.find(query).sort({ 'usage.transactionCount': -1, name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);
