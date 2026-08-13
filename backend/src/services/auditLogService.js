import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';
import { loggerStorage } from '../utils/logger.js';

const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'token', 'jwt', 'secret', 'authorization', 
  'apikey', 'stripekey', 'stripewebhooksecret', 'accesstoken', 'refreshtoken'
];

/**
 * Recursively redacts sensitive fields from objects.
 */
export const sanitizeSensitiveData = (data) => {
  if (!data) return data;
  
  // Handle mongoose document conversion
  if (typeof data.toObject === 'function') {
    data = data.toObject();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeSensitiveData);
  }

  if (typeof data === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = sanitizeSensitiveData(val);
      }
    }
    return clean;
  }

  return data;
};

/**
 * Creates an audit record in the database.
 * Fails gracefully to system log if MongoDB insert fails, avoiding blocking core business flow.
 */
export const record = async ({
  req,
  action,
  targetModel,
  targetId,
  before,
  after,
  status = 'SUCCESS',
}) => {
  try {
    const store = loggerStorage.getStore();
    const requestId = req?.id || store?.requestId || null;
    const organizationId = req?.user?.organizationId || store?.organizationId;
    const actorId = req?.user?.userId;
    const actorRole = req?.user?.role;

    if (!organizationId || !actorId) {
      // Avoid creating logs without valid actor/tenant context
      return null;
    }

    const sanitizedBefore = before ? sanitizeSensitiveData(before) : undefined;
    const sanitizedAfter = after ? sanitizeSensitiveData(after) : undefined;

    const log = await AuditLog.create({
      organizationId,
      actorId,
      actorRole,
      action,
      targetModel,
      targetId,
      before: sanitizedBefore,
      after: sanitizedAfter,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      requestId,
      status,
    });

    logger.info(`[Audit] Action recorded: ${action}`, {
      action,
      targetModel,
      targetId,
      requestId,
    });

    return log;
  } catch (err) {
    logger.error(`[Audit] Failed to write audit log for action: ${action}`, {
      error: err.message,
      action,
    });
    return null;
  }
};
