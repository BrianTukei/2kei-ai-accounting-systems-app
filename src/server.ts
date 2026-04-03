import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes';
import advancedAIRoutes from './routes/advancedAI';
import enhancedAIRoutes from './routes/enhancedAI';
import adminMessagingRoutes from './routes/adminMessaging';
import autonomousBookkeepingRoutes from './routes/autonomousBookkeeping';
import receiptScanningRoutes from './routes/receiptScanning';
import demoRoutes from './routes/demo';
import companyRoutes from './routes/company';
import subscriptionRoutes from './routes/subscription';
import forexRoutes from './routes/forex';
import countryRoutes from './routes/countries';
import billingRoutes from './routes/billing-simple';
// import adminBillingRoutes from './routes/adminBilling-working';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'file://', 'null'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API routes
app.use('/api', apiRoutes);
app.use('/api/advanced-ai', advancedAIRoutes);
app.use('/api/enhanced-ai', enhancedAIRoutes);
app.use('/api/admin-messaging', adminMessagingRoutes);
app.use('/api/autonomous-bookkeeping', autonomousBookkeepingRoutes);
app.use('/api/receipt-scanning', receiptScanningRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/billing', billingRoutes);
// app.use('/api/admin/billing', adminBillingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '2K AI Accounting Systems Backend',
    version: '1.0.0'
  });
});

// Catch-all handler for SPA (in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      details: 'Maximum file size is 10MB'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected field',
      details: 'Only single file uploads are allowed'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 2K AI Accounting Systems Backend running on port ${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode - CORS enabled for localhost');
  }
});

export default app;
