import * as aiService from '../services/aiService.js';
import User from '../models/User.js';
import Bill from '../models/Bill.js';
import Dispute from '../models/Dispute.js';
import { generateMockData } from '../utils/mockData.js';

export const getChatResponse = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      throw Object.assign(new Error('Message is required'), { status: 400 });
    }

    const forceDemo = req.query.demo === 'true';
    const response = await aiService.getCopilotResponse(
      req.user.userId,
      req.user.organizationId,
      message,
      forceDemo,
      req.user.role
    );

    res.json({ response });
  } catch (err) {
    next(err);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const insights = await aiService.calculatePredictiveBilling(
      req.user.userId,
      req.user.organizationId,
      forceDemo
    );
    res.json(insights);
  } catch (err) {
    next(err);
  }
};

export const getAdminAnomalies = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const organizationId = req.user.organizationId;
    const anomalies = [];

    if (forceDemo) {
      const mock = generateMockData(organizationId);
      
      // Simulate organization-wide alerts using mock users & disputes
      mock.users.forEach((u, i) => {
        if (i === 1) {
          anomalies.push({
            userId: u._id,
            userName: u.name,
            meterNumber: u.meterNumber,
            type: 'CONSUMPTION_SPIKE',
            severity: 'HIGH',
            description: `Extreme usage spike detected: 320 kWh logged in past 48 hours (+120% vs normal average).`,
            date: new Date(),
          });
        }
        if (i === 3) {
          anomalies.push({
            userId: u._id,
            userName: u.name,
            meterNumber: u.meterNumber,
            type: 'METER_INACTIVITY',
            severity: 'MEDIUM',
            description: `Smart Meter connection dropped: No telemetry received from ${u.meterNumber} in last 3 days.`,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          });
        }
      });

      mock.disputes.forEach((d, i) => {
        if (d.status === 'OPEN') {
          const matchingUser = mock.users.find(u => u._id.toString() === d.userId.toString()) || { name: 'Consumer' };
          anomalies.push({
            userId: d.userId,
            userName: matchingUser.name,
            meterNumber: matchingUser.meterNumber || 'N/A',
            type: 'ACTIVE_DISPUTE',
            severity: 'LOW',
            description: `Active dispute unresolved: Consumer raised objection to billing calculation: "${d.reason}".`,
            date: d.createdAt,
          });
        }
      });

    } else {
      // Production scanning
      const users = await User.find({ organizationId });
      const activeUserIds = users.map(u => u._id);

      // 1. Scan for open disputes
      const disputes = await Dispute.find({ organizationId, status: 'OPEN' }).populate('userId');
      disputes.forEach(d => {
        anomalies.push({
          userId: d.userId?._id,
          userName: d.userId?.name || 'Unknown User',
          meterNumber: d.userId?.meterNumber || 'N/A',
          type: 'ACTIVE_DISPUTE',
          severity: 'LOW',
          description: `Active billing dispute lodged: "${d.reason}"`,
          date: d.createdAt,
        });
      });

      // 2. Scan for overdue bills
      const overdueBills = await Bill.find({
        organizationId,
        status: 'UNPAID',
        dueDate: { $lt: new Date() },
      }).populate('userId');

      overdueBills.forEach(b => {
        anomalies.push({
          userId: b.userId?._id,
          userName: b.userId?.name || 'Unknown User',
          meterNumber: b.userId?.meterNumber || 'N/A',
          type: 'DEBT_RISK',
          severity: 'MEDIUM',
          description: `Payment Overdue: Bill of Rs. ${(b.totalInPaise / 100).toFixed(2)} is unpaid since ${new Date(b.dueDate).toLocaleDateString()}.`,
          date: b.dueDate,
        });
      });

      // 3. Scan for live consumption spikes on users
      const activeSmartUsers = users.filter(u => u.isSmartMeterEnabled && u.isActive);
      for (const u of activeSmartUsers) {
        // Simple heuristic: if last billing period was much lower than current meter increment
        const lastBill = await Bill.findOne({ userId: u._id }).sort({ createdAt: -1 });
        if (lastBill) {
          const currentUnits = Math.max(0, u.lastKnownReading - lastBill.currentReading);
          // If they consumed more units in the active incomplete month than in the whole last billed month
          if (currentUnits > lastBill.unitsConsumed * 1.5 && lastBill.unitsConsumed > 20) {
            anomalies.push({
              userId: u._id,
              userName: u.name,
              meterNumber: u.meterNumber,
              type: 'CONSUMPTION_SPIKE',
              severity: 'HIGH',
              description: `Active consumption (${Math.round(currentUnits)} kWh) is 50% higher than last month's entire bill (${lastBill.unitsConsumed} kWh).`,
              date: new Date(),
            });
          }
        }
      }
    }

    res.json({ anomalies });
  } catch (err) {
    next(err);
  }
};
