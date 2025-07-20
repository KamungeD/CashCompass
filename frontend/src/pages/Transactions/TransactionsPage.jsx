import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Edit3,
  Trash2,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { transactionAPI } from '../../services/api';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import TransactionForm from '../../components/forms/TransactionForm/TransactionForm';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const TransactionsPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll(pagination.page, pagination.limit, filters);
      
      // Ensure we have the correct data structure
      const responseData = response.data;
      let transactionsData = [];
      let totalCount = 0;
      let totalPagesCount = 0;

      if (responseData && responseData.data) {
        // The backend returns: { success: true, data: { transactions: [], pagination: {} } }
        if (Array.isArray(responseData.data.transactions)) {
          transactionsData = responseData.data.transactions;
        }
        
        // Extract pagination info
        if (responseData.data.pagination) {
          totalCount = responseData.data.pagination.total || 0;
          totalPagesCount = responseData.data.pagination.pages || 0;
        }
      }

      setTransactions(transactionsData);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
        totalPages: totalPagesCount
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      // Ensure transactions is always an array even on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      await transactionAPI.create(transactionData);
      toast.success('Transaction added successfully!');
      setShowAddForm(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleEditTransaction = async (transactionData) => {
    try {
      await transactionAPI.update(editingTransaction._id, transactionData);
      toast.success('Transaction updated successfully!');
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(transactionId);
      toast.success('Transaction deleted successfully!');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getTransactionIcon = (type) => {
    return type === 'income' ? (
      <TrendingUp className="h-5 w-5 text-green-500" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-500" />
    );
  };

  const formatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
    
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  if (loading && transactions.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Transactions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track and manage your income and expenses
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              size="md"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transport</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
            </select>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="From date"
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by adding your first transaction
            </p>
            <Button
              variant="primary"
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {transaction.description || 'No description'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {transaction.category?.icon && <span className="mr-1">{transaction.category.icon}</span>}
                          {transaction.category?.name || transaction.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {loading ? 'Loading transactions...' : 'No transactions found'}
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {(showAddForm || editingTransaction) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTransaction(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <TransactionForm
                initialData={editingTransaction}
                onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingTransaction(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
