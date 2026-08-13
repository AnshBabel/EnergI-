import crypto from 'crypto';
import { loggerStorage } from '../utils/logger.js';

export const correlationMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  res.setHeader('X-Request-ID', requestId);
  
  req.id = requestId;

  const store = {
    requestId,
    organizationId: null
  };

  loggerStorage.run(store, next);
};
