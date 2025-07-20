const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { ErrorResponse } = require('../errorHandler');

// Protect routes - authenticate user
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return next(new ErrorResponse('Access denied. No token provided', 401));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id and check if user still exists
      const user = await User.findById(decoded.id).select('+passwordChangedAt');
      
      if (!user) {
        return next(new ErrorResponse('Invalid token. User no longer exists', 401));
      }
      
      // Check if user is active
      if (!user.isActive) {
        return next(new ErrorResponse('User account has been deactivated', 401));
      }
      
      // Check if account is locked
      if (user.isLocked) {
        return next(new ErrorResponse('Account is temporarily locked due to multiple failed login attempts', 423));
      }
      
      // Check if password was changed after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return next(new ErrorResponse('Password was recently changed. Please log in again', 401));
      }
      
      // Grant access to protected route
      req.user = user;
      next();
      
    } catch (tokenError) {
      if (tokenError.name === 'JsonWebTokenError') {
        return next(new ErrorResponse('Invalid token', 401));
      } else if (tokenError.name === 'TokenExpiredError') {
        return next(new ErrorResponse('Token has expired', 401));
      } else {
        return next(new ErrorResponse('Token verification failed', 401));
      }
    }
    
  } catch (error) {
    next(new ErrorResponse('Authentication failed', 500));
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // If no token, continue without authentication
    if (!token) {
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive && !user.isLocked) {
        req.user = user;
      }
      
    } catch (tokenError) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', tokenError.message);
    }
    
    next();
    
  } catch (error) {
    next();
  }
};

// Authorize user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Access denied. Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Access denied. Required role: ${roles.join(' or ')}`, 403));
    }
    
    next();
  };
};

// Check if user owns resource
const checkOwnership = (resourcePath = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Access denied. Authentication required', 401));
    }
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Extract resource user ID from different paths
    let resourceUserId;
    
    if (resourcePath === 'user') {
      resourceUserId = req.params.userId || req.body.user || req.user._id;
    } else if (resourcePath === 'params.id') {
      resourceUserId = req.params.id;
    } else if (resourcePath === 'body.user') {
      resourceUserId = req.body.user;
    } else {
      // Custom path handling
      resourceUserId = req.params[resourcePath] || req.body[resourcePath];
    }
    
    // Check ownership
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Access denied. You can only access your own resources', 403));
    }
    
    next();
  };
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create user request log
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(userId, validRequests);
    
    // Check if user has exceeded the limit
    if (validRequests.length >= maxRequests) {
      return next(new ErrorResponse(`Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.floor(windowMs / 60000)} minutes`, 429));
    }
    
    // Add current request
    validRequests.push(now);
    
    next();
  };
};

// Validate email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Access denied. Authentication required', 401));
  }
  
  if (!req.user.isEmailVerified) {
    return next(new ErrorResponse('Email verification required. Please verify your email address', 403));
  }
  
  next();
};

// Check two-factor authentication
const requireTwoFactor = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Access denied. Authentication required', 401));
  }
  
  if (req.user.twoFactorEnabled && !req.session?.twoFactorVerified) {
    return next(new ErrorResponse('Two-factor authentication required', 403));
  }
  
  next();
};

// Validate API key for external integrations
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return next(new ErrorResponse('API key required', 401));
    }
    
    // Find user by API key (you'd need to add apiKey field to User model)
    const user = await User.findOne({ apiKey }).select('+apiKey');
    
    if (!user || !user.isActive) {
      return next(new ErrorResponse('Invalid API key', 401));
    }
    
    req.user = user;
    req.isApiRequest = true;
    
    next();
    
  } catch (error) {
    next(new ErrorResponse('API key validation failed', 500));
  }
};

// Middleware to refresh token automatically
const refreshTokenIfNeeded = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  try {
    // Check if token is about to expire (within 1 hour)
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (token) {
      const decoded = jwt.decode(token);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // If token expires within 1 hour, issue a new one
      if (timeUntilExpiry < 3600) {
        const newToken = req.user.generateAuthToken();
        
        // Set new token in response header
        res.setHeader('X-New-Token', newToken);
        
        // Update cookie if it was used
        if (req.cookies?.token) {
          res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }
      }
    }
    
    next();
    
  } catch (error) {
    // Don't fail the request if token refresh fails
    next();
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership,
  userRateLimit,
  requireEmailVerification,
  requireTwoFactor,
  validateApiKey,
  refreshTokenIfNeeded,
  securityHeaders
};
