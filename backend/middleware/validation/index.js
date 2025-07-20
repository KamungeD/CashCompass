const { body, param, query, validationResult } = require('express-validator');
const { ErrorResponse } = require('../errorHandler');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return next(new ErrorResponse('Validation failed', 400, errorMessages));
  }
  
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('email')
      .trim()
      .normalizeEmail()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .isLength({ max: 100 })
      .withMessage('Email cannot exceed 100 characters'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    
    body('phoneNumber')
      .optional()
      .trim()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid phone number'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date of birth')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (birthDate > today) {
          throw new Error('Date of birth cannot be in the future');
        }
        
        if (age < 13) {
          throw new Error('You must be at least 13 years old to register');
        }
        
        return true;
      }),
    
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .trim()
      .normalizeEmail()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],
  
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('phoneNumber')
      .optional()
      .trim()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid phone number'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date of birth')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        
        if (birthDate > today) {
          throw new Error('Date of birth cannot be in the future');
        }
        
        return true;
      }),
    
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'])
      .withMessage('Invalid currency'),
    
    body('timezone')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid timezone'),
    
    body('language')
      .optional()
      .isIn(['en', 'sw'])
      .withMessage('Invalid language'),
    
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmNewPassword')
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match new password');
        }
        return true;
      }),
    
    handleValidationErrors
  ],
  
  forgotPassword: [
    body('email')
      .trim()
      .normalizeEmail()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    
    handleValidationErrors
  ],
  
  resetPassword: [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    
    param('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid reset token format'),
    
    handleValidationErrors
  ]
};

// Transaction validation rules
const transactionValidation = {
  create: [
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => {
        if (parseFloat(value) === 0) {
          throw new Error('Amount cannot be zero');
        }
        if (Math.abs(parseFloat(value)) > 1000000) {
          throw new Error('Amount cannot exceed 1,000,000');
        }
        return true;
      }),
    
    body('type')
      .notEmpty()
      .withMessage('Transaction type is required')
      .isIn(['income', 'expense', 'transfer'])
      .withMessage('Transaction type must be income, expense, or transfer'),
    
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 1, max: 500 })
      .withMessage('Description must be between 1 and 500 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
    
    body('date')
      .notEmpty()
      .withMessage('Transaction date is required')
      .isISO8601()
      .withMessage('Please provide a valid date')
      .custom((value) => {
        const transactionDate = new Date(value);
        const today = new Date();
        
        if (transactionDate > today) {
          throw new Error('Transaction date cannot be in the future');
        }
        
        return true;
      }),
    
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'mobile_money', 'cheque', 'other'])
      .withMessage('Invalid payment method'),
    
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'])
      .withMessage('Invalid currency'),
    
    body('exchangeRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Exchange rate must be a positive number'),
    
    body('subcategory')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subcategory cannot exceed 100 characters'),
    
    body('accountNumber')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Account number cannot exceed 50 characters'),
    
    body('referenceNumber')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Reference number cannot exceed 100 characters'),
    
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed'),
    
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each tag must be between 1 and 30 characters'),
    
    handleValidationErrors
  ],
  
  update: [
    body('amount')
      .optional()
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => {
        if (parseFloat(value) === 0) {
          throw new Error('Amount cannot be zero');
        }
        if (Math.abs(parseFloat(value)) > 1000000) {
          throw new Error('Amount cannot exceed 1,000,000');
        }
        return true;
      }),
    
    body('type')
      .optional()
      .isIn(['income', 'expense', 'transfer'])
      .withMessage('Transaction type must be income, expense, or transfer'),
    
    body('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Description must be between 1 and 500 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
    
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date')
      .custom((value) => {
        const transactionDate = new Date(value);
        const today = new Date();
        
        if (transactionDate > today) {
          throw new Error('Transaction date cannot be in the future');
        }
        
        return true;
      }),
    
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'mobile_money', 'cheque', 'other'])
      .withMessage('Invalid payment method'),
    
    param('id')
      .isMongoId()
      .withMessage('Invalid transaction ID'),
    
    handleValidationErrors
  ],
  
  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid transaction ID'),
    
    handleValidationErrors
  ],
  
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('type')
      .optional()
      .isIn(['income', 'expense', 'transfer'])
      .withMessage('Invalid transaction type'),
    
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be a positive number'),
    
    handleValidationErrors
  ]
};

