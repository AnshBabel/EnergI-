import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat', authenticate, aiRateLimit, aiController.getChatResponse);
router.get('/insights', authenticate, aiRateLimit, aiController.getInsights);
router.get('/admin/anomalies', authenticate, aiRateLimit, aiController.getAdminAnomalies);

export default router;
