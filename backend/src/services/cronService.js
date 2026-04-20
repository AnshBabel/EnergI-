import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Bill from '../models/Bill.js';
import * as billService from './billService.js';

/**
 * Automated Billing Cycle logic.
 * Scans for users that need billing and generates bills in bulk.
 */
export const runBillingCycle = async (organizationId, { month, year, forceDemo = false }) => {
  if (forceDemo) {
    // Return simulated success for Showcase Mode
    return {
      total: 8,
      success: 8,
      failed: 0,
      errors: [],
      sampleCalculation: {
        consumer: 'Aditya Sharma',
        units: 142,
        breakdown: [
          { units: 100, rateInPaise: 450, chargeInPaise: 45000 },
          { units: 42, rateInPaise: 650, chargeInPaise: 27300 }
        ],
        total: 92300,
        estimated: false
      }
    };
  }

  const consumers = await User.find({
    organizationId,
    role: 'CONSUMER',
    isActive: true
  });

  const results = { total: consumers.length, success: 0, failed: 0, errors: [], sampleCalculation: null };

  for (const consumer of consumers) {
    try {
      // ... same logic for existing bill check ...
      const existing = await Bill.findOne({
        organizationId,
        userId: consumer._id,
        'billingPeriod.month': month,
        'billingPeriod.year': year
      });
      if (existing) continue;

      const lastBill = await Bill.findOne({
        organizationId,
        userId: consumer._id
      }).sort({ billDate: -1 });

      const previousReading = lastBill ? lastBill.currentReading : 0;
      
      let currentReading = consumer.lastKnownReading;
      let usedAverage = false;

      // If no new reading (same as previous) or missing, use average
      if (!currentReading || currentReading <= previousReading) {
        const avg = await billService.getAverageConsumption(consumer._id);
        currentReading = previousReading + avg;
        usedAverage = true;
      }

      const bill = await billService.generateBill(organizationId, consumer._id, {
        previousReading,
        currentReading,
        billingPeriod: { month, year }
      });
      
      results.success++;
      if (!results.sampleCalculation) {
        results.sampleCalculation = {
          consumer: consumer.name,
          units: bill.unitsConsumed,
          breakdown: bill.calculationBreakdown,
          total: bill.totalInPaise,
          estimated: usedAverage
        };
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ consumerId: consumer.consumerId, error: err.message });
    }
  }

  return results;
};

