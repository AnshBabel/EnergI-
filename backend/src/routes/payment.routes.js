import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

// Stripe webhook — raw body, no auth
router.post('/webhook', paymentController.webhook);

// Consumer creates checkout session
router.post('/checkout/:billId', authenticate, paymentController.createCheckout);

export default router;
