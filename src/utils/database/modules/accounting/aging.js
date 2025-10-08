// src/utils/database/modules/accounting/aging.js
import { db, safe, round2 } from '../../core.js';

/**
 * Aging Analysis - Critical for accounts receivable/payable management
 * Categorizes outstanding balances by age buckets
 */

/**
 * Get customer receivables aging report
 * @param {number|null} customerId - Specific customer or null for all
 * @param {string|null} asOfDate - As of date (default: today)
 * @returns {Array} Aging report data
 */
export function getCustomerAgingReport(customerId = null, asOfDate = null) {
  if (!db) return [];

  const targetDate = asOfDate || new Date().toISOString().split('T')[0];

  try {
    // Get all customers with outstanding balances
    let customerFilter = customerId ? 'AND c.id = ?' : '';
    const params = customerId ? [targetDate, customerId] : [targetDate];

    const sql = `
      SELECT
        c.id as customer_id,
        c.name as customer_name,
        c.phone,
        c.email,
        COALESCE((
          SELECT balance_after
          FROM customer_transactions
          WHERE customer_id = c.id
            AND transaction_date <= ?
          ORDER BY id DESC
          LIMIT 1
        ), 0) as total_balance
      FROM customers c
      WHERE c.is_active = 1 ${customerFilter}
      HAVING total_balance > 0
      ORDER BY total_balance DESC
    `;

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const agingData = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const customerId = row.customer_id;

      // Calculate aging buckets for this customer
      const buckets = calculateAgingBuckets(customerId, targetDate, 'customer');

      agingData.push({
        customer_id: customerId,
        customer_name: row.customer_name,
        phone: row.phone,
        email: row.email,
        total_balance: safe(row.total_balance, 0),
        current: buckets.current,
        days_1_30: buckets.days_1_30,
        days_31_60: buckets.days_31_60,
        days_61_90: buckets.days_61_90,
        days_over_90: buckets.days_over_90,
      });
    }
    stmt.free();

    return agingData;
  } catch (e) {
    console.error('Get customer aging report error:', e);
    return [];
  }
}

/**
 * Get supplier payables aging report
 */
export function getSupplierAgingReport(supplierId = null, asOfDate = null) {
  if (!db) return [];

  const targetDate = asOfDate || new Date().toISOString().split('T')[0];

  try {
    let supplierFilter = supplierId ? 'AND s.id = ?' : '';
    const params = supplierId ? [targetDate, supplierId] : [targetDate];

    const sql = `
      SELECT
        s.id as supplier_id,
        s.name as supplier_name,
        s.phone,
        s.email,
        COALESCE((
          SELECT balance_after
          FROM supplier_transactions
          WHERE supplier_id = s.id
            AND transaction_date <= ?
          ORDER BY id DESC
          LIMIT 1
        ), 0) as total_balance
      FROM suppliers s
      WHERE s.is_active = 1 ${supplierFilter}
      HAVING total_balance > 0
      ORDER BY total_balance DESC
    `;

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const agingData = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const supplierId = row.supplier_id;

      const buckets = calculateAgingBuckets(supplierId, targetDate, 'supplier');

      agingData.push({
        supplier_id: supplierId,
        supplier_name: row.supplier_name,
        phone: row.phone,
        email: row.email,
        total_balance: safe(row.total_balance, 0),
        current: buckets.current,
        days_1_30: buckets.days_1_30,
        days_31_60: buckets.days_31_60,
        days_61_90: buckets.days_61_90,
        days_over_90: buckets.days_over_90,
      });
    }
    stmt.free();

    return agingData;
  } catch (e) {
    console.error('Get supplier aging report error:', e);
    return [];
  }
}

/**
 * Calculate aging buckets for a specific account
 * @private
 */
function calculateAgingBuckets(accountId, asOfDate, accountType) {
  const buckets = {
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_over_90: 0,
  };

  try {
    const tableName = accountType === 'customer' ? 'customer_transactions' : 'supplier_transactions';
    const accountField = accountType === 'customer' ? 'customer_id' : 'supplier_id';

    const sql = `
      SELECT
        transaction_date,
        amount,
        balance_after
      FROM ${tableName}
      WHERE ${accountField} = ?
        AND transaction_date <= ?
        AND amount > 0
      ORDER BY transaction_date ASC
    `;

    const stmt = db.prepare(sql);
    stmt.bind([accountId, asOfDate]);

    const transactions = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      transactions.push({
        date: row.transaction_date,
        amount: safe(row.amount, 0),
      });
    }
    stmt.free();

    // Calculate days old and categorize
    const asOf = new Date(asOfDate);

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const daysOld = Math.floor((asOf - txDate) / (1000 * 60 * 60 * 24));

      if (daysOld <= 0) {
        buckets.current += tx.amount;
      } else if (daysOld <= 30) {
        buckets.days_1_30 += tx.amount;
      } else if (daysOld <= 60) {
        buckets.days_31_60 += tx.amount;
      } else if (daysOld <= 90) {
        buckets.days_61_90 += tx.amount;
      } else {
        buckets.days_over_90 += tx.amount;
      }
    }

    // Round all buckets
    buckets.current = round2(buckets.current);
    buckets.days_1_30 = round2(buckets.days_1_30);
    buckets.days_31_60 = round2(buckets.days_31_60);
    buckets.days_61_90 = round2(buckets.days_61_90);
    buckets.days_over_90 = round2(buckets.days_over_90);

  } catch (e) {
    console.error('Calculate aging buckets error:', e);
  }

  return buckets;
}

/**
 * Get aging summary (totals across all accounts)
 */
export function getAgingSummary(accountType = 'customer', asOfDate = null) {
  if (!db) return null;

  const agingReport = accountType === 'customer'
    ? getCustomerAgingReport(null, asOfDate)
    : getSupplierAgingReport(null, asOfDate);

  const summary = {
    total_accounts: agingReport.length,
    total_balance: 0,
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_over_90: 0,
  };

  for (const record of agingReport) {
    summary.total_balance += record.total_balance;
    summary.current += record.current;
    summary.days_1_30 += record.days_1_30;
    summary.days_31_60 += record.days_31_60;
    summary.days_61_90 += record.days_61_90;
    summary.days_over_90 += record.days_over_90;
  }

  // Round all values
  summary.total_balance = round2(summary.total_balance);
  summary.current = round2(summary.current);
  summary.days_1_30 = round2(summary.days_1_30);
  summary.days_31_60 = round2(summary.days_31_60);
  summary.days_61_90 = round2(summary.days_61_90);
  summary.days_over_90 = round2(summary.days_over_90);

  return summary;
}

/**
 * Get overdue accounts (90+ days)
 */
export function getOverdueAccounts(accountType = 'customer', asOfDate = null) {
  const agingReport = accountType === 'customer'
    ? getCustomerAgingReport(null, asOfDate)
    : getSupplierAgingReport(null, asOfDate);

  return agingReport
    .filter((record) => record.days_over_90 > 0)
    .sort((a, b) => b.days_over_90 - a.days_over_90);
}
