// src/utils/database/paymentMethods.js
import { db, saveDatabase, lastId } from './core.js';
import { validators, parseDbError } from '../validators.js';

/* ============================================
   PAYMENT METHODS MANAGEMENT
   ============================================ */

export function getPaymentMethods(activeOnly = false) {
  if (!db) return [];
  
  try {
    const sql = activeOnly
      ? 'SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY name_ar'
      : 'SELECT * FROM payment_methods ORDER BY name_ar';
    
    const stmt = db.prepare(sql);
    const methods = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      methods.push({
        id: row.id,
        name_ar: row.name_ar,
        name_en: row.name_en,
        is_active: row.is_active,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return methods;
  } catch (e) {
    console.error('Get payment methods error:', e);
    return [];
  }
}

/* ============================================
   CRITICAL FIX: PAYMENT METHODS FOR UI
   ============================================ */

export function getPaymentMethodsForUI(activeOnly = true) {
  const methods = getPaymentMethods(activeOnly);
  return methods.map(m => ({
    id: m.id,
    name: m.name_ar,
    name_ar: m.name_ar,
    name_en: m.name_en,
    is_active: m.is_active
  }));
}

export function addPaymentMethod(data) {
  try {
    const nameError = validators.required(data.name_ar, 'اسم طريقة الدفع');
    if (nameError) {
      return { success: false, error: nameError };
    }
    
    const stmt = db.prepare('INSERT INTO payment_methods (name_ar, name_en, is_active) VALUES (?, ?, ?)');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.is_active !== false ? 1 : 0
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add payment method error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updatePaymentMethod(methodId, data) {
  try {
    const stmt = db.prepare('UPDATE payment_methods SET name_ar = ?, name_en = ?, is_active = ? WHERE id = ?');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.is_active ? 1 : 0,
      methodId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update payment method error:', e);
    return { success: false, error: parseDbError(e) };
  }
}