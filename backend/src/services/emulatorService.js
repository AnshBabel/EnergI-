import User from '../models/User.js';

// EMULATOR SETTINGS
const TICK_INTERVAL_MS = 10000; // Tick every 10 seconds
const SPEED_MULTIPLIER = 60;   // 1 minute real time = 1 hour virtual time (for demo)

let emulatorInterval = null;

export const initEmulator = () => {
  if (emulatorInterval) return;

  console.log(`[IoT Emulator] Starting with Speed Multiplier: x${SPEED_MULTIPLIER}`);
  
  emulatorInterval = setInterval(async () => {
    try {
      // 1. Find all users with Smart Meters enabled
      const users = await User.find({ isSmartMeterEnabled: true, isActive: true });
      
      if (users.length === 0) return;

      // 2. Calculate increment for this tick
      // Formula: (Rate / 3600 seconds) * (10 seconds interval) * Multiplier
      // Simplified: (Rate / 360) * Multiplier
      
      const bulkOps = users.map(user => {
        const rate = user.consumptionRate || 0.2;
        const increment = (rate / 360) * SPEED_MULTIPLIER;
        
        // Add a bit of "noise/randomness" to make it look realistic
        const jitter = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
        const finalIncrement = increment * jitter;

        return {
          updateOne: {
            filter: { _id: user._id },
            update: { $inc: { lastKnownReading: finalIncrement } }
          }
        };
      });

      await User.bulkWrite(bulkOps);
      // console.log(`[IoT Emulator] Ticked ${users.length} meters.`);
    } catch (err) {
      console.error('[IoT Emulator] Error in tick cycle:', err);
    }
  }, TICK_INTERVAL_MS);
};

export const stopEmulator = () => {
  if (emulatorInterval) {
    clearInterval(emulatorInterval);
    emulatorInterval = null;
    console.log('[IoT Emulator] Stopped.');
  }
};
