import * as paymentService from '../services/paymentService.js';

export const createCheckout = async (req, res, next) => {
  try {
    const { billId } = req.params;
    const result = await paymentService.createCheckoutSession(
      req.user.organizationId,
      billId,
      req.user.userId
    );
    res.json(result);
  } catch (err) { next(err); }
};

export const webhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    // req.body is raw buffer here (set in app.js)
    const result = await paymentService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    err.status = err.status || 400;
    next(err);
  }
};
