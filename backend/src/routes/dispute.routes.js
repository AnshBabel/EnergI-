import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as disputeController from '../controllers/dispute.controller.js';

const router = Router();
router.use(authenticate);

// Consumer
router.post('/bill/:billId', disputeController.raise);
router.get('/my', disputeController.listForConsumer);

// Admin
router.get('/', requireAdmin, disputeController.listForAdmin);
router.patch('/:id/resolve', requireAdmin, disputeController.resolve);
router.patch('/:id/status', requireAdmin, disputeController.updateStatus);

export default router;
