const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(
      `🍃 MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`.cyan.underline
    );

    // Log database events
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB'.green);
    });

    mongoose.connection.on('error', (err) => {
      console.log(`❌ Mongoose connection error: ${err}`.red.bold);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB'.yellow);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination'.cyan);
      process.exit(0);
    });

  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`.red.bold);
    
    // Log specific connection errors
    if (error.name === 'MongoNetworkError') {
      console.log('🌐 Network error - check your internet connection and MongoDB URI'.yellow);
    } else if (error.name === 'MongoAuthenticationError') {
      console.log('🔐 Authentication failed - check your MongoDB credentials'.yellow);
    } else if (error.name === 'MongoParseError') {
      console.log('📝 URI parse error - check your MongoDB connection string format'.yellow);
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'Database connection is active',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      readyState: mongoose.connection.readyState
    };
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    
    return {
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      objects: stats.objects
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

// Environment-specific configurations
const getMongoURI = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'test':
      return process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/cashcompass-test';
    case 'production':
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is required in production');
      }
      return process.env.MONGO_URI;
    default:
      return process.env.MONGO_URI || 'mongodb://localhost:27017/cashcompass';
  }
};

// Validate MongoDB URI format
const validateMongoURI = (uri) => {
  const mongoURIRegex = /^mongodb(\+srv)?:\/\/.+/;
  if (!mongoURIRegex.test(uri)) {
    throw new Error('Invalid MongoDB URI format');
  }
  return true;
};

// Initialize database with validation
const initializeDatabase = async () => {
  try {
    const mongoURI = getMongoURI();
    validateMongoURI(mongoURI);
    
    // Override the MONGO_URI for the connection
    process.env.MONGO_URI = mongoURI;
    
    await connectDB();
    
    console.log(`🎯 Database initialized for ${process.env.NODE_ENV} environment`.green.bold);
    
  } catch (error) {
    console.log(`❌ Database initialization failed: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  checkDatabaseHealth,
  getDatabaseStats,
  getMongoURI,
  validateMongoURI,
  initializeDatabase
};
