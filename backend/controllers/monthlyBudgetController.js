const MonthlyBudget = require('../models/MonthlyBudget');
const YearlyPlan = require('../models/YearlyPlan');
const Transaction = require('../models/Transaction');

// Helper function to generate budget allocations for selected categories (monthly-focused)
const generateSelectedCategoryBudgets = (selectedCategories, monthlyIncome, priority, profile) => {
  const categories = [];
  
  // Base allocations using 50/30/20 rule with modifications for monthly amounts
  let essentialPercentage = 0.5;
  let lifestylePercentage = 0.3;
  let savingsPercentage = 0.2;

  // Adjust based on priority
  switch (priority) {
    case 'increase-savings':
      savingsPercentage = 0.3;
      lifestylePercentage = 0.2;
      break;
    case 'live-within-means':
      essentialPercentage = 0.45;
      lifestylePercentage = 0.35;
      savingsPercentage = 0.2;
      break;
    case 'healthy-lifestyle':
      lifestylePercentage = 0.35;
      essentialPercentage = 0.45;
      savingsPercentage = 0.2;
      break;
    case 'responsible-spending':
      essentialPercentage = 0.45;
      lifestylePercentage = 0.25;
      savingsPercentage = 0.3;
      break;
  }

  // Adjust based on life stage
  if (profile?.lifeStage === 'student') {
    savingsPercentage *= 0.5;
    lifestylePercentage += 0.1;
  } else if (profile?.lifeStage === 'approaching-retirement') {
    savingsPercentage = 0.4;
    lifestylePercentage = 0.2;
    essentialPercentage = 0.4;
  }

  // Adjust based on living situation
  if (profile?.livingSituation === 'with-parents') {
    essentialPercentage *= 0.3;
    savingsPercentage += 0.2;
  } else if (profile?.livingSituation === 'renting-shared') {
    essentialPercentage *= 0.8;
    savingsPercentage += 0.1;
  }

  // Calculate monthly amounts
  const essentialAmount = monthlyIncome * essentialPercentage;
  const lifestyleAmount = monthlyIncome * lifestylePercentage;
  const savingsAmount = monthlyIncome * savingsPercentage;
  
  // Category budget allocation mapping (monthly-focused)
  const categoryAllocations = {
    'Housing': {
      type: 'essential',
      percentage: 0.75,
      subcategoryWeights: {
        'Rent/Mortgage': 0.7,
        'Utilities': 0.15,
        'Phone': 0.05,
        'Internet': 0.05,
        'Supplies Shopping': 0.03,
        'Rental Management': 0.02
      }
    },
    'Transportation': {
      type: 'essential',
      percentage: 0.15,
      subcategoryWeights: {
        'Fuel': 0.5,
        'Bus/taxi fare': 0.3,
        'Insurance': 0.15,
        'Licensing': 0.05
      }
    },
    'Food': {
      type: 'mixed',
      essentialPercentage: 0.1,
      lifestylePercentage: 0.3,
      subcategoryWeights: {
        'Groceries Shopping': { type: 'essential', weight: 0.8 },
        'Water': { type: 'essential', weight: 0.2 },
        'Dining out': { type: 'lifestyle', weight: 0.5 },
        'Office lunch': { type: 'lifestyle', weight: 0.3 },
        'Energy drinks': { type: 'lifestyle', weight: 0.2 }
      }
    },
    'Personal Care': {
      type: 'mixed',
      essentialPercentage: 0.05,
      lifestylePercentage: 0.2,
      subcategoryWeights: {
        'Medical': { type: 'essential', weight: 0.6 },
        'Grooming Shopping': { type: 'essential', weight: 0.4 },
        'Hair/nails': { type: 'lifestyle', weight: 0.3 },
        'Clothing': { type: 'lifestyle', weight: 0.4 },
        'Haircare Products': { type: 'lifestyle', weight: 0.15 },
        'Skincare Products': { type: 'lifestyle', weight: 0.15 }
      }
    },
    'Insurance': {
      type: 'essential',
      percentage: 0.05,
      subcategoryWeights: {
        'Health': 1.0
      }
    },
    'Loans': {
      type: 'essential',
      percentage: 0.0,
      subcategoryWeights: {
        'Mortgage': 0.7,
        'Personal Loans': 0.2,
        'Student Loans': 0.1
      }
    },
    'Entertainment': {
      type: 'lifestyle',
      percentage: 0.4,
      subcategoryWeights: {
        'Streaming Services': 0.2,
        'Dates': 0.3,
        'Cinema': 0.2,
        'Hobbies': 0.2,
        'Music Subscriptions': 0.1
      }
    },
    'Pets': {
      type: 'lifestyle',
      percentage: 0.1,
      subcategoryWeights: {
        'Food': 0.5,
        'Medical': 0.3,
        'Grooming': 0.15,
        'Toys': 0.05
      }
    },
    'Savings/Investments': {
      type: 'savings',
      percentage: 1.0,
      subcategoryWeights: {
        'Emergency Fund': 0.5,
        'Retirement account': 0.3,
        'Investment account': 0.15,
        'Annual Payments Fund': 0.05
      }
    }
  };

  // Process each selected category
  Object.entries(selectedCategories || {}).forEach(([categoryName, categoryData]) => {
    if (!categoryData.selected) return;
    
    const allocation = categoryAllocations[categoryName];
    if (!allocation) return;

    // Calculate category budget based on type (monthly amounts)
    let categoryBudget = 0;
    if (allocation.type === 'essential') {
      categoryBudget = essentialAmount * allocation.percentage;
    } else if (allocation.type === 'lifestyle') {
      categoryBudget = lifestyleAmount * allocation.percentage;
    } else if (allocation.type === 'savings') {
      categoryBudget = savingsAmount * allocation.percentage;
    } else if (allocation.type === 'mixed') {
      const essentialPart = essentialAmount * (allocation.essentialPercentage || 0);
      const lifestylePart = lifestyleAmount * (allocation.lifestylePercentage || 0);
      categoryBudget = essentialPart + lifestylePart;
    }

    // Get selected subcategories
    const selectedSubcategories = Object.entries(categoryData.subcategories || {})
      .filter(([_, isSelected]) => isSelected)
      .map(([name, _]) => name);

    if (selectedSubcategories.length === 0) return;

    // Distribute budget among selected subcategories
    const totalWeight = selectedSubcategories.reduce((sum, subcat) => {
      const weight = allocation.subcategoryWeights[subcat];
      if (typeof weight === 'object') {
        return sum + weight.weight;
      }
      return sum + (weight || 0);
    }, 0);

    selectedSubcategories.forEach(subcategoryName => {
      const weight = allocation.subcategoryWeights[subcategoryName];
      let subcategoryWeight = 0;
      let subcategoryBudget = 0;

      if (typeof weight === 'object') {
        subcategoryWeight = weight.weight;
        if (weight.type === 'essential') {
          subcategoryBudget = (essentialAmount * (allocation.essentialPercentage || 0)) * (subcategoryWeight / totalWeight);
        } else if (weight.type === 'lifestyle') {
          subcategoryBudget = (lifestyleAmount * (allocation.lifestylePercentage || 0)) * (subcategoryWeight / totalWeight);
        }
      } else {
        subcategoryWeight = weight || (1 / selectedSubcategories.length);
        subcategoryBudget = categoryBudget * (subcategoryWeight / totalWeight);
      }

      if (subcategoryBudget > 0) {
        categories.push({
          category: categoryName,
          subcategory: subcategoryName,
          monthlyBudget: Math.round(subcategoryBudget),
          annualBudget: Math.round(subcategoryBudget * 12),
          frequency: 'monthly',
          isEssential: allocation.type === 'essential' || (typeof weight === 'object' && weight.type === 'essential')
        });
      }
    });
  });

  return categories;
};

