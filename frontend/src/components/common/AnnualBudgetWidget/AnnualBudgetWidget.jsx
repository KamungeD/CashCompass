import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { annualBudgetAPI } from '../../../services/api';
import { Link } from 'react-router-dom';

const AnnualBudgetWidget = () => {
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchBudgetSummary();
  }, []);

  const fetchBudgetSummary = async () => {
    try {
      const response = await annualBudgetAPI.getBudgetPerformance(currentYear);
      setBudgetSummary(response.data.data.summary);
    } catch (error) {
      console.error('Error fetching annual budget summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (progress) => {
    if (progress <= 75) return 'text-green-600 dark:text-green-400';
    if (progress <= 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (progress) => {
    if (progress <= 75) return 'bg-green-500';
    if (progress <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!budgetSummary) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Annual Budget {currentYear}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            No annual budget found for this year
          </p>
          <Link
            to="/annual-budget"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Create Annual Budget
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Annual Budget {currentYear}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {budgetSummary.monthsElapsed} of 12 months
            </p>
          </div>
        </div>
        
        <Link
          to="/annual-budget"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          View Details
        </Link>
      </div>

      <div className="space-y-4">
        {/* Progress Overview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Budget Progress
            </span>
            <span className={`text-sm font-bold ${getStatusColor(budgetSummary.progress)}`}>
              {budgetSummary.progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(budgetSummary.progress)}`}
              style={{ width: `${Math.min(budgetSummary.progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(budgetSummary.totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
            <p className={`text-sm font-bold ${
              budgetSummary.remainingBudget >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(budgetSummary.remainingBudget)}
            </p>
          </div>
        </div>

        {/* Warning if over budget */}
        {budgetSummary.variance > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-700 dark:text-red-300">
              Over budget by {formatCurrency(budgetSummary.variance)}
            </p>
          </div>
        )}

        {/* Projection */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Projected Annual Spending
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(budgetSummary.projectedAnnualSpending)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualBudgetWidget;
