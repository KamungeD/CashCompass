import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import { Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { format } from 'date-fns';

const schema = yup.object({
  type: yup.string().oneOf(['income', 'expense']).required('Transaction type is required'),
  amount: yup.number().positive('Amount must be positive').required('Amount is required'),
  category: yup.string().required('Category is required'),
  description: yup.string().max(200, 'Description must be less than 200 characters'),
  date: yup.date().required('Date is required'),
  paymentMethod: yup.string()
});

const categories = {
  expense: [
    { value: 'food', label: '🍕 Food & Dining' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'utilities', label: '💡 Utilities' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'healthcare', label: '🏥 Healthcare' },
    { value: 'education', label: '📚 Education' },
    { value: 'rent', label: '🏠 Rent/Mortgage' },
    { value: 'insurance', label: '🛡️ Insurance' },
    { value: 'other', label: '📦 Other' }
  ],
  income: [
    { value: 'salary', label: '💼 Salary' },
    { value: 'freelance', label: '💻 Freelance' },
    { value: 'business', label: '🏢 Business' },
    { value: 'investment', label: '📈 Investment' },
    { value: 'gift', label: '🎁 Gift' },
    { value: 'bonus', label: '🎯 Bonus' },
    { value: 'refund', label: '↩️ Refund' },
    { value: 'other', label: '💰 Other' }
  ]
};

const paymentMethods = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'credit_card', label: '💳 Credit Card' },
  { value: 'debit_card', label: '💳 Debit Card' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'mobile_money', label: '📱 M-Pesa' },
  { value: 'other', label: '📝 Other' }
];

const TransactionForm = ({ initialData, onSubmit, onCancel, isLoading = false }) => {
  const [selectedType, setSelectedType] = useState(initialData?.type || 'expense');

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    watch 
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: initialData?.type || 'expense',
      amount: initialData?.amount || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
      date: initialData?.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: initialData?.paymentMethod || 'cash'
    }
  });

  const transactionType = watch('type');
  const amount = watch('amount');

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setValue('type', type);
    setValue('category', ''); // Reset category when type changes
  };

  const handleFormSubmit = (data) => {
    const formattedData = {
      ...data,
      amount: parseFloat(data.amount),
      date: new Date(data.date).toISOString()
    };

    // Remove empty description or provide a default
    if (!formattedData.description || formattedData.description.trim() === '') {
      delete formattedData.description; // Remove empty description
    } else {
      formattedData.description = formattedData.description.trim();
    }

    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Transaction Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`p-4 rounded-lg border-2 transition-all ${
              transactionType === 'expense'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">💸</span>
              <span className="font-medium">Expense</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`p-4 rounded-lg border-2 transition-all ${
              transactionType === 'income'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="font-medium">Income</span>
            </div>
          </button>
        </div>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div className="relative">
          {amount && amount !== '' && (
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
          )}
          <Input
            label="Amount *"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount')}
            error={errors.amount?.message}
            className={amount && amount !== '' ? "pl-10" : ""}
          />
        </div>

        {/* Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
          <Input
            label="Date *"
            type="date"
            {...register('date')}
            error={errors.date?.message}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Tag className="inline h-4 w-4 mr-1" />
          Category *
        </label>
        <select
          {...register('category')}
          className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors ${
            errors.category
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
        >
          <option value="">Select a category</option>
          {categories[transactionType]?.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment Method
        </label>
        <select
          {...register('paymentMethod')}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
        >
          {paymentMethods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="relative">
        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Optional description or notes..."
          className={`w-full rounded-lg border px-3 py-2 pl-10 text-sm transition-colors resize-none ${
            errors.description
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
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
          {isLoading ? 'Saving...' : initialData ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
