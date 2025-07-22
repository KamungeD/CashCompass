const mongoose = require('mongoose');
const { Budget, Category, Transaction } = require('../models');
const { ErrorResponse } = require('../middleware/errorHandler');

// Helper function to find or create category by name
const findOrCreateCategoryByName = async (categoryName, categoryType, userId) => {
  // First try to find existing category by name
  let category = await Category.findOne({
    name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
    $or: [
      { user: userId },
      { isSystem: true }
    ]
  });

  if (!category) {
    // Create new category if it doesn't exist
    category = await Category.create({
      name: categoryName.toLowerCase(),
      type: categoryType,
      user: userId,
      icon: getCategoryIcon(categoryName),
      color: getCategoryColor(categoryName)
    });
  }

  return category;
};

// Helper function to get category icon based on name
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    'food': '🍕',
    'transport': '🚗',
    'utilities': '💡',
    'entertainment': '🎬',
    'shopping': '🛍️',
    'healthcare': '🏥',
    'rent': '🏠',
    'insurance': '🛡️',
    'education': '📚',
    'travel': '✈️',
    'business': '💼',
    'other': '📝'
  };
  return iconMap[categoryName.toLowerCase()] || '📝';
};

// Helper function to get category color based on name
const getCategoryColor = (categoryName) => {
  const colorMap = {
    'food': '#10b981',
    'transport': '#3b82f6',
    'utilities': '#f59e0b',
    'entertainment': '#8b5cf6',
    'shopping': '#ef4444',
    'healthcare': '#06b6d4',
    'rent': '#84cc16',
    'insurance': '#6366f1',
    'education': '#14b8a6',
    'travel': '#f97316',
    'business': '#0d9488',
    'other': '#6b7280'
  };
  return colorMap[categoryName.toLowerCase()] || '#6b7280';
};

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    console.log('📊 Get budgets request received');
    console.log('👤 User ID:', req.user._id);
    console.log('🔍 Query params:', req.query);
    
    const {
      page = 1,
      limit = 10,
      status,
      type,
      period,
      active = 'false', // Changed default to false to get all budgets
      sort = '-createdAt'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (type) query.type = type;
    if (period) query.period = period;

    // Filter for active budgets (current or future) - only if explicitly requested
    if (active === 'true') {
      const now = new Date();
      query.$or = [
        { status: 'active', endDate: { $gte: now } },
        { status: 'active', startDate: { $lte: now }, endDate: { $gte: now } }
      ];
    }
    
    console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2));

    const budgets = await Budget.find(query)
      .populate('categories.category', 'name icon color type')
      .populate('sharing.sharedWith.user', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    console.log('📋 Found budgets count:', budgets.length);
    console.log('📋 Total budgets in DB for user:', total);
    console.log('📋 Budget data sample:', budgets.length > 0 ? budgets[0] : 'No budgets found');

    res.status(200).json({
      success: true,
      data: {
        budgets,
        pagination: {
          current: parseInt(page),
          pages: totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get active budgets for user
// @route   GET /api/budgets/active
// @access  Private
const getActiveBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.getActiveBudgets(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        budgets
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('categories.category', 'name icon color type')
      .populate('sharing.sharedWith.user', 'firstName lastName email');

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    // Check for alerts
    const alerts = budget.checkAlerts();

    res.status(200).json({
      success: true,
      data: {
        budget: {
          ...budget.toObject(),
          alerts
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
  try {
    console.log('📋 Budget creation request received');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user._id);
    
    // Check if budget name already exists for user
    const existingBudget = await Budget.findOne({
      name: req.body.name,
      user: req.user._id
    });

    if (existingBudget) {
      // Suggest an alternative name
      const timestamp = new Date().getTime();
      const alternativeName = `${req.body.name} (${timestamp})`;
      
      console.log('❌ Budget name already exists:', req.body.name);
      return next(new ErrorResponse(
        `Budget with name "${req.body.name}" already exists. Try a different name or use: "${alternativeName}"`, 
        400
      ));
    }

    // Validate required fields
    if (!req.body.name || !req.body.amount || !req.body.startDate || !req.body.endDate) {
      console.log('❌ Missing required fields:', {
        name: !!req.body.name,
        amount: !!req.body.amount,
        startDate: !!req.body.startDate,
        endDate: !!req.body.endDate
      });
      return next(new ErrorResponse('Missing required fields: name, amount, startDate, endDate', 400));
    }

    // Process categories - handle both ObjectId and name-based categories
    let processedCategories = [];
    
    if (req.body.categories && req.body.categories.length > 0) {
      for (const categoryData of req.body.categories) {
        let category;
        
        // Check if category is provided as ObjectId or name
        if (mongoose.Types.ObjectId.isValid(categoryData.category)) {
          // Handle ObjectId-based category
          category = await Category.findOne({
            _id: categoryData.category,
            $or: [
              { user: req.user._id },
              { isSystem: true }
            ]
          });
          
          if (!category) {
            return next(new ErrorResponse(`Category ${categoryData.category} not found`, 404));
          }
        } else if (categoryData.name) {
          // Handle name-based category (from frontend form)
          category = await findOrCreateCategoryByName(
            categoryData.name, 
            req.body.type || 'expense', 
            req.user._id
          );
        } else {
          return next(new ErrorResponse('Category must have either category ID or name', 400));
        }

        // Check if category type matches budget type
        if (req.body.type === 'expense' && category.type === 'income') {
          return next(new ErrorResponse(`Category ${category.name} is for income, but budget is for expenses`, 400));
        }
        if (req.body.type === 'income' && category.type === 'expense') {
          return next(new ErrorResponse(`Category ${category.name} is for expenses, but budget is for income`, 400));
        }

        processedCategories.push({
          category: category._id,
          allocatedAmount: categoryData.allocatedAmount,
          spentAmount: 0,
          remainingAmount: categoryData.allocatedAmount
        });
      }
    }

    // Create budget with processed categories
    const budgetData = {
      ...req.body,
      categories: processedCategories,
      user: req.user._id
    };

    const budget = await Budget.create(budgetData);

    // Populate the created budget
    const populatedBudget = await Budget.findById(budget._id)
      .populate('categories.category', 'name icon color type');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: {
        budget: populatedBudget
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  try {
    console.log('🔄 Update budget request received');
    console.log('📊 Budget ID:', req.params.id);
    console.log('👤 User ID:', req.user._id);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    // Check if name is being updated and already exists
    if (req.body.name && req.body.name !== budget.name) {
      const existingBudget = await Budget.findOne({
        name: req.body.name,
        user: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingBudget) {
        return next(new ErrorResponse('Budget with this name already exists', 400));
      }
    }

    // Handle categories if being updated
    let processedCategories = [];
    if (req.body.categories && req.body.categories.length > 0) {
      console.log('📝 Processing categories for update:', req.body.categories);
      
      for (const categoryData of req.body.categories) {
        console.log('🏷️ Processing category data:', categoryData);
        
        let category;
        
        // Check if category is provided as ObjectId (existing category reference)
        if (categoryData.category && mongoose.Types.ObjectId.isValid(categoryData.category)) {
          category = await Category.findOne({
            _id: categoryData.category,
            $or: [
              { user: req.user._id },
              { isSystem: true }
            ]
          });
          
          if (!category) {
            return next(new ErrorResponse(`Category ${categoryData.category} not found`, 404));
          }
        }
        // Check if category is provided as name (new category or name reference)
        else if (categoryData.name) {
          console.log('🔍 Finding/creating category by name:', categoryData.name);
          category = await findOrCreateCategoryByName(categoryData.name, 'expense', req.user._id);
        }
        else {
          return next(new ErrorResponse('Category name or ID is required', 400));
        }
        
        console.log('✅ Category resolved:', category.name, category._id);
        
        processedCategories.push({
          category: category._id,
          allocatedAmount: categoryData.allocatedAmount || categoryData.limit || 0,
          alertThreshold: categoryData.alertThreshold || 80
        });
      }
      
      // Update the request body with processed categories
      req.body.categories = processedCategories;
      console.log('📊 Final processed categories:', processedCategories);
    }

    // Add to history
    const historyEntry = {
      date: new Date(),
      action: 'updated',
      details: {
        updatedFields: Object.keys(req.body),
        previousAmount: budget.amount
      },
      note: 'Budget updated'
    };

    const updateData = {
      ...req.body,
      $push: { history: historyEntry }
    };

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('categories.category', 'name icon color type');

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: {
        budget: updatedBudget
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    // Check if budget has transactions linked to it
    const transactionCount = await Transaction.countDocuments({ budget: req.params.id });

    if (transactionCount > 0) {
      // Soft delete by changing status
      budget.status = 'cancelled';
      await budget.save();

      return res.status(200).json({
        success: true,
        message: 'Budget cancelled successfully (has linked transactions)'
      });
    }

    // Hard delete if no transactions
    await Budget.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get budget statistics
// @route   GET /api/budgets/stats
// @access  Private
const getBudgetStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Set default date range if not provided
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      start.setFullYear(start.getFullYear() - 1); // Last year
    }

    const summary = await Budget.getBudgetSummary(req.user._id, start, end);

    // Get budget performance
    const budgetPerformance = await Budget.aggregate([
      {
        $match: {
          user: req.user._id,
          $or: [
            { startDate: { $gte: start, $lte: end } },
            { endDate: { $gte: start, $lte: end } },
            { startDate: { $lte: start }, endDate: { $gte: end } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          amount: 1,
          spent: 1,
          percentageUsed: 1,
          status: 1,
          type: 1,
          period: 1,
          healthStatus: 1,
          remaining: 1
        }
      },
      {
        $sort: { percentageUsed: -1 }
      }
    ]);

    // Calculate overall statistics
    const totalBudgeted = budgetPerformance.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgetPerformance.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = budgetPerformance.reduce((sum, budget) => sum + budget.remaining, 0);
    const overBudgetCount = budgetPerformance.filter(budget => budget.percentageUsed > 100).length;

    res.status(200).json({
      success: true,
      data: {
        summary,
        budgetPerformance,
        overallStats: {
          totalBudgeted,
          totalSpent,
          totalRemaining,
          overallUtilization: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
          overBudgetCount,
          totalBudgets: budgetPerformance.length
        },
        period: {
          start,
          end
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reset budget for new period
// @route   POST /api/budgets/:id/reset
// @access  Private
const resetBudget = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    if (!budget.isRecurring) {
      return next(new ErrorResponse('Only recurring budgets can be reset', 400));
    }

    // Validate new dates
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    if (newEnd <= newStart) {
      return next(new ErrorResponse('End date must be after start date', 400));
    }

    // Reset budget
    await budget.resetForNewPeriod(newStart, newEnd);

    const updatedBudget = await Budget.findById(budget._id)
      .populate('categories.category', 'name icon color type');

    res.status(200).json({
      success: true,
      message: 'Budget reset successfully for new period',
      data: {
        budget: updatedBudget
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add category to budget
// @route   POST /api/budgets/:id/categories
// @access  Private
const addCategoryToBudget = async (req, res, next) => {
  try {
    const { category, allocatedAmount } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    // Verify category exists
    const categoryDoc = await Category.findOne({
      _id: category,
      $or: [
        { user: req.user._id },
        { isSystem: true }
      ]
    });

    if (!categoryDoc) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Check if category already exists in budget
    const existingCategory = budget.categories.find(
      cat => cat.category.toString() === category
    );

    if (existingCategory) {
      return next(new ErrorResponse('Category already exists in budget', 400));
    }

    // Add category to budget
    budget.categories.push({
      category,
      allocatedAmount,
      spentAmount: 0,
      remainingAmount: allocatedAmount
    });

    await budget.save();

    const updatedBudget = await Budget.findById(budget._id)
      .populate('categories.category', 'name icon color type');

    res.status(200).json({
      success: true,
      message: 'Category added to budget successfully',
      data: {
        budget: updatedBudget
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Remove category from budget
// @route   DELETE /api/budgets/:id/categories/:categoryId
// @access  Private
const removeCategoryFromBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    // Find category in budget
    const categoryIndex = budget.categories.findIndex(
      cat => cat.category.toString() === req.params.categoryId
    );

    if (categoryIndex === -1) {
      return next(new ErrorResponse('Category not found in budget', 404));
    }

    // Remove category
    budget.categories.splice(categoryIndex, 1);
    await budget.save();

    res.status(200).json({
      success: true,
      message: 'Category removed from budget successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get budget alerts
// @route   GET /api/budgets/:id/alerts
// @access  Private
const getBudgetAlerts = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    const alerts = budget.checkAlerts();

    res.status(200).json({
      success: true,
      data: {
        alerts,
        alertSettings: budget.alerts
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get budget summary for dashboard
// @route   Internal function
// @access  Private
const getBudgetSummary = async (userId) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get active budgets for current month
    const activeBudgets = await Budget.find({
      user: userId,
      status: 'active',
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth }
    }).populate('categories.category', 'name color icon');

    let totalBudgeted = 0;
    let totalSpent = 0;
    let budgetProgress = [];

    for (const budget of activeBudgets) {
      // Calculate total budgeted amount
      const budgetAmount = budget.totalAmount || 0;
      totalBudgeted += budgetAmount;

      // Calculate spent amount for this budget
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            status: 'completed',
            date: { $gte: budget.startDate, $lte: budget.endDate },
            category: { $in: budget.categories.map(c => c.category._id) }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$baseCurrencyAmount' }
          }
        }
      ]);

      const spentAmount = spent.length > 0 ? spent[0].total : 0;
      totalSpent += spentAmount;

      budgetProgress.push({
        id: budget._id,
        name: budget.name,
        budgeted: budgetAmount,
        spent: spentAmount,
        remaining: Math.max(0, budgetAmount - spentAmount),
        percentage: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0,
        status: spentAmount >= budgetAmount ? 'over' : 
               spentAmount >= budgetAmount * 0.8 ? 'warning' : 'good'
      });
    }

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining: Math.max(0, totalBudgeted - totalSpent),
      overallPercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      budgetCount: activeBudgets.length,
      budgetProgress
    };
  } catch (error) {
    console.error('Error calculating budget summary:', error);
    return {
      totalBudgeted: 0,
      totalSpent: 0,
      totalRemaining: 0,
      overallPercentage: 0,
      budgetCount: 0,
      budgetProgress: []
    };
  }
};

module.exports = {
  getBudgets,
  getActiveBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStats,
  resetBudget,
  addCategoryToBudget,
  removeCategoryFromBudget,
  getBudgetAlerts,
  getBudgetSummary
};
