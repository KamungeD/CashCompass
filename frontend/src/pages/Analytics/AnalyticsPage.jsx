import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  AlertTriangle,
  ChevronDown,
  Download,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

const AnalyticsPage = () => {
  const { 
    transactions = [], 
    budgets = [], 
    loading, 
    error,
    fetchTransactions,
    fetchBudgets 
  } = useDashboard();

  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewType, setViewType] = useState('spending'); // spending, income, budgets

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
  }, []);

  // Date range calculations
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3Months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last6Months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = parseISO(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  // Analytics calculations
  const calculateSpendingByCategory = () => {
    const spending = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        spending[transaction.category] = (spending[transaction.category] || 0) + transaction.amount;
      });
    return Object.entries(spending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateIncomeByCategory = () => {
    const income = {};
    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(transaction => {
        income[transaction.category] = (income[transaction.category] || 0) + transaction.amount;
      });
    return Object.entries(income)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateMonthlyTrends = () => {
    const trends = {};
    filteredTransactions.forEach(transaction => {
      const month = format(parseISO(transaction.date), 'MMM yyyy');
      if (!trends[month]) {
        trends[month] = { income: 0, expenses: 0 };
      }
      if (transaction.type === 'income') {
        trends[month].income += transaction.amount;
      } else {
        trends[month].expenses += transaction.amount;
      }
    });
    return Object.entries(trends)
      .map(([month, data]) => ({ month, ...data, net: data.income - data.expenses }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
  };

  const calculateBudgetAnalysis = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentBudget = budgets.find(b => b.month === currentMonth && b.isActive);
    
    if (!currentBudget) return null;

    const spending = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        spending[transaction.category] = (spending[transaction.category] || 0) + transaction.amount;
      });

    return currentBudget.categories.map(category => {
      const spent = spending[category.name] || 0;
      const percentage = (spent / category.limit) * 100;
      const status = percentage >= 100 ? 'over' : percentage >= category.alertThreshold ? 'warning' : 'good';
      
      return {
        ...category,
        spent,
        remaining: category.limit - spent,
        percentage: Math.min(percentage, 100),
        status
      };
    });
  };

  const spendingByCategory = calculateSpendingByCategory();
  const incomeByCategory = calculateIncomeByCategory();
  const monthlyTrends = calculateMonthlyTrends();
  const budgetAnalysis = calculateBudgetAnalysis();

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      food: '🍕',
      transport: '🚗',
      utilities: '💡',
      entertainment: '🎬',
      shopping: '🛍️',
      healthcare: '🏥',
      rent: '🏠',
      insurance: '🛡️',
      salary: '💰',
      business: '💼',
      investment: '📈',
      gift: '🎁'
    };
    return emojis[category] || '📊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading analytics: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Insights into your financial patterns and budget performance
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* View Type Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { value: 'spending', label: 'Spending', icon: TrendingDown },
              { value: 'income', label: 'Income', icon: TrendingUp },
              { value: 'budgets', label: 'Budgets', icon: Target }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setViewType(value)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
                  viewType === value
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className={`h-8 w-8 ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Amount</p>
              <p className={`text-2xl font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Based on View Type */}
      {viewType === 'spending' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Spending by Category
            </h3>
            <div className="space-y-4">
              {spendingByCategory.slice(0, 6).map((item, index) => {
                const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                return (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {item.category}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Trends
            </h3>
            <div className="space-y-4">
              {monthlyTrends.slice(-6).map((trend, index) => (
                <div key={trend.month} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {trend.month}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Net: {formatCurrency(trend.net)}
                    </p>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600">↑ {formatCurrency(trend.income)}</span>
                    <span className="text-red-600">↓ {formatCurrency(trend.expenses)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewType === 'income' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Income by Category
            </h3>
            <div className="space-y-4">
              {incomeByCategory.map((item, index) => {
                const percentage = totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0;
                return (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {item.category}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Income vs Expenses Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Income vs Expenses
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Income</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Expenses</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full" 
                    style={{ width: totalIncome > 0 ? `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</span>
                  <span className={`text-sm font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalIncome > 0 ? ((netAmount / totalIncome) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewType === 'budgets' && budgetAnalysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Budget Performance - {format(new Date(), 'MMMM yyyy')}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {budgetAnalysis.map((category) => (
              <div key={category.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getCategoryEmoji(category.name)}</span>
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {category.name}
                    </h4>
                    {category.status === 'over' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {category.status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${
                    category.status === 'over' ? 'text-red-600' : 
                    category.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Spent</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(category.spent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Budget</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(category.limit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                    <span className={`font-medium ${
                      category.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(category.remaining)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        category.status === 'over' ? 'bg-red-500' :
                        category.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!budgetAnalysis && viewType === 'budgets' && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Budget
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a budget for this month to see budget analysis and performance tracking.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
