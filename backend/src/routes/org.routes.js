import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as orgController from '../controllers/org.controller.js';

const router = Router();
router.use(authenticate);

router.get('/branding', orgController.getBranding);
router.patch('/branding', requireAdmin, orgController.updateBranding);

export default router;
