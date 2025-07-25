import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import AnalyticsCard from '../../components/common/AnalyticsCard/AnalyticsCard';
import SimpleChart from '../../components/common/SimpleChart/SimpleChart';
import { analyticsAPI } from '../../services/api';
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
  Filter,
  DollarSign,
  CreditCard,
  PiggyBank,
  Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewType, setViewType] = useState('spending'); // spending, income, trends, summary

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    spendingByCategory: { categories: [], totalSpending: 0 },
    incomeBySource: { sources: [], totalIncome: 0 },
    monthlyTrends: { trends: [] },
    financialSummary: { current: {}, changes: {} },
    savingsAnalysis: { monthlyData: [], yearlyTotals: {} }
  });

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching analytics data...');

      const [
        spendingResponse,
        incomeResponse,
        trendsResponse,
        summaryResponse,
        savingsResponse
      ] = await Promise.all([
        analyticsAPI.getSpendingByCategory({ period: selectedPeriod }),
        analyticsAPI.getIncomeBySource({ period: selectedPeriod }),
        analyticsAPI.getMonthlyTrends({ months: 6 }),
        analyticsAPI.getFinancialSummary({ period: selectedPeriod }),
        analyticsAPI.getSavingsAnalysis({ year: new Date().getFullYear() })
      ]);

      console.log('📊 Analytics data received:', {
        spending: spendingResponse.data,
        income: incomeResponse.data,
        trends: trendsResponse.data,
        summary: summaryResponse.data,
        savings: savingsResponse.data
      });

      setAnalyticsData({
        spendingByCategory: spendingResponse.data.data,
        incomeBySource: incomeResponse.data.data,
        monthlyTrends: trendsResponse.data.data,
        financialSummary: summaryResponse.data.data,
        savingsAnalysis: savingsResponse.data.data
      });
    } catch (error) {
      console.error('❌ Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  // Period options
  const periodOptions = [
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'thisYear', label: 'This Year' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { spendingByCategory, incomeBySource, monthlyTrends, financialSummary, savingsAnalysis } = analyticsData;

  // Get trend direction helper
  const getTrendDirection = (value) => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'neutral';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Financial Analytics
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Comprehensive insights into your financial health and spending patterns
              </p>
            </div>
            
            {/* Controls */}
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                {[
                  { key: 'summary', label: 'Summary', icon: Activity },
                  { key: 'spending', label: 'Spending', icon: CreditCard },
                  { key: 'income', label: 'Income', icon: DollarSign },
                  { key: 'trends', label: 'Trends', icon: TrendingUp }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewType(key)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      viewType === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Total Income"
            value={financialSummary.current?.income || 0}
            subtitle={selectedPeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
            icon={DollarSign}
            color="green"
            trend={{
              direction: getTrendDirection(financialSummary.changes?.income || 0),
              value: Math.abs(financialSummary.changes?.income || 0).toFixed(1),
              period: 'last period'
            }}
          />
          
          <AnalyticsCard
            title="Total Expenses"
            value={financialSummary.current?.expenses || 0}
            subtitle={selectedPeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
            icon={CreditCard}
            color="red"
            trend={{
              direction: getTrendDirection(financialSummary.changes?.expenses || 0),
              value: Math.abs(financialSummary.changes?.expenses || 0).toFixed(1),
              period: 'last period'
            }}
          />
          
          <AnalyticsCard
            title="Net Income"
            value={financialSummary.current?.netIncome || 0}
            subtitle="Income - Expenses"
            icon={financialSummary.current?.netIncome >= 0 ? TrendingUp : TrendingDown}
            color={financialSummary.current?.netIncome >= 0 ? 'green' : 'red'}
          />
          
          <AnalyticsCard
            title="Savings Rate"
            value={`${financialSummary.current?.savingsRate || 0}%`}
            subtitle="Percentage saved"
            icon={PiggyBank}
            color="blue"
          />
        </div>

        {/* Main Content */}
        {viewType === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              data={spendingByCategory.categories?.slice(0, 8).map(cat => ({
                label: cat.category,
                value: cat.totalAmount,
                percentage: cat.percentage
              })) || []}
              type="pie"
              title="Spending by Category"
            />
            
            <SimpleChart
              data={monthlyTrends.trends?.map(trend => ({
                label: trend.month,
                value: trend.netIncome
              })) || []}
              type="line"
              title="Monthly Net Income Trend"
            />
          </div>
        )}

        {viewType === 'spending' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              data={spendingByCategory.categories?.map(cat => ({
                label: cat.category,
                value: cat.totalAmount,
                percentage: cat.percentage
              })) || []}
              type="bar"
              title="Spending by Category"
            />
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Top Spending Categories
              </h3>
              <div className="space-y-4">
                {spendingByCategory.categories?.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {category.category}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        KES {category.totalAmount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.percentage}% of total
                      </p>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        )}

        {viewType === 'income' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              data={incomeBySource.sources?.map(source => ({
                label: source.source,
                value: source.totalAmount,
                percentage: source.percentage
              })) || []}
              type="pie"
              title="Income by Source"
            />
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Income Sources
              </h3>
              <div className="space-y-4">
                {incomeBySource.sources?.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {source.source}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {source.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        KES {source.totalAmount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {source.percentage}% of total
                      </p>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        )}

        {viewType === 'trends' && (
          <div className="space-y-6">
            <SimpleChart
              data={monthlyTrends.trends?.map(trend => ({
                label: trend.month,
                value: trend.income,
                name: 'Income'
              })) || []}
              type="line"
              title="Monthly Income Trend"
            />
            
            <SimpleChart
              data={monthlyTrends.trends?.map(trend => ({
                label: trend.month,
                value: trend.expenses,
                name: 'Expenses'
              })) || []}
              type="line"
              title="Monthly Expenses Trend"
            />
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Monthly Savings Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 text-gray-600 dark:text-gray-400">Month</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Income</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Expenses</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Net</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Savings Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTrends.trends?.map((trend, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 text-gray-900 dark:text-gray-100">{trend.month}</td>
                        <td className="py-3 text-right text-green-600 dark:text-green-400">
                          KES {trend.income?.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-red-600 dark:text-red-400">
                          KES {trend.expenses?.toLocaleString()}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          trend.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          KES {trend.netIncome?.toLocaleString()}
                        </td>
                        <td className={`py-3 text-right ${
                          trend.savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {trend.savingsRate?.toFixed(1)}%
                        </td>
                      </tr>
                    )) || []}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
