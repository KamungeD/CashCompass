import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  Gift,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Button from '../../../common/Button/Button';
import Input from '../../../common/Input/Input';
import CurrencyInput from '../../../common/CurrencyInput/CurrencyInput';
import { formatCurrency } from '../../../../utils/helpers';

const IncomeCollection = ({ wizardData, updateWizardData, goToNextStep, goToPreviousStep }) => {
  const [incomes, setIncomes] = useState(wizardData.incomes || [
    { id: 1, name: '', amount: '', frequency: 'monthly', type: 'salary' }
  ]);

  const incomeTypes = [
    { value: 'salary', label: 'Salary/Wages', icon: Briefcase },
    { value: 'allowance', label: 'Allowance', icon: Gift },
    { value: 'investment', label: 'Investment Returns', icon: TrendingUp },
    { value: 'inheritance', label: 'Inheritance', icon: Gift },
    { value: 'side-hustle', label: 'Side Hustle', icon: DollarSign },
    { value: 'other', label: 'Other', icon: DollarSign }
  ];

  const addIncomeSource = () => {
    const newIncome = {
      id: Date.now(),
      name: '',
      amount: '',
      frequency: 'monthly',
      type: 'salary'
    };
    setIncomes(prev => [...prev, newIncome]);
  };

  const removeIncomeSource = (id) => {
    if (incomes.length > 1) {
      setIncomes(prev => prev.filter(income => income.id !== id));
    }
  };

  const updateIncome = (id, field, value) => {
    setIncomes(prev => prev.map(income => 
      income.id === id ? { ...income, [field]: value } : income
    ));
  };

  const calculateTotalAnnualIncome = () => {
    return incomes.reduce((total, income) => {
      const amount = parseFloat(income.amount) || 0;
      const annualAmount = income.frequency === 'monthly' ? amount * 12 : amount;
      return total + annualAmount;
    }, 0);
  };

  const isValid = () => {
    return incomes.some(income => 
      income.name.trim() && 
      income.amount && 
      parseFloat(income.amount) > 0
    );
  };

  const handleContinue = () => {
    if (isValid()) {
      // Filter out empty income sources
      const validIncomes = incomes.filter(income => 
        income.name.trim() && income.amount && parseFloat(income.amount) > 0
      );
      
      updateWizardData('incomes', validIncomes);
      goToNextStep();
    }
  };

  const getIncomeTypeIcon = (type) => {
    const incomeType = incomeTypes.find(t => t.value === type);
    return incomeType ? incomeType.icon : DollarSign;
  };

  const totalAnnualIncome = calculateTotalAnnualIncome();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Let's set up your income sources
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Add all your income sources so we can create an accurate budget. Don't worry, this information stays private.
        </p>
      </div>

      {/* Total Income Display */}
      {totalAnnualIncome > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Total Annual Income
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalAnnualIncome)}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Monthly: {formatCurrency(totalAnnualIncome / 12)}
            </p>
          </div>
        </div>
      )}

      {/* Income Sources */}
      <div className="space-y-6 mb-8">
        {incomes.map((income, index) => {
          const Icon = getIncomeTypeIcon(income.type);
          
          return (
            <div key={income.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Income Source {index + 1}
                  </h3>
                </div>
                {incomes.length > 1 && (
                  <Button
                    onClick={() => removeIncomeSource(income.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Income Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={income.type}
                    onChange={(e) => updateIncome(income.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 
                             dark:text-gray-100 text-gray-900"
                  >
                    {incomeTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Income Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Name
                  </label>
                  <Input
                    placeholder="e.g., Main Job, Freelancing"
                    value={income.name}
                    onChange={(e) => updateIncome(income.id, 'name', e.target.value)}
                  />
                </div>

                {/* Amount */}
                <div>
                  <CurrencyInput
                    label="Amount"
                    placeholder="Enter amount"
                    value={income.amount}
                    onChange={(e) => updateIncome(income.id, 'amount', e.target.value)}
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={income.frequency}
                    onChange={(e) => updateIncome(income.id, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 
                             dark:text-gray-100 text-gray-900"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              {/* Annual Calculation Display */}
              {income.amount && parseFloat(income.amount) > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Annual equivalent: {' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(
                        income.frequency === 'monthly' 
                          ? (parseFloat(income.amount) || 0) * 12 
                          : (parseFloat(income.amount) || 0)
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Another Income Button */}
      <div className="text-center mb-8">
        <Button
          onClick={addIncomeSource}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Another Income Source</span>
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Tip:</strong> Include all regular income sources like salary, allowances, investment returns, 
          or side hustles. You can always update these later as your situation changes.
        </p>
      </div>

      {/* Navigation Buttons */}
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
          disabled={!isValid()}
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

export default IncomeCollection;
