import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { exportBackup, verifyBackupData } from '../controllers/backup.controller.js';

const router = Router();

// Route restricted to ADMIN and SUPER_ADMIN roles
const requireAdminRole = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required' });
  }
  next();
};

router.get('/export', authenticate, requireAdminRole, exportBackup);
router.post('/verify', authenticate, requireAdminRole, verifyBackupData);

export default router;
