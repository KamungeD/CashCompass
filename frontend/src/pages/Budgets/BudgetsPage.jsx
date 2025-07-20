import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  Edit3, 
  Trash2,
  DollarSign,
  Calendar,
  PieChart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { budgetAPI, transactionAPI } from '../../services/api';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import BudgetForm from '../../components/forms/BudgetForm/BudgetForm';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const BudgetsPage = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getBudgets();
      const budgetsWithProgress = await calculateBudgetProgress(response.data.data);
      setBudgets(budgetsWithProgress);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetProgress = async (budgetList) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    try {
      const transactionsResponse = await transactionAPI.getTransactions({
        dateFrom: format(monthStart, 'yyyy-MM-dd'),
        dateTo: format(monthEnd, 'yyyy-MM-dd'),
        type: 'expense'
      });
      
      const expenses = transactionsResponse.data.data;
      
      return budgetList.map(budget => {
        const categoriesWithProgress = budget.categories.map(category => {
          const categoryExpenses = expenses.filter(exp => exp.category === category.name);
          const spent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const percentage = category.limit > 0 ? (spent / category.limit) * 100 : 0;
          
          return {
            ...category,
            spent,
            percentage: Math.min(percentage, 100),
            status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
          };
        });
        
        const totalSpent = categoriesWithProgress.reduce((sum, cat) => sum + cat.spent, 0);
        const totalBudget = categoriesWithProgress.reduce((sum, cat) => sum + cat.limit, 0);
        const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
        return {
          ...budget,
          categories: categoriesWithProgress,
          totalSpent,
          totalBudget,
          overallPercentage: Math.min(overallPercentage, 100),
          overallStatus: overallPercentage >= 100 ? 'over' : overallPercentage >= 80 ? 'warning' : 'good'
        };
      });
    } catch (error) {
      console.error('Error calculating budget progress:', error);
      return budgetList;
    }
  };

  const handleAddBudget = async (budgetData) => {
    try {
      await budgetAPI.createBudget(budgetData);
      toast.success('Budget created successfully!');
      setShowAddForm(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Failed to create budget');
    }
  };

  const handleEditBudget = async (budgetData) => {
    try {
      await budgetAPI.updateBudget(editingBudget._id, budgetData);
      toast.success('Budget updated successfully!');
      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await budgetAPI.deleteBudget(budgetId);
      toast.success('Budget deleted successfully!');
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'over':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'over':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Budgets
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Set spending limits and track your progress for {format(currentMonth, 'MMMM yyyy')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Budget</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Budget Overview Cards */}
      {budgets.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No budgets yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first budget to start tracking your spending
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Budget</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {budgets.map((budget) => (
            <div
              key={budget._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Budget Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {format(new Date(budget.month), 'MMMM yyyy')} Budget
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(budget.totalSpent || 0)} spent of {formatCurrency(budget.totalBudget || 0)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.overallStatus)}`}>
                      {budget.overallStatus === 'good' && 'On Track'}
                      {budget.overallStatus === 'warning' && 'Near Limit'}
                      {budget.overallStatus === 'over' && 'Over Budget'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBudget(budget)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget._id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {budget.overallPercentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budget.overallStatus)}`}
                    style={{ width: `${Math.min(budget.overallPercentage || 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Category Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budget.categories?.map((category, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {category.name}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(category.status)}`}>
                          {category.status === 'good' && '✓'}
                          {category.status === 'warning' && '⚠'}
                          {category.status === 'over' && '✗'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {formatCurrency(category.spent || 0)} / {formatCurrency(category.limit)}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(category.status)}`}
                          style={{ width: `${Math.min(category.percentage || 0, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {category.percentage?.toFixed(1)}% used
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {(showAddForm || editingBudget) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingBudget ? 'Edit Budget' : 'Create Budget'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingBudget(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <BudgetForm
                initialData={editingBudget}
                onSubmit={editingBudget ? handleEditBudget : handleAddBudget}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingBudget(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
