import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { list } from '../controllers/auditLog.controller.js';

const router = Router();

// Only ADMIN role has access, and list controller locks query to req.user.organizationId
router.get('/', authenticate, (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required' });
  }
  next();
}, list);

export default router;
