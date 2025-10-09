import { describe, it, expect } from 'vitest';
import { calculateSheetWeight, calculateItemTotal, applyDiscount, calculateVAT } from '../../utils/pricingCalculations';

describe('pricingCalculations - calculateSheetWeight', () => {
  it('should calculate weight correctly', () => {
    const weight = calculateSheetWeight(1000, 2000, 1.5, 7.85);
    expect(weight).toBeGreaterThan(0);
    expect(typeof weight).toBe('number');
  });

  it('should handle zero dimensions', () => {
    const weight = calculateSheetWeight(0, 2000, 1.5, 7.85);
    expect(weight).toBe(0);
  });

  it('should handle missing density', () => {
    const weight = calculateSheetWeight(1000, 2000, 1.5, 0);
    expect(weight).toBe(0);
  });
});

describe('pricingCalculations - calculateItemTotal', () => {
  it('should calculate total correctly', () => {
    const total = calculateItemTotal(10, 100.50);
    expect(total).toBe(1005);
  });

  it('should handle decimals', () => {
    const total = calculateItemTotal(3, 33.33);
    expect(total).toBeCloseTo(99.99, 2);
  });

  it('should handle zero quantity', () => {
    const total = calculateItemTotal(0, 100);
    expect(total).toBe(0);
  });
});

describe('pricingCalculations - applyDiscount', () => {
  it('should apply percentage discount', () => {
    const result = applyDiscount(1000, 10, 'percentage');
    expect(result).toBe(900);
  });

  it('should apply fixed discount', () => {
    const result = applyDiscount(1000, 100, 'fixed');
    expect(result).toBe(900);
  });

  it('should not allow negative result', () => {
    const result = applyDiscount(100, 200, 'fixed');
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should handle 100% discount', () => {
    const result = applyDiscount(1000, 100, 'percentage');
    expect(result).toBe(0);
  });
});

describe('pricingCalculations - calculateVAT', () => {
  it('should calculate VAT correctly', () => {
    const vat = calculateVAT(1000, 10);
    expect(vat).toBe(100);
  });

  it('should handle zero rate', () => {
    const vat = calculateVAT(1000, 0);
    expect(vat).toBe(0);
  });

  it('should handle decimal rates', () => {
    const vat = calculateVAT(1000, 5.5);
    expect(vat).toBe(55);
  });
});
