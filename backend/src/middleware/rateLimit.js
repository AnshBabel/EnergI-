import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const authRateLimit = rateLimit({
  windowMs: env.NODE_ENV === 'development' ? 1000 : 15 * 60 * 1000, // 1 second in dev, 15 minutes otherwise
  max: env.NODE_ENV === 'development' ? 10000 : 5, // 10,000 attempts in dev, 5 otherwise
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // only count failed attempts
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down.' },
});

