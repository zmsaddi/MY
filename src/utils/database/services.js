// src/utils/database/services.js
import { db, saveDatabase, safe, lastId } from './core.js';
import { validators, parseDbError } from '../validators.js';

/* ============================================
   SERVICE TYPES MANAGEMENT
   ============================================ */

export function getServiceTypes(activeOnly = false) {
  if (!db) return [];
  
  try {
    const sql = activeOnly
      ? 'SELECT * FROM service_types WHERE is_active = 1 ORDER BY id'
      : 'SELECT * FROM service_types ORDER BY id';
    
    const stmt = db.prepare(sql);
    const services = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      services.push({
        id: row.id,
        name_ar: row.name_ar,
        name_en: row.name_en,
        default_cost: row.default_cost ?? 0,
        is_active: row.is_active,
        is_default: row.is_default,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return services;
  } catch (e) {
    console.error('Get service types error:', e);
    return [];
  }
}

export function addServiceType(data) {
  try {
    const nameError = validators.required(data.name_ar, 'اسم الخدمة');
    if (nameError) {
      return { success: false, error: nameError };
    }
    
    const stmt = db.prepare('INSERT INTO service_types (name_ar, name_en, default_cost, is_active, is_default) VALUES (?, ?, ?, ?, ?)');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      safe(data.default_cost, 0),
      data.is_active !== false ? 1 : 0,
      data.is_default ? 1 : 0
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add service type error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateServiceType(serviceId, data) {
  try {
    const stmt = db.prepare('UPDATE service_types SET name_ar = ?, name_en = ?, default_cost = ?, is_active = ? WHERE id = ?');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      safe(data.default_cost, 0),
      data.is_active ? 1 : 0,
      serviceId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update service type error:', e);
    return { success: false, error: parseDbError(e) };
  }
}