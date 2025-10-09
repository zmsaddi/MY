// src/utils/database/customers.js
import { db, saveDatabase, lastId, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { withErrorHandler } from './errorHandler.js';

/* ============================================
   CUSTOMERS MANAGEMENT
   ============================================ */

export function getCustomers(activeOnly = true) {
  if (!db) return [];
  
  try {
    const sql = activeOnly
      ? 'SELECT * FROM customers WHERE is_active = 1 ORDER BY name'
      : 'SELECT * FROM customers ORDER BY name';
    
    const stmt = db.prepare(sql);
    const customers = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      customers.push({
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
    
    return customers;
  } catch (e) {
    console.error('Get customers error:', e);
    return [];
  }
}

export function addCustomer(data) {
  try {
    const validationError = validators.validateCustomerSupplier(data, true);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const stmt = db.prepare(`INSERT INTO customers
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
    console.error('Add customer error:', e);
    withErrorHandler(() => { throw e; }, 'إضافة عميل', { details: { data } });
    return { success: false, error: parseDbError(e) };
  }
}

export function updateCustomer(customerId, data) {
  try {
    const validationError = validators.validateCustomerSupplier(data, true);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const stmt = db.prepare(`UPDATE customers SET
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
      customerId
    ]);
    stmt.free();

    saveDatabase();
    return { success: true };

  } catch (e) {
    console.error('Update customer error:', e);
    withErrorHandler(() => { throw e; }, 'تحديث بيانات العميل', { details: { customerId, data } });
    return { success: false, error: parseDbError(e) };
  }
}

export function deleteCustomer(customerId) {
  try {
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?');
    checkStmt.bind([customerId]);
    
    let hasTransactions = false;
    if (checkStmt.step()) {
      const row = checkStmt.getAsObject();
      hasTransactions = row.count > 0;
    }
    checkStmt.free();
    
    if (hasTransactions) {
      const stmt = db.prepare('UPDATE customers SET is_active = 0 WHERE id = ?');
      stmt.run([customerId]);
      stmt.free();
    } else {
      const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
      stmt.run([customerId]);
      stmt.free();
    }
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Delete customer error:', e);
    withErrorHandler(() => { throw e; }, 'حذف العميل', { details: { customerId } });
    return { success: false, error: parseDbError(e) };
  }
}