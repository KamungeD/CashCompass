import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import { Plus, Trash2, Target, DollarSign, Save, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const schema = yup.object({
  month: yup.string().required('Month is required'),
  income: yup.object({
    monthly: yup.number().min(0, 'Monthly income must be positive').default(0),
    sources: yup.array().of(yup.object({
      name: yup.string().required('Source name is required'),
      amount: yup.number().min(0, 'Amount must be positive').required('Amount is required')
    })).default([])
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

const MonthlyBudgetForm = ({ initialData, onSubmit, onCancel, isLoading = false }) => {
  // Initialize form hook
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      month: initialData?.month || format(new Date(), 'yyyy-MM'),
      income: initialData?.income || { monthly: 0, sources: [] }
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
        isRecurring: true
      }));
    });

    // Fill in existing data
    categories.forEach(item => {
      const category = item.category || 'Other';
      const subcategory = item.subcategory || 'Miscellaneous';
      
      if (!organized[category]) {
        organized[category] = [];
      }
      
      const existingIndex = organized[category].findIndex(sub => sub.subcategory === subcategory);
      if (existingIndex >= 0) {
        organized[category][existingIndex] = {
          subcategory,
          monthlyBudget: item.monthlyAmount || item.monthlyBudget || 0,
          isRecurring: item.isRecurring !== undefined ? item.isRecurring : true
        };
      } else {
        organized[category].push({
          subcategory,
          monthlyBudget: item.monthlyAmount || item.monthlyBudget || 0,
          isRecurring: item.isRecurring !== undefined ? item.isRecurring : true
        });
      }
    });

    return organized;
  };

  const [categoryData, setCategoryData] = useState(() => organizeDataByCategory(initialData?.categories));
  const [incomeSource, setIncomeSource] = useState({ name: '', amount: '' });

  const watchedIncome = watch('income');

  // Auto-calculate totals
  const calculateTotalBudget = () => {
    return Object.values(categoryData).reduce((total, subcategories) => {
      return total + subcategories.reduce((subTotal, sub) => subTotal + (sub.monthlyBudget || 0), 0);
    }, 0);
  };

  const calculateTotalIncome = () => {
    const monthlyIncome = watchedIncome?.monthly || 0;
    const sourcesIncome = (watchedIncome?.sources || []).reduce((total, source) => total + (source.amount || 0), 0);
    return monthlyIncome + sourcesIncome;
  };

  // Handle subcategory budget change
  const handleSubcategoryChange = (category, subcategoryIndex, field, value) => {
    setCategoryData(prev => ({
      ...prev,
      [category]: prev[category].map((sub, index) => 
        index === subcategoryIndex 
          ? { ...sub, [field]: field === 'monthlyBudget' ? parseFloat(value) || 0 : value }
          : sub
      )
    }));
  };

  // Add new subcategory
  const addSubcategory = (category) => {
    setCategoryData(prev => ({
      ...prev,
      [category]: [
        ...prev[category],
        { subcategory: '', monthlyBudget: 0, isRecurring: true }
      ]
    }));
  };

  // Remove subcategory
  const removeSubcategory = (category, subcategoryIndex) => {
    setCategoryData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, index) => index !== subcategoryIndex)
    }));
  };

  // Add income source
  const addIncomeSource = () => {
    if (!incomeSource.name || !incomeSource.amount) {
      toast.error('Please fill in both name and amount for the income source');
      return;
    }

    const currentSources = watchedIncome?.sources || [];
    setValue('income.sources', [
      ...currentSources,
      { name: incomeSource.name, amount: parseFloat(incomeSource.amount) || 0 }
    ]);
    setIncomeSource({ name: '', amount: '' });
  };

  // Remove income source
  const removeIncomeSource = (index) => {
    const currentSources = watchedIncome?.sources || [];
    setValue('income.sources', currentSources.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onFormSubmit = (data) => {
    const formattedData = {
      ...data,
      categories: Object.entries(categoryData).flatMap(([category, subcategories]) =>
        subcategories
          .filter(sub => sub.subcategory && sub.monthlyBudget > 0)
          .map(sub => ({
            category,
            subcategory: sub.subcategory,
            monthlyAmount: sub.monthlyBudget,
            annualProjection: sub.monthlyBudget * 12,
            isRecurring: sub.isRecurring
          }))
      )
    };

    console.log('📝 Submitting monthly budget form data:', formattedData);
    onSubmit(formattedData);
  };

  const totalBudget = calculateTotalBudget();
  const totalIncome = calculateTotalIncome();
  const remainingBudget = totalIncome - totalBudget;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Monthly Budget Details
            </h3>
          </div>
        </div>

        {/* Month and Income */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Budget Month"
            type="month"
            {...register('month')}
            error={errors.month?.message}
            icon={Calendar}
          />
          <Input
            label="Base Monthly Income"
            type="number"
            step="0.01"
            placeholder="Enter your base monthly income"
            {...register('income.monthly')}
            error={errors.income?.monthly?.message}
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Additional Income Sources */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Additional Income Sources
        </h4>
        
        {/* Add new income source */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Income source name"
            value={incomeSource.name}
            onChange={(e) => setIncomeSource(prev => ({ ...prev, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={incomeSource.amount}
            onChange={(e) => setIncomeSource(prev => ({ ...prev, amount: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addIncomeSource}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Source</span>
          </Button>
        </div>

        {/* Income sources list */}
        {watchedIncome?.sources?.length > 0 && (
          <div className="space-y-2">
            {watchedIncome.sources.map((source, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div>
                  <span className="font-medium">{source.name}</span>
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    KES {source.amount?.toLocaleString()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeIncomeSource(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              KES {totalIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              KES {totalBudget.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
            <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              KES {remainingBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="space-y-6">
        {CATEGORY_OPTIONS.map(category => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {category}
              </h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addSubcategory(category)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </Button>
            </div>

            <div className="space-y-3">
              {categoryData[category]?.map((subcategory, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Subcategory name"
                    value={subcategory.subcategory}
                    onChange={(e) => handleSubcategoryChange(category, index, 'subcategory', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monthly budget"
                    value={subcategory.monthlyBudget}
                    onChange={(e) => handleSubcategoryChange(category, index, 'monthlyBudget', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={subcategory.isRecurring}
                      onChange={(e) => handleSubcategoryChange(category, index, 'isRecurring', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Recurring</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeSubcategory(category, index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !isValid}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Monthly Budget'}</span>
        </Button>
      </div>
    </form>
  );
};

export default MonthlyBudgetForm;
