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
    const result = await paymentService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    err.status = err.status || 400;
    next(err);
  }
};

export const listAll = async (req, res, next) => {
  try {
    const { limit, page } = req.query;
    const result = await paymentService.listAllPayments(
      req.user.organizationId,
      { limit: parseInt(limit) || 20, page: parseInt(page) || 1 }
    );
    res.json(result);
  } catch (err) { next(err); }
};

export const refund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const result = await paymentService.refundPayment(
      req.user.organizationId,
      paymentId
    );
    res.json(result);
  } catch (err) { next(err); }
};
