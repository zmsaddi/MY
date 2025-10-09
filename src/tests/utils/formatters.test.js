import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

describe('formatters - formatCurrency', () => {
  it('should format currency with symbol', () => {
    const result = formatCurrency(1234.56, '$');
    expect(result).toBe('1,234.56 $');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toBe('0.00 USD');
  });

  it('should handle negative values', () => {
    const result = formatCurrency(-500, '$');
    expect(result).toContain('-');
  });
});

describe('formatters - formatNumber', () => {
  it('should format numbers with thousands separator', () => {
    const result = formatNumber(1234567);
    expect(result).toContain(',');
  });

  it('should handle decimals', () => {
    const result = formatNumber(123.456, 2);
    expect(result).toBe('123.46');
  });
});

describe('formatters - formatDate', () => {
  it('should format date correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should handle invalid dates', () => {
    const result = formatDate('invalid');
    expect(result).toBeTruthy();
  });
});
