import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as tariffController from '../controllers/tariff.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', tariffController.list);
router.post('/', tariffController.create);
router.patch('/:id/activate', tariffController.setActive);
router.delete('/:id', tariffController.remove);

export default router;
