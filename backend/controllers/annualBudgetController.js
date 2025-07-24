const AnnualBudget = require('../models/AnnualBudget');
const Transaction = require('../models/Transaction');

// Helper function to generate budget allocations for selected categories
const generateSelectedCategoryBudgets = (selectedCategories, essentialAmount, lifestyleAmount, savingsAmount) => {
  const categories = [];
  
  // Category budget allocation mapping with REASONABLE percentages that work together
  const categoryAllocations = {
    'Housing': {
      type: 'essential',
      percentage: 0.65, // 65% of essential budget
      subcategoryWeights: {
        'Rent/Mortgage': 0.70,
        'Utilities': 0.15,
        'Phone': 0.05,
        'Internet': 0.05,
        'Supplies Shopping': 0.03,
        'Rental Management': 0.02
      }
    },
    'Transportation': {
      type: 'essential',
      percentage: 0.20, // 20% of essential budget
      subcategoryWeights: {
        'Fuel': 0.50,
        'Bus/taxi fare': 0.30,
        'Insurance': 0.15,
        'Licensing': 0.05
      }
    },
    'Food': {
      type: 'mixed',
      essentialPercentage: 0.15, // 15% of essential budget for groceries
      lifestylePercentage: 0.30, // 30% of lifestyle budget for dining
      subcategoryWeights: {
        'Groceries Shopping': { type: 'essential', weight: 0.70 },
        'Water': { type: 'essential', weight: 0.30 },
        'Dining out': { type: 'lifestyle', weight: 0.50 },
        'Office lunch': { type: 'lifestyle', weight: 0.30 },
        'Energy drinks': { type: 'lifestyle', weight: 0.20 }
      }
    },
    'Personal Care': {
      type: 'mixed',
      essentialPercentage: 0.05, // 5% of essential budget
      lifestylePercentage: 0.20, // 20% of lifestyle budget
      subcategoryWeights: {
        'Medical': { type: 'essential', weight: 0.60 },
        'Grooming Shopping': { type: 'essential', weight: 0.40 },
        'Hair/nails': { type: 'lifestyle', weight: 0.30 },
        'Clothing': { type: 'lifestyle', weight: 0.40 },
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
      percentage: 0.05, // 5% of essential budget for debt payments
      subcategoryWeights: {
        'Mortgage': 0.70,
        'Personal Loans': 0.20,
        'Student Loans': 0.10
      }
    },
    'Entertainment': {
      type: 'lifestyle',
      percentage: 0.40, // 40% of lifestyle budget
      subcategoryWeights: {
        'Streaming Services': 0.20,
        'Dates': 0.30,
        'Cinema': 0.20,
        'Hobbies': 0.20,
        'Music Subscriptions': 0.10
      }
    },
    'Pets': {
      type: 'lifestyle',
      percentage: 0.10, // 10% of lifestyle budget
      subcategoryWeights: {
        'Food': 0.50,
        'Medical': 0.30,
        'Grooming': 0.15,
        'Toys': 0.05
      }
    },
    'Savings/Investments': {
      type: 'savings',
      percentage: 1.0, // 100% of savings budget
      subcategoryWeights: {
        'Emergency Fund': 0.50,
        'Retirement account': 0.30,
        'Investment account': 0.15,
        'Annual Payments Fund': 0.05
      }
    }
  };

  // Track used budget to prevent over-allocation
  let usedEssential = 0;
  let usedLifestyle = 0;
  let usedSavings = 0;

  // Process each selected category
  Object.entries(selectedCategories || {}).forEach(([categoryName, categoryData]) => {
    if (!categoryData.selected) return;
    
    const allocation = categoryAllocations[categoryName];
    if (!allocation) return;

    // Get selected subcategories
    const selectedSubcategories = Object.entries(categoryData.subcategories || {})
      .filter(([_, isSelected]) => isSelected)
      .map(([name, _]) => name);

    if (selectedSubcategories.length === 0) return;

    // Calculate total category budget based on type
    let totalCategoryBudget = 0;
    if (allocation.type === 'essential') {
      totalCategoryBudget = essentialAmount * allocation.percentage;
      usedEssential += allocation.percentage;
    } else if (allocation.type === 'lifestyle') {
      totalCategoryBudget = lifestyleAmount * allocation.percentage;
      usedLifestyle += allocation.percentage;
    } else if (allocation.type === 'savings') {
      totalCategoryBudget = savingsAmount * allocation.percentage;
      usedSavings += allocation.percentage;
    } else if (allocation.type === 'mixed') {
      const essentialPart = essentialAmount * (allocation.essentialPercentage || 0);
      const lifestylePart = lifestyleAmount * (allocation.lifestylePercentage || 0);
      totalCategoryBudget = essentialPart + lifestylePart;
      usedEssential += (allocation.essentialPercentage || 0);
      usedLifestyle += (allocation.lifestylePercentage || 0);
    }

    // Calculate weights for selected subcategories only
    const selectedWeights = {};
    let totalSelectedWeight = 0;

    selectedSubcategories.forEach(subcategoryName => {
      const weight = allocation.subcategoryWeights[subcategoryName];
      let normalizedWeight = 0;

      if (typeof weight === 'object') {
        normalizedWeight = weight.weight;
      } else {
        normalizedWeight = weight || (1 / selectedSubcategories.length);
      }

      selectedWeights[subcategoryName] = normalizedWeight;
      totalSelectedWeight += normalizedWeight;
    });

    // Distribute budget proportionally among selected subcategories
    selectedSubcategories.forEach(subcategoryName => {
      const weight = selectedWeights[subcategoryName];
      const proportion = weight / totalSelectedWeight;
      
      let subcategoryBudget = 0;
      if (allocation.type === 'mixed') {
        const subWeight = allocation.subcategoryWeights[subcategoryName];
        if (typeof subWeight === 'object') {
          if (subWeight.type === 'essential') {
            subcategoryBudget = (essentialAmount * (allocation.essentialPercentage || 0)) * proportion;
          } else {
            subcategoryBudget = (lifestyleAmount * (allocation.lifestylePercentage || 0)) * proportion;
          }
        }
      } else {
        subcategoryBudget = totalCategoryBudget * proportion;
      }

      if (subcategoryBudget > 0) {
        categories.push({
          category: categoryName,
          subcategory: subcategoryName,
          monthlyBudget: Math.round(subcategoryBudget / 12),
          annualBudget: Math.round(subcategoryBudget),
          isEssential: allocation.type === 'essential' || 
                      (allocation.type === 'mixed' && 
                       typeof allocation.subcategoryWeights[subcategoryName] === 'object' && 
                       allocation.subcategoryWeights[subcategoryName].type === 'essential')
        });
      }
    });
  });

  // Log allocation percentages for debugging
  console.log('🔍 Budget allocation check:');
  console.log(`Essential used: ${(usedEssential * 100).toFixed(1)}%`);
  console.log(`Lifestyle used: ${(usedLifestyle * 100).toFixed(1)}%`);
  console.log(`Savings used: ${(usedSavings * 100).toFixed(1)}%`);

  // CRITICAL: Validate that we haven't over-allocated within each budget type
  if (usedEssential > 1.0) {
    console.warn('⚠️ Essential budget over-allocated, scaling down...');
    const essentialScale = 1.0 / usedEssential;
    categories.forEach(cat => {
      if (cat.isEssential) {
        cat.annualBudget = Math.round(cat.annualBudget * essentialScale);
        cat.monthlyBudget = Math.round(cat.annualBudget / 12);
      }
    });
  }

  if (usedLifestyle > 1.0) {
    console.warn('⚠️ Lifestyle budget over-allocated, scaling down...');
    const lifestyleScale = 1.0 / usedLifestyle;
    categories.forEach(cat => {
      if (!cat.isEssential && cat.category !== 'Savings/Investments') {
        cat.annualBudget = Math.round(cat.annualBudget * lifestyleScale);
        cat.monthlyBudget = Math.round(cat.annualBudget / 12);
      }
    });
  }

  if (usedSavings > 1.0) {
    console.warn('⚠️ Savings budget over-allocated, scaling down...');
    const savingsScale = 1.0 / usedSavings;
    categories.forEach(cat => {
      if (cat.category === 'Savings/Investments') {
        cat.annualBudget = Math.round(cat.annualBudget * savingsScale);
        cat.monthlyBudget = Math.round(cat.annualBudget / 12);
      }
    });
  }

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

    console.log('🎯 Generating budget recommendations for monthly income:', income);
    console.log('📊 Priority:', priority);
    console.log('👤 Profile:', profile);

    // CRITICAL FIX: Convert monthly income to annual income for annual budget calculations
    const annualIncome = income * 12;
    console.log('💰 Annual income calculated:', annualIncome);

    // Base allocations using 50/30/20 rule with modifications - ENSURE THEY SUM TO 100%
    let essentialPercentage = 0.50;
    let lifestylePercentage = 0.30;
    let savingsPercentage = 0.20;

    // Adjust based on priority
    switch (priority) {
      case 'increase-savings':
        essentialPercentage = 0.45;
        lifestylePercentage = 0.25;
        savingsPercentage = 0.30;
        break;
      case 'live-within-means':
        essentialPercentage = 0.50;
        lifestylePercentage = 0.35;
        savingsPercentage = 0.15;
        break;
      case 'healthy-lifestyle':
        essentialPercentage = 0.45;
        lifestylePercentage = 0.35;
        savingsPercentage = 0.20;
        break;
      case 'responsible-spending':
        essentialPercentage = 0.50;
        lifestylePercentage = 0.25;
        savingsPercentage = 0.25;
        break;
    }

    // Adjust based on life stage - MAINTAIN TOTAL = 100%
    if (profile?.lifeStage === 'student') {
      // Students need less savings, more lifestyle
      essentialPercentage = 0.55;
      lifestylePercentage = 0.35;
      savingsPercentage = 0.10;
    } else if (profile?.lifeStage === 'approaching-retirement') {
      // Pre-retirees need more savings
      essentialPercentage = 0.40;
      lifestylePercentage = 0.20;
      savingsPercentage = 0.40;
    }

    // Adjust based on living situation - MAINTAIN TOTAL = 100%
    if (profile?.livingSituation === 'with-parents') {
      // Lower housing costs, more savings
      essentialPercentage = 0.25;
      lifestylePercentage = 0.35;
      savingsPercentage = 0.40;
    } else if (profile?.livingSituation === 'renting-shared') {
      // Shared housing costs
      essentialPercentage = 0.40;
      lifestylePercentage = 0.35;
      savingsPercentage = 0.25;
    }

    // ENSURE PERCENTAGES ALWAYS SUM TO 100%
    const totalPercentage = essentialPercentage + lifestylePercentage + savingsPercentage;
    if (Math.abs(totalPercentage - 1.0) > 0.01) {
      console.warn('⚠️ Budget percentages do not sum to 100%, normalizing...');
      essentialPercentage = essentialPercentage / totalPercentage;
      lifestylePercentage = lifestylePercentage / totalPercentage;
      savingsPercentage = savingsPercentage / totalPercentage;
    }

    console.log('📈 Final percentages:', {
      essential: Math.round(essentialPercentage * 100) + '%',
      lifestyle: Math.round(lifestylePercentage * 100) + '%',
      savings: Math.round(savingsPercentage * 100) + '%'
    });

    // Calculate amounts using ANNUAL income
    const essentialAmount = annualIncome * essentialPercentage;
    const lifestyleAmount = annualIncome * lifestylePercentage;
    const savingsAmount = annualIncome * savingsPercentage;

    console.log('💰 Calculated annual amounts:', {
      essential: essentialAmount,
      lifestyle: lifestyleAmount,
      savings: savingsAmount,
      total: essentialAmount + lifestyleAmount + savingsAmount,
      monthlyIncome: income,
      annualIncome: annualIncome
    });

    // Generate category recommendations based on selected categories
    const categories = generateSelectedCategoryBudgets(
      selectedCategories, 
      essentialAmount, 
      lifestyleAmount, 
      savingsAmount
    );

    const totalAllocated = categories.reduce((sum, cat) => sum + cat.annualBudget, 0);
    const allocationPercentage = (totalAllocated / annualIncome) * 100;

    console.log('✅ Final allocation:', {
      totalAllocated,
      monthlyIncome: income,
      annualIncome: annualIncome,
      percentage: allocationPercentage.toFixed(1) + '%'
    });

    // VALIDATION: Ensure allocation doesn't exceed annual income
    if (totalAllocated > annualIncome * 1.02) { // Allow only 2% margin for rounding
      console.error('❌ Budget allocation exceeds annual income by too much!');
      console.error(`Total allocated: ${totalAllocated}, Annual Income: ${annualIncome}, Ratio: ${(totalAllocated/annualIncome * 100).toFixed(1)}%`);
      
      // Scale down all categories proportionally to fit within annual income
      const scaleFactor = (annualIncome * 0.98) / totalAllocated; // Target 98% of annual income
      console.log('🔧 Scaling down by factor:', scaleFactor.toFixed(3));
      
      categories.forEach(category => {
        category.annualBudget = Math.round(category.annualBudget * scaleFactor);
        category.monthlyBudget = Math.round(category.annualBudget / 12);
      });
      
      console.log('✅ Budget scaled to fit within annual income');
    }

    const finalTotalAllocated = categories.reduce((sum, cat) => sum + cat.annualBudget, 0);

    res.json({
      success: true,
      data: {
        categories,
        totalAllocated: finalTotalAllocated,
        breakdown: {
          essential: Math.round(essentialAmount),
          lifestyle: Math.round(lifestyleAmount),
          savings: Math.round(savingsAmount)
        },
        percentages: {
          essential: Math.round(essentialPercentage * 100),
          lifestyle: Math.round(lifestylePercentage * 100),
          savings: Math.round(savingsPercentage * 100)
        },
        allocationPercentage: Math.round((finalTotalAllocated / annualIncome) * 100),
        income: {
          monthly: income,
          annual: annualIncome
        }
      }
    });
  } catch (error) {
    console.error('❌ Error generating budget recommendations:', error);
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
