/**
 * billingEngine.js — Pure function, no DB calls, no side effects.
 * All math in integer paise (1 INR = 100 paise). Zero floats.
 *
 * @param {number} unitsConsumed - Integer units consumed
 * @param {object} tariffConfig  - Active TariffConfig document
 * @returns {object} breakdown, subtotalInPaise, taxAmountInPaise, totalInPaise
 */
export const calculateBill = (unitsConsumed, tariffConfig) => {
  const { slabs, fixedChargeInPaise = 0, taxPercent = 0 } = tariffConfig;

  let remaining = Math.max(0, Math.floor(unitsConsumed));
  let subtotalInPaise = fixedChargeInPaise;
  const breakdown = [];

  for (const slab of slabs) {
    if (remaining <= 0) break;

    // null upToUnits means this is the last (unlimited) slab
    const slabUnits = slab.upToUnits ? Math.min(remaining, slab.upToUnits) : remaining;
    const slabCharge = slabUnits * slab.rateInPaise; // integer × integer = integer

    breakdown.push({
      units: slabUnits,
      rateInPaise: slab.rateInPaise,
      chargeInPaise: slabCharge,
    });

    subtotalInPaise += slabCharge;
    remaining -= slabUnits;
  }

  // Tax rounded to nearest paise (Math.round keeps it integer)
  const taxAmountInPaise = Math.round((subtotalInPaise * taxPercent) / 100);
  const totalInPaise = subtotalInPaise + taxAmountInPaise;

  return {
    breakdown,
    fixedChargeInPaise,
    subtotalInPaise,
    taxAmountInPaise,
    totalInPaise,
  };
};

/**
 * Format paise to display string e.g. 50000 → "₹500.00"
 */
export const formatPaise = (paise) =>
  `₹${(paise / 100).toFixed(2)}`;
