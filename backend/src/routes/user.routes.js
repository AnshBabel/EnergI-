import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', userController.list);
router.post('/', userController.create);
router.get('/:id', userController.getOne);
router.patch('/:id', userController.update);

export default router;
