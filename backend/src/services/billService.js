import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import { getActiveTariff } from './tariffService.js';
import { calculateBill } from '../utils/billingEngine.js';
import { queueBillGeneratedNotification } from './notificationService.js';

const DUE_DATE_DAYS = 15; // bills due 15 days after generation

export const generateBill = async (organizationId, userId, { previousReading, currentReading, billingPeriod }) => {
  // Validate user belongs to org
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) throw Object.assign(new Error('User not found in this organization'), { status: 404 });

  // Check for duplicate bill
  const existing = await Bill.findOne({
    organizationId,
    userId,
    'billingPeriod.month': billingPeriod.month,
    'billingPeriod.year': billingPeriod.year,
  });
  if (existing) throw Object.assign(new Error('Bill already exists for this period'), { status: 409 });

  if (currentReading < previousReading) {
    throw Object.assign(new Error('Current reading cannot be less than previous reading'), { status: 400 });
  }

  const unitsConsumed = currentReading - previousReading;
  const tariff = await getActiveTariff(organizationId);
  const calc = calculateBill(unitsConsumed, tariff);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + DUE_DATE_DAYS);

  const bill = await Bill.create({
    organizationId,
    userId,
    tariffConfigId: tariff._id,
    billingPeriod,
    previousReading,
    currentReading,
    unitsConsumed,
    calculationBreakdown: calc.breakdown,
    fixedChargeInPaise: calc.fixedChargeInPaise,
    subtotalInPaise: calc.subtotalInPaise,
    taxAmountInPaise: calc.taxAmountInPaise,
    totalInPaise: calc.totalInPaise,
    dueDate,
  });

  // Update user's lastBillingDate
  await User.findByIdAndUpdate(userId, { lastBillingDate: new Date() });

  // Queue notification (fire-and-forget)
  queueBillGeneratedNotification(bill, user).catch(console.error);

  return bill;
};

export const getBillsByUser = async (organizationId, userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [bills, total] = await Promise.all([
    Bill.find({ organizationId, userId }).sort({ billDate: -1 }).skip(skip).limit(limit),
    Bill.countDocuments({ organizationId, userId }),
  ]);
  return { bills, total, page, totalPages: Math.ceil(total / limit) };
};

export const getBillsByOrg = async (organizationId, { status, page = 1, limit = 20 } = {}) => {
  const query = { organizationId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [bills, total] = await Promise.all([
    Bill.find(query).populate('userId', 'name email consumerId').sort({ billDate: -1 }).skip(skip).limit(limit),
    Bill.countDocuments(query),
  ]);
  return { bills, total, page, totalPages: Math.ceil(total / limit) };
};

export const getBillById = async (organizationId, billId) => {
  const bill = await Bill.findOne({ _id: billId, organizationId }).populate('userId', 'name email consumerId address');
  if (!bill) throw Object.assign(new Error('Bill not found'), { status: 404 });
  return bill;
};

export const getOrgAnalytics = async (organizationId) => {
  const [totalCollected, totalPending, totalOverdue, billCount] = await Promise.all([
    Bill.aggregate([
      { $match: { organizationId, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalInPaise' } } },
    ]),
    Bill.aggregate([
      { $match: { organizationId, status: 'UNPAID', dueDate: { $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: '$totalInPaise' } } },
    ]),
    Bill.aggregate([
      { $match: { organizationId, status: 'UNPAID', dueDate: { $lt: new Date() } } },
      { $group: { _id: null, total: { $sum: '$totalInPaise' } } },
    ]),
    Bill.countDocuments({ organizationId }),
  ]);
  return {
    totalCollectedInPaise: totalCollected[0]?.total || 0,
    totalPendingInPaise: totalPending[0]?.total || 0,
    totalOverdueInPaise: totalOverdue[0]?.total || 0,
    billCount,
  };
};

export const getOrgHistory = async (organizationId) => {
  // Get last 6 months of data
  return Bill.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: { month: '$billingPeriod.month', year: '$billingPeriod.year' },
        collected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$totalInPaise', 0] } },
        pending: { $sum: { $cond: [{ $ne: ['$status', 'PAID'] }, '$totalInPaise', 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 6 },
  ]);
};


export const getUserHistory = async (organizationId, userId) => {
  return Bill.aggregate([
    { $match: { 
      organizationId: new mongoose.Types.ObjectId(organizationId), 
      userId: new mongoose.Types.ObjectId(userId) 
    } },
    {
      $group: {
        _id: { month: '$billingPeriod.month', year: '$billingPeriod.year' },
        units: { $sum: '$unitsConsumed' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 6 },
  ]);
};

