import { useState, useEffect } from 'react';
import { dashboardAPI, transactionAPI, budgetAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export const useDashboard = () => {
  const [data, setData] = useState({
    stats: {
      totalBalance: { value: 0, change: 0, trend: 'up' },
      monthlyIncome: { value: 0, change: 0, trend: 'up' },
      monthlyExpenses: { value: 0, change: 0, trend: 'up' },
      savingsRate: { value: 0, change: 0, trend: 'up' }
    },
    recentTransactions: [],
    budgetSummary: {
      totalBudgeted: 0,
      totalSpent: 0,
      totalRemaining: 0,
      overallPercentage: 0,
      budgetCount: 0,
      budgetProgress: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [statsResponse, transactionsResponse, budgetResponse] = await Promise.all([
        dashboardAPI.getFinancialStats().catch(() => ({ data: { data: { stats: data.stats } } })),
        transactionAPI.getAll(1, 5).catch(() => ({ data: { data: [] } })),
        budgetAPI.getAll().catch(() => ({ data: { data: { budgets: [] } } }))
      ]);

      // Process the data
      const newData = {
        stats: statsResponse.data.data?.stats || data.stats,
        recentTransactions: transactionsResponse.data.data || [],
        budgetSummary: {
          totalBudgeted: 0,
          totalSpent: 0,
          totalRemaining: 0,
          overallPercentage: 0,
          budgetCount: budgetResponse.data.data?.budgets?.length || 0,
          budgetProgress: []
        }
      };

      setData(newData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refreshData
  };
};

export default useDashboard;
