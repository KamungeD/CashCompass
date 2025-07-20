const { Transaction, Category, Budget } = require('../models');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      status = 'completed',
      search,
      sort = '-date'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user._id };

    // Add filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.baseCurrencyAmount = {};
      if (minAmount) query.baseCurrencyAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.baseCurrencyAmount.$lte = parseFloat(maxAmount);
    }

    // Text search
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .populate('category', 'name icon color type')
      .populate('budget', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: totalPages,
          total,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('category', 'name icon color type')
      .populate('budget', 'name amount spent remaining');

    if (!transaction) {
      return next(new ErrorResponse('Transaction not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        transaction
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    // Add user to transaction data
    const transactionData = {
      ...req.body,
      user: req.user._id
    };

    // Verify category belongs to user or is system category
    const category = await Category.findOne({
      _id: req.body.category,
      $or: [
        { user: req.user._id },
        { isSystem: true }
      ]
    });

    if (!category) {
      return next(new ErrorResponse('Category not found or not accessible', 404));
    }

    // Check if category type matches transaction type
    if (category.type !== 'both' && category.type !== req.body.type) {
      return next(new ErrorResponse(`Category is for ${category.type} transactions only`, 400));
    }

    // If budget is specified, verify it belongs to user
    if (req.body.budget) {
      const budget = await Budget.findOne({
        _id: req.body.budget,
        user: req.user._id
      });

      if (!budget) {
        return next(new ErrorResponse('Budget not found', 404));
      }

      // Check if budget is active
      if (budget.status !== 'active') {
        return next(new ErrorResponse('Budget is not active', 400));
      }
    }

    // Create transaction
    const transaction = await Transaction.create(transactionData);

    // Update category usage statistics
    await category.updateUsage(Math.abs(transaction.amount), true);

    // Update budget if specified
    if (req.body.budget && req.body.type === 'expense') {
      const budget = await Budget.findById(req.body.budget);
      await budget.addTransaction(transaction);
    }

    // Populate the created transaction
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('category', 'name icon color type')
      .populate('budget', 'name');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction: populatedTransaction
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    // Find existing transaction
    const existingTransaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('category');

    if (!existingTransaction) {
      return next(new ErrorResponse('Transaction not found', 404));
    }

    // If category is being updated, verify new category
    if (req.body.category && req.body.category !== existingTransaction.category._id.toString()) {
      const category = await Category.findOne({
        _id: req.body.category,
        $or: [
          { user: req.user._id },
          { isSystem: true }
        ]
      });

      if (!category) {
        return next(new ErrorResponse('Category not found or not accessible', 404));
      }

      // Check if category type matches transaction type
      const transactionType = req.body.type || existingTransaction.type;
      if (category.type !== 'both' && category.type !== transactionType) {
        return next(new ErrorResponse(`Category is for ${category.type} transactions only`, 400));
      }
    }

    // Store original values for budget updates
    const originalAmount = existingTransaction.amount;
    const originalType = existingTransaction.type;

    // Update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name icon color type').populate('budget', 'name');

    // Update category usage statistics
    if (req.body.category && req.body.category !== existingTransaction.category._id.toString()) {
      // Decrease usage for old category
      await existingTransaction.category.updateUsage(Math.abs(originalAmount), false);
      
      // Increase usage for new category
      const newCategory = await Category.findById(req.body.category);
      await newCategory.updateUsage(Math.abs(transaction.amount), true);
    } else if (req.body.amount && req.body.amount !== originalAmount) {
      // Update usage for same category with new amount
      const amountDifference = Math.abs(transaction.amount) - Math.abs(originalAmount);
      if (amountDifference !== 0) {
        await existingTransaction.category.updateUsage(Math.abs(amountDifference), amountDifference > 0);
      }
    }

    // Update budget if applicable
    if (existingTransaction.budget) {
      const budget = await Budget.findById(existingTransaction.budget);
      if (budget) {
        // Remove old transaction impact
        await budget.removeTransaction({
          ...existingTransaction.toObject(),
          amount: originalAmount,
          type: originalType
        });
        
        // Add new transaction impact
        if (transaction.type === 'expense') {
          await budget.addTransaction(transaction);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        transaction
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('category');

    if (!transaction) {
      return next(new ErrorResponse('Transaction not found', 404));
    }

    // Update category usage statistics
    await transaction.category.updateUsage(Math.abs(transaction.amount), false);

    // Update budget if applicable
    if (transaction.budget && transaction.type === 'expense') {
      const budget = await Budget.findById(transaction.budget);
      if (budget) {
        await budget.removeTransaction(transaction);
      }
    }

    // Delete transaction
    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    // Set default date range if not provided
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      
      switch (period) {
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setMonth(start.getMonth() - 1);
      }
    }

    // Get summary statistics
    const summary = await Transaction.getUserSummary(req.user._id, start, end);

    // Get spending by category
    const categorySpending = await Transaction.getSpendingByCategory(req.user._id, start, end);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: '$baseCurrencyAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Calculate current balance
    const currentBalance = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$baseCurrencyAmount' }
        }
      }
    ]);

    const income = currentBalance.find(item => item._id === 'income')?.total || 0;
    const expenses = Math.abs(currentBalance.find(item => item._id === 'expense')?.total || 0);
    const balance = income - expenses;

    res.status(200).json({
      success: true,
      data: {
        summary,
        categorySpending,
        monthlyTrends,
        currentBalance: {
          income,
          expenses,
          balance
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

// @desc    Bulk create transactions (for imports)
// @route   POST /api/transactions/bulk
// @access  Private
const bulkCreateTransactions = async (req, res, next) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return next(new ErrorResponse('Transactions array is required', 400));
    }

    if (transactions.length > 1000) {
      return next(new ErrorResponse('Maximum 1000 transactions allowed per bulk operation', 400));
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const transactionData of transactions) {
      try {
        // Add user to transaction data
        const data = { ...transactionData, user: req.user._id };

        // Verify category exists
        const category = await Category.findOne({
          _id: data.category,
          $or: [
            { user: req.user._id },
            { isSystem: true }
          ]
        });

        if (!category) {
          results.failed.push({
            data: transactionData,
            error: 'Category not found or not accessible'
          });
          continue;
        }

        // Create transaction
        const transaction = await Transaction.create(data);
        
        // Update category usage
        await category.updateUsage(Math.abs(transaction.amount), true);

        results.successful.push(transaction);

      } catch (error) {
        results.failed.push({
          data: transactionData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get total balance for user
// @route   Internal function
// @access  Private
const getTotalBalance = async (userId) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$baseCurrencyAmount', 0]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$baseCurrencyAmount', 0]
            }
          }
        }
      }
    ]);

    if (result.length === 0) return 0;
    return result[0].totalIncome - result[0].totalExpenses;
  } catch (error) {
    console.error('Error calculating total balance:', error);
    return 0;
  }
};

