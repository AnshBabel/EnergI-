import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/org.routes.js';
import tariffRoutes from './routes/tariff.routes.js';
import billRoutes from './routes/bill.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import disputeRoutes from './routes/dispute.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Security headers
app.use(helmet());

app.use('/uploads', express.static('uploads'));

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true, // allow cookies
}));

// Raw body for Stripe webhook (must come before express.json())
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/uploads', express.static('uploads'));
// Body parsing
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/org', orgRoutes);
app.use('/api/v1/tariffs', tariffRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/users', userRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
