import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Security headers
app.use(helmet());

app.use('/uploads', express.static('uploads'));

// Serve Frontend Static Files (Production)
const distPath = path.join(__dirname, '../../frontend/dist/energi-frontend/browser');
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for Angular routes (must come after API routes)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If index.html is missing (e.g. build not run), fall back to 404
      res.status(404).json({ error: 'Frontend not found' });
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