// Get monthly budget for a specific month and year
exports.getMonthlyBudget = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    if (!year || year < 2020 || year > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Valid year is required (2020-2050)'
      });
    }

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Valid month is required (1-12)'
      });
    }

    let monthlyBudget = await MonthlyBudget.findOne({
      user: userId,
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!monthlyBudget) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Sync with current transactions
    await monthlyBudget.syncWithTransactions();

    res.json({
      success: true,
      data: monthlyBudget
    });
  } catch (error) {
    console.error('Error fetching monthly budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly budget',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create or update monthly budget
exports.createOrUpdateMonthlyBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month, income, categories, creationMethod, userProfile, priority } = req.body;

    console.log('📅 Monthly budget creation request:', {
      userId,
      year,
      month,
      income: income ? { monthly: income.monthly, annual: income.annual } : null,
      categoriesCount: categories ? categories.length : 0,
      creationMethod,
      priority
    });

    // Validation
    if (!year || !month) {
      console.error('❌ Missing required fields: year or month');
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
        details: {
          year: year || 'missing',
          month: month || 'missing'
        }
      });
    }

    if (year < 2020 || year > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2020 and 2050'
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12'
      });
    }

    // Calculate totals
    const monthlyIncomeAmount = income?.monthly || 0;
    const annualIncomeAmount = income?.annual || (monthlyIncomeAmount * 12);

    let monthlyBudget = await MonthlyBudget.findOne({
      user: userId,
      year,
      month
    });

    if (monthlyBudget) {
      // Update existing budget
      console.log('🔄 Updating existing monthly budget');
      monthlyBudget.income = {
        monthly: monthlyIncomeAmount,
        annual: annualIncomeAmount,
        sources: income?.sources || []
      };
      monthlyBudget.categories = categories || [];
      monthlyBudget.userProfile = userProfile || monthlyBudget.userProfile;
      monthlyBudget.priority = priority || monthlyBudget.priority;
      monthlyBudget.creationMethod = creationMethod || monthlyBudget.creationMethod;
    } else {
      // Create new budget
      console.log('✨ Creating new monthly budget');
      monthlyBudget = new MonthlyBudget({
        user: userId,
        year,
        month,
        income: {
          monthly: monthlyIncomeAmount,
          annual: annualIncomeAmount,
          sources: income?.sources || []
        },
        categories: categories || [],
        creationMethod: creationMethod || 'manual',
        userProfile: userProfile || {},
        priority: priority || null
      });
    }

    await monthlyBudget.save();
    console.log('✅ Monthly budget saved successfully');

    // Update or create yearly plan
    let yearlyPlan = await YearlyPlan.findOne({ user: userId, year });
    if (!yearlyPlan) {
      console.log('📊 Creating new yearly plan');
      yearlyPlan = new YearlyPlan({
        user: userId,
        year,
        yearlyOverview: {
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          monthsWithBudgets: 0
        },
        monthlySummaries: [],
        categoryTrends: []
      });
    }

    await yearlyPlan.updateMonthlySummary(month, monthlyBudget);
    console.log('📈 Yearly plan updated');

    res.status(201).json({
      success: true,
      message: 'Monthly budget saved successfully',
      data: monthlyBudget
    });
  } catch (error) {
    console.error('❌ Error creating/updating monthly budget:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save monthly budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Generate budget recommendations for a specific month
exports.generateMonthlyBudgetRecommendations = async (req, res) => {
  try {
    const { income, priority, profile, selectedCategories } = req.body;

    if (!income || income <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid monthly income is required'
      });
    }

    // Generate recommendations (monthly-focused)
    let categories = generateSelectedCategoryBudgets(
      selectedCategories, 
      income, // This is monthly income
      priority,
      profile
    );

    // Debug logs before scaling
    console.log('DEBUG: categories before scaling', categories);
    let totalAllocated = categories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
    console.log('DEBUG: totalAllocated before scaling', totalAllocated);
    console.log('DEBUG: income', income);

    // --- Scaling logic: always scale allocations to 100% of income ---
    if (totalAllocated !== income && totalAllocated > 0) {
      const scaleFactor = income / totalAllocated;
      categories = categories.map(cat => {
        const scaledMonthly = Math.round(cat.monthlyBudget * scaleFactor);
        return {
          ...cat,
          monthlyBudget: scaledMonthly,
          annualBudget: scaledMonthly * 12
        };
      });
      totalAllocated = categories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
    }
    // Debug logs after scaling
    console.log('DEBUG: categories after scaling', categories);
    console.log('DEBUG: totalAllocated after scaling', totalAllocated);
    // --- End scaling logic ---

    const remainingBudget = income - totalAllocated;

    res.json({
      success: true,
      data: {
        monthlyIncome: income,
        annualIncome: income * 12,
        categories,
        totals: {
          monthlyAllocated: totalAllocated,
          annualAllocated: totalAllocated * 12,
          monthlyRemaining: remainingBudget,
          annualRemaining: remainingBudget * 12
        },
        recommendations: {
          savingsRate: Math.round((categories.filter(c => c.category.includes('Savings')).reduce((sum, c) => sum + c.monthlyBudget, 0) / income) * 100),
          budgetingMethod: priority === 'increase-savings' ? '30/50/20 (High Savings)' : '50/30/20 (Balanced)',
          nextSteps: [
            'Review and adjust category amounts based on your actual expenses',
            'Track your spending for the first month to see how accurate the budget is',
            'Set up automatic transfers for savings categories',
            'Review and update monthly as needed'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Error generating monthly budget recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate budget recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get monthly budget performance
exports.getMonthlyBudgetPerformance = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    const monthlyBudget = await MonthlyBudget.findOne({
      user: userId,
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!monthlyBudget) {
      return res.status(404).json({
        success: false,
        message: 'Monthly budget not found'
      });
    }

    await monthlyBudget.syncWithTransactions();
    const performanceData = monthlyBudget.getPerformanceData();

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error fetching monthly budget performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all monthly budgets for a year
exports.getYearlyMonthlyBudgets = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const monthlyBudgets = await MonthlyBudget.find({
      user: userId,
      year: parseInt(year)
    }).sort({ month: 1 });

    res.json({
      success: true,
      data: monthlyBudgets
    });
  } catch (error) {
    console.error('Error fetching yearly monthly budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly budgets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete monthly budget
exports.deleteMonthlyBudget = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    const monthlyBudget = await MonthlyBudget.findOneAndDelete({
      user: userId,
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!monthlyBudget) {
      return res.status(404).json({
        success: false,
        message: 'Monthly budget not found'
      });
    }

    // Update yearly plan
    const yearlyPlan = await YearlyPlan.findOne({ user: userId, year: parseInt(year) });
    if (yearlyPlan) {
      yearlyPlan.monthlySummaries = yearlyPlan.monthlySummaries.filter(s => s.month !== parseInt(month));
      yearlyPlan.recalculateYearlyOverview();
      await yearlyPlan.save();
    }

    res.json({
      success: true,
      message: 'Monthly budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting monthly budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete monthly budget',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Sync monthly budget with transactions
exports.syncMonthlyBudgetWithTransactions = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    const monthlyBudget = await MonthlyBudget.findOne({
      user: userId,
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!monthlyBudget) {
      return res.status(404).json({
        success: false,
        message: 'Monthly budget not found'
      });
    }

    await monthlyBudget.syncWithTransactions();

    res.json({
      success: true,
      message: 'Monthly budget synced successfully',
      data: monthlyBudget
    });
  } catch (error) {
    console.error('Error syncing monthly budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync monthly budget',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
