// Environment configuration validation and management
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'test' 
    ? '.env.test' 
    : '.env';

const envPath = path.resolve(process.cwd(), envFile);
dotenv.config({ path: envPath });

// Required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET'
];

// Optional environment variables with defaults
const defaultEnvVars = {
  JWT_EXPIRE: '30d',
  BCRYPT_ROUNDS: '12',
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: '100',
  API_PREFIX: '/api/v1',
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
};

// Validate required environment variables
function validateEnvVars() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    process.exit(1);
  }
  
  // Set defaults for optional variables
  Object.entries(defaultEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });
  
  console.log('✅ Environment variables validated successfully');
}

// Get environment configuration
function getConfig() {
  return {
    // Server configuration
    port: parseInt(process.env.PORT, 10),
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    
    // Database configuration
    mongoUri: process.env.MONGO_URI,
    
    // Authentication configuration
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10),
    
    // Security configuration
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
    frontendUrl: process.env.FRONTEND_URL,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    
    // API configuration
    apiPrefix: process.env.API_PREFIX,
    
    // Logging configuration
    logLevel: process.env.LOG_LEVEL,
    
    // Email configuration (if implemented)
    emailHost: process.env.EMAIL_HOST,
    emailPort: process.env.EMAIL_PORT,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    
    // File upload configuration
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf'],
  };
}

module.exports = {
  validateEnvVars,
  getConfig
};
