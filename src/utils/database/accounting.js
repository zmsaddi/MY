// src/utils/database/accounting.js
import { db, tx, saveDatabase, safe, round2, lastId, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';

/* ============================================
   BALANCE QUERIES
   ============================================ */

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

/* ============================================
   STATEMENTS
   ============================================ */

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
        END as sale_id
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
        amount: row.amount,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        balance_after: row.balance_after,
        notes: row.notes,
        transaction_date: row.transaction_date,
        created_at: row.created_at,
        invoice_number: row.invoice_number,
        sale_id: row.sale_id
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
        amount: row.amount,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        balance_after: row.balance_after,
        notes: row.notes,
        transaction_date: row.transaction_date,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return transactions;
  } catch (e) {
    console.error('Get supplier statement error:', e);
    return [];
  }
}

/* ============================================
   TRANSACTION INSERTION
   ============================================ */

export function insertCustomerTransactionInline(data) {
  const currentBalance = getCustomerBalance(data.customer_id);
  const newBalance = round2(currentBalance + safe(data.amount));

  const stmt = db.prepare(`
    INSERT INTO customer_transactions
    (customer_id, transaction_type, amount, reference_type, reference_id,
     balance_after, notes, transaction_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    data.customer_id,
    data.transaction_type,
    safe(data.amount),
    data.reference_type || null,
    data.reference_id || null,
    newBalance,
    data.notes || null,
    data.transaction_date,
    getCurrentUser()
  ]);
  stmt.free();
}

export function insertSupplierTransactionInline(data) {
  const currentBalance = getSupplierBalance(data.supplier_id);
  const newBalance = round2(currentBalance + safe(data.amount));

  const stmt = db.prepare(`
    INSERT INTO supplier_transactions
    (supplier_id, transaction_type, amount, reference_type, reference_id,
     balance_after, notes, transaction_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    data.supplier_id,
    data.transaction_type,
    safe(data.amount),
    data.reference_type || null,
    data.reference_id || null,
    newBalance,
    data.notes || null,
    data.transaction_date,
    getCurrentUser()
  ]);
  stmt.free();
}

/* ============================================
   PAYMENT SETTLEMENT
   ============================================ */

export function settleCustomerPayment(customerId, paymentAmount, paymentDate, paymentMethod, notes = null) {
  try {
    tx.begin();
    
    const amountError = validators.positiveNumber(paymentAmount, 'مبلغ الدفعة');
    if (amountError) {
      tx.rollback();
      return { success: false, error: amountError };
    }
    
    insertCustomerTransactionInline({
      customer_id: customerId,
      transaction_type: 'payment',
      amount: -safe(paymentAmount),
      reference_type: 'payment',
      reference_id: null,
      transaction_date: paymentDate,
      notes: notes || `دفعة - ${paymentMethod}`
    });
    
    tx.commit();
    saveDatabase();
    
    return { success: true, balance: getCustomerBalance(customerId) };
    
  } catch (e) {
    tx.rollback();
    console.error('Settle customer payment error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function settleSupplierPayment(supplierId, paymentAmount, paymentDate, paymentMethod, notes = null) {
  try {
    tx.begin();
    
    const amountError = validators.positiveNumber(paymentAmount, 'مبلغ الدفعة');
    if (amountError) {
      tx.rollback();
      return { success: false, error: amountError };
    }
    
    insertSupplierTransactionInline({
      supplier_id: supplierId,
      transaction_type: 'payment',
      amount: -safe(paymentAmount),
      reference_type: 'payment',
      reference_id: null,
      transaction_date: paymentDate,
      notes: notes || `دفعة - ${paymentMethod}`
    });
    
    tx.commit();
    saveDatabase();
    
    return { success: true, balance: getSupplierBalance(supplierId) };
    
  } catch (e) {
    tx.rollback();
    console.error('Settle supplier payment error:', e);
    return { success: false, error: parseDbError(e) };
  }
}
