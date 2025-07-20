import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import { Plus, Trash2, Calendar, Target, DollarSign } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';

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
      month: initialData?.month ? format(new Date(initialData.month), 'yyyy-MM') : format(startOfMonth(new Date()), 'yyyy-MM'),
      categories: initialData?.categories || [{ name: 'food', limit: 0, alertThreshold: 80 }],
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
    const formattedData = {
      ...data,
      categories: data.categories.map(cat => ({
        ...cat,
        limit: parseFloat(cat.limit),
        alertThreshold: parseFloat(cat.alertThreshold)
      })),
      totalBudget
    };
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget Categories *
          </label>
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

        <div className="space-y-4">
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
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
