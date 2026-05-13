import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat', authenticate, aiController.getChatResponse);
router.get('/insights', authenticate, aiController.getInsights);
router.get('/admin/anomalies', authenticate, aiController.getAdminAnomalies);

export default router;
