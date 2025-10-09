// src/utils/accounting/AccountingSystem.js
// نظام المحاسبة الشامل للمشروع

import { getDb } from '../database/core';

/**
 * نظام المحاسبة المحترف
 * يتعامل مع:
 * 1. المدفوعات للموردين
 * 2. المدفوعات من العملاء
 * 3. المصروفات
 * 4. حسابات الأرباح والخسائر
 * 5. الميزانية العمومية
 */

// ==================== حسابات الموردين ====================

/**
 * الحصول على رصيد المورد
 */
export function getSupplierBalance(supplierId) {
  const db = getDb();

  // إجمالي المشتريات من المورد
  const purchases = db.prepare(`
    SELECT
      COALESCE(SUM(b.total_cost), 0) as total_purchases
    FROM batches b
    WHERE b.supplier_id = ?
  `).get(supplierId);

  // إجمالي المدفوعات للمورد
  const payments = db.prepare(`
    SELECT
      COALESCE(SUM(p.amount), 0) as total_payments
    FROM supplier_payments p
    WHERE p.supplier_id = ?
  `).get(supplierId);

  const totalPurchases = purchases?.total_purchases || 0;
  const totalPayments = payments?.total_payments || 0;
  const balance = totalPurchases - totalPayments;

  return {
    total_purchases: totalPurchases,
    total_payments: totalPayments,
    balance: balance, // المبلغ المستحق للمورد
    status: balance === 0 ? 'settled' : (balance > 0 ? 'payable' : 'overpaid')
  };
}

/**
 * إضافة دفعة للمورد
 */
