// src/utils/database/expensesAccounting.js
// Professional Expense Accounting Module with Double-Entry Bookkeeping

import { db, tx, saveDatabase, safe, lastId, getCurrentUser, round2 } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { getBaseCurrencyInfo } from './currencies.js';

/* ============================================
   EXPENSE TYPES & CATEGORIES - PROFESSIONAL
   ============================================ */

// Professional expense categories with accounting codes
export const EXPENSE_CATEGORIES = {
  // Operating Expenses (600-699)
  RENT: { code: '610', nameAr: 'الإيجار', nameEn: 'Rent', type: 'OPERATING', taxDeductible: true },
  SALARIES: { code: '620', nameAr: 'الرواتب', nameEn: 'Salaries', type: 'OPERATING', taxDeductible: true },
  UTILITIES: { code: '630', nameAr: 'المرافق', nameEn: 'Utilities', type: 'OPERATING', taxDeductible: true },
  MAINTENANCE: { code: '640', nameAr: 'الصيانة', nameEn: 'Maintenance', type: 'OPERATING', taxDeductible: true },
  INSURANCE: { code: '650', nameAr: 'التأمين', nameEn: 'Insurance', type: 'OPERATING', taxDeductible: true },
  MARKETING: { code: '660', nameAr: 'التسويق', nameEn: 'Marketing', type: 'OPERATING', taxDeductible: true },
  TRANSPORT: { code: '670', nameAr: 'النقل', nameEn: 'Transportation', type: 'OPERATING', taxDeductible: true },
  OFFICE: { code: '680', nameAr: 'مستلزمات مكتبية', nameEn: 'Office Supplies', type: 'OPERATING', taxDeductible: true },

  // Cost of Goods Sold (500-599)
  RAW_MATERIALS: { code: '510', nameAr: 'المواد الخام', nameEn: 'Raw Materials', type: 'COGS', taxDeductible: true },
  DIRECT_LABOR: { code: '520', nameAr: 'العمالة المباشرة', nameEn: 'Direct Labor', type: 'COGS', taxDeductible: true },
  OVERHEAD: { code: '530', nameAr: 'المصاريف الصناعية', nameEn: 'Manufacturing Overhead', type: 'COGS', taxDeductible: true },

  // Administrative Expenses (700-799)
  LEGAL: { code: '710', nameAr: 'المصاريف القانونية', nameEn: 'Legal Fees', type: 'ADMINISTRATIVE', taxDeductible: true },
  ACCOUNTING: { code: '720', nameAr: 'المحاسبة', nameEn: 'Accounting', type: 'ADMINISTRATIVE', taxDeductible: true },
  BANK_CHARGES: { code: '730', nameAr: 'رسوم بنكية', nameEn: 'Bank Charges', type: 'ADMINISTRATIVE', taxDeductible: true },
  DEPRECIATION: { code: '740', nameAr: 'الإهلاك', nameEn: 'Depreciation', type: 'ADMINISTRATIVE', taxDeductible: true },

  // Financial Expenses (800-899)
  INTEREST: { code: '810', nameAr: 'الفوائد', nameEn: 'Interest', type: 'FINANCIAL', taxDeductible: true },
  TAXES: { code: '820', nameAr: 'الضرائب', nameEn: 'Taxes', type: 'FINANCIAL', taxDeductible: false },
  PENALTIES: { code: '830', nameAr: 'الغرامات', nameEn: 'Penalties', type: 'FINANCIAL', taxDeductible: false },

  // Other Expenses (900-999)
  MISC: { code: '990', nameAr: 'مصاريف أخرى', nameEn: 'Other Expenses', type: 'OTHER', taxDeductible: true }
};

/* ============================================
   EXPENSE APPROVAL WORKFLOW
   ============================================ */

export const APPROVAL_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
  CREDIT_CARD: 'credit_card',
  PETTY_CASH: 'petty_cash'
};

/* ============================================
   ENHANCED EXPENSE MANAGEMENT
   ============================================ */

