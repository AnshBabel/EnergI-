import mongoose from 'mongoose';
import { calculateBill } from './billingEngine.js';

/**
 * Stable Seeded Random Utility
 * Ensures that mock data is deterministic based on the organization ID.
 */
const seededRandom = (seedString) => {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return hash / 4294967296;
  };
};

export const generateMockData = (organizationId) => {
  const random = seededRandom(organizationId.toString());
  const orgId = new mongoose.Types.ObjectId(organizationId);

  // Helper to generate a stable ObjectId based on a string seed
  const seededId = (seed) => {
    const hex = Buffer.from(seed.padEnd(12, '0')).toString('hex').slice(0, 24);
    return new mongoose.Types.ObjectId(hex);
  };

  // 1. Mock Users (Consumers)
  const mockUsers = [
    { name: 'Aditya Sharma', email: 'aditya.sharma@example.com', role: 'CONSUMER', isSmartMeterEnabled: true, meterNumber: 'SM-7821-X', consumerId: 'EN-821901', load: 1.2 },
    { name: 'Priya Iyer', email: 'priya.i@example.com', role: 'CONSUMER', isSmartMeterEnabled: true, meterNumber: 'SM-9012-Y', consumerId: 'EN-772102', load: 0.8 },
    { name: 'Rahul Varma', email: 'rahul.v@example.com', role: 'CONSUMER', isSmartMeterEnabled: true, meterNumber: 'SM-1122-Z', consumerId: 'EN-102933', load: 2.1 },
    { name: 'Sanya Malhotra', email: 'sanya.m@example.com', role: 'CONSUMER', isSmartMeterEnabled: false, meterNumber: 'TM-4455-A', consumerId: 'EN-990124', load: 0.0 },
    { name: 'Vikram Singh', email: 'vikram.s@example.com', role: 'CONSUMER', isSmartMeterEnabled: true, meterNumber: 'SM-5566-B', consumerId: 'EN-881235', load: 1.5 },
    { name: 'Ananya Gupta', email: 'ananya.g@example.com', role: 'CONSUMER', isSmartMeterEnabled: true, meterNumber: 'SM-6677-C', consumerId: 'EN-770456', load: 0.6 },
    { name: 'Zaid Khan', email: 'zaid.k@example.com', role: 'CONSUMER', isSmartMeterEnabled: false, meterNumber: 'TM-8899-D', consumerId: 'EN-551277', load: 0.0 },
    { name: 'Ishita Roy', email: 'ishita.r@example.com', role: 'CONSUMER', isSmartMeterEnabled: true, meterNumber: 'SM-2233-E', consumerId: 'EN-440188', load: 3.2 },
  ].map((u, i) => ({
    _id: seededId(`user-${i}`),
    organizationId: orgId,
    ...u,
    consumptionRate: u.load,
    lastKnownReading: 1200 + (random() * 500),
    isActive: true,
    address: i % 2 === 0 ? 'Sector 4, Dwarka, New Delhi' : 'B-12, Koregaon Park, Pune',
    createdAt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000 * (i + 1))),
  }));

  // 2. Mock Tariff Configs
  const mockTariffs = [
    {
      _id: seededId('tariff-1'),
      organizationId: orgId,
      name: 'Residential Peak High-Voltage',
      effectiveFrom: new Date('2023-01-01'),
      slabs: [
        { upToUnits: 100, rateInPaise: 450 },
        { upToUnits: 300, rateInPaise: 650 },
        { upToUnits: null, rateInPaise: 850 },
      ],
      fixedChargeInPaise: 15000,
      taxPercent: 18,
      earlyBirdDiscountPercent: 5,
      earlyBirdGraceDays: 10,
      isActive: true,
    }
  ];

  // 3. Mock Bills
  const mockBills = [];
  mockUsers.forEach((user, userIdx) => {
    // Generate 3 months of bills for each user
    for (let m = 0; m < 3; m++) {
      const month = ((new Date().getMonth() - m + 12) % 12) + 1;
      const year = new Date().getFullYear() - (new Date().getMonth() - m < 0 ? 1 : 0);
      const units = Math.round(100 + (random() * 200));
      
      const calc = calculateBill(units, mockTariffs[0]);
      
      const statusSeed = random();
      let status = 'PAID';
      if (statusSeed > 0.8) status = 'UNPAID';
      else if (statusSeed > 0.95) status = 'DISPUTED';

      const billDate = new Date(year, month - 1, 10);
      const dueDate = new Date(year, month - 1, 25);
      
      // Add mock early bird
      const earlyBird = {
        discountPercent: 5,
        discountAmountInPaise: Math.round((calc.totalInPaise * 0.05)),
        eligibleUntil: new Date(billDate.getTime() + (7 * 24 * 60 * 60 * 1000))
      };

      mockBills.push({
        _id: seededId(`bill-${userIdx}-${m}`),
        organizationId: orgId,
        userId: user,
        tariffConfigId: mockTariffs[0]._id,
        billingPeriod: { month, year },
        previousReading: 1000 + (m * 200),
        currentReading: 1000 + (m * 200) + units,
        unitsConsumed: units,
        calculationBreakdown: calc.breakdown,
        subtotalInPaise: calc.subtotalInPaise,
        taxAmountInPaise: calc.taxAmountInPaise,
        totalInPaise: calc.totalInPaise,
        fixedChargeInPaise: calc.fixedChargeInPaise,
        earlyBird,
        status,
        dueDate,
        billDate,
        createdAt: billDate,
      });
    }
  });

  // 4. Mock Payments
  const mockPayments = mockBills.filter(b => b.status === 'PAID').map((bill, i) => ({
    _id: seededId(`pay-${i}`),
    organizationId: orgId,
    billId: bill._id,
    userId: bill.userId._id,
    stripeSessionId: `cs_test_${i}`,
    stripeEventId: `evt_${i}`,
    amountInPaise: bill.totalInPaise,
    status: 'SUCCESS',
    processedAt: new Date(bill.billDate.getTime() + (random() * 5 * 24 * 60 * 60 * 1000)),
    createdAt: new Date(bill.billDate.getTime() + (random() * 5 * 24 * 60 * 60 * 1000)),
  }));

  // 5. Mock Disputes
  const mockDisputes = mockBills.filter(b => b.status === 'DISPUTED' || random() > 0.9).map((bill, i) => ({
    _id: seededId(`dispute-${i}`),
    organizationId: orgId,
    billId: bill._id,
    userId: bill.userId._id,
    reason: i % 2 === 0 ? 'Incorrect meter reading observed' : 'Duplicate bill generated for the same month',
    status: i === 0 ? 'OPEN' : 'RESOLVED',
    adminNote: i === 0 ? '' : 'Verified the reading. Adjustment applied to the next billing cycle.',
    resolvedAt: i === 0 ? null : new Date(),
    createdAt: new Date(bill.billDate.getTime() + (2 * 24 * 60 * 60 * 1000)),
  }));

  // 6. Mock Notifications
  const mockNotifications = [];
  mockBills.slice(0, 10).forEach((bill, i) => {
    mockNotifications.push({
      _id: seededId(`notif-${i}`),
      organizationId: orgId,
      userId: bill.userId._id,
      type: 'BILL_GENERATED',
      channel: 'EMAIL',
      status: 'SENT',
      payload: { amount: bill.totalInPaise, period: `${bill.billingPeriod.month}/${bill.billingPeriod.year}` },
      sentAt: bill.billDate,
      createdAt: bill.billDate,
    });
  });

  return {
    users: mockUsers,
    tariffs: mockTariffs,
    bills: mockBills,
    payments: mockPayments,
    disputes: mockDisputes,
    notifications: mockNotifications,
  };
};
