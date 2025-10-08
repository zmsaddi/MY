// src/utils/database/modules/accounting/balances.js
import { db, safe, round2 } from '../../core.js';

/**
 * Enhanced balance calculation - calculates from ALL transactions, not just last record
 * This is more reliable and allows for historical balance queries
 */

export function calculateCustomerBalance(customerId, asOfDate = null) {
  if (!db) return 0;

  try {
    let sql = `
      SELECT COALESCE(SUM(amount), 0) as balance
      FROM customer_transactions
      WHERE customer_id = ?
    `;
    const params = [customerId];

    if (asOfDate) {
      sql += ` AND transaction_date <= ?`;
      params.push(asOfDate);
    }

    const stmt = db.prepare(sql);
    stmt.bind(params);

    let balance = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      balance = round2(safe(row.balance, 0));
    }
    stmt.free();

    return balance;
  } catch (e) {
    console.error('Calculate customer balance error:', e);
    return 0;
  }
}

export function calculateSupplierBalance(supplierId, asOfDate = null) {
  if (!db) return 0;

  try {
    let sql = `
      SELECT COALESCE(SUM(amount), 0) as balance
      FROM supplier_transactions
      WHERE supplier_id = ?
    `;
    const params = [supplierId];

    if (asOfDate) {
      sql += ` AND transaction_date <= ?`;
      params.push(asOfDate);
    }

    const stmt = db.prepare(sql);
    stmt.bind(params);

    let balance = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      balance = round2(safe(row.balance, 0));
    }
    stmt.free();

    return balance;
  } catch (e) {
    console.error('Calculate supplier balance error:', e);
    return 0;
  }
}

/**
 * Get balance from last transaction (for backward compatibility)
 */
export function getCustomerBalance(customerId) {
  if (!db) return 0;

  try {
    const stmt = db.prepare(`
      SELECT balance_after
      FROM customer_transactions
      WHERE customer_id = ?
      ORDER BY id DESC
      LIMIT 1
    `);
    stmt.bind([customerId]);

    let balance = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      balance = safe(row.balance_after, 0);
    }
    stmt.free();

    return balance;
  } catch (e) {
    console.error('Get customer balance error:', e);
    return 0;
  }
}

export function getSupplierBalance(supplierId) {
  if (!db) return 0;

  try {
    const stmt = db.prepare(`
      SELECT balance_after
      FROM supplier_transactions
      WHERE supplier_id = ?
      ORDER BY id DESC
      LIMIT 1
    `);
    stmt.bind([supplierId]);

    let balance = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      balance = safe(row.balance_after, 0);
    }
    stmt.free();

    return balance;
  } catch (e) {
    console.error('Get supplier balance error:', e);
    return 0;
  }
}

/**
 * Rebuild balance trail - recalculates all balance_after values
 * Useful for data integrity verification and correction
 */
export function rebuildCustomerBalanceTrail(customerId) {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // Get all transactions in chronological order
    const stmt = db.prepare(`
      SELECT id, amount
      FROM customer_transactions
      WHERE customer_id = ?
      ORDER BY transaction_date ASC, id ASC
    `);
    stmt.bind([customerId]);

    const transactions = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      transactions.push({ id: row.id, amount: safe(row.amount, 0) });
    }
    stmt.free();

    // Recalculate running balance
    let runningBalance = 0;
    const updateStmt = db.prepare(`
      UPDATE customer_transactions
      SET balance_after = ?
      WHERE id = ?
    `);

    for (const tx of transactions) {
      runningBalance = round2(runningBalance + tx.amount);
      updateStmt.run([runningBalance, tx.id]);
    }
    updateStmt.free();

    db.run('COMMIT');

    return { success: true, finalBalance: runningBalance, transactionsUpdated: transactions.length };
  } catch (e) {
    db.run('ROLLBACK');
    console.error('Rebuild customer balance trail error:', e);
    return { success: false, error: e.message };
  }
}

export function rebuildSupplierBalanceTrail(supplierId) {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      SELECT id, amount
      FROM supplier_transactions
      WHERE supplier_id = ?
      ORDER BY transaction_date ASC, id ASC
    `);
    stmt.bind([supplierId]);

    const transactions = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      transactions.push({ id: row.id, amount: safe(row.amount, 0) });
    }
    stmt.free();

    let runningBalance = 0;
    const updateStmt = db.prepare(`
      UPDATE supplier_transactions
      SET balance_after = ?
      WHERE id = ?
    `);

    for (const tx of transactions) {
      runningBalance = round2(runningBalance + tx.amount);
      updateStmt.run([runningBalance, tx.id]);
    }
    updateStmt.free();

    db.run('COMMIT');

    return { success: true, finalBalance: runningBalance, transactionsUpdated: transactions.length };
  } catch (e) {
    db.run('ROLLBACK');
    console.error('Rebuild supplier balance trail error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get all customer balances
 */
export function getAllCustomerBalances() {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.phone,
        COALESCE(
          (SELECT balance_after FROM customer_transactions
           WHERE customer_id = c.id
           ORDER BY id DESC LIMIT 1),
          0
        ) as balance
      FROM customers c
      WHERE c.is_active = 1
      ORDER BY balance DESC
    `);

    const balances = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      balances.push({
        customer_id: row.id,
        customer_name: row.name,
        phone: row.phone,
        balance: safe(row.balance, 0),
      });
    }
    stmt.free();

    return balances;
  } catch (e) {
    console.error('Get all customer balances error:', e);
    return [];
  }
}

export function getAllSupplierBalances() {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT
        s.id,
        s.name,
        s.phone,
        COALESCE(
          (SELECT balance_after FROM supplier_transactions
           WHERE supplier_id = s.id
           ORDER BY id DESC LIMIT 1),
          0
        ) as balance
      FROM suppliers s
      WHERE s.is_active = 1
      ORDER BY balance DESC
    `);

    const balances = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      balances.push({
        supplier_id: row.id,
        supplier_name: row.name,
        phone: row.phone,
        balance: safe(row.balance, 0),
      });
    }
    stmt.free();

    return balances;
  } catch (e) {
    console.error('Get all supplier balances error:', e);
    return [];
  }
}
