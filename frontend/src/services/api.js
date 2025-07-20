import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error) => {
    // Log error response in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
      error.message = 'Too many requests. Please wait a moment and try again.';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - API server may be down');
      error.message = 'Network error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize auth token from localStorage
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Dashboard API functions
export const dashboardAPI = {
  // Get dashboard overview data
  getOverview: () => api.get('/dashboard/overview'),
  
  // Get recent transactions
  getRecentTransactions: (limit = 5) => api.get(`/transactions/recent?limit=${limit}`),
  
  // Get budget summary
  getBudgetSummary: () => api.get('/budgets/summary'),
  
  // Get financial stats
  getFinancialStats: () => api.get('/dashboard/stats'),
};

// Transaction API functions
export const transactionAPI = {
  // Get all transactions with pagination
  getAll: (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/transactions?${params}`);
  },
  
  // Get single transaction
  getById: (id) => api.get(`/transactions/${id}`),
  
  // Create new transaction
  create: (data) => api.post('/transactions', data),
  
  // Update transaction
  update: (id, data) => api.put(`/transactions/${id}`, data),
  
  // Delete transaction
  delete: (id) => api.delete(`/transactions/${id}`),
  
  // Get transaction categories
  getCategories: () => api.get('/categories'),
};

// Budget API functions
export const budgetAPI = {
  // Get all budgets
  getAll: () => api.get('/budgets'),
  
  // Get single budget
  getById: (id) => api.get(`/budgets/${id}`),
  
  // Create new budget
  create: (data) => api.post('/budgets', data),
  
  // Update budget
  update: (id, data) => api.put(`/budgets/${id}`, data),
  
  // Delete budget
  delete: (id) => api.delete(`/budgets/${id}`),
  
  // Get budget progress
  getProgress: (id) => api.get(`/budgets/${id}/progress`),
};

// Auth API functions
export const authAPI = {
  // User registration
  register: (data) => api.post('/auth/register', data),
  
  // User login
  login: (data) => api.post('/auth/login', data),
  
  // User logout
  logout: () => api.post('/auth/logout'),
  
  // Get user profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update user profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Change password
  changePassword: (data) => api.put('/auth/change-password', data),
};

export default api;
