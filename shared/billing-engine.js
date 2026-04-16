const SLAB_RATES = [
  { max: 100, rate: 500 },
  { max: 300, rate: 800 },
  { max: Infinity, rate: 1200 }
];
const FIXED_CHARGE = 5000;
const TAX_RATE = 0.18;

const calculateBill = (units) => {
  if (units < 0) return { error: "Units cannot be negative" };
  let energyChargePaise = 0;
  let remainingUnits = units;
  let previousMax = 0;
  for (const slab of SLAB_RATES) {
    const unitsInSlab = Math.min(remainingUnits, slab.max - previousMax);
    energyChargePaise += unitsInSlab * slab.rate;
    remainingUnits -= unitsInSlab;
    previousMax = slab.max;
    if (remainingUnits <= 0) break;
  }
  const subtotal = energyChargePaise + FIXED_CHARGE;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  return {
    units,
    energyCharge: energyChargePaise / 100,
    fixedCharge: FIXED_CHARGE / 100,
    tax: tax / 100,
    total: total / 100,
    totalInPaise: total
  };
};
module.exports = { calculateBill };