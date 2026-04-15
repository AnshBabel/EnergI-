import { calculateBill } from '../src/utils/billingEngine.js';

const sampleTariff = {
  slabs: [
    { upToUnits: 100, rateInPaise: 500 },   // ₹5/unit for first 100
    { upToUnits: 200, rateInPaise: 800 },   // ₹8/unit for next 200
    { upToUnits: null, rateInPaise: 1200 },  // ₹12/unit unlimited
  ],
  fixedChargeInPaise: 10000, // ₹100 fixed
  taxPercent: 18,
};

describe('billingEngine.calculateBill', () => {
  test('zero units — only fixed charge + tax', () => {
    const result = calculateBill(0, sampleTariff);
    expect(result.subtotalInPaise).toBe(10000);
    expect(result.taxAmountInPaise).toBe(1800);
    expect(result.totalInPaise).toBe(11800);
    expect(result.breakdown).toHaveLength(0);
  });

  test('within first slab (50 units)', () => {
    const result = calculateBill(50, sampleTariff);
    // fixed (10000) + 50 * 500 = 10000 + 25000 = 35000
    expect(result.subtotalInPaise).toBe(35000);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].units).toBe(50);
    expect(result.breakdown[0].chargeInPaise).toBe(25000);
  });

  test('exactly 100 units — fills first slab completely', () => {
    const result = calculateBill(100, sampleTariff);
    expect(result.subtotalInPaise).toBe(10000 + 100 * 500); // 60000
    expect(result.breakdown).toHaveLength(1);
  });

  test('crosses two slabs (150 units)', () => {
    const result = calculateBill(150, sampleTariff);
    // fixed (10000) + 100*500 (50000) + 50*800 (40000) = 100000
    expect(result.subtotalInPaise).toBe(100000);
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0].units).toBe(100);
    expect(result.breakdown[1].units).toBe(50);
    expect(result.taxAmountInPaise).toBe(18000);
    expect(result.totalInPaise).toBe(118000);
  });

  test('crosses all three slabs (350 units)', () => {
    const result = calculateBill(350, sampleTariff);
    // fixed (10000) + 100*500 (50000) + 200*800 (160000) + 50*1200 (60000) = 280000
    expect(result.subtotalInPaise).toBe(280000);
    expect(result.breakdown).toHaveLength(3);
    expect(result.breakdown[2].units).toBe(50);
  });

  test('result values are always integers (no floats)', () => {
    const result = calculateBill(333, { ...sampleTariff, taxPercent: 18 });
    expect(Number.isInteger(result.subtotalInPaise)).toBe(true);
    expect(Number.isInteger(result.taxAmountInPaise)).toBe(true);
    expect(Number.isInteger(result.totalInPaise)).toBe(true);
  });

  test('negative units treated as zero', () => {
    const result = calculateBill(-10, sampleTariff);
    expect(result.breakdown).toHaveLength(0);
    expect(result.subtotalInPaise).toBe(10000);
  });
});
