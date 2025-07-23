const AnnualBudget = require('../models/AnnualBudget');
const Transaction = require('../models/Transaction');

// Helper function to generate budget allocations for selected categories
const generateSelectedCategoryBudgets = (selectedCategories, essentialAmount, lifestyleAmount, savingsAmount) => {
  const categories = [];
  
  // Category budget allocation mapping
  const categoryAllocations = {
    'Housing': {
      type: 'essential',
      percentage: 0.75, // 75% of essential budget
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
      percentage: 0.15, // 15% of essential budget
      subcategoryWeights: {
        'Fuel': 0.5,
        'Bus/taxi fare': 0.3,
        'Insurance': 0.15,
        'Licensing': 0.05
      }
    },
    'Food': {
      type: 'mixed', // Both essential and lifestyle
      essentialPercentage: 0.1, // 10% of essential budget for groceries
      lifestylePercentage: 0.3, // 30% of lifestyle budget for dining
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
      essentialPercentage: 0.05, // 5% of essential budget
      lifestylePercentage: 0.2, // 20% of lifestyle budget
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
      percentage: 0.05, // 5% of essential budget
      subcategoryWeights: {
        'Health': 1.0
      }
    },
    'Loans': {
      type: 'essential',
      percentage: 0.0, // Calculated based on actual debt
      subcategoryWeights: {
        'Mortgage': 0.7,
        'Personal Loans': 0.2,
        'Student Loans': 0.1
      }
    },
    'Entertainment': {
      type: 'lifestyle',
      percentage: 0.4, // 40% of lifestyle budget
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
      percentage: 0.1, // 10% of lifestyle budget
      subcategoryWeights: {
        'Food': 0.5,
        'Medical': 0.3,
        'Grooming': 0.15,
        'Toys': 0.05
      }
    },
    'Savings/Investments': {
      type: 'savings',
      percentage: 1.0, // 100% of savings budget
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

    // Calculate category budget based on type
    let categoryBudget = 0;
    if (allocation.type === 'essential') {
      categoryBudget = essentialAmount * allocation.percentage;
    } else if (allocation.type === 'lifestyle') {
      categoryBudget = lifestyleAmount * allocation.percentage;
    } else if (allocation.type === 'savings') {
      categoryBudget = savingsAmount * allocation.percentage;
    } else if (allocation.type === 'mixed') {
      // Mixed categories split between essential and lifestyle
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
        // For mixed categories, calculate budget based on subcategory type
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
          monthlyBudget: Math.round(subcategoryBudget / 12),
          annualBudget: Math.round(subcategoryBudget),
          isEssential: allocation.type === 'essential' || (typeof weight === 'object' && weight.type === 'essential')
        });
      }
    });
  });

  return categories;
};

