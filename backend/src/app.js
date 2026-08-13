import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { correlationMiddleware } from './middleware/correlation.js';
import { logger } from './utils/logger.js';
import { apiRateLimit } from './middleware/rateLimit.js';

import fs from 'fs';
import { isDbConnected } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/org.routes.js';
import tariffRoutes from './routes/tariff.routes.js';
import billRoutes from './routes/bill.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import disputeRoutes from './routes/dispute.routes.js';
import userRoutes from './routes/user.routes.js';
import aiRoutes from './routes/ai.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';
import superAdminRoutes from './routes/superadmin.routes.js';
import backupRoutes from './routes/backup.routes.js';

import { checkMaintenance } from './middleware/maintenance.js';

import mongoSanitize from 'express-mongo-sanitize';

const app = express();

// Track correlation ID for all incoming requests
app.use(correlationMiddleware);

// Security headers (Tailored for Angular 18, Google Fonts, and Stripe)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://generativelanguage.googleapis.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use('/uploads', express.static('uploads'));

// Dynamically resolve Angular build output directory
const distBrowserPath = path.join(__dirname, '../../frontend/dist/energi-frontend/browser');
const distRootPath = path.join(__dirname, '../../frontend/dist/energi-frontend');
const distPath = fs.existsSync(distBrowserPath) ? distBrowserPath : distRootPath;
app.use(express.static(distPath));

// CORS Configuration with strict origin check
const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:4200', 'http://localhost:5000'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like mobile apps, curl, server-to-server) or matched origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Access denied for this origin.'));
    }
  },
  credentials: true,
}));

// Raw body for Stripe webhook (must come before express.json())
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '100kb' }));

// Body parsing with strict size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Express Mongo Sanitize (Strips $ and . from user inputs to prevent NoSQL injection)
app.use(mongoSanitize());

app.use(cookieParser());

// Maintenance Check & Rate Limiting (Global for API)
app.use('/api', checkMaintenance);
app.use('/api', apiRateLimit);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/org', orgRoutes);
app.use('/api/v1/tariffs', tariffRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/org/backup', backupRoutes);

// Google Search Console Verification Endpoint
app.get('/googleca46d16ff5497787.html', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('google-site-verification: googleca46d16ff5497787.html');
});

// Health check (Liveness)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/liveness', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check (Readiness)
app.get('/health/readiness', (_req, res) => {
  const dbConnected = isDbConnected();
  if (!dbConnected) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for Angular routes (must come after API routes)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) return next();
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({ error: 'Frontend build index.html not found' });
  }
  
  res.sendFile(indexPath, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to send index.html' });
    }
  });
});

// 404 handler (for API routes only if next() was called)
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      requestId: res.getHeader('X-Request-ID') || 'unknown'
    }
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const requestId = req.id || res.getHeader('X-Request-ID') || 'unknown';
  
  let category = 'INTERNAL_ERROR';
  if (status === 400) category = 'VALIDATION_ERROR';
  else if (status === 401) category = 'AUTHENTICATION_ERROR';
  else if (status === 403) category = 'AUTHORIZATION_ERROR';
  else if (status === 404) category = 'NOT_FOUND';
  else if (status === 409) category = 'CONFLICT';
  else if (status === 429) category = 'RATE_LIMITED';

  // Log detailed server-side error with logger
  logger.error(`Error on ${req.method} ${req.url}: ${err.message}`, {
    category,
    statusCode: status,
    errorMessage: err.message,
    stack: err.stack
  });

  if (res.headersSent) {
    return res.end();
  }

  res.status(status).json({
    success: false,
    error: {
      code: category,
      message: status === 500 ? 'An internal server error occurred' : err.message,
      requestId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

export default app;
