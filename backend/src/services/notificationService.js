import Notification from '../models/Notification.js';
import Organization from '../models/Organization.js';
import { sendBillGeneratedEmail, sendPaymentSuccessEmail, sendOverdueReminderEmail } from '../utils/emailService.js';
import { formatPaise } from '../utils/billingEngine.js';
import Bill from '../models/Bill.js';
import { generateMockData } from '../utils/mockData.js';

export const listNotifications = async (organizationId, { userId, page = 1, limit = 20, forceDemo = false } = {}) => {
  if (forceDemo) {
    const { notifications, users } = generateMockData(organizationId);
    // For individual consumer demo, we always show data for the first mock persona
    const demoUser = users[0];
    const userNotifs = userId ? notifications.filter(n => n.userId.toString() === demoUser._id.toString()) : notifications;
    return { notifications: userNotifs, total: userNotifs.length };
  }
  
  const query = { organizationId };
  if (userId) query.userId = userId;
  
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .populate('userId', 'name email consumerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
  ]);
  
  return { notifications, total };
};

const createAndSend = async (notifData, sendFn) => {
  if (notifData.skipStorage) {
    console.log(`[Showcase] Simulating ${notifData.type} notification for user ${notifData.userId}`);
    return { ...notifData, status: 'SENT', sentAt: new Date(), isSimulated: true };
  }

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
  
  // Find previous bill to check trend
  const previousBill = await Bill.findOne({
    userId: user._id,
    _id: { $ne: bill._id }
  }).sort({ billDate: -1 });

  let usageTrend = null;
  if (previousBill && previousBill.unitsConsumed > 0) {
    const change = ((bill.unitsConsumed - previousBill.unitsConsumed) / previousBill.unitsConsumed) * 100;
    if (change > 15) { // 15% threshold for "High Usage Alert"
      usageTrend = {
        percent: change.toFixed(1),
        isHigh: true
      };
    }
  }

  return createAndSend(
    {
      organizationId: bill.organizationId,
      userId: user._id,
      type: 'BILL_GENERATED',
      payload: { 
        billId: bill._id, 
        amount: formatPaise(bill.totalInPaise),
        usageTrend 
      },
    },
    () => sendBillGeneratedEmail({
      to: user.email,
      userName: user.name,
      billAmount: formatPaise(bill.totalInPaise),
      billingPeriod: bill.billingPeriod,
      dueDate: bill.dueDate,
      billId: bill._id,
      org,
      usageTrend // Passing trend alert to email template
    })
  );
};

export const queuePaymentSuccessNotification = async (payment, bill, user, forceDemo = false) => {
  const org = await Organization.findById(bill.organizationId);
  return createAndSend(
    {
      organizationId: bill.organizationId,
      userId: user._id,
      type: 'PAYMENT_SUCCESS',
      payload: { paymentId: payment._id, amount: formatPaise(payment.amountInPaise) },
      skipStorage: forceDemo
    },
    () => sendPaymentSuccessEmail({
      to: user.email,
      userName: user.name,
      billAmount: formatPaise(payment.amountInPaise),
      billingPeriod: bill.billingPeriod,
      org,
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
      org,
    })
  );
};
