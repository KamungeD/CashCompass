import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import { Plus, Trash2, Target, DollarSign, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = yup.object({
  year: yup.number().min(2020).max(2050).required('Year is required'),
  income: yup.object({
    monthly: yup.number().min(0, 'Monthly income must be positive').default(0),
    annual: yup.number().min(0, 'Annual income must be positive').default(0)
  })
});

const CATEGORY_OPTIONS = [
  'Housing',
  'Transportation', 
  'Loans',
  'Insurance',
  'Entertainment',
  'Food',
  'Personal Care',
  'Pets',
  'Gifts and Donations',
  'Savings/Investments',
  'Other'
];

// Default subcategories for each category
const DEFAULT_SUBCATEGORIES = {
  'Housing': ['Rent/Mortgage', 'Utilities', 'Home Insurance', 'Property Tax', 'Maintenance'],
  'Transportation': ['Car Payment', 'Gas', 'Car Insurance', 'Public Transport', 'Parking'],
  'Loans': ['Student Loans', 'Credit Cards', 'Personal Loans', 'Other Debt'],
  'Insurance': ['Health Insurance', 'Life Insurance', 'Disability Insurance'],
  'Entertainment': ['Streaming Services', 'Movies', 'Dining Out', 'Hobbies', 'Travel'],
  'Food': ['Groceries', 'Dining Out', 'Takeout', 'Coffee'],
  'Personal Care': ['Healthcare', 'Clothing', 'Personal Items', 'Gym Membership'],
  'Pets': ['Pet Food', 'Veterinary', 'Pet Insurance', 'Pet Supplies'],
  'Gifts and Donations': ['Gifts', 'Charitable Donations', 'Religious Donations'],
  'Savings/Investments': ['Emergency Fund', 'Retirement', 'Investments', 'Vacation Fund'],
  'Other': ['Miscellaneous', 'Unexpected Expenses']
};

const AnnualBudgetForm = ({ initialData, onSubmit, onCancel, isLoading = false }) => {
  // Initialize form hook first before using setValue
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      year: initialData?.year || new Date().getFullYear(),
      income: initialData?.income || { monthly: 0, annual: 0 }
    },
    mode: 'onChange'
  });

  // Organize initial data by categories
  const organizeDataByCategory = (categories = []) => {
    const organized = {};
    
    // Initialize with default subcategories
    CATEGORY_OPTIONS.forEach(category => {
      organized[category] = DEFAULT_SUBCATEGORIES[category].map(subcategory => ({
        subcategory,
        monthlyBudget: 0,
        annualBudget: 0,
        isRecurring: true
      }));
    });

    // Fill in existing data
    categories.forEach(item => {
      const category = item.category || 'Other';
      const subcategoryName = item.subcategory;
      
      if (organized[category]) {
        const existingSubcat = organized[category].find(sub => sub.subcategory === subcategoryName);
        if (existingSubcat) {
          existingSubcat.monthlyBudget = item.monthlyBudget || 0;
          existingSubcat.annualBudget = item.annualBudget || 0;
          existingSubcat.isRecurring = item.isRecurring !== false;
        } else {
          // Add custom subcategory to existing category
          organized[category].push({
            subcategory: subcategoryName,
            monthlyBudget: item.monthlyBudget || 0,
            annualBudget: item.annualBudget || 0,
            isRecurring: item.isRecurring !== false
          });
        }
      }
    });

    return organized;
  };

  const [categoryData, setCategoryData] = useState(() => 
    organizeDataByCategory(initialData?.categories)
  );

  const [customCategories, setCustomCategories] = useState([]);

  // Update form values when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData?.income) {
      setValue('income.monthly', initialData.income.monthly || 0);
      setValue('income.annual', initialData.income.annual || 0);
    }
    if (initialData?.year) {
      setValue('year', initialData.year);
    }
    if (initialData?.categories) {
      setCategoryData(organizeDataByCategory(initialData.categories));
    }
  }, [initialData, setValue]);

  const watchIncome = watch('income');

  const handleBudgetChange = (category, subcategory, field, value) => {
    setCategoryData(prev => {
      const updated = { ...prev };
      if (updated[category]) {
        const subcatIndex = updated[category].findIndex(sub => sub.subcategory === subcategory);
        if (subcatIndex !== -1) {
          updated[category] = [...updated[category]];
          updated[category][subcatIndex] = { ...updated[category][subcatIndex] };
          updated[category][subcatIndex][field] = Number(value) || 0;
          
          // Auto-calculate annual from monthly
          if (field === 'monthlyBudget') {
            updated[category][subcatIndex]['annualBudget'] = (Number(value) || 0) * 12;
          }
          // Auto-calculate monthly from annual
          else if (field === 'annualBudget') {
            updated[category][subcatIndex]['monthlyBudget'] = (Number(value) || 0) / 12;
          }
        }
      }
      return updated;
    });
  };

  const handleAddCustomCategory = () => {
    setCustomCategories(prev => [...prev, {
      category: '',
      subcategory: '',
      monthlyBudget: '',
      annualBudget: ''
    }]);
  };

  const handleRemoveCustomCategory = (index) => {
    setCustomCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomCategoryChange = (index, field, value) => {
    setCustomCategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calculate annual from monthly
      if (field === 'monthlyBudget') {
        updated[index]['annualBudget'] = Number(value) * 12 || '';
      }
      // Auto-calculate monthly from annual
      if (field === 'annualBudget') {
        updated[index]['monthlyBudget'] = Number(value) / 12 || '';
      }
      
      return updated;
    });
  };

  const handleIncomeChange = (field, value) => {
    setValue(`income.${field}`, value);
    
    // Auto-calculate annual from monthly
    if (field === 'monthly') {
      const annualValue = Number(value) * 12;
      setValue('income.annual', annualValue);
    }
    
    // Auto-calculate monthly from annual
    if (field === 'annual') {
      const monthlyValue = Number(value) / 12;
      setValue('income.monthly', monthlyValue);
    }
  };

  const onFormSubmit = async (data) => {
    try {
      // Convert categoryData to the expected format
      const categories = [];
      
      // Add predefined categories with budget data
      Object.entries(categoryData).forEach(([category, subcategories]) => {
        subcategories.forEach(subcat => {
          if (subcat.monthlyBudget > 0 || subcat.annualBudget > 0) {
            categories.push({
              category,
              subcategory: subcat.subcategory,
              monthlyBudget: subcat.monthlyBudget,
              annualBudget: subcat.annualBudget,
              isRecurring: subcat.isRecurring
            });
          }
        });
      });

      // Add custom categories
      customCategories.forEach(customCat => {
        if ((customCat.monthlyBudget > 0 || customCat.annualBudget > 0) && 
            customCat.category && customCat.subcategory) {
          categories.push({
            category: customCat.category,
            subcategory: customCat.subcategory,
            monthlyBudget: Number(customCat.monthlyBudget) || 0,
            annualBudget: Number(customCat.annualBudget) || 0,
            isRecurring: true
          });
        }
      });

      const formattedData = {
        ...data,
        categories
      };

      await onSubmit(formattedData);
      toast.success('Annual budget saved successfully!');
    } catch (error) {
      console.error('Error saving annual budget:', error);
      toast.error('Failed to save annual budget');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  // Calculate totals from categoryData and customCategories
  const totalMonthlyBudget = Object.values(categoryData).reduce((total, subcategories) => {
    return total + subcategories.reduce((sum, subcat) => sum + (Number(subcat.monthlyBudget) || 0), 0);
  }, 0) + customCategories.reduce((sum, cat) => sum + (Number(cat.monthlyBudget) || 0), 0);

  const totalAnnualBudget = Object.values(categoryData).reduce((total, subcategories) => {
    return total + subcategories.reduce((sum, subcat) => sum + (Number(subcat.annualBudget) || 0), 0);
  }, 0) + customCategories.reduce((sum, cat) => sum + (Number(cat.annualBudget) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {initialData ? 'Edit Annual Budget' : 'Create Annual Budget'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Set up your yearly budget with monthly guidelines
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Year and Income */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <Input
                type="number"
                min="2020"
                max="2050"
                {...register('year')}
                error={errors.year?.message}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Income
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={watchIncome?.monthly || ''}
                onChange={(e) => handleIncomeChange('monthly', e.target.value)}
                error={errors.income?.monthly?.message}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Annual Income
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={watchIncome?.annual || ''}
                onChange={(e) => handleIncomeChange('annual', e.target.value)}
                error={errors.income?.annual?.message}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Budget Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(watchIncome?.monthly)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Budget</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalMonthlyBudget)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Annual Budget</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalAnnualBudget)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Difference</p>
              <p className={`text-lg font-bold ${
                (watchIncome?.monthly || 0) - totalMonthlyBudget >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency((watchIncome?.monthly || 0) - totalMonthlyBudget)}
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Budget Categories
            </h3>
          </div>

          <div className="space-y-8">
            {Object.entries(categoryData).map(([category, subcategories]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                  {category}
                </h4>
                
                <div className="grid gap-4">
                  {subcategories.map((subcat, index) => (
                    <div key={`${category}-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {subcat.subcategory}
                        </h5>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Monthly Budget
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={subcat.monthlyBudget ? "" : "0.00"}
                          value={subcat.monthlyBudget || ''}
                          onChange={(e) => handleBudgetChange(category, subcat.subcategory, 'monthlyBudget', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Annual Budget
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={subcat.annualBudget ? "" : "0.00"}
                          value={subcat.annualBudget || ''}
                          onChange={(e) => handleBudgetChange(category, subcat.subcategory, 'annualBudget', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Categories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                  Custom Categories
                </h4>
                <Button
                  type="button"
                  onClick={handleAddCustomCategory}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Custom</span>
                </Button>
              </div>

              {customCategories.map((customCat, index) => (
                <div key={`custom-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <Input
                      placeholder="e.g., Entertainment"
                      value={customCat.category}
                      onChange={(e) => handleCustomCategoryChange(index, 'category', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subcategory
                    </label>
                    <Input
                      placeholder="e.g., Movies"
                      value={customCat.subcategory}
                      onChange={(e) => handleCustomCategoryChange(index, 'subcategory', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Budget
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder=""
                      value={customCat.monthlyBudget || ''}
                      onChange={(e) => handleCustomCategoryChange(index, 'monthlyBudget', e.target.value)}
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Annual Budget
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        value={customCat.annualBudget || ''}
                        onChange={(e) => handleCustomCategoryChange(index, 'annualBudget', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveCustomCategory(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errors.categories && (
            <p className="text-red-500 text-sm mt-2">{errors.categories.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Budget'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AnnualBudgetForm;
