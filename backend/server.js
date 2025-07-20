const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const colors = require('colors');

// Load environment variables
dotenv.config();

// Import database connection
const { connectDB } = require('./config/database');

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all localhost origins in development
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test' && process.env.DISABLE_RATE_LIMIT_TEST === 'true';
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'type']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CashCompass API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// API routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CashCompass API',
    version: '1.0.0',
    author: 'Duncan Kamunge (@KamungeD)',
    documentation: `${req.protocol}://${req.get('host')}${apiPrefix}/docs`,
    health: `${req.protocol}://${req.get('host')}/health`
  });
});

// API routes
app.use(`${apiPrefix}`, apiRoutes);

// Catch-all for API documentation placeholder
app.get(`${apiPrefix}/docs`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CashCompass API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: `${apiPrefix}/auth`,
      transactions: `${apiPrefix}/transactions`,
      budgets: `${apiPrefix}/budgets`,
      categories: `${apiPrefix}/categories`,
      health: `${apiPrefix}/health`
    },
    authEndpoints: {
      register: `POST ${apiPrefix}/auth/register`,
      login: `POST ${apiPrefix}/auth/login`,
      profile: `GET ${apiPrefix}/auth/profile`,
      logout: `POST ${apiPrefix}/auth/logout`,
      forgotPassword: `POST ${apiPrefix}/auth/forgot-password`,
      resetPassword: `POST ${apiPrefix}/auth/reset-password`
    },
    transactionEndpoints: {
      list: `GET ${apiPrefix}/transactions`,
      create: `POST ${apiPrefix}/transactions`,
      details: `GET ${apiPrefix}/transactions/:id`,
      update: `PUT ${apiPrefix}/transactions/:id`,
      delete: `DELETE ${apiPrefix}/transactions/:id`,
      stats: `GET ${apiPrefix}/transactions/stats`
    },
    categoryEndpoints: {
      list: `GET ${apiPrefix}/categories`,
      create: `POST ${apiPrefix}/categories`,
      tree: `GET ${apiPrefix}/categories/tree`,
      search: `GET ${apiPrefix}/categories/search`
    },
    budgetEndpoints: {
      list: `GET ${apiPrefix}/budgets`,
      create: `POST ${apiPrefix}/budgets`,
      active: `GET ${apiPrefix}/budgets/active`,
      stats: `GET ${apiPrefix}/budgets/stats`
    },
    github: 'https://github.com/KamungeD/cashcompass',
    author: 'Duncan Kamunge (@KamungeD)'
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `🚀 CashCompass Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
  console.log(`📖 API Documentation: http://localhost:${PORT}${apiPrefix}/docs`.cyan);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`.green);
  console.log(`👨‍💻 Author: Duncan Kamunge (@KamungeD)`.magenta);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`.red.bold);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`.red.bold);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = app;
