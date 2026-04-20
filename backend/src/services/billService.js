import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import { getActiveTariff } from './tariffService.js';
import { calculateBill } from '../utils/billingEngine.js';
import { queueBillGeneratedNotification } from './notificationService.js';
import TariffConfig from '../models/TariffConfig.js';
import { generateMockData } from '../utils/mockData.js';
export { generateMockData };

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

  // Early Bird Calculation
  let earlyBird = { discountPercent: 0, discountAmountInPaise: 0, eligibleUntil: null };
  if (tariff.earlyBirdDiscountPercent > 0) {
    earlyBird.discountPercent = tariff.earlyBirdDiscountPercent;
    earlyBird.eligibleUntil = new Date();
    earlyBird.eligibleUntil.setDate(earlyBird.eligibleUntil.getDate() + (tariff.earlyBirdGraceDays || 5));
    earlyBird.discountAmountInPaise = Math.round((calc.totalInPaise * tariff.earlyBirdDiscountPercent) / 100);
  }

  const bill = await Bill.create({
    organizationId,
    userId,
    tariffConfigId: tariff._id,
    earlyBird,
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

export const getBillsByUser = async (organizationId, userId, { page = 1, limit = 10, forceDemo = false } = {}) => {
  if (forceDemo) {
    const { bills, users } = generateMockData(organizationId);
    // For individual consumer demo, we always show data for the first mock persona
    const demoUser = users[0];
    const userBills = bills.filter(b => b.userId._id.toString() === demoUser._id.toString());
    return { bills: userBills, total: userBills.length, page: 1, totalPages: 1 };
  }
  
  const skip = (page - 1) * limit;
  const [bills, total] = await Promise.all([
    Bill.find({ organizationId, userId }).sort({ billDate: -1 }).skip(skip).limit(limit).populate('userId', 'name email consumerId'),
    Bill.countDocuments({ organizationId, userId }),
  ]);
  return { bills, total, page, totalPages: Math.ceil(total / limit) };
};

export const getBillsByOrg = async (organizationId, { status, page = 1, limit = 20, forceDemo = false } = {}) => {
  if (forceDemo) {
    let { bills } = generateMockData(organizationId);
    if (status) bills = bills.filter(b => b.status === status);
    return { bills, total: bills.length, page: 1, totalPages: 1 };
  }
  
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

export const getOrgAnalytics = async (organizationId, forceDemo = false) => {
  const orgId = new mongoose.Types.ObjectId(organizationId);
  
  if (forceDemo) {
    const { bills } = generateMockData(organizationId);
    const paid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalInPaise, 0);
    const pending = bills.filter(b => b.status === 'UNPAID' && new Date(b.dueDate) >= new Date()).reduce((sum, b) => sum + b.totalInPaise, 0);
    const overdue = bills.filter(b => b.status === 'UNPAID' && new Date(b.dueDate) < new Date()).reduce((sum, b) => sum + b.totalInPaise, 0);
    
    return {
      totalCollectedInPaise: paid,
      totalPendingInPaise: pending,
      totalOverdueInPaise: overdue,
      billCount: bills.length,
      revenueMix: [
        { label: 'Collected', value: paid, color: '#10B981' },
        { label: 'Pending', value: pending, color: '#6366F1' },
        { label: 'Overdue', value: overdue, color: '#EF4444' }
      ]
    };
  }

  const [totalCollected, totalPending, totalOverdue, billCount] = await Promise.all([
    Bill.aggregate([
      { $match: { organizationId: orgId, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalInPaise' } } },
    ]),
    Bill.aggregate([
      { $match: { organizationId: orgId, status: 'UNPAID', dueDate: { $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: '$totalInPaise' } } },
    ]),
    Bill.aggregate([
      { $match: { organizationId: orgId, status: 'UNPAID', dueDate: { $lt: new Date() } } },
      { $group: { _id: null, total: { $sum: '$totalInPaise' } } },
    ]),
    Bill.countDocuments({ organizationId: orgId }),
  ]);
  return {
    totalCollectedInPaise: totalCollected[0]?.total || 0,
    totalPendingInPaise: totalPending[0]?.total || 0,
    totalOverdueInPaise: totalOverdue[0]?.total || 0,
    billCount,
    revenueMix: [
      { label: 'Collected', value: totalCollected[0]?.total || 0, color: '#10B981' },
      { label: 'Pending', value: totalPending[0]?.total || 0, color: '#6366F1' },
      { label: 'Overdue', value: totalOverdue[0]?.total || 0, color: '#EF4444' }
    ]
  };
};

/**
 * Calculates average consumption for a user over available history
 */
export const getAverageConsumption = async (userId) => {
  const history = await Bill.find({ userId }).sort({ billDate: -1 }).limit(6);
  if (history.length === 0) return 50; // Default fallback
  const sum = history.reduce((acc, b) => acc + b.unitsConsumed, 0);
  return Math.round(sum / history.length);
};

export const getOrgHistory = async (organizationId, forceDemo = false) => {
  if (forceDemo) {
    const { bills } = generateMockData(organizationId);
    // Group bills by month/year
    const historyMap = {};
    bills.forEach(b => {
      const key = `${b.billingPeriod.month}/${b.billingPeriod.year}`;
      if (!historyMap[key]) historyMap[key] = { _id: b.billingPeriod, collected: 0, pending: 0 };
      if (b.status === 'PAID') historyMap[key].collected += b.totalInPaise;
      else historyMap[key].pending += b.totalInPaise;
    });
    return Object.values(historyMap).sort((a,b) => b._id.year - a._id.year || b._id.month - a._id.month).slice(0, 6).reverse();
  }
  
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
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};


export const getUserHistory = async (organizationId, userId, forceDemo = false) => {
  if (forceDemo) {
    const { bills, users } = generateMockData(organizationId);
    const demoUser = users[0];
    return bills
      .filter(b => b.userId._id.toString() === demoUser._id.toString())
      .map(b => ({
        _id: b.billingPeriod,
        units: b.unitsConsumed,
      }))
      .slice(0, 6)
      .reverse();
  }
  
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
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

/**
 * Advanced Consumer Intelligence Engine
 * Provides historical trends and actionable energy-saving insights
 */
export const getIntelligence = async (userId, organizationId, forceDemo = false) => {
  let history;
  if (forceDemo) {
    const mock = generateMockData(organizationId);
    // Always use the primary mock persona for individual consumer intelligence demo
    const mockUser = mock.users[0];
    history = mock.bills.filter(b => b.userId._id.toString() === mockUser._id.toString());
  } else {
    history = await Bill.find({ userId, organizationId })
      .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 })
      .limit(12);
  }

  const hasRealHistory = history.length > 0 && !forceDemo;
  const latest = history[0] || {
    _id: new mongoose.Types.ObjectId(),
    unitsConsumed: 120, // Default baseline for brand new users
    totalInPaise: 84000, 
    billingPeriod: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    tariffConfigId: null
  };

  // 2. Trend Calculations (Latest vs Previous Month)
  const previous = history.length > 1 ? history[1] : null;
  
  let momTrend = 0;
  if (previous && previous.unitsConsumed > 0) {
    momTrend = ((latest.unitsConsumed - previous.unitsConsumed) / previous.unitsConsumed) * 100;
  }

  // 3. Slab Optimization Advisor
  let insight = null;
  if (latest.tariffConfigId) {
    const config = await TariffConfig.findById(latest.tariffConfigId);
    if (config && config.slabs) {
      const sortedSlabs = [...config.slabs].sort((a, b) => a.limit - b.limit);
      const currentUnits = latest.unitsConsumed;
      const nextSlab = sortedSlabs.find(s => s.limit > currentUnits);
      
      if (nextSlab) {
        const unitsToNextThreshold = nextSlab.limit - currentUnits;
        if (unitsToNextThreshold < 15) {
          insight = {
            type: 'SLAB_WARNING',
            message: `Warning: You are just ${unitsToNextThreshold} units away from a higher rate slab (₹${nextSlab.rate}/unit). Reducing usage slightly could save you a significant amount on your next bill.`,
            threshold: nextSlab.limit
          };
        }
      }
    }
  }

  return {
    hasHistory: true, // Always true now because we simulate
    isSample: !hasRealHistory || forceDemo, 
    latest: {
      units: latest.unitsConsumed,
      amount: latest.totalInPaise,
      period: latest.billingPeriod
    },
    trends: {
      momChange: momTrend.toFixed(1),
      isIncreasing: momTrend > 0
    },
    insight,
    history: history.map(h => ({
      period: `${h.billingPeriod.month}/${h.billingPeriod.year}`,
      units: h.unitsConsumed,
      amount: h.totalInPaise
    })).reverse()
  };
};


