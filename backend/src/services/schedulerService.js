import cron from 'node-cron';
import Organization from '../models/Organization.js';
import { runBillingCycle } from './cronService.js';

/**
 * Initializes the automated billing scheduler.
 * Runs once a day to check for organizations that need billing.
 */
export const initScheduledBilling = () => {
  // Run everyday at 00:01
  cron.schedule('1 0 * * *', async () => {
    console.log('⏰ [Scheduler] Starting daily billing check...');
    const today = new Date().getDate();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    try {
      const orgsToBill = await Organization.find({
        isAutoBillingEnabled: true,
        billingCycleDay: today
      });

      console.log(`⏰ [Scheduler] Found ${orgsToBill.length} organizations to process today.`);

      for (const org of orgsToBill) {
        console.log(`⏰ [Scheduler] Running cycle for ${org.name}...`);
        await runBillingCycle(org._id, { month: currentMonth, year: currentYear });
      }

      console.log('✅ [Scheduler] Daily billing check completed.');
    } catch (err) {
      console.error('❌ [Scheduler] Error during daily billing check:', err);
    }
  });

  console.log('🚀 [Scheduler] Billing automation initialized.');
};
