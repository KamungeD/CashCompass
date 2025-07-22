// Security middleware configuration for production
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Content Security Policy
const cspConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
    },
  },
  crossOriginEmbedderPolicy: false
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' 
    ? 1000 // Much higher limit for development
    : (process.env.RATE_LIMIT_MAX_REQUESTS || 100), // production limit
  message: {
    error: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health';
  }
};

// Stricter rate limiting for auth endpoints
const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' 
    ? 100 // Much higher limit for development (instead of 5)
    : 5, // production limit - only 5 auth attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  cspConfig,
  rateLimitConfig,
  authRateLimitConfig,
  
  // Additional security headers
  securityHeaders: helmet({
    ...cspConfig,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  }),
  
  // Rate limiters
  generalLimiter: rateLimit(rateLimitConfig),
  authLimiter: rateLimit(authRateLimitConfig),
};