// Default budget template based on the CSV data
const DEFAULT_BUDGET_TEMPLATE = [
  // Housing
  { category: 'Housing', subcategory: 'Rent', monthlyBudget: 38000, annualBudget: 456000 },
  { category: 'Housing', subcategory: 'Phone', monthlyBudget: 2000, annualBudget: 24000 },
  { category: 'Housing', subcategory: 'Second Phone', monthlyBudget: 2500, annualBudget: 30000 },
  { category: 'Housing', subcategory: 'Electricity', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Housing', subcategory: 'Water and sewer', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Housing', subcategory: 'Internet', monthlyBudget: 4100, annualBudget: 49200 },
  { category: 'Housing', subcategory: 'Supplies Shopping', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Housing', subcategory: 'Rental Management', monthlyBudget: 1000, annualBudget: 12000 },

  // Transportation
  { category: 'Transportation', subcategory: 'Bus/taxi fare', monthlyBudget: 3000, annualBudget: 36000 },
  { category: 'Transportation', subcategory: 'Insurance', monthlyBudget: 0, annualBudget: 10085 },
  { category: 'Transportation', subcategory: 'Licensing', monthlyBudget: 0, annualBudget: 1300 },
  { category: 'Transportation', subcategory: 'Fuel', monthlyBudget: 9000, annualBudget: 108000 },

  // Loans
  { category: 'Loans', subcategory: 'Mortgage', monthlyBudget: 38473, annualBudget: 461676 },

  // Insurance
  { category: 'Insurance', subcategory: 'Health', monthlyBudget: 0, annualBudget: 7500 },
  { category: 'Insurance', subcategory: 'Second Health', monthlyBudget: 0, annualBudget: 7500 },

  // Entertainment
  { category: 'Entertainment', subcategory: 'Spotify', monthlyBudget: 439, annualBudget: 5268 },
  { category: 'Entertainment', subcategory: 'Netflix', monthlyBudget: 1100, annualBudget: 13200 },
  { category: 'Entertainment', subcategory: 'Showmax', monthlyBudget: 650, annualBudget: 7800 },
  { category: 'Entertainment', subcategory: 'Dates', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Entertainment', subcategory: 'Cinema', monthlyBudget: 2500, annualBudget: 30000 },

  // Food
  { category: 'Food', subcategory: 'Groceries Shopping', monthlyBudget: 20000, annualBudget: 240000 },
  { category: 'Food', subcategory: 'Dining out', monthlyBudget: 10000, annualBudget: 120000 },
  { category: 'Food', subcategory: 'Office lunch', monthlyBudget: 10000, annualBudget: 120000 },
  { category: 'Food', subcategory: 'Water', monthlyBudget: 1400, annualBudget: 16800 },
  { category: 'Food', subcategory: 'Energy drinks', monthlyBudget: 3360, annualBudget: 40320 },

  // Personal Care
  { category: 'Personal Care', subcategory: 'Medical', monthlyBudget: 7900, annualBudget: 94800 },
  { category: 'Personal Care', subcategory: 'Second Medical', monthlyBudget: 7200, annualBudget: 86400 },
  { category: 'Personal Care', subcategory: 'Hair/nails', monthlyBudget: 2000, annualBudget: 24000 },
  { category: 'Personal Care', subcategory: 'Second Hair/nails', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Personal Care', subcategory: 'Grooming Shopping', monthlyBudget: 4000, annualBudget: 48000 },
  { category: 'Personal Care', subcategory: 'Clothing', monthlyBudget: 8000, annualBudget: 96000 },
  { category: 'Personal Care', subcategory: 'Haircare Products', monthlyBudget: 0, annualBudget: 14000 },
  { category: 'Personal Care', subcategory: 'Skincare Products', monthlyBudget: 8000, annualBudget: 96000 },

  // Pets
  { category: 'Pets', subcategory: 'Food', monthlyBudget: 3858, annualBudget: 46296 },
  { category: 'Pets', subcategory: 'Medical', monthlyBudget: 0, annualBudget: 5000 },
  { category: 'Pets', subcategory: 'Grooming', monthlyBudget: 4500, annualBudget: 54000 },
  { category: 'Pets', subcategory: 'Toys', monthlyBudget: 500, annualBudget: 6000 },

  // Savings/Investments
  { category: 'Savings/Investments', subcategory: 'Retirement account', monthlyBudget: 40000, annualBudget: 480000 },
  { category: 'Savings/Investments', subcategory: 'Second Investment account', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Savings/Investments', subcategory: 'Rainy Day Fund', monthlyBudget: 5000, annualBudget: 60000 },
  { category: 'Savings/Investments', subcategory: 'Annual Payments Fund', monthlyBudget: 3782, annualBudget: 45384 }
];

// Get annual budget for a specific year
exports.getAnnualBudget = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    if (!year || year < 2020 || year > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Valid year is required (2020-2050)'
      });
    }

    let annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    // Return null if no budget exists - don't auto-create
    if (!annualBudget) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Sync with current transactions only if budget exists
    await annualBudget.syncWithTransactions();

    res.json({
      success: true,
      data: annualBudget
    });
  } catch (error) {
    console.error('Error fetching annual budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch annual budget',
      error: error.message
    });
  }
};

// Create or update annual budget
exports.createOrUpdateAnnualBudget = async (req, res) => {
  try {
    const { year, categories, income } = req.body;
    const userId = req.user.id;

    if (!year || !categories) {
      return res.status(400).json({
        success: false,
        message: 'Year and categories are required'
      });
    }

    let annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (annualBudget) {
      // Update existing budget
      annualBudget.categories = categories;
      if (income) {
        annualBudget.income = income;
      }
      await annualBudget.save();
    } else {
      // Create new budget
      annualBudget = new AnnualBudget({
        user: userId,
        year: parseInt(year),
        categories,
        income: income || { monthly: 0, annual: 0 }
      });
      await annualBudget.save();
    }

    res.json({
      success: true,
      data: annualBudget,
      message: annualBudget.isNew ? 'Annual budget created successfully' : 'Annual budget updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating annual budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update annual budget',
      error: error.message
    });
  }
};

// Get budget performance analysis
exports.getBudgetPerformance = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found for the specified year'
      });
    }

    // Sync with latest transactions
    await annualBudget.syncWithTransactions();

    const performance = annualBudget.getCategoryPerformance();
    
    // Calculate summary statistics
    const summary = {
      totalBudgeted: annualBudget.totalAnnualBudget,
      totalSpent: annualBudget.totalActualSpending,
      variance: annualBudget.variance,
      progress: annualBudget.progress,
      remainingBudget: annualBudget.remainingBudget,
      monthsElapsed: annualBudget.monthsElapsed,
      averageMonthlySpending: annualBudget.monthsElapsed > 0 ? 
        annualBudget.totalActualSpending / annualBudget.monthsElapsed : 0,
      projectedAnnualSpending: annualBudget.monthsElapsed > 0 ? 
        (annualBudget.totalActualSpending / annualBudget.monthsElapsed) * 12 : 0
    };

    // Group performance by category
    const categoryGroups = performance.reduce((groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = {
          category: item.category,
          totalBudgeted: 0,
          totalSpent: 0,
          subcategories: []
        };
      }
      
      groups[item.category].totalBudgeted += item.annualBudget;
      groups[item.category].totalSpent += item.annualActual;
      groups[item.category].subcategories.push(item);
      
      return groups;
    }, {});

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        summary,
        categoryGroups: Object.values(categoryGroups),
        performance,
        lastSyncDate: annualBudget.lastSyncDate
      }
    });
  } catch (error) {
    console.error('Error fetching budget performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget performance',
      error: error.message
    });
  }
};

