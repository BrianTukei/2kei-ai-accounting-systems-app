const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import error handler
const { globalErrorHandler } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const subscriptionRoutes = require('./routes/subscription');
const forexRoutes = require('./routes/forex');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const billingRoutes = require('./routes/billing');
const adminMessagingRoutes = require('./routes/adminMessaging');
const broadcastRoutes = require('./routes/broadcastRoutes');
const documentProcessingRoutes = require('./routes/documentProcessing');
const demoRoutes = require('./routes/demo');

// Import subscription jobs
const { initializeSubscriptionJobs } = require('./jobs/subscriptionJobs');

// Import middleware
const { authenticate } = require('./middleware/auth');
const { generalLimiter, authLimiter, passwordLimiter, emailLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/validation');

// Import workers
require('./workers/emailWorker');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '2K AI Accounting API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Step 9: System health check with stats
app.get('/api/system/health', async (req, res) => {
  try {
    const Company = require('./models/Company');
    const User = require('./models/User');
    const DemoBooking = require('./models/DemoBooking');
    
    // Fallback if collections are not ready
    let companies = 0, users = 0, bookings = 0;
    try { companies = await Company.countDocuments(); } catch(e){}
    try { users = await User.countDocuments(); } catch(e){}
    try { bookings = await DemoBooking.countDocuments(); } catch(e){}

    res.status(200).json({
      companies,
      users,
      bookings,
      status: "healthy"
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/company', authenticate, companyRoutes);
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/forex', authenticate, forexRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/billing', authenticate, billingRoutes); // Billing routes with auth protection
app.use('/api/admin/messages', adminMessagingRoutes); // Admin messaging routes
app.use('/api/admin/broadcasts', broadcastRoutes); // Admin Broadcast Routes
app.use('/api/documents', documentProcessingRoutes); // AI Parser Queue Routes
app.use('/api/demo', demoRoutes); // Public demo booking routes
app.use('/api/admin', adminRoutes);
  app.use('/api/system', require('./routes/systemRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '2K AI Accounting API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      company: '/api/company',
      subscription: '/api/subscription',
      forex: '/api/forex',
      transactions: '/api/transactions',
      billing: '/api/billing',
      admin: '/api/admin'
    },
    documentation: 'https://github.com/BrianTukei/2kei-ai-accounting-systems-app'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(globalErrorHandler);

// Validate required environment variables
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const requiredInAllEnvs = ['JWT_SECRET'];
  const requiredInProduction = ['MONGODB_URI'];
  const optionalIntegrations = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

  const missingRequired = requiredInAllEnvs.filter((varName) => !process.env[varName]);
  const missingProdOnly = isProduction
    ? requiredInProduction.filter((varName) => !process.env[varName])
    : [];

  if (missingRequired.length > 0 || missingProdOnly.length > 0) {
    const missing = [...missingRequired, ...missingProdOnly];
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Set these in your environment and redeploy/restart.');
    process.exit(1);
  }

  // Validate JWT secret strength in production (keep dev flexible)
  if (isProduction && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long in production');
    process.exit(1);
  }

  // Warn about development defaults
  if (process.env.JWT_SECRET === 'your_super_secret_key_here') {
    if (isProduction) {
      console.error('❌ Default JWT_SECRET is not allowed in production');
      process.exit(1);
    }
    console.warn('⚠️  Using default JWT secret in development');
  }

  const missingOptional = optionalIntegrations.filter((varName) => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn('⚠️ Optional integrations not configured:', missingOptional.join(', '));
    console.warn('   Supabase-dependent features may be unavailable.');
  }

  console.log('✅ Environment variables validated');
};

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2k_accounting', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Step 8: Seed Demo Data Automatically
    const seedDemoData = require('./utils/seedDemoData');
    await seedDemoData();
    
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.error('❌ Database connection error: Could not connect to MongoDB.');
      console.error('👉 Please ensure MongoDB is installed and running locally, or configure MONGODB_URI in your .env file.');
    } else {
      console.error('❌ Database connection error:', error.message);
    }
    process.exit(1);
  }
};

// Import core stability tools
const { initWorker } = require('./workers/processor');

// Init process queue
initWorker();

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  validateEnvironment();
  await connectDB();
  
  // Initialize subscription management jobs
  if (process.env.ENABLE_BILLING === 'true') {
    initializeSubscriptionJobs();
  }
  
  app.listen(PORT, () => {
    console.log(`
🚀 2K AI Accounting Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📚 API Docs: http://localhost:${PORT}/api
🏥 Health Check: http://localhost:${PORT}/health
    `);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = app;
