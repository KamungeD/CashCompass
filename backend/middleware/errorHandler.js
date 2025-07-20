const colors = require('colors');

// Custom Error class
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(err.stack.red);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new ErrorResponse(message, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again';
    error = new ErrorResponse(message, 401);
  }

  // Express rate limit error
  if (err.status === 429) {
    const message = 'Too many requests. Please try again later';
    error = new ErrorResponse(message, 429);
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    const message = 'Cross-Origin Request Blocked';
    error = new ErrorResponse(message, 403);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new ErrorResponse(message, 413);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new ErrorResponse(message, 400);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: error.status || 'error',
    message,
    statusCode
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  // Add request info for debugging
  if (process.env.NODE_ENV === 'development') {
    errorResponse.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
  }

  // Log error for monitoring (in production)
  if (process.env.NODE_ENV === 'production') {
    console.error({
      error: message,
      statusCode,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent')
    });
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found middleware (404 handler)
const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new ErrorResponse(message, 404);
  next(error);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value
  }));
};

// Custom error classes for specific scenarios
class AuthenticationError extends ErrorResponse {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends ErrorResponse {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class ValidationError extends ErrorResponse {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class NotFoundError extends ErrorResponse {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends ErrorResponse {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class BadRequestError extends ErrorResponse {
  constructor(message = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  formatValidationErrors,
  ErrorResponse,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  BadRequestError
};