// Get monthly breakdown
exports.getMonthlyBreakdown = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found'
      });
    }

    // Get monthly transaction data
    const startOfYear = new Date(parseInt(year), 0, 1);
    const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);

    const monthlyData = [];
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(parseInt(year), month, 1);
      const endOfMonth = new Date(parseInt(year), month + 1, 0, 23, 59, 59);
      
      const transactions = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            type: 'expense'
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' }
          }
        }
      ]);

      const monthlyBudget = annualBudget.totalMonthlyBudget;
      const monthlySpent = transactions.length > 0 ? Math.abs(transactions[0].totalSpent) : 0;

      monthlyData.push({
        month: month + 1,
        monthName: new Date(parseInt(year), month).toLocaleString('default', { month: 'long' }),
        budgeted: monthlyBudget,
        actual: monthlySpent,
        variance: monthlySpent - monthlyBudget,
        progress: monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0
      });
    }

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyData,
        annualSummary: {
          totalBudgeted: annualBudget.totalAnnualBudget,
          totalSpent: annualBudget.totalActualSpending,
          averageMonthlyBudget: annualBudget.totalMonthlyBudget,
          averageMonthlySpent: monthlyData.reduce((sum, m) => sum + m.actual, 0) / 12
        }
      }
    });
  } catch (error) {
    console.error('Error fetching monthly breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly breakdown',
      error: error.message
    });
  }
};

// Sync budget with transactions
exports.syncBudgetWithTransactions = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOne({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found'
      });
    }

    await annualBudget.syncWithTransactions();

    res.json({
      success: true,
      data: annualBudget,
      message: 'Budget synced with transactions successfully'
    });
  } catch (error) {
    console.error('Error syncing budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync budget with transactions',
      error: error.message
    });
  }
};

// Get default budget template
exports.getBudgetTemplate = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        template: DEFAULT_BUDGET_TEMPLATE,
        categories: [...new Set(DEFAULT_BUDGET_TEMPLATE.map(item => item.category))],
        totalMonthlyBudget: DEFAULT_BUDGET_TEMPLATE.reduce((sum, item) => sum + item.monthlyBudget, 0),
        totalAnnualBudget: DEFAULT_BUDGET_TEMPLATE.reduce((sum, item) => sum + item.annualBudget, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching budget template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget template',
      error: error.message
    });
  }
};

// Generate budget recommendations based on user input
exports.generateBudgetRecommendations = async (req, res) => {
  try {
    const { income, priority, profile, selectedCategories } = req.body;

    if (!income || income <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid income is required'
      });
    }

    // Base allocations using 50/30/20 rule with modifications
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
      essentialPercentage *= 0.3; // Much lower housing costs
      savingsPercentage += 0.2;
    } else if (profile?.livingSituation === 'renting-shared') {
      essentialPercentage *= 0.8; // Shared housing costs
      savingsPercentage += 0.1;
    }

    // Calculate amounts
    const essentialAmount = income * essentialPercentage;
    const lifestyleAmount = income * lifestylePercentage;
    const savingsAmount = income * savingsPercentage;

    // Generate category recommendations based on selected categories
    const categories = generateSelectedCategoryBudgets(
      selectedCategories, 
      essentialAmount, 
      lifestyleAmount, 
      savingsAmount
    );

    const totalAllocated = categories.reduce((sum, cat) => sum + cat.annualBudget, 0);

    res.json({
      success: true,
      data: {
        categories,
        totalAllocated,
        breakdown: {
          essential: Math.round(essentialAmount),
          lifestyle: Math.round(lifestyleAmount),
          savings: Math.round(savingsAmount)
        },
        percentages: {
          essential: Math.round(essentialPercentage * 100),
          lifestyle: Math.round(lifestylePercentage * 100),
          savings: Math.round(savingsPercentage * 100)
        }
      }
    });
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate budget recommendations',
      error: error.message
    });
  }
};

// Delete annual budget
exports.deleteAnnualBudget = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const annualBudget = await AnnualBudget.findOneAndDelete({
      user: userId,
      year: parseInt(year)
    });

    if (!annualBudget) {
      return res.status(404).json({
        success: false,
        message: 'Annual budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Annual budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting annual budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete annual budget',
      error: error.message
    });
  }
};