// Category validation rules
const categoryValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('type')
      .notEmpty()
      .withMessage('Category type is required')
      .isIn(['income', 'expense', 'both'])
      .withMessage('Category type must be income, expense, or both'),
    
    body('icon')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Icon identifier cannot exceed 50 characters'),
    
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Please provide a valid hex color'),
    
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    
    handleValidationErrors
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('type')
      .optional()
      .isIn(['income', 'expense', 'both'])
      .withMessage('Category type must be income, expense, or both'),
    
    body('icon')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Icon identifier cannot exceed 50 characters'),
    
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Please provide a valid hex color'),
    
    param('id')
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    handleValidationErrors
  ]
};

// Budget validation rules
const budgetValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Budget name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Budget name must be between 1 and 100 characters'),
    
    body('amount')
      .notEmpty()
      .withMessage('Budget amount is required')
      .isFloat({ min: 0 })
      .withMessage('Budget amount must be a positive number'),
    
    body('period')
      .notEmpty()
      .withMessage('Budget period is required')
      .isIn(['weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
      .withMessage('Invalid budget period'),
    
    body('startDate')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    body('endDate')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
        
        return true;
      }),
    
    body('type')
      .notEmpty()
      .withMessage('Budget type is required')
      .isIn(['expense', 'income', 'savings', 'debt_payment'])
      .withMessage('Invalid budget type'),
    
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR'])
      .withMessage('Invalid currency'),
    
    body('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    
    body('categories.*.category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    body('categories.*.allocatedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Allocated amount must be a positive number'),
    
    handleValidationErrors
  ]
};

// Common validation rules
const commonValidation = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
    
    handleValidationErrors
  ],
  
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'amount', '-amount', 'date', '-date'])
      .withMessage('Invalid sort field'),
    
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  transactionValidation,
  categoryValidation,
  budgetValidation,
  commonValidation,
  handleValidationErrors,
  
  // Main validation function used in routes
  validate: (validationType) => {
    const validationMap = {
      // User validations
      'register': userValidation.register,
      'login': userValidation.login,
      'updateProfile': userValidation.updateProfile,
      'changePassword': userValidation.changePassword,
      'forgotPassword': userValidation.forgotPassword,
      'resetPassword': userValidation.resetPassword,
      'resendVerification': userValidation.forgotPassword, // Same as forgot password
      
      // Transaction validations
      'createTransaction': transactionValidation.create,
      'updateTransaction': transactionValidation.update,
      'bulkCreateTransactions': transactionValidation.create, // Use same as create
      
      // Category validations
      'createCategory': categoryValidation.create,
      'updateCategory': categoryValidation.update,
      'moveCategory': [
        body('newParent').optional().isMongoId().withMessage('Invalid parent category ID'),
        param('id').isMongoId().withMessage('Invalid category ID'),
        handleValidationErrors
      ],
      'bulkUpdateCategories': [
        body('updates').isArray().withMessage('Updates must be an array'),
        body('updates.*.id').isMongoId().withMessage('Invalid category ID'),
        handleValidationErrors
      ],
      
      // Budget validations
      'createBudget': budgetValidation.create,
      'updateBudget': budgetValidation.update,
      'resetBudget': [
        body('startDate').notEmpty().isISO8601().withMessage('Valid start date required'),
        body('endDate').notEmpty().isISO8601().withMessage('Valid end date required'),
        param('id').isMongoId().withMessage('Invalid budget ID'),
        handleValidationErrors
      ],
      'addCategoryToBudget': [
        body('category').notEmpty().isMongoId().withMessage('Valid category ID required'),
        body('allocatedAmount').notEmpty().isFloat({ min: 0 }).withMessage('Valid allocated amount required'),
        param('id').isMongoId().withMessage('Invalid budget ID'),
        handleValidationErrors
      ]
    };
    
    return validationMap[validationType] || [handleValidationErrors];
  }
};
