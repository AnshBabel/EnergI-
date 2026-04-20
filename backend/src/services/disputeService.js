import Dispute from '../models/Dispute.js';
import Bill from '../models/Bill.js';
import { generateMockData } from '../utils/mockData.js';

export const raiseDispute = async (organizationId, userId, billId, reason) => {
  const bill = await Bill.findOne({ _id: billId, organizationId, userId });
  if (!bill) throw Object.assign(new Error('Bill not found'), { status: 404 });
  if (bill.status === 'PAID') throw Object.assign(new Error('Cannot dispute a paid bill'), { status: 400 });

  // Check for existing open dispute
  const existing = await Dispute.findOne({ billId, status: { $in: ['OPEN', 'UNDER_REVIEW'] } });
  if (existing) throw Object.assign(new Error('A dispute already exists for this bill'), { status: 409 });

  // Update bill status
  await Bill.findByIdAndUpdate(billId, { status: 'DISPUTED' });

  return Dispute.create({ organizationId, billId, userId, reason });
};

export const listDisputesByOrg = async (organizationId, { status, page = 1, limit = 20, forceDemo = false } = {}) => {
  if (forceDemo) {
    let { disputes } = generateMockData(organizationId);
    if (status) disputes = disputes.filter(d => d.status === status);
    return disputes.slice((page - 1) * limit, page * limit);
  }
  
  const query = { organizationId };
  if (status) query.status = status;
  return Dispute.find(query)
    .populate('userId', 'name email consumerId')
    .populate('billId', 'billingPeriod totalInPaise')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const listDisputesByUser = async (organizationId, userId, { forceDemo = false } = {}) => {
  if (forceDemo) {
    const { disputes, users } = generateMockData(organizationId);
    const demoUser = users[0];
    return disputes.filter(d => d.userId.toString() === demoUser._id.toString());
  }

  return Dispute.find({ organizationId, userId })
    .populate('billId', 'billingPeriod totalInPaise')
    .sort({ createdAt: -1 });
};


export const resolveDispute = async (organizationId, disputeId, { resolution, adminNote }) => {
  const dispute = await Dispute.findOne({ _id: disputeId, organizationId });
  if (!dispute) throw Object.assign(new Error('Dispute not found'), { status: 404 });

  dispute.status = resolution; // 'RESOLVED' or 'REJECTED'
  dispute.adminNote = adminNote || '';
  dispute.resolvedAt = new Date();
  await dispute.save();

  // Restore bill status based on resolution
  const newBillStatus = resolution === 'RESOLVED' ? 'WAIVED' : 'UNPAID';
  await Bill.findByIdAndUpdate(dispute.billId, { status: newBillStatus });

  return dispute;
};

export const updateDisputeStatus = async (organizationId, disputeId, status) => {
  const dispute = await Dispute.findOne({ _id: disputeId, organizationId });
  if (!dispute) throw Object.assign(new Error('Dispute not found'), { status: 404 });
  dispute.status = status;
  await dispute.save();
  return dispute;
};
