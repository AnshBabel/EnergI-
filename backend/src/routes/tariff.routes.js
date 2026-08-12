import { Router } from 'express';
import { authenticate, requireAdmin, blockImpersonatedHighRiskOps } from '../middleware/auth.js';
import * as tariffController from '../controllers/tariff.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', tariffController.list);
router.post('/', blockImpersonatedHighRiskOps, tariffController.create);
router.patch('/:id/activate', blockImpersonatedHighRiskOps, tariffController.setActive);
router.delete('/:id', blockImpersonatedHighRiskOps, tariffController.remove);

export default router;
