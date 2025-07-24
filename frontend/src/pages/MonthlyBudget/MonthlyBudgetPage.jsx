import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Target,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Edit3,
  Trash2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { monthlyBudgetAPI, yearlyPlanAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import DeleteConfirmation from '../../components/common/DeleteConfirmation/DeleteConfirmation';
import MonthlyBudgetForm from '../../components/forms/MonthlyBudgetForm/MonthlyBudgetForm';
import BudgetCreationWizard from '../../components/forms/BudgetCreationWizard/BudgetCreationWizard';

const MonthlyBudgetPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch monthly budget
  const fetchMonthlyBudget = async () => {
    try {
      setLoading(true);
      const response = await monthlyBudgetAPI.getMonthlyBudget(selectedYear, selectedMonth);
      
      if (response.data.success) {
        setMonthlyBudget(response.data.data);
        
        // Fetch performance data if budget exists
        if (response.data.data) {
          const perfResponse = await monthlyBudgetAPI.getBudgetPerformance(selectedYear, selectedMonth);
          if (perfResponse.data.success) {
            setPerformanceData(perfResponse.data.data);
          }
        } else {
          setPerformanceData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching monthly budget:', error);
      toast.error('Failed to load monthly budget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMonthlyBudget();
    }
  }, [user, selectedYear, selectedMonth]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleCreateBudget = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = (budgetData) => {
    setShowWizard(false);
    setMonthlyBudget(budgetData);
    toast.success('Monthly budget created successfully!');
    fetchMonthlyBudget(); // Refresh data
  };

  const handleEditBudget = () => {
    setShowCreateForm(true);
  };

  const handleDeleteBudget = async () => {
    try {
      await monthlyBudgetAPI.deleteMonthlyBudget(selectedYear, selectedMonth);
      setMonthlyBudget(null);
      setPerformanceData(null);
      setShowDeleteConfirm(false);
      toast.success('Monthly budget deleted successfully');
    } catch (error) {
      console.error('Error deleting monthly budget:', error);
      toast.error('Failed to delete monthly budget');
    }
  };

  const handleSyncTransactions = async () => {
    if (!monthlyBudget) return;
    
    try {
      setLoading(true);
      await monthlyBudgetAPI.syncWithTransactions(selectedYear, selectedMonth);
      toast.success('Budget synced with transactions');
      fetchMonthlyBudget(); // Refresh data
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast.error('Failed to sync transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnnualOverview = () => {
    navigate(`/annual-review/${selectedYear}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Monthly Budget
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your monthly expenses and track your financial goals
              </p>
            </div>
            <button
              onClick={handleViewAnnualOverview}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Annual Overview</span>
            </button>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {monthlyBudget ? 'Budget Active' : 'No Budget Set'}
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {monthlyBudget ? (
          <>
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Monthly Income</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(monthlyBudget.income.monthly)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Budgeted Expenses</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(monthlyBudget.totals.monthlyBudgetedExpenses)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Actual Expenses</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(monthlyBudget.totals.monthlyActualExpenses)}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Remaining Budget</p>
                    <p className={`text-2xl font-bold ${
                      monthlyBudget.totals.monthlyDifference >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(monthlyBudget.totals.monthlyDifference)}
                    </p>
                  </div>
                  <TrendingUp className={`h-8 w-8 ${
                    monthlyBudget.totals.monthlyDifference >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={handleEditBudget}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Budget</span>
              </button>
              
              <button
                onClick={handleSyncTransactions}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Sync Transactions</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Budget</span>
              </button>
            </div>

            {/* Budget Categories */}
            {performanceData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Budget Performance
                </h3>
                
                <div className="space-y-4">
                  {performanceData.categories.map((category, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {category.category} - {category.subcategory}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.frequency === 'monthly' ? 'Monthly' : 'Annual (monthly allocation)'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(category.actual)} / {formatCurrency(category.budgeted)}
                          </p>
                          <p className={`text-sm font-medium ${
                            category.difference >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {category.difference >= 0 ? '+' : ''}{formatCurrency(category.difference)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            category.percentageUsed <= 100 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(category.percentageUsed, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {category.percentageUsed.toFixed(1)}% used
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Annual Projection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Annual Projection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Projected Annual Income</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(monthlyBudget.income.annual)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Projected Annual Expenses</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(monthlyBudget.totals.annualBudgetedExpenses)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Projected Annual Savings</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(monthlyBudget.income.annual - monthlyBudget.totals.annualBudgetedExpenses)}
                  </p>
                </div>
              </div>
            </div>

          </>
        ) : (
          /* No Budget State */
          <div className="text-center py-12">
            <Calendar className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Budget for {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Create your first monthly budget to start tracking your income and expenses for this month.
            </p>
            <button
              onClick={handleCreateBudget}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Monthly Budget</span>
            </button>
          </div>
        )}

        {/* Wizard Modal */}
        {showWizard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <BudgetCreationWizard
                isMonthly={true}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onComplete={handleWizardComplete}
                onCancel={() => setShowWizard(false)}
              />
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <MonthlyBudgetForm
                budget={monthlyBudget}
                year={selectedYear}
                month={selectedMonth}
                onSave={(savedBudget) => {
                  setMonthlyBudget(savedBudget);
                  setShowCreateForm(false);
                  fetchMonthlyBudget();
                  toast.success('Budget updated successfully!');
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <DeleteConfirmation
            title="Delete Monthly Budget"
            message={`Are you sure you want to delete the budget for ${monthNames[selectedMonth - 1]} ${selectedYear}? This action cannot be undone.`}
            onConfirm={handleDeleteBudget}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MonthlyBudgetPage;