// @desc    Get monthly income for user
// @route   Internal function
// @access  Private
const getMonthlyIncome = async (userId, startDate, endDate) => {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'income',
          status: 'completed',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$baseCurrencyAmount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  } catch (error) {
    console.error('Error calculating monthly income:', error);
    return 0;
  }
};

// @desc    Get monthly expenses for user
// @route   Internal function
// @access  Private
const getMonthlyExpenses = async (userId, startDate, endDate) => {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          status: 'completed',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$baseCurrencyAmount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  } catch (error) {
    console.error('Error calculating monthly expenses:', error);
    return 0;
  }
};

// @desc    Get recent transactions for user
// @route   Internal function
// @access  Private
const getRecentTransactions = async (userId, limit = 5) => {
  try {
    const transactions = await Transaction.find({
      user: userId,
      status: 'completed'
    })
      .populate('category', 'name color icon')
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return transactions;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

// @desc    Get monthly statistics for user
// @route   Internal function
// @access  Private
const getMonthlyStats = async (userId, startDate, endDate) => {
  try {
    const [incomeResult, expenseResult, balanceResult] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'income',
            status: 'completed',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$baseCurrencyAmount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            status: 'completed',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$baseCurrencyAmount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ['$type', 'income'] }, '$baseCurrencyAmount', 0]
              }
            },
            totalExpenses: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, '$baseCurrencyAmount', 0]
              }
            }
          }
        }
      ])
    ]);

    const income = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const expenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
    const totalBalance = balanceResult.length > 0 ? 
      (balanceResult[0].totalIncome - balanceResult[0].totalExpenses) : 0;

    return {
      income,
      expenses,
      totalBalance
    };
  } catch (error) {
    console.error('Error calculating monthly stats:', error);
    return {
      income: 0,
      expenses: 0,
      totalBalance: 0
    };
  }
};

// @desc    Get recent transactions for dashboard
// @route   GET /api/transactions/recent
// @access  Private
const getRecentTransactionsRoute = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const transactions = await getRecentTransactions(req.user._id, parseInt(limit));

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  bulkCreateTransactions,
  // Dashboard helper functions
  getTotalBalance,
  getMonthlyIncome,
  getMonthlyExpenses,
  getRecentTransactions,
  getMonthlyStats,
  getRecentTransactionsRoute
};
