import axios from 'axios';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
  backoffFactor: 2
};

// Request tracking for rate limiting
let requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // Minimum 200ms between requests

// Retry logic with exponential backoff
const retryRequest = async (originalRequest, retryCount = 0) => {
  if (retryCount >= RATE_LIMIT_CONFIG.maxRetries) {
    throw new Error('Maximum retry attempts exceeded');
  }

  const delay = Math.min(
    RATE_LIMIT_CONFIG.baseDelay * Math.pow(RATE_LIMIT_CONFIG.backoffFactor, retryCount),
    RATE_LIMIT_CONFIG.maxDelay
  );
  
  console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${RATE_LIMIT_CONFIG.maxRetries})`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  try {
    // Use the retry instance to avoid interceptor loops
    const retryConfig = {
      method: originalRequest.method,
      url: originalRequest.url,
      data: originalRequest.data,
      headers: originalRequest.headers,
      params: originalRequest.params
    };
    
    return await retryApi(retryConfig);
  } catch (error) {
    if (error.response?.status === 429) {
      // Recursive retry with incremented count
      return retryRequest(originalRequest, retryCount + 1);
    }
    throw error;
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for retries (without interceptors)
const retryApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request throttling to prevent rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
    
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
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 429 Too Many Requests with retry logic
    if (error.response?.status === 429 && !originalRequest._isRetry) {
      originalRequest._isRetry = true; // Prevent infinite retry loops
      
      try {
        const response = await retryRequest(originalRequest, 0);
        return response;
      } catch (retryError) {
        console.error('🚫 Rate limiting: Max retries exceeded');
        return Promise.reject({
          ...error,
          message: 'Server is busy. Please try again in a few moments.',
          userMessage: 'Too many requests. Please wait a moment and try again.'
        });
      }
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - API server may be down');
      error.message = 'Network error. Please check your connection.';
    }
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
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
  
  // Alias for getAll - for compatibility
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters);
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

// Force reload - Transaction API methods are now available

// Budget API functions
export const budgetAPI = {
  // Get all budgets
  getAll: () => {
    console.log('📊 Fetching budgets from API...');
    return api.get('/budgets');
  },
  getBudgets: () => {
    console.log('📊 Fetching budgets from API (alias)...');
    return api.get('/budgets');
  }, // Alias for getAll
  
  // Get single budget
  getById: (id) => api.get(`/budgets/${id}`),
  
  // Create new budget
  create: (data) => {
    console.log('🚀 Sending budget data to API:', data);
    return api.post('/budgets', data);
  },
  createBudget: (data) => {
    console.log('🚀 Sending budget data to API (alias):', data);
    return api.post('/budgets', data);
  }, // Alias for create
  
  // Update budget
  update: (id, data) => api.put(`/budgets/${id}`, data),
  updateBudget: (id, data) => api.put(`/budgets/${id}`, data), // Alias for update
  
  // Delete budget
  delete: (id) => api.delete(`/budgets/${id}`),
  deleteBudget: (id) => api.delete(`/budgets/${id}`), // Alias for delete
  
  // Get budget progress
  getProgress: (id) => api.get(`/budgets/${id}/progress`),
};

// Force reload - Budget API methods are now available

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

// Annual Budget API
export const annualBudgetAPI = {
  // Get annual budget for specific year
  getAnnualBudget: (year) => api.get(`/annual-budgets/${year}`),
  
  // Create or update annual budget
  createOrUpdateBudget: (data) => api.post('/annual-budgets', data),
  
  // Get budget performance analysis
  getBudgetPerformance: (year) => api.get(`/annual-budgets/${year}/performance`),
  
  // Get monthly breakdown
  getMonthlyBreakdown: (year) => api.get(`/annual-budgets/${year}/monthly`),
  
  // Sync budget with transactions
  syncWithTransactions: (year) => api.post(`/annual-budgets/${year}/sync`),
  
  // Get budget template
  getBudgetTemplate: () => api.get('/annual-budgets/template'),
  
  // Delete annual budget
  deleteAnnualBudget: (year) => api.delete(`/annual-budgets/${year}`)
};

export default api;
