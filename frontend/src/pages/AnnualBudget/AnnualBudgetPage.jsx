import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { annualBudgetAPI } from '../../services/api';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import DeleteConfirmation from '../../components/common/DeleteConfirmation/DeleteConfirmation';
import AnnualBudgetForm from '../../components/forms/AnnualBudgetForm/AnnualBudgetForm';
import BudgetCreationWizard from '../../components/forms/BudgetCreationWizard/BudgetCreationWizard';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/helpers';

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
  const [updating, setUpdating] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAnnualBudget();
  }, [selectedYear]);

  const fetchAnnualBudget = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [budgetResponse, performanceResponse, monthlyResponse] = await Promise.all([
        annualBudgetAPI.getAnnualBudget(selectedYear).catch(err => ({ data: { data: null } })),
        annualBudgetAPI.getBudgetPerformance(selectedYear).catch(err => ({ data: { data: null } })),
        annualBudgetAPI.getMonthlyBreakdown(selectedYear).catch(err => ({ data: { data: null } }))
      ]);

      const budgetData = budgetResponse.data.data;
      
      // Check if this is a first-time user (no budget for current year)
      if (!budgetData && selectedYear === currentYear) {
        setIsFirstTimeUser(true);
        setShowWizard(true);
      } else {
        setIsFirstTimeUser(false);
        setShowWizard(false);
      }

      setAnnualBudget(budgetData);
      setPerformance(performanceResponse.data.data);
      setMonthlyBreakdown(monthlyResponse.data.data);
    } catch (error) {
      console.error('Error fetching annual budget:', error);
      // Don't show error toast for first-time users
      if (!isFirstTimeUser) {
        toast.error('Failed to load annual budget');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithTransactions = async () => {
    try {
      setSyncing(true);
      await annualBudgetAPI.syncWithTransactions(selectedYear);
      toast.success('Budget synced with transactions');
      fetchAnnualBudget();
    } catch (error) {
      console.error('Error syncing budget:', error);
      toast.error('Failed to sync budget');
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
      fetchAnnualBudget();
    } catch (error) {
      console.error('Error updating annual budget:', error);
      toast.error('Failed to update annual budget');
    } finally {
      setUpdating(false);
    }
  };

  const handleWizardComplete = async (budgetData) => {
    setShowWizard(false);
    setIsFirstTimeUser(false);
    // Refresh the page data
    await fetchAnnualBudget();
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    // For first-time users, we might want to show an empty state instead
    if (isFirstTimeUser) {
      setIsFirstTimeUser(false);
    }
  };

  const handleDeleteBudget = async () => {
    try {
      console.log('🗑️ Starting delete process for year:', selectedYear);
      setDeleting(true);
      
      console.log('🗑️ Calling API to delete annual budget...');
      await annualBudgetAPI.deleteAnnualBudget(selectedYear);
      
      console.log('✅ Annual budget deleted successfully');
      toast.success(`Annual budget for ${selectedYear} has been deleted successfully`);
      
      // Reset state
      setAnnualBudget(null);
      setPerformance(null);
      setMonthlyBreakdown(null);
      setShowDeleteConfirmation(false);
      
      // Don't auto-show wizard after intentional deletion
      // User deleted the budget intentionally, respect their choice
      setIsFirstTimeUser(false);
      setShowWizard(false);
      
    } catch (error) {
      console.error('❌ Error deleting annual budget:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to delete annual budget. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
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

  // Show wizard for first-time users or when explicitly requested
  if (showWizard) {
    return (
      <BudgetCreationWizard 
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  // Show empty state for users without a budget who cancelled the wizard
  if (!annualBudget && !isFirstTimeUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16">
          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Target className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Create Your First Annual Budget
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Take control of your finances with a personalized annual budget. 
            Our guided wizard makes it easy to get started.
          </p>
          <Button
            onClick={() => setShowWizard(true)}
            size="lg"
            className="flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Create Annual Budget</span>
          </Button>
        </div>
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
            <>
              <Button
                onClick={() => setShowEditForm(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Budget</span>
              </Button>
              
              {/* Delete Button */}
              <Button
                onClick={() => {
                  console.log('🗑️ Delete button clicked, showing confirmation');
                  setShowDeleteConfirmation(true);
                }}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </>
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
                      onClick={() => setShowEditForm(true)}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          isOpen={true}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDeleteBudget}
          title="Delete Annual Budget"
          itemName={`${selectedYear}`}
          itemType="annual budget"
          year={selectedYear}
          isLoading={deleting}
          customWarnings={[
            `All ${selectedYear} financial planning data will be removed`,
            "Budget performance tracking and analytics will be lost",
            "This may affect your multi-year financial planning reports"
          ]}
        />
      )}
    </div>
  );
};

export default AnnualBudgetPage;
