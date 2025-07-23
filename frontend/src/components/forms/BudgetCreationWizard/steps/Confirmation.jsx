import React, { useState } from 'react';
import { 
  CheckCircle, 
  TrendingUp, 
  Target, 
  PiggyBank, 
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import Button from '../../../common/Button/Button';

const Confirmation = ({ 
  wizardData, 
  goToPreviousStep, 
  completeBudgetCreation,
  loading 
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const calculateTotalSavings = () => {
    return wizardData.budget.categories
      .filter(cat => cat.category.includes('Fund') || cat.category.includes('Goals'))
      .reduce((total, cat) => total + (cat.annualBudget || 0), 0);
  };

  const calculateEssentialExpenses = () => {
    return wizardData.budget.categories
      .filter(cat => cat.isEssential && !cat.category.includes('Fund') && !cat.category.includes('Goals'))
      .reduce((total, cat) => total + (cat.annualBudget || 0), 0);
  };

  const calculateLifestyleExpenses = () => {
    return wizardData.budget.categories
      .filter(cat => !cat.isEssential)
      .reduce((total, cat) => total + (cat.annualBudget || 0), 0);
  };

  const getPriorityText = () => {
    if (typeof wizardData.priority === 'string') {
      const priorityMap = {
        'live-within-means': 'live within your means',
        'increase-savings': 'increase your savings',
        'detailed-tracking': 'keep detailed records accurately',
        'healthy-lifestyle': 'restructure into a healthier lifestyle',
        'responsible-spending': 'create more responsible spending',
        'specific-goal': 'work towards a specific goal'
      };
      return priorityMap[wizardData.priority] || wizardData.priority;
    }
    return wizardData.priority;
  };

  const handleCompleteBudget = async () => {
    try {
      setIsCompleting(true);
      await completeBudgetCreation(wizardData.budget);
    } catch (error) {
      console.error('Failed to complete budget creation:', error);
      setIsCompleting(false);
    }
  };

  const totalSavings = calculateTotalSavings();
  const essentialExpenses = calculateEssentialExpenses();
  const lifestyleExpenses = calculateLifestyleExpenses();
  const savingsRate = (totalSavings / wizardData.budget.totalIncome) * 100;

  const highlights = [
    {
      icon: Target,
      label: 'Annual Budget Goal',
      value: formatCurrency(wizardData.budget.totalIncome),
      description: 'Your total planned income for the year',
      color: 'blue'
    },
    {
      icon: PiggyBank,
      label: 'Annual Savings',
      value: formatCurrency(totalSavings),
      description: `${savingsRate.toFixed(1)}% of your income`,
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Monthly Savings',
      value: formatCurrency(totalSavings / 12),
      description: 'Building your future, month by month',
      color: 'purple'
    },
    {
      icon: Calendar,
      label: 'Budget Allocation',
      value: `${wizardData.budget.categories.length} categories`,
      description: 'Organized and ready to track',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'green': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'purple': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'indigo': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Celebration Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Your Budget is Ready! 🎉
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Congratulations! You've created a personalized budget focused on helping you{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">
            {getPriorityText()}
          </span>. 
          Here's what you're planning to achieve this year:
        </p>
      </div>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {highlights.map((highlight, index) => {
          const Icon = highlight.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getColorClasses(highlight.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {highlight.label}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {highlight.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {highlight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Breakdown */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 
                      border border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-12">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Your Budget Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {formatCurrency(essentialExpenses)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Essential Expenses</div>
            <div className="text-xs text-gray-500 mt-1">
              {((essentialExpenses / wizardData.budget.totalIncome) * 100).toFixed(1)}% of income
            </div>
          </div>
          
          <div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {formatCurrency(lifestyleExpenses)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Lifestyle & Wants</div>
            <div className="text-xs text-gray-500 mt-1">
              {((lifestyleExpenses / wizardData.budget.totalIncome) * 100).toFixed(1)}% of income
            </div>
          </div>
          
          <div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {formatCurrency(totalSavings)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Savings & Goals</div>
            <div className="text-xs text-gray-500 mt-1">
              {savingsRate.toFixed(1)}% of income
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Message */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            🎯 You're planning to save {formatCurrency(totalSavings)} this year!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            That's {formatCurrency(totalSavings / 12)} per month towards your financial goals. 
            Keep this up and you'll build real financial security!
          </p>
        </div>
      </div>

      {/* Next Steps Preview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          What happens next?
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <p className="text-gray-700 dark:text-gray-300">Your budget will be saved and ready to use</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <p className="text-gray-700 dark:text-gray-300">Start tracking your expenses against your budget</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-gray-700 dark:text-gray-300">Monitor your progress and adjust as needed</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <p className="text-gray-700 dark:text-gray-300">Achieve your financial goals! 🎉</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
        <Button
          onClick={handleCompleteBudget}
          disabled={isCompleting || loading}
          size="lg"
          className="flex items-center justify-center space-x-2 px-8 py-4 text-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating your budget...</span>
            </>
          ) : (
            <>
              <span>Save My Budget</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={goToPreviousStep}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={isCompleting || loading}
        >
          <span>← Make Changes</span>
        </Button>

        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <span>Ready to start your financial journey? 🚀</span>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
