import { describe, it, expect } from 'vitest';
import {
  validateNumber,
  validateString,
  validateEmail,
  validatePhone,
  validateDate,
  escapeHtml
} from '../../utils/validation/inputSanitizer';

describe('inputSanitizer - validateNumber', () => {
  it('should validate positive numbers', () => {
    const result = validateNumber(100);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(100);
  });

  it('should reject negative numbers when not allowed', () => {
    const result = validateNumber(-50, { allowNegative: false });
    expect(result.valid).toBe(false);
  });

  it('should allow negative numbers when specified', () => {
    const result = validateNumber(-50, { allowNegative: true });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(-50);
  });

  it('should enforce min value', () => {
    const result = validateNumber(5, { min: 10 });
    expect(result.valid).toBe(false);
  });

  it('should enforce max value', () => {
    const result = validateNumber(100, { max: 50 });
    expect(result.valid).toBe(false);
  });

  it('should reject NaN', () => {
    const result = validateNumber('invalid');
    expect(result.valid).toBe(false);
  });
});

describe('inputSanitizer - validateString', () => {
  it('should validate normal strings', () => {
    const result = validateString('Hello World');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('Hello World');
  });

  it('should trim whitespace', () => {
    const result = validateString('  test  ');
    expect(result.value).toBe('test');
  });

  it('should enforce minLength', () => {
    const result = validateString('hi', { minLength: 5 });
    expect(result.valid).toBe(false);
  });

  it('should enforce maxLength', () => {
    const result = validateString('a'.repeat(200), { maxLength: 100 });
    expect(result.valid).toBe(false);
  });

  it('should block SQL keywords when sqlSafe is true', () => {
    const result = validateString('SELECT * FROM users', { sqlSafe: true, blockSqlKeywords: true });
    expect(result.valid).toBe(false);
  });

  it('should allow normal text with sqlSafe', () => {
    const result = validateString('Normal customer name', { sqlSafe: true });
    expect(result.valid).toBe(true);
  });
});

describe('inputSanitizer - validateEmail', () => {
  it('should validate correct email', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateEmail('invalid-email');
    expect(result.valid).toBe(false);
  });

  it('should allow null when allowNull is true', () => {
    const result = validateEmail(null, { allowNull: true });
    expect(result.valid).toBe(true);
  });
});

describe('inputSanitizer - validatePhone', () => {
  it('should validate Syrian phone numbers', () => {
    const result = validatePhone('+963991234567');
    expect(result.valid).toBe(true);
  });

  it('should validate international format', () => {
    const result = validatePhone('+1234567890');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid phone', () => {
    const result = validatePhone('abc123');
    expect(result.valid).toBe(false);
  });
});

describe('inputSanitizer - escapeHtml', () => {
  it('should escape HTML special characters', () => {
    const result = escapeHtml('<script>alert("XSS")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('should escape quotes', () => {
    const result = escapeHtml('"Hello" and \'World\'');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#39;');
  });

  it('should handle normal text', () => {
    const result = escapeHtml('Normal text');
    expect(result).toBe('Normal text');
  });
});
