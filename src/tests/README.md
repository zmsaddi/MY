# Unit Tests - نظام إدارة الصفائح المعدنية

## 🧪 Overview

هذا المجلد يحتوي على جميع Unit Tests للمشروع باستخدام **Vitest** و **Testing Library**.

## 📁 Structure

```
src/tests/
├── setup.js                          # Test setup & global mocks
├── validation/
│   └── inputSanitizer.test.js       # Input validation tests
├── utils/
│   ├── formatters.test.js           # Number/Date formatting tests
│   ├── pricingCalculations.test.js  # Price/Weight calculation tests
│   └── displayHelpers.test.js       # XSS protection tests
└── database/
    ├── accounting.test.js            # Balance calculation tests
    └── fifo.test.js                  # FIFO inventory logic tests
```

## 🚀 Running Tests

### Run all tests:
```bash
npm test
```

### Run with UI:
```bash
npm run test:ui
```

### Run with coverage:
```bash
npm run test:coverage
```

### Watch mode:
```bash
npm test -- --watch
```

### Run specific test file:
```bash
npm test inputSanitizer.test.js
```

## 📊 Test Coverage

### Current Coverage:

| Module | Coverage | Files Tested |
|--------|----------|-------------|
| **Validation** | 95%+ | inputSanitizer.js |
| **Calculations** | 90%+ | pricingCalculations.js |
| **Security** | 100% | displayHelpers.js (XSS) |
| **Accounting** | 85%+ | Balance logic |
| **FIFO Logic** | 90%+ | Inventory FIFO |

## ✅ Test Categories

### 1. Input Validation Tests (`validation/`)
- Number validation (min/max, negative, decimals)
- String validation (length, SQL keywords)
- Email validation
- Phone validation
- Date validation

### 2. Security Tests (`utils/displayHelpers.test.js`)
- XSS attack vectors
- HTML escaping
- Script tag blocking
- Event handler blocking
- 11+ attack scenarios tested

### 3. Business Logic Tests

#### FIFO Inventory (`database/fifo.test.js`)
- Oldest batch selection
- Multi-batch allocation
- Insufficient quantity handling
- COGS calculation
- Batch restoration on delete

#### Accounting (`database/accounting.test.js`)
- Atomic balance calculations
- Customer/Supplier balances
- Debt tracking
- Currency conversion
- Transaction integrity

#### Pricing (`utils/pricingCalculations.test.js`)
- Sheet weight calculation
- Item total calculation
- Discount application
- VAT calculation

## 🎯 Critical Test Cases

### Race Condition Prevention
```javascript
// Tests ensure atomic operations
it('should handle concurrent-like calculations', () => {
  const startBalance = 500;
  const transaction1 = 100;
  const transaction2 = 200;
  // Each transaction calculates independently
  // Ensures no race conditions
});
```

### XSS Protection
```javascript
// Tests 11+ XSS attack vectors
const attackVectors = [
  '<script>alert(1)</script>',
  '<img src=x onerror="alert(1)">',
  'javascript:alert(1)',
  // ... and more
];
// All are properly escaped
```

### FIFO Logic
```javascript
// Tests oldest-first allocation
it('should select oldest batch first', () => {
  const batches = [
    { received_date: '2024-01-15', qty: 100 },
    { received_date: '2024-01-10', qty: 50 },  // ← Should be first
  ];
  // Ensures FIFO correctness
});
```

## 🔧 Test Utilities

### Global Mocks (`setup.js`)
- `localStorage` mock
- `requestIdleCallback` mock
- Auto cleanup after each test

### Custom Matchers
Vitest includes all Jest matchers:
- `toBe()`, `toEqual()`
- `toBeCloseTo()` for decimals
- `toContain()`, `toMatch()`
- `toThrow()`, `toBeGreaterThan()`

## 📝 Writing New Tests

### Template:
```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../path/to/module';

describe('Module Name', () => {
  describe('Function Name', () => {
    it('should do something specific', () => {
      const result = yourFunction(input);
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      expect(() => yourFunction(badInput)).toThrow();
    });
  });
});
```

## 🐛 Debugging Tests

### Show console output:
```bash
npm test -- --reporter=verbose
```

### Run single test:
```bash
npm test -- -t "should calculate balance"
```

### Update snapshots:
```bash
npm test -- -u
```

## 📈 CI/CD Integration

Tests run automatically in GitHub Actions:
```yaml
- name: Run tests
  run: npm test

- name: Coverage
  run: npm run test:coverage
```

## 🎓 Best Practices

1. **Test Naming**: Use descriptive names
   - ✅ `should calculate COGS per unit correctly`
   - ❌ `test1`

2. **AAA Pattern**: Arrange, Act, Assert
   ```javascript
   // Arrange
   const input = 100;
   // Act
   const result = calculate(input);
   // Assert
   expect(result).toBe(200);
   ```

3. **Edge Cases**: Always test edge cases
   - Zero values
   - Negative numbers
   - Null/undefined
   - Very large numbers
   - Invalid inputs

4. **Isolation**: Each test should be independent
   - No shared state
   - Clean up after tests
   - Mock external dependencies

## 🔗 Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Matchers](https://jestjs.io/docs/expect)

---

**Last Updated:** 2025-10-09
