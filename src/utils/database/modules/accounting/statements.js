// src/utils/database/modules/accounting/statements.js
import { db, safe, round2 } from '../../core.js';

/**
 * Enhanced statement generation with better formatting and filtering
 */

export function getCustomerStatement(customerId, fromDate = null, toDate = null) {
  if (!db) return [];

  try {
    let sql = `
      SELECT
        ct.*,
        CASE
          WHEN ct.reference_type = 'sale' THEN s.invoice_number
          ELSE NULL
        END as invoice_number,
        CASE
          WHEN ct.reference_type = 'sale' THEN ct.reference_id
          ELSE NULL
        END as sale_id,
        CASE
          WHEN ct.reference_type = 'sale' THEN s.sale_date
          ELSE NULL
        END as sale_date
      FROM customer_transactions ct
      LEFT JOIN sales s ON ct.reference_type = 'sale' AND ct.reference_id = s.id
      WHERE ct.customer_id = ?
    `;
    const params = [customerId];

    if (fromDate) {
      sql += ` AND ct.transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      sql += ` AND ct.transaction_date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY ct.transaction_date ASC, ct.id ASC`;

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const transactions = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      transactions.push({
        id: row.id,
        customer_id: row.customer_id,
        transaction_type: row.transaction_type,
        transaction_date: row.transaction_date,
        amount: safe(row.amount, 0),
        balance_after: safe(row.balance_after, 0),
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        invoice_number: row.invoice_number,
        sale_id: row.sale_id,
        sale_date: row.sale_date,
        notes: row.notes,
        created_at: row.created_at,
        created_by: row.created_by,
      });
    }
    stmt.free();

    return transactions;
  } catch (e) {
    console.error('Get customer statement error:', e);
    return [];
  }
}

export function getSupplierStatement(supplierId, fromDate = null, toDate = null) {
  if (!db) return [];

  try {
    let sql = `
      SELECT *
      FROM supplier_transactions
      WHERE supplier_id = ?
    `;
    const params = [supplierId];

    if (fromDate) {
      sql += ` AND transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      sql += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY transaction_date ASC, id ASC`;

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const transactions = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      transactions.push({
        id: row.id,
        supplier_id: row.supplier_id,
        transaction_type: row.transaction_type,
        transaction_date: row.transaction_date,
        amount: safe(row.amount, 0),
        balance_after: safe(row.balance_after, 0),
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        notes: row.notes,
        created_at: row.created_at,
        created_by: row.created_by,
      });
    }
    stmt.free();

    return transactions;
  } catch (e) {
    console.error('Get supplier statement error:', e);
    return [];
  }
}

/**
 * Get statement summary (totals for the period)
 */
export function getStatementSummary(accountType, accountId, fromDate = null, toDate = null) {
  if (!db) return null;

  const statement = accountType === 'customer'
    ? getCustomerStatement(accountId, fromDate, toDate)
    : getSupplierStatement(accountId, fromDate, toDate);

  const summary = {
    opening_balance: 0,
    total_charges: 0,
    total_payments: 0,
    closing_balance: 0,
    transaction_count: statement.length,
  };

  if (statement.length > 0) {
    // Opening balance = balance before first transaction
    summary.opening_balance = round2(statement[0].balance_after - statement[0].amount);

    // Calculate totals
    for (const tx of statement) {
      if (tx.amount > 0) {
        summary.total_charges += tx.amount;
      } else {
        summary.total_payments += Math.abs(tx.amount);
      }
    }

    // Closing balance = last transaction balance
    summary.closing_balance = statement[statement.length - 1].balance_after;

    // Round values
    summary.total_charges = round2(summary.total_charges);
    summary.total_payments = round2(summary.total_payments);
  }

  return summary;
}
