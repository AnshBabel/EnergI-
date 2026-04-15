import Notification from '../models/Notification.js';
import Organization from '../models/Organization.js';
import { sendBillGeneratedEmail, sendPaymentSuccessEmail, sendOverdueReminderEmail } from '../utils/emailService.js';
import { formatPaise } from '../utils/billingEngine.js';

const createAndSend = async (notifData, sendFn) => {
  const notif = await Notification.create({ ...notifData, status: 'PENDING' });
  try {
    await sendFn();
    notif.status = 'SENT';
    notif.sentAt = new Date();
  } catch (err) {
    notif.status = 'FAILED';
    notif.error = err.message;
  }
  await notif.save();
  return notif;
};

export const queueBillGeneratedNotification = async (bill, user) => {
  const org = await Organization.findById(bill.organizationId);
  return createAndSend(
    {
      organizationId: bill.organizationId,
      userId: user._id,
      type: 'BILL_GENERATED',
      payload: { billId: bill._id, amount: formatPaise(bill.totalInPaise) },
    },
    () => sendBillGeneratedEmail({
      to: user.email,
      userName: user.name,
      billAmount: formatPaise(bill.totalInPaise),
      billingPeriod: bill.billingPeriod,
      dueDate: bill.dueDate,
      billId: bill._id,
      orgName: org.name,
    })
  );
};

export const queuePaymentSuccessNotification = async (payment, bill, user) => {
  const org = await Organization.findById(bill.organizationId);
  return createAndSend(
    {
      organizationId: bill.organizationId,
      userId: user._id,
      type: 'PAYMENT_SUCCESS',
      payload: { paymentId: payment._id, amount: formatPaise(payment.amountInPaise) },
    },
    () => sendPaymentSuccessEmail({
      to: user.email,
      userName: user.name,
      billAmount: formatPaise(payment.amountInPaise),
      billingPeriod: bill.billingPeriod,
      orgName: org.name,
    })
  );
};

export const queueOverdueNotification = async (bill, user) => {
  const org = await Organization.findById(bill.organizationId);
  return createAndSend(
    {
      organizationId: bill.organizationId,
      userId: user._id,
      type: 'PAYMENT_OVERDUE',
      payload: { billId: bill._id },
    },
    () => sendOverdueReminderEmail({
      to: user.email,
      userName: user.name,
      billAmount: formatPaise(bill.totalInPaise),
      dueDate: bill.dueDate,
      billId: bill._id,
      orgName: org.name,
    })
  );
};
