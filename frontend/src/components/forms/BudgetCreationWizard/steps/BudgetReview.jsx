import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Button from '../../../common/Button/Button';
import Input from '../../../common/Input/Input';
import CurrencyInput from '../../../common/CurrencyInput/CurrencyInput';
import { formatCurrency } from '../../../../utils/helpers';

const BudgetReview = ({ wizardData, updateWizardData, goToNextStep, goToPreviousStep }) => {
  const [budget, setBudget] = useState(wizardData.budget || { categories: [], totalIncome: 0, totalAllocated: 0 });
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'annual'
  const [editingCategory, setEditingCategory] = useState(null);

  const defaultCategories = {
    'Essential': [
      { name: 'Housing', subcategories: ['Rent/Mortgage', 'Utilities', 'Insurance'], isEssential: true },
      { name: 'Transportation', subcategories: ['Car Payment', 'Gas', 'Insurance', 'Public Transit'], isEssential: true },
      { name: 'Food', subcategories: ['Groceries', 'Dining Out'], isEssential: true },
      { name: 'Healthcare', subcategories: ['Insurance', 'Medical Expenses'], isEssential: true },
      { name: 'Debt Payments', subcategories: ['Credit Cards', 'Student Loans'], isEssential: true }
    ],
    'Lifestyle': [
      { name: 'Entertainment', subcategories: ['Movies', 'Subscriptions', 'Hobbies'], isEssential: false },
      { name: 'Personal Care', subcategories: ['Gym', 'Grooming', 'Clothing'], isEssential: false },
      { name: 'Gifts & Charity', subcategories: ['Gifts', 'Donations'], isEssential: false },
      { name: 'Miscellaneous', subcategories: ['Fun Money', 'Unexpected'], isEssential: false }
    ],
    'Savings & Goals': [
      { name: 'Emergency Fund', subcategories: ['Emergency Savings'], isEssential: true },
      { name: 'Short-term Goals', subcategories: ['Vacation', 'Electronics'], isEssential: false },
      { name: 'Long-term Goals', subcategories: ['House Down Payment', 'Car'], isEssential: false }
    ]
  };

  useEffect(() => {
    // If budget is empty, initialize with default categories
    if (!budget.categories || budget.categories.length === 0) {
      initializeDefaultBudget();
    } else {
      // Ensure all existing categories have unique IDs
      const categoriesWithIds = budget.categories.map((category, index) => ({
        ...category,
        id: category.id || `existing-${Date.now()}-${index}`
      }));
      
      if (categoriesWithIds.some((cat, idx) => cat.id !== budget.categories[idx]?.id)) {
        setBudget(prev => ({
          ...prev,
          categories: categoriesWithIds
        }));
      }
    }
  }, []);

  const initializeDefaultBudget = () => {
    const categories = [];
    let idCounter = 0;
    
    Object.entries(defaultCategories).forEach(([groupName, groupCategories]) => {
      groupCategories.forEach(cat => {
        cat.subcategories.forEach(subcat => {
          categories.push({
            id: `${Date.now()}-${idCounter++}`,
            category: cat.name,
            subcategory: subcat,
            monthlyBudget: 0,
            annualBudget: 0,
            isEssential: cat.isEssential,
            isMonthly: true // Default to monthly
          });
        });
      });
    });

    setBudget(prev => ({
      ...prev,
      categories
    }));
  };

  const calculateTotalAllocated = () => {
    return budget.categories.reduce((total, cat) => {
      // Always calculate based on annual budget for consistency
      return total + (cat.annualBudget || 0);
    }, 0);
  };

  const calculateTotalAllocatedForView = () => {
    return budget.categories.reduce((total, cat) => {
      if (viewMode === 'monthly') {
        return total + (cat.monthlyBudget || 0);
      } else {
        return total + (cat.annualBudget || 0);
      }
    }, 0);
  };

  const updateCategoryBudget = (categoryId, field, value) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          const updatedCat = { ...cat, [field]: parseFloat(value) || 0 };
          
          // Auto-calculate monthly/annual
          if (field === 'monthlyBudget') {
            updatedCat.annualBudget = updatedCat.monthlyBudget * 12;
          } else if (field === 'annualBudget') {
            updatedCat.monthlyBudget = updatedCat.annualBudget / 12;
          }
          
          return updatedCat;
        }
        return cat;
      })
    }));
  };

  const addCustomCategory = () => {
    const newCategory = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: 'Custom',
      subcategory: 'New Category',
      monthlyBudget: 0,
      annualBudget: 0,
      isEssential: false,
      isMonthly: true,
      isCustom: true
    };
    
    setBudget(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    
    setEditingCategory(newCategory.id);
  };

  const removeCategory = (categoryId) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId)
    }));
  };

  const updateCategoryName = (categoryId, field, value) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const groupedCategories = budget.categories.reduce((groups, category) => {
    const group = category.isEssential ? 'Essential' : 
                  category.category === 'Emergency Fund' || category.category.includes('Goals') ? 'Savings & Goals' : 
                  'Lifestyle';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(category);
    return groups;
  }, {});

  const totalAllocated = calculateTotalAllocated();
  const totalAllocatedForView = calculateTotalAllocatedForView();
  
  // Calculate remaining income and percentage based on view mode
  const incomeForView = viewMode === 'monthly' ? wizardData.budget.totalIncome / 12 : wizardData.budget.totalIncome;
  const remainingIncome = incomeForView - totalAllocatedForView;
  const allocationPercentage = (totalAllocatedForView / incomeForView) * 100;

  const getStatusColor = () => {
    if (allocationPercentage <= 100) return 'text-green-600 dark:text-green-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleContinue = () => {
    updateWizardData('budget', {
      ...budget,
      totalAllocated
    });
    goToNextStep();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Review & Customize Your Budget
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Adjust amounts and add custom categories to match your lifestyle
        </p>
      </div>

      {/* Budget Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(incomeForView)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Allocated</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {formatCurrency(totalAllocatedForView)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
            <p className={`text-2xl font-bold ${remainingIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(remainingIncome)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Allocation %</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {allocationPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-md transition-all ${
              viewMode === 'monthly' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setViewMode('annual')}
            className={`px-4 py-2 rounded-md transition-all ${
              viewMode === 'annual' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Annual View
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8 mb-8">
        {Object.entries(groupedCategories).map(([groupName, categories]) => (
          <div key={groupName} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
              {groupName}
            </h3>
            
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div key={category.id || `category-${index}-${category.category}-${category.subcategory}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Category/Subcategory */}
                    <div className="md:col-span-2">
                      {editingCategory === category.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Category"
                            value={category.category}
                            onChange={(e) => updateCategoryName(category.id, 'category', e.target.value)}
                          />
                          <Input
                            placeholder="Subcategory"
                            value={category.subcategory}
                            onChange={(e) => updateCategoryName(category.id, 'subcategory', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {category.subcategory}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.category}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div>
                      <CurrencyInput
                        placeholder="Enter amount"
                        value={viewMode === 'monthly' ? category.monthlyBudget || '' : category.annualBudget || ''}
                        onChange={(e) => updateCategoryBudget(
                          category.id, 
                          viewMode === 'monthly' ? 'monthlyBudget' : 'annualBudget', 
                          e.target.value
                        )}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2">
                      {category.isCustom && (
                        <Button
                          onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {category.isCustom && (
                        <Button
                          onClick={() => removeCategory(category.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Category */}
      <div className="text-center mb-8">
        <Button
          onClick={addCustomCategory}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Category</span>
        </Button>
      </div>

      {/* Validation Alerts */}
      {allocationPercentage > 100 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">
              <strong>Budget over income:</strong> You've allocated more than your total income. 
              Please adjust your budget amounts.
            </p>
          </div>
        </div>
      )}

      {allocationPercentage >= 95 && allocationPercentage <= 100 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">
              <strong>Great job!</strong> You've allocated {allocationPercentage.toFixed(1)}% of your income. 
              This is a well-balanced budget.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={goToPreviousStep}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        <Button
          onClick={handleContinue}
          disabled={allocationPercentage > 105} // Allow slight over-allocation
          size="lg"
          className="flex items-center space-x-2 px-8"
        >
          <span>Continue</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default BudgetReview;
