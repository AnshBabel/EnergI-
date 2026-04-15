import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && req.method === 'GET') {
    // Allow token in query string for GET requests (e.g. PDFs in new tab)
    token = req.query.token;
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
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
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
