import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import { Plus, Trash2, Calendar, Target, DollarSign } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const categorySchema = yup.object({
  name: yup.string().required('Category name is required'),
  limit: yup.number().min(0, 'Limit must be positive').required('Limit is required'),
  alertThreshold: yup.number().min(0).max(100, 'Threshold must be between 0-100').default(80)
});

const schema = yup.object({
  month: yup.string().required('Month is required'),
  categories: yup.array().of(categorySchema).min(1, 'At least one category is required'),
  isActive: yup.boolean().default(true)
});

const defaultCategories = [
  { name: 'food', label: '🍕 Food & Dining' },
  { name: 'transport', label: '🚗 Transport' },
  { name: 'utilities', label: '💡 Utilities' },
  { name: 'entertainment', label: '🎬 Entertainment' },
  { name: 'shopping', label: '🛍️ Shopping' },
  { name: 'healthcare', label: '🏥 Healthcare' },
  { name: 'rent', label: '🏠 Rent/Mortgage' },
  { name: 'insurance', label: '🛡️ Insurance' }
];

const BudgetForm = ({ initialData, onSubmit, onCancel, isLoading = false }) => {
  console.log('🔧 BudgetForm initialized with:', initialData);
  
  // Process initial categories for editing
  const processedCategories = initialData?.categories ? 
    initialData.categories.map(cat => ({
      name: cat.category?.name || cat.name || 'Unknown',
      limit: cat.allocatedAmount || cat.limit || 0,
      alertThreshold: cat.alertThreshold || 80
    })) :
    [{ name: 'food', limit: 0, alertThreshold: 80 }];
    
  console.log('📂 Processed categories for form:', processedCategories);
  
  // Extract month from startDate if editing, otherwise use current month
  const getInitialMonth = () => {
    if (initialData?.startDate) {
      const startDate = new Date(initialData.startDate);
      return format(startDate, 'yyyy-MM');
    } else if (initialData?.month) {
      return initialData.month;
    } else {
      return format(startOfMonth(new Date()), 'yyyy-MM');
    }
  };
  
  const initialMonth = getInitialMonth();
  console.log('📅 Initial month for form:', initialMonth);

  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      month: initialMonth,
      categories: processedCategories,
      isActive: initialData?.isActive ?? true
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories'
  });

  const watchedCategories = watch('categories');
  const totalBudget = watchedCategories?.reduce((sum, cat) => sum + (parseFloat(cat.limit) || 0), 0) || 0;

  const addCategory = () => {
    append({ name: '', limit: 0, alertThreshold: 80 });
  };

  const addQuickCategory = (categoryName) => {
    const existingCategories = watchedCategories?.map(cat => cat.name) || [];
    if (!existingCategories.includes(categoryName)) {
      append({ name: categoryName, limit: 0, alertThreshold: 80 });
    }
  };

  const handleFormSubmit = (data) => {
    console.log('📝 Form submission started');
    console.log('📝 Raw form data:', data);
    console.log('📝 Initial data (for editing):', initialData);
    
    // Parse the month to create start and end dates (avoid timezone issues)
    const monthDate = new Date(data.month + '-01');
    console.log('📅 Month date created:', monthDate.toISOString());
    
    // Calculate start date (first day of month) - use UTC to avoid timezone issues
    const startDate = new Date(Date.UTC(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0));
    
    // Calculate end date (last day of month) - use UTC to avoid timezone issues
    const endDate = new Date(Date.UTC(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999));
    
    console.log('📅 Calculated dates:', {
      monthInput: data.month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateValue: startDate.getTime(),
      endDateValue: endDate.getTime(),
      isValidRange: endDate > startDate,
      timeDifference: endDate.getTime() - startDate.getTime()
    });
    
    // Validate date range
    if (endDate <= startDate) {
      console.error('❌ Invalid date range:', { startDate, endDate });
      toast.error('Invalid date range calculated');
      return;
    }
    
    // Generate budget name
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const baseName = `Budget for ${monthName}`;
    const timestamp = new Date().getTime();
    
    // For editing: preserve original name unless explicitly changed
    // For creating: use custom name or generate new name
    let budgetName;
    if (initialData) {
      // Editing mode - preserve original name unless user provided custom name
      budgetName = data.customName || initialData.name || baseName;
    } else {
      // Creating mode - use custom name or generate new name
      budgetName = data.customName || `${baseName}`;
    }
    
    console.log('📝 Budget name decision:', {
      isEditing: !!initialData,
      originalName: initialData?.name,
      customName: data.customName,
      finalName: budgetName
    });
    
    const formattedData = {
      name: budgetName,
      amount: totalBudget,
      period: 'monthly',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: 'expense',
      currency: 'KES',
      categories: data.categories.map(cat => ({
        name: cat.name, // We'll handle category ObjectId creation on backend
        allocatedAmount: parseFloat(cat.limit),
        alertThreshold: parseFloat(cat.alertThreshold)
      })),
      // Keep original data for frontend use
      month: data.month,
      isActive: data.isActive,
      // Add a fallback unique identifier for backend use
      uniqueKey: `${data.month}-${timestamp}`
    };
    
    console.log('🔧 Formatted budget data:', formattedData);
    console.log('💰 Total budget amount:', totalBudget);
    console.log('📊 Categories:', formattedData.categories);
    onSubmit(formattedData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Edit Budget Header */}
      {initialData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Editing Budget: {initialData.name || 
                  (initialData.startDate ? 
                    `Budget for ${format(new Date(initialData.startDate), 'MMMM yyyy')}` : 
                    'Unnamed Budget'
                  )
                }
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Make changes to your budget categories and amounts below
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Budget Month */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
        <Input
          label="Budget Month *"
          type="month"
          {...register('month')}
          error={errors.month?.message}
          className="pl-10"
        />
      </div>

      {/* Custom Budget Name */}
      <div>
        <Input
          label="Budget Name (Optional)"
          placeholder="e.g., July 2025 Vacation Budget"
          {...register('customName')}
          error={errors.customName?.message}
          helperText="Leave blank to auto-generate name based on month"
        />
      </div>

      {/* Quick Add Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Add Categories
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {defaultCategories.map((category) => {
            const isAdded = watchedCategories?.some(cat => cat.name === category.name);
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => addQuickCategory(category.name)}
                disabled={isAdded}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  isAdded
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Budget Categories *
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {fields.length} {fields.length === 1 ? 'category' : 'categories'} added
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCategory}
            className="flex items-center space-x-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add Category</span>
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {fields.length > 4 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 bg-gray-100 dark:bg-gray-600 rounded">
              Scroll down to see all categories
            </div>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                {/* Category Name */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    {...register(`categories.${index}.name`)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select category</option>
                    {defaultCategories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.categories?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.categories[index].name.message}
                    </p>
                  )}
                </div>

                {/* Budget Limit */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Budget Limit (KES)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`categories.${index}.limit`)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.categories?.[index]?.limit && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.categories[index].limit.message}
                    </p>
                  )}
                </div>

                {/* Alert Threshold */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Alert at (%)
                  </label>
                  <div className="relative">
                    <Target className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register(`categories.${index}.alertThreshold`)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      placeholder="80"
                    />
                  </div>
                  {errors.categories?.[index]?.alertThreshold && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.categories[index].alertThreshold.message}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <div className="sm:col-span-2 flex justify-end">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.categories && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.categories.message}
          </p>
        )}
      </div>

      {/* Budget Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
            Total Monthly Budget
          </span>
          <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
            {formatCurrency(totalBudget)}
          </span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
          This is the sum of all category limits
        </p>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
          This budget is active
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="sm:order-1 w-full sm:w-auto"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="sm:order-2 w-full sm:w-auto"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;
