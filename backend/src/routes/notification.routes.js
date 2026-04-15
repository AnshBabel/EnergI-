import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = Router();
router.use(authenticate);

router.get('/my', async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) { next(err); }
});

export default router;
