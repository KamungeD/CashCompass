import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '../../components/common';

const DashboardPage = () => {
  const stats = [
    {
      title: 'Total Balance',
      value: 'KSh 45,250.00',
      change: '+12.5%',
      trend: 'up',
      icon: Wallet,
      color: 'blue',
    },
    {
      title: 'Monthly Income',
      value: 'KSh 85,000.00',
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Monthly Expenses',
      value: 'KSh 42,750.00',
      change: '-3.1%',
      trend: 'down',
      icon: TrendingDown,
      color: 'red',
    },
    {
      title: 'Savings Rate',
      value: '48.5%',
      change: '+5.3%',
      trend: 'up',
      icon: PieChart,
      color: 'purple',
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      description: 'Grocery Shopping',
      amount: -2500,
      category: 'Food & Dining',
      date: '2025-07-20',
      type: 'expense',
    },
    {
      id: 2,
      description: 'Salary Deposit',
      amount: 85000,
      category: 'Income',
      date: '2025-07-20',
      type: 'income',
    },
    {
      id: 3,
      description: 'Internet Bill',
      amount: -3500,
      category: 'Bills & Utilities',
      date: '2025-07-19',
      type: 'expense',
    },
    {
      id: 4,
      description: 'Coffee Shop',
      amount: -450,
      category: 'Food & Dining',
      date: '2025-07-19',
      type: 'expense',
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(Math.abs(amount));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back! Here's your financial overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Recent Transactions
                </h2>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Actions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Transaction
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <PieChart className="h-5 w-5 mr-2" />
                  Create Budget
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Analytics
                </Button>
              </div>
              
              {/* Monthly Budget Progress */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Monthly Budget
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    KSh 42,750 / KSh 50,000
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: '85.5%' }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  85.5% of monthly budget used
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
