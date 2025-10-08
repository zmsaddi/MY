// src/utils/database/suppliers.js
import { db, saveDatabase, lastId, safe, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { insertSupplierTransactionInline } from './accounting.js';

/* ============================================
   SUPPLIERS MANAGEMENT
   ============================================ */

export function getSuppliers(activeOnly = true) {
  if (!db) return [];
  
  try {
    const sql = activeOnly
      ? 'SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name'
      : 'SELECT * FROM suppliers ORDER BY name';
    
    const stmt = db.prepare(sql);
    const suppliers = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      suppliers.push({
        id: row.id,
        name: row.name,
        company_name: row.company_name,
        phone1: row.phone1,
        phone2: row.phone2,
        address: row.address,
        email: row.email,
        tax_number: row.tax_number,
        notes: row.notes,
        is_active: row.is_active,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return suppliers;
  } catch (e) {
    console.error('Get suppliers error:', e);
    return [];
  }
}

export function addSupplier(data) {
  try {
    const validationError = validators.validateCustomerSupplier(data, false);
    if (validationError) {
      return { success: false, error: validationError };
    }
    
    const stmt = db.prepare(`INSERT INTO suppliers
      (name, company_name, phone1, phone2, address, email, tax_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run([
      data.name.trim(),
      data.company_name ? data.company_name.trim() : null,
      data.phone1 ? data.phone1.trim() : null,
      data.phone2 ? data.phone2.trim() : null,
      data.address ? data.address.trim() : null,
      data.email ? data.email.trim() : null,
      data.tax_number ? data.tax_number.trim() : null,
      data.notes ? data.notes.trim() : null,
      getCurrentUser()
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add supplier error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateSupplier(supplierId, data) {
  try {
    const validationError = validators.validateCustomerSupplier(data, false);
    if (validationError) {
      return { success: false, error: validationError };
    }
    
    const stmt = db.prepare(`UPDATE suppliers SET
      name = ?,
      company_name = ?,
      phone1 = ?,
      phone2 = ?,
      address = ?,
      email = ?,
      tax_number = ?,
      notes = ?,
      updated_by = ?
      WHERE id = ?`);

    stmt.run([
      data.name.trim(),
      data.company_name ? data.company_name.trim() : null,
      data.phone1 ? data.phone1.trim() : null,
      data.phone2 ? data.phone2.trim() : null,
      data.address ? data.address.trim() : null,
      data.email ? data.email.trim() : null,
      data.tax_number ? data.tax_number.trim() : null,
      data.notes ? data.notes.trim() : null,
      getCurrentUser(),
      supplierId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update supplier error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function deleteSupplier(supplierId) {
  try {
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM batches WHERE supplier_id = ?');
    checkStmt.bind([supplierId]);
    
    let hasBatches = false;
    if (checkStmt.step()) {
      const row = checkStmt.getAsObject();
      hasBatches = row.count > 0;
    }
    checkStmt.free();
    
    if (hasBatches) {
      const stmt = db.prepare('UPDATE suppliers SET is_active = 0 WHERE id = ?');
      stmt.run([supplierId]);
      stmt.free();
    } else {
      const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
      stmt.run([supplierId]);
      stmt.free();
    }
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Delete supplier error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   SUPPLIER PAYMENTS
   ============================================ */

export function addSupplierPayment(paymentData) {
  try {
    if (!paymentData.supplier_id || !paymentData.amount || paymentData.amount <= 0) {
      return { success: false, error: 'بيانات الدفع غير صحيحة' };
    }
    
    const stmt = db.prepare(`
      INSERT INTO supplier_payments 
      (supplier_id, batch_id, amount, currency, payment_method, payment_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      paymentData.supplier_id,
      paymentData.batch_id || null,
      safe(paymentData.amount),
      paymentData.currency || 'USD',
      paymentData.payment_method || null,
      paymentData.payment_date || new Date().toISOString().split('T')[0],
      paymentData.notes || null
    ]);
    stmt.free();
    
    const paymentId = lastId();
    
    insertSupplierTransactionInline({
      supplier_id: paymentData.supplier_id,
      transaction_type: 'payment',
      amount: -safe(paymentData.amount),
      reference_type: 'payment',
      reference_id: paymentId,
      transaction_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      notes: paymentData.notes || 'دفعة للمورد'
    });
    
    saveDatabase();
    return { success: true, id: paymentId };
    
  } catch (e) {
    console.error('Add supplier payment error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function getSupplierPayments(supplierId) {
  if (!db) return [];
  
  try {
    const stmt = db.prepare(`
      SELECT 
        sp.*,
        s.name as supplier_name
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.supplier_id = ?
      ORDER BY sp.payment_date DESC, sp.created_at DESC
    `);
    stmt.bind([supplierId]);
    
    const payments = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      payments.push({
        id: row.id,
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        batch_id: row.batch_id,
        amount: row.amount,
        currency: row.currency,
        payment_method: row.payment_method,
        payment_date: row.payment_date,
        notes: row.notes,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return payments;
  } catch (e) {
    console.error('Get supplier payments error:', e);
    return [];
  }
}

export function getSupplierBalance(supplierId) {
  if (!db) return { total_purchases: 0, total_payments: 0, balance: 0 };
  
  try {
    const purchasesStmt = db.prepare(`
      SELECT COALESCE(SUM(total_cost), 0) as total_purchases
      FROM batches
      WHERE supplier_id = ?
    `);
    purchasesStmt.bind([supplierId]);
    
    let totalPurchases = 0;
    if (purchasesStmt.step()) {
      const row = purchasesStmt.getAsObject();
      totalPurchases = row.total_purchases || 0;
    }
    purchasesStmt.free();
    
    const paymentsStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_payments
      FROM supplier_payments
      WHERE supplier_id = ?
    `);
    paymentsStmt.bind([supplierId]);
    
    let totalPayments = 0;
    if (paymentsStmt.step()) {
      const row = paymentsStmt.getAsObject();
      totalPayments = row.total_payments || 0;
    }
    paymentsStmt.free();
    
    const balance = totalPurchases - totalPayments;
    
    return {
      total_purchases: totalPurchases,
      total_payments: totalPayments,
      balance: balance
    };
  } catch (e) {
    console.error('Get supplier balance error:', e);
    return { total_purchases: 0, total_payments: 0, balance: 0 };
  }
}

export function getAllSuppliersWithBalances() {
  const suppliers = getSuppliers(false);
  return suppliers.map(s => ({
    ...s,
    ...getSupplierBalance(s.id)
  }));
}