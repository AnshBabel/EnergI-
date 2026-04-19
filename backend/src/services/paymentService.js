import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { queuePaymentSuccessNotification } from './notificationService.js';
import { formatPaise } from '../utils/billingEngine.js';

export const createCheckoutSession = async (organizationId, billId, userId) => {
  const bill = await Bill.findOne({ _id: billId, organizationId, userId });
  if (!bill) throw Object.assign(new Error('Bill not found'), { status: 404 });
  
  if (bill.status === 'PAID') throw Object.assign(new Error('Bill is already paid'), { status: 400 });
  if (bill.status === 'DISPUTED') throw Object.assign(new Error('Payment is frozen while bill is in dispute'), { status: 403 });
  if (bill.status === 'WAIVED') throw Object.assign(new Error('This bill has been waived'), { status: 400 });

  let amountToPayInPaise = bill.totalInPaise;
  let ebDiscountApplied = 0;

  if (bill.earlyBird && bill.earlyBird.discountPercent > 0) {
    const isEligible = new Date() <= new Date(bill.earlyBird.eligibleUntil);
    if (isEligible) {
      ebDiscountApplied = bill.earlyBird.discountAmountInPaise;
      amountToPayInPaise = bill.totalInPaise - ebDiscountApplied;
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'inr',
          unit_amount: amountToPayInPaise, // Stripe uses smallest unit (paise for INR)
          product_data: {
            name: `Electricity Bill — ${bill.billingPeriod.month}/${bill.billingPeriod.year}`,
            description: `${bill.unitsConsumed} units consumed${ebDiscountApplied > 0 ? ' (Early-Bird Discount Applied)' : ''}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { 
      billId: billId.toString(), 
      userId: userId.toString(), 
      organizationId: organizationId.toString(),
      ebDiscountApplied: ebDiscountApplied.toString()
    },
    success_url: `${env.FRONTEND_URL}/payment/status?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${env.FRONTEND_URL}/payment/status?success=false`,
  });

  return { url: session.url, sessionId: session.id };
};

export const handleWebhook = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw Object.assign(new Error(`Webhook signature verification failed: ${err.message}`), { status: 400 });
  }

  // IDEMPOTENCY CHECK — skip if already processed
  const existing = await Payment.findOne({ stripeEventId: event.id });
  if (existing) {
    return { alreadyProcessed: true };
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { billId, userId, organizationId } = session.metadata;

    // Create immutable payment record
    const payment = await Payment.create({
      organizationId,
      billId,
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      stripeEventId: event.id, // idempotency key
      amountInPaise: session.amount_total,
      status: 'SUCCESS',
      processedAt: new Date(),
    });

    // Mark bill as paid
    await Bill.findByIdAndUpdate(billId, { status: 'PAID' });

    // Queue payment success notification
    const [bill, user] = await Promise.all([
      Bill.findById(billId),
      User.findById(userId),
    ]);
    queuePaymentSuccessNotification(payment, bill, user).catch(console.error);
  }

  return { received: true };
};

/**
 * Refund a successful payment via Stripe and update internal records
 */
export const refundPayment = async (organizationId, paymentId) => {
  const payment = await Payment.findOne({ _id: paymentId, organizationId });
  if (!payment) throw Object.assign(new Error('Payment not found'), { status: 404 });
  if (payment.status !== 'SUCCESS') throw Object.assign(new Error('Only successful payments can be refunded'), { status: 400 });

  // 1. Trigger Stripe Refund
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    reason: 'requested_by_customer',
    metadata: { paymentId: paymentId.toString(), billId: payment.billId.toString() }
  });

  // 2. Update Payment record
  payment.status = 'REFUNDED';
  payment.processedAt = new Date();
  await payment.save();

  // 3. Mark the Bill back to UNPAID (or a new REFUNDED status if preferred)
  await Bill.findByIdAndUpdate(payment.billId, { status: 'UNPAID' });

  return { refundId: refund.id, status: 'REFUNDED' };
};

/**
 * List all payments for an organization (Admin only)
 */
export const listAllPayments = async (organizationId, { limit = 20, page = 1 }) => {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find({ organizationId })
      .populate('userId', 'name email')
      .populate('billId', 'billingPeriod totalInPaise')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ organizationId })
  ]);

  return { payments, total, pages: Math.ceil(total / limit) };
};