export function addExpenseWithAccounting(data) {
  try {
    tx.begin();

    // Validate expense data
    const validation = validateExpenseData(data);
    if (!validation.success) {
      tx.rollback();
      return { success: false, error: validation.error };
    }

    const baseCurrency = getBaseCurrencyInfo();
    const amount = round2(safe(data.amount));
    const vatAmount = data.includesVat ? round2(amount * (data.vatRate || 0.15) / 1.15) : 0;
    const netAmount = round2(amount - vatAmount);

    // Insert expense record
    const expenseStmt = db.prepare(`
      INSERT INTO expenses_enhanced (
        category_code, expense_type, amount, vat_amount, net_amount,
        currency_code, exchange_rate, amount_base, description,
        expense_date, payment_method, payment_reference, vendor_name,
        invoice_number, approval_status, approved_by, approved_at,
        paid_status, paid_date, paid_by, receipt_url, notes,
        is_recurring, recurrence_pattern, next_occurrence,
        budget_category, cost_center, project_id,
        tax_deductible, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const exchangeRate = data.exchangeRate || 1.0;
    const amountBase = round2(amount * exchangeRate);

    expenseStmt.run([
      data.categoryCode,
      data.expenseType || 'OPERATING',
      amount,
      vatAmount,
      netAmount,
      data.currencyCode || baseCurrency.code,
      exchangeRate,
      amountBase,
      data.description,
      data.expenseDate,
      data.paymentMethod || PAYMENT_METHODS.CASH,
      data.paymentReference || null,
      data.vendorName || null,
      data.invoiceNumber || null,
      data.approvalStatus || APPROVAL_STATUS.DRAFT,
      data.approvedBy || null,
      data.approvedAt || null,
      data.paidStatus || false,
      data.paidDate || null,
      data.paidBy || null,
      data.receiptUrl || null,
      data.notes || null,
      data.isRecurring || false,
      data.recurrencePattern || null,
      data.nextOccurrence || null,
      data.budgetCategory || null,
      data.costCenter || null,
      data.projectId || null,
      data.taxDeductible !== false ? 1 : 0,
      getCurrentUser()
    ]);
    expenseStmt.free();

    const expenseId = lastId();

    // Create double-entry accounting records
    createExpenseAccountingEntries(expenseId, data, amountBase, vatAmount);

    // Update budget tracking if applicable
    if (data.budgetCategory) {
      updateBudgetTracking(data.budgetCategory, amountBase);
    }

    // Handle recurring expenses
    if (data.isRecurring && data.recurrencePattern) {
      scheduleNextRecurrence(expenseId, data);
    }

    tx.commit();
    saveDatabase();

    return { success: true, id: expenseId };

  } catch (e) {
    tx.rollback();
    console.error('Add expense with accounting error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   DOUBLE-ENTRY ACCOUNTING
   ============================================ */

function createExpenseAccountingEntries(expenseId, data, amount, vatAmount) {
  // Debit: Expense Account (increases expense)
  const debitStmt = db.prepare(`
    INSERT INTO general_ledger (
      transaction_type, transaction_id, account_code, account_name,
      debit, credit, description, transaction_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Main expense entry
  debitStmt.run([
    'EXPENSE',
    expenseId,
    data.categoryCode,
    data.description,
    amount - vatAmount,
    0,
    `Expense: ${data.description}`,
    data.expenseDate
  ]);

  // VAT entry if applicable
  if (vatAmount > 0) {
    debitStmt.run([
      'EXPENSE_VAT',
      expenseId,
      '250', // VAT Recoverable account
      'ضريبة القيمة المضافة المستردة',
      vatAmount,
      0,
      `VAT on expense: ${data.description}`,
      data.expenseDate
    ]);
  }

  // Credit: Cash/Bank Account (decreases asset)
  const creditAccount = getPaymentMethodAccount(data.paymentMethod);
  debitStmt.run([
    'EXPENSE_PAYMENT',
    expenseId,
    creditAccount.code,
    creditAccount.name,
    0,
    amount,
    `Payment for: ${data.description}`,
    data.expenseDate
  ]);

  debitStmt.free();
}

function getPaymentMethodAccount(method) {
  const accounts = {
    [PAYMENT_METHODS.CASH]: { code: '100', name: 'النقدية' },
    [PAYMENT_METHODS.BANK_TRANSFER]: { code: '110', name: 'البنك' },
    [PAYMENT_METHODS.CHECK]: { code: '111', name: 'الشيكات' },
    [PAYMENT_METHODS.CREDIT_CARD]: { code: '112', name: 'بطاقة الائتمان' },
    [PAYMENT_METHODS.PETTY_CASH]: { code: '101', name: 'النثرية' }
  };

  return accounts[method] || accounts[PAYMENT_METHODS.CASH];
}

/* ============================================
   BUDGET MANAGEMENT
   ============================================ */

export function createBudget(data) {
  try {
    const stmt = db.prepare(`
      INSERT INTO expense_budgets (
        category_code, budget_year, budget_month,
        budget_amount, alert_threshold, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.categoryCode,
      data.budgetYear,
      data.budgetMonth || null,
      safe(data.budgetAmount),
      data.alertThreshold || 0.8, // Alert at 80% by default
      data.notes || null,
      getCurrentUser()
    ]);
    stmt.free();

    saveDatabase();
    return { success: true, id: lastId() };

  } catch (e) {
    console.error('Create budget error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function getBudgetStatus(categoryCode, year, month = null) {
  if (!db) return null;

  try {
    // Get budget
    const budgetStmt = db.prepare(`
      SELECT budget_amount, alert_threshold
      FROM expense_budgets
      WHERE category_code = ? AND budget_year = ?
      ${month ? 'AND budget_month = ?' : 'AND budget_month IS NULL'}
    `);

    const params = [categoryCode, year];
    if (month) params.push(month);
    budgetStmt.bind(params);

    let budget = null;
    if (budgetStmt.step()) {
      budget = budgetStmt.getAsObject();
    }
    budgetStmt.free();

    if (!budget) return null;

    // Get actual expenses
    const expenseStmt = db.prepare(`
      SELECT SUM(amount_base) as total_spent
      FROM expenses_enhanced
      WHERE category_code = ?
      AND strftime('%Y', expense_date) = ?
      ${month ? "AND strftime('%m', expense_date) = ?" : ''}
      AND approval_status = 'approved'
    `);

    expenseStmt.bind(params);

    let totalSpent = 0;
    if (expenseStmt.step()) {
      const row = expenseStmt.getAsObject();
      totalSpent = safe(row.total_spent);
    }
    expenseStmt.free();

    const budgetAmount = safe(budget.budget_amount);
    const remaining = budgetAmount - totalSpent;
    const percentUsed = budgetAmount > 0 ? (totalSpent / budgetAmount) : 0;
    const isOverBudget = totalSpent > budgetAmount;
    const needsAlert = percentUsed >= safe(budget.alert_threshold);

    return {
      budgetAmount,
      totalSpent,
      remaining,
      percentUsed: round2(percentUsed * 100),
      isOverBudget,
      needsAlert
    };

  } catch (e) {
    console.error('Get budget status error:', e);
    return null;
  }
}

/* ============================================
   RECURRING EXPENSES
   ============================================ */

export function scheduleNextRecurrence(expenseId, data) {
  const patterns = {
    'daily': 1,
    'weekly': 7,
    'biweekly': 14,
    'monthly': 30,
    'quarterly': 90,
    'yearly': 365
  };

  const days = patterns[data.recurrencePattern] || 30;
  const nextDate = new Date(data.expenseDate);
  nextDate.setDate(nextDate.getDate() + days);

  const stmt = db.prepare(`
    INSERT INTO recurring_expense_schedule (
      original_expense_id, next_date, pattern, is_active
    ) VALUES (?, ?, ?, 1)
  `);

  stmt.run([expenseId, nextDate.toISOString().split('T')[0], data.recurrencePattern]);
  stmt.free();
}

export function getRecurringExpensesDue(date = null) {
  if (!db) return [];

  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const stmt = db.prepare(`
      SELECT r.*, e.*
      FROM recurring_expense_schedule r
      JOIN expenses_enhanced e ON r.original_expense_id = e.id
      WHERE r.next_date <= ? AND r.is_active = 1
    `);

    stmt.bind([targetDate]);

    const expenses = [];
    while (stmt.step()) {
      expenses.push(stmt.getAsObject());
    }
    stmt.free();

    return expenses;

  } catch (e) {
    console.error('Get recurring expenses due error:', e);
    return [];
  }
}

/* ============================================
   EXPENSE ANALYTICS
   ============================================ */

export function getExpenseAnalytics(fromDate, toDate) {
  if (!db) return null;

  try {
    // By category
    const categoryStmt = db.prepare(`
      SELECT
        category_code,
        COUNT(*) as count,
        SUM(amount_base) as total,
        AVG(amount_base) as average,
        MIN(amount_base) as min_amount,
        MAX(amount_base) as max_amount
      FROM expenses_enhanced
      WHERE expense_date BETWEEN ? AND ?
      AND approval_status = 'approved'
      GROUP BY category_code
      ORDER BY total DESC
    `);

    categoryStmt.bind([fromDate, toDate]);

    const byCategory = [];
    while (categoryStmt.step()) {
      byCategory.push(categoryStmt.getAsObject());
    }
    categoryStmt.free();

    // By payment method
    const paymentStmt = db.prepare(`
      SELECT
        payment_method,
        COUNT(*) as count,
        SUM(amount_base) as total
      FROM expenses_enhanced
      WHERE expense_date BETWEEN ? AND ?
      AND approval_status = 'approved'
      GROUP BY payment_method
    `);

    paymentStmt.bind([fromDate, toDate]);

    const byPaymentMethod = [];
    while (paymentStmt.step()) {
      byPaymentMethod.push(paymentStmt.getAsObject());
    }
    paymentStmt.free();

    // Monthly trend
    const trendStmt = db.prepare(`
      SELECT
        strftime('%Y-%m', expense_date) as month,
        SUM(amount_base) as total,
        COUNT(*) as count
      FROM expenses_enhanced
      WHERE expense_date BETWEEN ? AND ?
      AND approval_status = 'approved'
      GROUP BY strftime('%Y-%m', expense_date)
      ORDER BY month
    `);

    trendStmt.bind([fromDate, toDate]);

    const monthlyTrend = [];
    while (trendStmt.step()) {
      monthlyTrend.push(trendStmt.getAsObject());
    }
    trendStmt.free();

    // Tax deductible vs non-deductible
    const taxStmt = db.prepare(`
      SELECT
        tax_deductible,
        SUM(amount_base) as total
      FROM expenses_enhanced
      WHERE expense_date BETWEEN ? AND ?
      AND approval_status = 'approved'
      GROUP BY tax_deductible
    `);

    taxStmt.bind([fromDate, toDate]);

    let taxDeductible = 0;
    let nonTaxDeductible = 0;

    while (taxStmt.step()) {
      const row = taxStmt.getAsObject();
      if (row.tax_deductible) {
        taxDeductible = safe(row.total);
      } else {
        nonTaxDeductible = safe(row.total);
      }
    }
    taxStmt.free();

    // Grand totals
    const totalStmt = db.prepare(`
      SELECT
        COUNT(*) as total_count,
        SUM(amount_base) as grand_total,
        SUM(vat_amount) as total_vat,
        SUM(net_amount) as total_net
      FROM expenses_enhanced
      WHERE expense_date BETWEEN ? AND ?
      AND approval_status = 'approved'
    `);

    totalStmt.bind([fromDate, toDate]);

    let summary = {
      totalCount: 0,
      grandTotal: 0,
      totalVat: 0,
      totalNet: 0
    };

    if (totalStmt.step()) {
      const row = totalStmt.getAsObject();
      summary = {
        totalCount: row.total_count || 0,
        grandTotal: safe(row.grand_total),
        totalVat: safe(row.total_vat),
        totalNet: safe(row.total_net)
      };
    }
    totalStmt.free();

    return {
      summary,
      byCategory,
      byPaymentMethod,
      monthlyTrend,
      taxBreakdown: {
        deductible: taxDeductible,
        nonDeductible: nonTaxDeductible
      }
    };

  } catch (e) {
    console.error('Get expense analytics error:', e);
    return null;
  }
}

/* ============================================
   APPROVAL WORKFLOW
   ============================================ */

export function submitExpenseForApproval(expenseId) {
  try {
    const stmt = db.prepare(`
      UPDATE expenses_enhanced
      SET approval_status = ?, submitted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND approval_status = ?
    `);

    stmt.run([APPROVAL_STATUS.PENDING, expenseId, APPROVAL_STATUS.DRAFT]);
    stmt.free();

    saveDatabase();
    return { success: true };

  } catch (e) {
    console.error('Submit expense for approval error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function approveExpense(expenseId, approvedBy, notes = null) {
  try {
    tx.begin();

    const stmt = db.prepare(`
      UPDATE expenses_enhanced
      SET
        approval_status = ?,
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP,
        approval_notes = ?
      WHERE id = ? AND approval_status = ?
    `);

    stmt.run([
      APPROVAL_STATUS.APPROVED,
      approvedBy,
      notes,
      expenseId,
      APPROVAL_STATUS.PENDING
    ]);
    stmt.free();

    // Create accounting entries upon approval
    const expenseStmt = db.prepare('SELECT * FROM expenses_enhanced WHERE id = ?');
    expenseStmt.bind([expenseId]);

    if (expenseStmt.step()) {
      const expense = expenseStmt.getAsObject();
      createExpenseAccountingEntries(expenseId, expense, expense.amount_base, expense.vat_amount);
    }
    expenseStmt.free();

    tx.commit();
    saveDatabase();

    return { success: true };

  } catch (e) {
    tx.rollback();
    console.error('Approve expense error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function rejectExpense(expenseId, rejectedBy, reason) {
  try {
    const stmt = db.prepare(`
      UPDATE expenses_enhanced
      SET
        approval_status = ?,
        rejected_by = ?,
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = ?
      WHERE id = ? AND approval_status = ?
    `);

    stmt.run([
      APPROVAL_STATUS.REJECTED,
      rejectedBy,
      reason,
      expenseId,
      APPROVAL_STATUS.PENDING
    ]);
    stmt.free();

    saveDatabase();
    return { success: true };

  } catch (e) {
    console.error('Reject expense error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   VALIDATION
   ============================================ */

function validateExpenseData(data) {
  const errors = [];

  // Required fields
  if (!data.categoryCode) errors.push('فئة المصروف مطلوبة');
  if (!data.amount || data.amount <= 0) errors.push('المبلغ يجب أن يكون أكبر من صفر');
  if (!data.description) errors.push('الوصف مطلوب');
  if (!data.expenseDate) errors.push('تاريخ المصروف مطلوب');

  // Date validation
  const expenseDate = new Date(data.expenseDate);
  const today = new Date();
  if (expenseDate > today) {
    errors.push('لا يمكن إدخال مصروف بتاريخ مستقبلي');
  }

  // Budget validation if category has budget
  if (data.categoryCode) {
    const year = expenseDate.getFullYear();
    const month = expenseDate.getMonth() + 1;
    const budgetStatus = getBudgetStatus(data.categoryCode, year, month);

    if (budgetStatus && budgetStatus.isOverBudget) {
      errors.push(`تحذير: هذا المصروف سيتجاوز الميزانية المحددة (${budgetStatus.percentUsed}%)`);
    }
  }

  // Receipt validation for amounts over threshold
  if (data.amount > 1000 && !data.receiptUrl && !data.invoiceNumber) {
    errors.push('المصروفات أكبر من 1000 تتطلب إيصال أو رقم فاتورة');
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join('. ') };
  }

  return { success: true };
}

/* ============================================
   EXPORT FOR REPORTING
   ============================================ */

export function exportExpensesForTax(year) {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT
        category_code,
        expense_type,
        SUM(CASE WHEN tax_deductible = 1 THEN net_amount ELSE 0 END) as deductible_amount,
        SUM(CASE WHEN tax_deductible = 0 THEN net_amount ELSE 0 END) as non_deductible_amount,
        SUM(vat_amount) as total_vat,
        COUNT(*) as transaction_count
      FROM expenses_enhanced
      WHERE strftime('%Y', expense_date) = ?
      AND approval_status = 'approved'
      GROUP BY category_code, expense_type
      ORDER BY category_code
    `);

    stmt.bind([year.toString()]);

    const taxReport = [];
    while (stmt.step()) {
      taxReport.push(stmt.getAsObject());
    }
    stmt.free();

    return taxReport;

  } catch (e) {
    console.error('Export expenses for tax error:', e);
    return [];
  }
}