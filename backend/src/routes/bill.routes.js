import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as billController from '../controllers/bill.controller.js';

const router = Router();

// Shared/Consumer static routes (Must come first)
router.get('/my', authenticate, billController.listByUser);
router.get('/my-history', authenticate, billController.userHistory);
router.get('/my-intelligence', authenticate, billController.getIntelligence);

// Admin routes
router.get('/analytics', authenticate, requireAdmin, billController.analytics);
router.get('/history', authenticate, requireAdmin, billController.history);
router.get('/export', authenticate, requireAdmin, billController.exportCsv);
router.post('/run-cycle', authenticate, requireAdmin, billController.runCycle);
router.get('/', authenticate, requireAdmin, billController.listByOrg);
router.post('/user/:userId', authenticate, requireAdmin, billController.generate);
router.get('/user/:userId', authenticate, requireAdmin, billController.listByUser);

// Parameter-based routes (Must come last)
router.get('/:id', authenticate, billController.getOne);
router.get('/:id/pdf', authenticate, billController.downloadPdf);

export default router;