export function addSupplierPayment(data) {
  const db = getDb();

  try {
    const result = db.prepare(`
      INSERT INTO supplier_payments (
        supplier_id, amount, payment_date, payment_method,
        reference_number, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      data.supplier_id,
      data.amount,
      data.payment_date,
      data.payment_method || null,
      data.reference_number || null,
      data.notes || null
    );

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على كشف حساب المورد
 */
export function getSupplierStatement(supplierId, startDate, endDate) {
  const db = getDb();

  // المشتريات
  const purchases = db.prepare(`
    SELECT
      'purchase' as type,
      b.id,
      b.received_date as date,
      s.code as sheet_code,
      b.quantity,
      b.total_cost as debit,
      0 as credit,
      b.notes
    FROM batches b
    JOIN sheets s ON b.sheet_id = s.id
    WHERE b.supplier_id = ?
      AND b.received_date BETWEEN ? AND ?
    ORDER BY b.received_date
  `).all(supplierId, startDate, endDate);

  // المدفوعات
  const payments = db.prepare(`
    SELECT
      'payment' as type,
      p.id,
      p.payment_date as date,
      p.reference_number,
      0 as quantity,
      0 as debit,
      p.amount as credit,
      p.notes
    FROM supplier_payments p
    WHERE p.supplier_id = ?
      AND p.payment_date BETWEEN ? AND ?
    ORDER BY p.payment_date
  `).all(supplierId, startDate, endDate);

  // دمج وترتيب
  const transactions = [...purchases, ...payments].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // حساب الرصيد التدريجي
  let runningBalance = 0;
  transactions.forEach(t => {
    runningBalance += (t.debit - t.credit);
    t.balance = runningBalance;
  });

  return {
    transactions,
    summary: {
      total_debit: transactions.reduce((sum, t) => sum + t.debit, 0),
      total_credit: transactions.reduce((sum, t) => sum + t.credit, 0),
      final_balance: runningBalance
    }
  };
}

// ==================== حسابات العملاء ====================

/**
 * الحصول على رصيد العميل
 */
export function getCustomerBalance(customerId) {
  const db = getDb();

  // إجمالي المبيعات للعميل
  const sales = db.prepare(`
    SELECT
      COALESCE(SUM(s.total_amount), 0) as total_sales
    FROM sales s
    WHERE s.customer_id = ?
  `).get(customerId);

  // إجمالي المدفوعات من العميل
  const payments = db.prepare(`
    SELECT
      COALESCE(SUM(p.amount), 0) as total_payments
    FROM payments p
    WHERE p.customer_id = ?
      AND p.transaction_type = 'customer_payment'
  `).get(customerId);

  const totalSales = sales?.total_sales || 0;
  const totalPayments = payments?.total_payments || 0;
  const balance = totalSales - totalPayments;

  return {
    total_sales: totalSales,
    total_payments: totalPayments,
    balance: balance, // المبلغ المستحق من العميل
    status: balance === 0 ? 'settled' : (balance > 0 ? 'receivable' : 'overpaid')
  };
}

/**
 * إضافة دفعة من العميل
 */
export function addCustomerPayment(data) {
  const db = getDb();

  try {
    const result = db.prepare(`
      INSERT INTO payments (
        customer_id, transaction_type, amount, payment_date,
        payment_method, reference_number, notes, created_at
      ) VALUES (?, 'customer_payment', ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      data.customer_id,
      data.amount,
      data.payment_date,
      data.payment_method || null,
      data.reference_number || null,
      data.notes || null
    );

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على كشف حساب العميل
 */
export function getCustomerStatement(customerId, startDate, endDate) {
  const db = getDb();

  // المبيعات
  const sales = db.prepare(`
    SELECT
      'sale' as type,
      s.id,
      s.sale_date as date,
      s.invoice_number,
      s.total_amount as debit,
      0 as credit,
      s.notes
    FROM sales s
    WHERE s.customer_id = ?
      AND s.sale_date BETWEEN ? AND ?
    ORDER BY s.sale_date
  `).all(customerId, startDate, endDate);

  // المدفوعات
  const payments = db.prepare(`
    SELECT
      'payment' as type,
      p.id,
      p.payment_date as date,
      p.reference_number,
      0 as debit,
      p.amount as credit,
      p.notes
    FROM payments p
    WHERE p.customer_id = ?
      AND p.transaction_type = 'customer_payment'
      AND p.payment_date BETWEEN ? AND ?
    ORDER BY p.payment_date
  `).all(customerId, startDate, endDate);

  // دمج وترتيب
  const transactions = [...sales, ...payments].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // حساب الرصيد التدريجي
  let runningBalance = 0;
  transactions.forEach(t => {
    runningBalance += (t.debit - t.credit);
    t.balance = runningBalance;
  });

  return {
    transactions,
    summary: {
      total_debit: transactions.reduce((sum, t) => sum + t.debit, 0),
      total_credit: transactions.reduce((sum, t) => sum + t.credit, 0),
      final_balance: runningBalance
    }
  };
}

// ==================== المصروفات ====================

/**
 * إضافة مصروف
 */
export function addExpense(data) {
  const db = getDb();

  try {
    const result = db.prepare(`
      INSERT INTO expenses (
        expense_type, amount, expense_date, description,
        payment_method, reference_number, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      data.expense_type,
      data.amount,
      data.expense_date,
      data.description || null,
      data.payment_method || null,
      data.reference_number || null
    );

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على إجمالي المصروفات
 */
export function getTotalExpenses(startDate, endDate) {
  const db = getDb();

  const result = db.prepare(`
    SELECT
      expense_type,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE expense_date BETWEEN ? AND ?
    GROUP BY expense_type
  `).all(startDate, endDate);

  const grandTotal = result.reduce((sum, r) => sum + r.total, 0);

  return {
    by_type: result,
    grand_total: grandTotal
  };
}

// ==================== قائمة الدخل ====================

/**
 * حساب قائمة الدخل
 */
export function getIncomeStatement(startDate, endDate) {
  const db = getDb();

  // الإيرادات (المبيعات)
  const sales = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total_sales
    FROM sales
    WHERE sale_date BETWEEN ? AND ?
  `).get(startDate, endDate);

  // تكلفة البضاعة المباعة (COGS)
  const cogs = db.prepare(`
    SELECT COALESCE(SUM(
      si.quantity * COALESCE(
        (SELECT b.price_per_kg * s.weight_per_sheet_kg
         FROM batches b
         JOIN sheets s ON b.sheet_id = s.id
         WHERE b.sheet_id = si.sheet_id
         ORDER BY b.received_date
         LIMIT 1), 0)
    ), 0) as total_cogs
    FROM sale_items si
    JOIN sales sa ON si.sale_id = sa.id
    WHERE sa.sale_date BETWEEN ? AND ?
      AND si.item_type = 'material'
  `).get(startDate, endDate);

  // المصروفات التشغيلية
  const expenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_expenses
    FROM expenses
    WHERE expense_date BETWEEN ? AND ?
  `).get(startDate, endDate);

  const totalSales = sales?.total_sales || 0;
  const totalCOGS = cogs?.total_cogs || 0;
  const totalExpenses = expenses?.total_expenses || 0;

  const grossProfit = totalSales - totalCOGS;
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const netProfit = grossProfit - totalExpenses;
  const netMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  return {
    revenue: {
      sales: totalSales
    },
    cost_of_goods_sold: totalCOGS,
    gross_profit: grossProfit,
    gross_margin_percentage: grossMargin,
    operating_expenses: totalExpenses,
    net_profit: netProfit,
    net_margin_percentage: netMargin,
    period: {
      start_date: startDate,
      end_date: endDate
    }
  };
}

// ==================== الميزانية العمومية ====================

/**
 * حساب الميزانية العمومية
 */
export function getBalanceSheet(asOfDate) {
  const db = getDb();

  // === الأصول ===

  // المخزون
  const inventory = db.prepare(`
    SELECT COALESCE(SUM(
      b.quantity_remaining * b.price_per_kg * s.weight_per_sheet_kg
    ), 0) as inventory_value
    FROM batches b
    JOIN sheets s ON b.sheet_id = s.id
    WHERE b.quantity_remaining > 0
  `).get();

  // الذمم المدينة (العملاء)
  const receivables = db.prepare(`
    SELECT COALESCE(SUM(
      s.total_amount - COALESCE(
        (SELECT SUM(amount) FROM payments
         WHERE customer_id = s.customer_id
         AND transaction_type = 'customer_payment'), 0)
    ), 0) as total_receivables
    FROM sales s
    WHERE s.sale_date <= ?
  `).get(asOfDate);

  // النقد (من المدفوعات)
  const cash = db.prepare(`
    SELECT (
      COALESCE((SELECT SUM(amount) FROM payments WHERE transaction_type = 'customer_payment'), 0)
      - COALESCE((SELECT SUM(amount) FROM supplier_payments), 0)
      - COALESCE((SELECT SUM(amount) FROM expenses), 0)
    ) as cash_balance
  `).get();

  // === الالتزامات ===

  // الذمم الدائنة (الموردين)
  const payables = db.prepare(`
    SELECT COALESCE(SUM(
      b.total_cost - COALESCE(
        (SELECT SUM(amount) FROM supplier_payments
         WHERE supplier_id = b.supplier_id), 0)
    ), 0) as total_payables
    FROM batches b
    WHERE b.received_date <= ?
  `).get(asOfDate);

  const totalAssets = (inventory?.inventory_value || 0) +
                      (receivables?.total_receivables || 0) +
                      (cash?.cash_balance || 0);

  const totalLiabilities = payables?.total_payables || 0;
  const equity = totalAssets - totalLiabilities;

  return {
    assets: {
      current_assets: {
        cash: cash?.cash_balance || 0,
        accounts_receivable: receivables?.total_receivables || 0,
        inventory: inventory?.inventory_value || 0,
        total_current_assets: totalAssets
      },
      total_assets: totalAssets
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: payables?.total_payables || 0,
        total_current_liabilities: totalLiabilities
      },
      total_liabilities: totalLiabilities
    },
    equity: {
      retained_earnings: equity,
      total_equity: equity
    },
    as_of_date: asOfDate
  };
}

// ==================== التقارير المالية ====================

/**
 * الحصول على ملخص مالي شامل
 */
export function getFinancialSummary(startDate, endDate) {
  const incomeStatement = getIncomeStatement(startDate, endDate);
  const balanceSheet = getBalanceSheet(endDate);

  // نسب مالية مهمة
  const currentRatio = balanceSheet.assets.total_assets /
                      (balanceSheet.liabilities.total_liabilities || 1);

  const returnOnAssets = balanceSheet.assets.total_assets > 0
    ? (incomeStatement.net_profit / balanceSheet.assets.total_assets) * 100
    : 0;

  return {
    income_statement: incomeStatement,
    balance_sheet: balanceSheet,
    financial_ratios: {
      current_ratio: currentRatio,
      return_on_assets: returnOnAssets,
      gross_margin: incomeStatement.gross_margin_percentage,
      net_margin: incomeStatement.net_margin_percentage
    },
    period: {
      start_date: startDate,
      end_date: endDate
    }
  };
}

export default {
  // Supplier functions
  getSupplierBalance,
  addSupplierPayment,
  getSupplierStatement,

  // Customer functions
  getCustomerBalance,
  addCustomerPayment,
  getCustomerStatement,

  // Expense functions
  addExpense,
  getTotalExpenses,

  // Financial statements
  getIncomeStatement,
  getBalanceSheet,
  getFinancialSummary
};