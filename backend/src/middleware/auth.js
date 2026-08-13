import { verifyAccessToken } from '../utils/jwt.js';
import { loggerStorage } from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
      isImpersonated: !!payload.isImpersonated,
      impersonatorId: payload.impersonatorId || null,
    };

    // Track organizationId in the logging store
    const store = loggerStorage.getStore();
    if (store) {
      store.organizationId = payload.organizationId;
    }

    // Track activity in background
    if (process.env.NODE_ENV !== 'test') {
      import('../models/User.js').then(m => {
        m.default.findByIdAndUpdate(payload.userId, { lastActiveAt: new Date() }).exec().catch(() => {});
      }).catch(() => {});
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const blockImpersonatedHighRiskOps = (req, res, next) => {
  if (req.user?.isImpersonated) {
    return res.status(403).json({ error: 'High-risk operation denied for impersonated session' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireConsumer = (req, res, next) => {
  if (req.user?.role !== 'CONSUMER') {
    return res.status(403).json({ error: 'Consumer access required' });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
};
