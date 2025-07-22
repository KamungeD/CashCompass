import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
  Plus,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { annualBudgetAPI } from '../../services/api';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Input from '../../components/common/Input/Input';
import AnnualBudgetForm from '../../components/forms/AnnualBudgetForm/AnnualBudgetForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Category Edit Form Component
const CategoryEditForm = ({ category, subcategories, onSave, onCancel, isLoading }) => {
  const [budgetData, setBudgetData] = useState(() => {
    const data = {};
    subcategories.forEach(subcat => {
      const key = `${subcat.category}-${subcat.subcategory}`;
      data[key] = {
        monthlyBudget: subcat.monthlyBudget || 0,
        annualBudget: subcat.annualBudget || 0
      };
    });
    return data;
  });

  const handleBudgetChange = (subcategory, field, value) => {
    const key = `${category}-${subcategory}`;
    setBudgetData(prev => {
      const updated = { ...prev };
      updated[key] = { ...updated[key] };
      updated[key][field] = Number(value) || 0;
      
      // Auto-calculate annual from monthly
      if (field === 'monthlyBudget') {
        updated[key]['annualBudget'] = (Number(value) || 0) * 12;
      }
      // Auto-calculate monthly from annual
      else if (field === 'annualBudget') {
        updated[key]['monthlyBudget'] = (Number(value) || 0) / 12;
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    const updatedCategories = Object.entries(budgetData).map(([key, budget]) => {
      const [cat, subcat] = key.split('-');
      return {
        category: cat,
        subcategory: subcat,
        monthlyBudget: budget.monthlyBudget,
        annualBudget: budget.annualBudget,
        isRecurring: true
      };
    });
    onSave(updatedCategories);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit {category} Budget
            </h2>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {subcategories.map((subcat) => {
            const key = `${category}-${subcat.subcategory}`;
            const currentBudget = budgetData[key] || { monthlyBudget: 0, annualBudget: 0 };
            
            return (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {subcat.subcategory}
                  </h5>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Budget
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentBudget.monthlyBudget || ''}
                    onChange={(e) => handleBudgetChange(subcat.subcategory, 'monthlyBudget', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Budget
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentBudget.annualBudget || ''}
                    onChange={(e) => handleBudgetChange(subcat.subcategory, 'annualBudget', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AnnualBudgetPage = () => {
  const { user } = useAuth();
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [annualBudget, setAnnualBudget] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Cache and request management
  const cacheRef = useRef({});
  const lastRequestRef = useRef({});
  const abortControllerRef = useRef(null);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce((year) => {
      fetchAnnualBudget(year);
    }, 500),
    []
  );

  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check if we have cached data for this year
    const cacheKey = `year-${selectedYear}`;
    if (cacheRef.current[cacheKey] && Date.now() - lastRequestRef.current[cacheKey] < 30000) {
      // Use cached data if less than 30 seconds old
      const cachedData = cacheRef.current[cacheKey];
      setAnnualBudget(cachedData.budget);
      setPerformance(cachedData.performance);
      setMonthlyBreakdown(cachedData.monthly);
      setLoading(false);
      return;
    }

    // Use debounced fetch for new requests
    debouncedFetch(selectedYear);
  }, [selectedYear, debouncedFetch]);

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefresh = () => {
    // Clear all cache
    cacheRef.current = {};
    lastRequestRef.current = {};
    fetchAnnualBudget(selectedYear);
  };

  const fetchAnnualBudget = async (year = selectedYear, retryCount = 0) => {
    try {
      setLoading(true);
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Add signal to API calls to allow cancellation
      const requestOptions = { signal };
      
      // Fetch data with staggered timing to reduce server load
      const budgetResponse = await annualBudgetAPI.getAnnualBudget(year);
      
      // Small delay before next request
      await new Promise(resolve => setTimeout(resolve, 100));
      if (signal.aborted) return;
      
      const performanceResponse = await annualBudgetAPI.getBudgetPerformance(year);
      
      // Small delay before next request
      await new Promise(resolve => setTimeout(resolve, 100));
      if (signal.aborted) return;
      
      const monthlyResponse = await annualBudgetAPI.getMonthlyBreakdown(year);

      // Cache the successful response
      const cacheKey = `year-${year}`;
      cacheRef.current[cacheKey] = {
        budget: budgetResponse.data.data,
        performance: performanceResponse.data.data,
        monthly: monthlyResponse.data.data
      };
      lastRequestRef.current[cacheKey] = Date.now();

      setAnnualBudget(budgetResponse.data.data);
      setPerformance(performanceResponse.data.data);
      setMonthlyBreakdown(monthlyResponse.data.data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      console.error('Error fetching annual budget:', error);
      
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429 && retryCount < 3) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        toast.error(`Too many requests. Retrying in ${retryDelay / 1000} seconds...`);
        
        setTimeout(() => {
          fetchAnnualBudget(year, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // Handle other errors
      if (error.response?.status === 429) {
        toast.error('Server is busy. Please try again later.');
      } else {
        toast.error('Failed to load annual budget');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSyncWithTransactions = async () => {
    try {
      setSyncing(true);
      await annualBudgetAPI.syncWithTransactions(selectedYear);
      toast.success('Budget synced with transactions');
      
      // Clear cache and refresh data
      const cacheKey = `year-${selectedYear}`;
      delete cacheRef.current[cacheKey];
      delete lastRequestRef.current[cacheKey];
      
      fetchAnnualBudget(selectedYear);
    } catch (error) {
      console.error('Error syncing budget:', error);
      if (error.response?.status === 429) {
        toast.error('Server is busy. Please try again later.');
      } else {
        toast.error('Failed to sync budget');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateBudget = async (budgetData) => {
    try {
      setUpdating(true);
      await annualBudgetAPI.createOrUpdateBudget(budgetData);
      toast.success('Annual budget updated successfully!');
      setShowEditForm(false);
      
      // Clear cache and refresh data
      const cacheKey = `year-${selectedYear}`;
      delete cacheRef.current[cacheKey];
      delete lastRequestRef.current[cacheKey];
      
      fetchAnnualBudget(selectedYear);
    } catch (error) {
      console.error('Error updating annual budget:', error);
      if (error.response?.status === 429) {
        toast.error('Server is busy. Please try again later.');
      } else {
        toast.error('Failed to update annual budget');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCategoryEdit = (categoryName) => {
    setEditingCategory(categoryName);
  };

  const handleCategorySave = async (updatedCategories) => {
    try {
      setUpdating(true);
      
      // Get current budget data and update only the edited category
      const currentCategories = annualBudget?.categories || [];
      const otherCategories = currentCategories.filter(cat => 
        cat.category !== editingCategory
      );
      
      const budgetData = {
        year: selectedYear,
        income: annualBudget?.income || { monthly: 0, annual: 0 },
        categories: [...otherCategories, ...updatedCategories]
      };

      await annualBudgetAPI.createOrUpdateBudget(budgetData);
      toast.success(`${editingCategory} budget updated successfully!`);
      setEditingCategory(null);
      
      // Clear cache and refresh data
      const cacheKey = `year-${selectedYear}`;
      delete cacheRef.current[cacheKey];
      delete lastRequestRef.current[cacheKey];
      
      fetchAnnualBudget(selectedYear);
    } catch (error) {
      console.error('Error updating category budget:', error);
      if (error.response?.status === 429) {
        toast.error('Server is busy. Please try again later.');
      } else {
        toast.error(`Failed to update ${editingCategory} budget`);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCategoryCancel = () => {
    setEditingCategory(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusColor = (variance) => {
    if (variance <= 0) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    if (variance <= annualBudget?.totalAnnualBudget * 0.1) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
  };

  const getProgressBarColor = (progress) => {
    if (progress <= 80) return 'bg-green-500';
    if (progress <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Annual Budget {selectedYear}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your yearly spending and monthly progress
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {/* Edit Button */}
          {annualBudget && (
            <Button
              onClick={() => setShowEditForm(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Budget</span>
            </Button>
          )}
          
          {/* Sync Button */}
          <Button
            onClick={handleSyncWithTransactions}
            disabled={syncing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </Button>

          {/* Manual Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {annualBudget && performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Budget */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(performance.summary.totalBudgeted)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(performance.summary.totalSpent)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {performance.summary.progress.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(performance.summary.progress)}`}
                  style={{ width: `${Math.min(performance.summary.progress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Remaining Budget */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                <p className={`text-2xl font-bold ${performance.summary.remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(performance.summary.remainingBudget)}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${performance.summary.remainingBudget >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {performance.summary.remainingBudget >= 0 ? 
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" /> : 
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'categories', label: 'Categories', icon: Target },
            { id: 'monthly', label: 'Monthly Breakdown', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && performance && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Budget Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Months Elapsed</span>
                  <span className="font-medium">{performance.summary.monthsElapsed} / 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Monthly Spending</span>
                  <span className="font-medium">{formatCurrency(performance.summary.averageMonthlySpending)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Projected Annual Spending</span>
                  <span className="font-medium">{formatCurrency(performance.summary.projectedAnnualSpending)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Budget Variance</span>
                  <span className={`font-medium ${performance.summary.variance <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(performance.summary.variance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Last Sync
              </h3>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(performance.lastSyncDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(performance.lastSyncDate), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && performance && (
        <div className="space-y-6">
          {Object.values(performance.categoryGroups).map((categoryGroup) => (
            <div key={categoryGroup.category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {categoryGroup.category}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(categoryGroup.totalSpent)} / {formatCurrency(categoryGroup.totalBudgeted)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {categoryGroup.totalBudgeted > 0 ? 
                          `${((categoryGroup.totalSpent / categoryGroup.totalBudgeted) * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => handleCategoryEdit(categoryGroup.category)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getProgressBarColor(categoryGroup.totalBudgeted > 0 ? (categoryGroup.totalSpent / categoryGroup.totalBudgeted) * 100 : 0)
                      }`}
                      style={{ 
                        width: `${Math.min(categoryGroup.totalBudgeted > 0 ? (categoryGroup.totalSpent / categoryGroup.totalBudgeted) * 100 : 0, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {categoryGroup.subcategories.map((subcat) => (
                    <div key={`${subcat.category}-${subcat.subcategory}`} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {subcat.subcategory}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monthly: {formatCurrency(subcat.monthlyBudget)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(subcat.annualActual)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          of {formatCurrency(subcat.annualBudget)}
                        </p>
                        <div className="flex items-center justify-end mt-1">
                          {subcat.isOverBudget ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`ml-1 text-xs ${subcat.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {subcat.annualProgress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Breakdown Tab */}
      {activeTab === 'monthly' && monthlyBreakdown && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Monthly Breakdown {selectedYear}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyBreakdown.monthlyData.map((month) => (
                <div 
                  key={month.month} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {month.monthName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(month.variance)}`}>
                      {month.variance <= 0 ? 'On Track' : 'Over Budget'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Budgeted</span>
                      <span className="font-medium">{formatCurrency(month.budgeted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Actual</span>
                      <span className="font-medium">{formatCurrency(month.actual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Variance</span>
                      <span className={`font-medium ${month.variance <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(month.variance)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(month.progress)}`}
                        style={{ width: `${Math.min(month.progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {month.progress.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Annual Budget Modal */}
      {showEditForm && annualBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Annual Budget {selectedYear}
              </h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <AnnualBudgetForm
                  initialData={{
                    year: selectedYear,
                    categories: annualBudget.categories,
                    income: annualBudget.income
                  }}
                  onSubmit={handleUpdateBudget}
                  onCancel={() => setShowEditForm(false)}
                  isLoading={updating}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {editingCategory && performance && (
        <CategoryEditForm
          category={editingCategory}
          subcategories={performance.categoryGroups[editingCategory]?.subcategories || []}
          onSave={handleCategorySave}
          onCancel={handleCategoryCancel}
          isLoading={updating}
        />
      )}
    </div>
  );
};

export default AnnualBudgetPage;
