const { Category } = require('../models');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { type, includeSystem = true, search, active = true } = req.query;

    // Build query
    const query = {
      $or: [
        { user: req.user._id }
      ]
    };

    // Include system categories if requested
    if (includeSystem === 'true') {
      query.$or.push({ isSystem: true });
    }

    // Filter by type
    if (type) {
      query.$and = [
        { $or: [{ type: type }, { type: 'both' }] }
      ];
    }

    // Filter by active status
    if (active === 'true') {
      query.isActive = true;
    }

    // Text search
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { keywords: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name icon color')
      .sort({ 'usage.transactionCount': -1, name: 1 });

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Private
const getCategoryTree = async (req, res, next) => {
  try {
    const { type } = req.query;

    const categoryTree = await Category.getCategoryTree(req.user._id, type);

    res.status(200).json({
      success: true,
      data: {
        categoryTree
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get popular categories
// @route   GET /api/categories/popular
// @access  Private
const getPopularCategories = async (req, res, next) => {
  try {
    const { type, limit = 10 } = req.query;

    const categories = await Category.getPopularCategories(req.user._id, type, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { isSystem: true }
      ]
    })
      .populate('parentCategory', 'name icon color')
      .populate('metadata.lastModifiedBy', 'firstName lastName');

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Get children categories
    const children = await category.getChildren();

    res.status(200).json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          children
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    // Check if category name already exists for user
    const existingCategory = await Category.findOne({
      name: req.body.name,
      user: req.user._id
    });

    if (existingCategory) {
      return next(new ErrorResponse('Category with this name already exists', 400));
    }

    // If parent category is specified, verify it exists and belongs to user
    if (req.body.parentCategory) {
      const parentCategory = await Category.findOne({
        _id: req.body.parentCategory,
        $or: [
          { user: req.user._id },
          { isSystem: true }
        ]
      });

      if (!parentCategory) {
        return next(new ErrorResponse('Parent category not found', 404));
      }

      // Check nesting level
      if (parentCategory.level >= 2) {
        return next(new ErrorResponse('Categories can only be nested 3 levels deep', 400));
      }
    }

    // Create category
    const categoryData = {
      ...req.body,
      user: req.user._id,
      metadata: {
        createdBy: 'user',
        lastModifiedBy: req.user._id
      }
    };

    const category = await Category.create(categoryData);

    // Populate the created category
    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name icon color');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: populatedCategory
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    // Find category
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return next(new ErrorResponse('Category not found or not owned by user', 404));
    }

    // Check if category is system category
    if (category.isSystem) {
      return next(new ErrorResponse('System categories cannot be modified', 403));
    }

    // If name is being updated, check for duplicates
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: req.body.name,
        user: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return next(new ErrorResponse('Category with this name already exists', 400));
      }
    }

    // If parent category is being updated, verify it
    if (req.body.parentCategory && req.body.parentCategory !== category.parentCategory?.toString()) {
      const parentCategory = await Category.findOne({
        _id: req.body.parentCategory,
        $or: [
          { user: req.user._id },
          { isSystem: true }
        ]
      });

      if (!parentCategory) {
        return next(new ErrorResponse('Parent category not found', 404));
      }

      // Check nesting level
      if (parentCategory.level >= 2) {
        return next(new ErrorResponse('Categories can only be nested 3 levels deep', 400));
      }

      // Check for circular reference
      if (parentCategory._id.toString() === req.params.id) {
        return next(new ErrorResponse('Category cannot be its own parent', 400));
      }
    }

    // Update metadata
    const updateData = {
      ...req.body,
      'metadata.lastModifiedBy': req.user._id,
      'metadata.version': category.metadata.version + 1
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('parentCategory', 'name icon color');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return next(new ErrorResponse('Category not found or not owned by user', 404));
    }

    // Check if category is system category
    if (category.isSystem) {
      return next(new ErrorResponse('System categories cannot be deleted', 403));
    }

    // Check if category has transactions
    const { Transaction } = require('../models');
    const transactionCount = await Transaction.countDocuments({ category: req.params.id });

    if (transactionCount > 0) {
      return next(new ErrorResponse('Cannot delete category that has transactions. Please reassign transactions first.', 400));
    }

    // Check if category has child categories
    const childrenCount = await Category.countDocuments({ parentCategory: req.params.id });

    if (childrenCount > 0) {
      return next(new ErrorResponse('Cannot delete category that has subcategories. Please delete or reassign subcategories first.', 400));
    }

    // Delete category
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add subcategory
// @route   POST /api/categories/:id/subcategories
// @access  Private
const addSubcategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return next(new ErrorResponse('Category not found or not owned by user', 404));
    }

    // Check if subcategory name already exists
    const existingSubcategory = category.subcategories.find(
      sub => sub.name.toLowerCase() === req.body.name.toLowerCase()
    );

    if (existingSubcategory) {
      return next(new ErrorResponse('Subcategory with this name already exists', 400));
    }

    // Add subcategory
    await category.addSubcategory(req.body);

    res.status(201).json({
      success: true,
      message: 'Subcategory added successfully',
      data: {
        category
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Remove subcategory
// @route   DELETE /api/categories/:id/subcategories/:subcategoryId
// @access  Private
const removeSubcategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return next(new ErrorResponse('Category not found or not owned by user', 404));
    }

    // Check if subcategory exists
    const subcategory = category.subcategories.find(
      sub => sub._id.toString() === req.params.subcategoryId
    );

    if (!subcategory) {
      return next(new ErrorResponse('Subcategory not found', 404));
    }

    // Remove subcategory
    await category.removeSubcategory(req.params.subcategoryId);

    res.status(200).json({
      success: true,
      message: 'Subcategory removed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Search categories
// @route   GET /api/categories/search
// @access  Private
const searchCategories = async (req, res, next) => {
  try {
    const { q: searchTerm, type } = req.query;

    if (!searchTerm) {
      return next(new ErrorResponse('Search term is required', 400));
    }

    const categories = await Category.searchCategories(req.user._id, searchTerm, type);

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get category usage statistics
// @route   GET /api/categories/:id/stats
// @access  Private
const getCategoryStats = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { isSystem: true }
      ]
    });

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Get transaction statistics for this category
    const { Transaction } = require('../models');
    
    const stats = await Transaction.aggregate([
      {
        $match: {
          category: category._id,
          user: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: { $abs: '$baseCurrencyAmount' } },
          avgAmount: { $avg: { $abs: '$baseCurrencyAmount' } },
          minAmount: { $min: { $abs: '$baseCurrencyAmount' } },
          maxAmount: { $max: { $abs: '$baseCurrencyAmount' } },
          lastTransaction: { $max: '$date' }
        }
      }
    ]);

    // Get monthly breakdown
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          category: category._id,
          user: req.user._id,
          status: 'completed',
          date: {
            $gte: new Date(new Date().getFullYear(), 0, 1) // Start of current year
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: { $abs: '$baseCurrencyAmount' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const categoryStats = stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      lastTransaction: null
    };

    res.status(200).json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color
        },
        stats: categoryStats,
        monthlyBreakdown: monthlyStats
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get categories with subcategories
// @route   GET /api/categories/with-subcategories
// @access  Private
const getCategoriesWithSubcategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      user: req.user._id,
      parentCategory: null
    })
      .populate('subcategories', 'name type icon color')
      .sort('name');

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Move category to different parent
// @route   PATCH /api/categories/:id/move
// @access  Private
const moveCategory = async (req, res, next) => {
  try {
    const { newParent } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Validate new parent if provided
    if (newParent) {
      const parentCategory = await Category.findOne({
        _id: newParent,
        user: req.user._id
      });

      if (!parentCategory) {
        return next(new ErrorResponse('Parent category not found', 404));
      }

      // Check if it would create circular reference
      if (newParent === req.params.id) {
        return next(new ErrorResponse('Category cannot be its own parent', 400));
      }
    }

    category.parentCategory = newParent || null;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category moved successfully',
      data: {
        category
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update categories
// @route   PATCH /api/categories/bulk-update
// @access  Private
const bulkUpdateCategories = async (req, res, next) => {
  try {
    const { updates } = req.body;

    const results = [];

    for (const update of updates) {
      const category = await Category.findOneAndUpdate(
        {
          _id: update.id,
          user: req.user._id
        },
        update,
        {
          new: true,
          runValidators: true
        }
      );

      if (category) {
        results.push(category);
      }
    }

    res.status(200).json({
      success: true,
      message: `${results.length} categories updated successfully`,
      data: {
        categories: results
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get category usage statistics
// @route   GET /api/categories/:id/usage
// @access  Private
const getCategoryUsage = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Get usage statistics
    const usage = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          category: category._id
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          lastUsed: { $max: '$date' }
        }
      }
    ]);

    const stats = usage[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      averageAmount: 0,
      lastUsed: null
    };

    res.status(200).json({
      success: true,
      data: {
        category,
        usage: stats
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryUsage,
  searchCategories,
  getCategoriesWithSubcategories,
  moveCategory,
  bulkUpdateCategories
};
