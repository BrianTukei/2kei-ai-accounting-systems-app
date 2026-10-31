import './env';
import { fileURLToPath } from 'url';
import path from 'path';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { runJobWorker } from './workers/jobWorker';
import apiRoutes from './routes';
import advancedAIRoutes from './routes/advancedAI';
import enhancedAIRoutes from './routes/enhancedAI';
import adminMessagingRoutes from './routes/adminMessaging';
import adminEmailRoutes from './routes/adminEmail';
import autonomousBookkeepingRoutes from './routes/autonomousBookkeeping';
import receiptScanningRoutes from './routes/receiptScanning';
import demoRoutes from './routes/demo';
import companyRoutes from './routes/company';
import subscriptionRoutes from './routes/subscription';
import forexRoutes from './routes/forex';
import countryRoutes from './routes/countries';
import billingRoutes from './routes/billing-simple';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ──────────────────────────────────────
app.use(
  helmet({
    // SPA serves its own assets; tighten CSP later if needed
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────
const productionOrigins = [
  process.env.APP_URL,
  'https://briantukei-2kei-ai-accounting-systems-app.onrender.com',
].filter(Boolean) as string[];

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? productionOrigins
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8080',
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Body parsers (size limits) ────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts on this endpoint, try again later' },
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Email send limit reached, try again later' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', strictLimiter);
app.use('/api/admin', strictLimiter);
app.use('/api/admin/send-email', emailLimiter);
app.use('/api/admin/broadcast-email', emailLimiter);
app.use('/api/admin/broadcasts', emailLimiter);

// ── Static files (production) ─────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// ── API routes ────────────────────────────────────────────
app.use('/api', apiRoutes);
app.use('/api/advanced-ai', advancedAIRoutes);
app.use('/api/enhanced-ai', enhancedAIRoutes);
app.use('/api/admin-messaging', adminMessagingRoutes);
app.use('/api/admin/broadcasts', adminEmailRoutes);
app.use('/api/autonomous-bookkeeping', autonomousBookkeepingRoutes);
app.use('/api/receipt-scanning', receiptScanningRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/billing', billingRoutes);

// ── Health (public, no secrets) ───────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '2K AI Accounting Systems Backend',
    version: '1.0.0',
  });
});

// ── SPA catch-all (production) ────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// ── Error handler ─────────────────────────────────────────
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Server error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        details: 'Maximum file size is 10MB',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        details: 'Only single file uploads are allowed',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 2K AI Accounting Systems Backend running on port ${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode - CORS enabled for localhost');
  }

  runJobWorker().catch((err) => {
    console.error('Failed to start Job Worker:', err);
  });
});

export default app;
