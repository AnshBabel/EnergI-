import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

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
import superAdminRoutes from './routes/superadmin.routes.js';

import { checkMaintenance } from './middleware/maintenance.js';

const app = express();

// Security headers (Allow Google Fonts & inline styles for production rendering)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use('/uploads', express.static('uploads'));

// Dynamically resolve Angular build output directory (supports browser/ subfolder or root dist)
const distBrowserPath = path.join(__dirname, '../../frontend/dist/energi-frontend/browser');
const distRootPath = path.join(__dirname, '../../frontend/dist/energi-frontend');
const distPath = fs.existsSync(distBrowserPath) ? distBrowserPath : distRootPath;
app.use(express.static(distPath));

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true, // allow cookies
}));

// Raw body for Stripe webhook (must come before express.json())
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
// Body parsing
app.use(express.json());
app.use(cookieParser());

// Maintenance Check (Global for API)
app.use('/api', checkMaintenance);

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

// Google Search Console Verification Endpoint
app.get('/googleca46d16ff5497787.html', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('google-site-verification: googleca46d16ff5497787.html');
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('🔥 Global Error Handler:', err.message);
  if (res.headersSent) {
    console.warn('⚠️ Headers already sent, closing connection.');
    return res.end();
  }
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
