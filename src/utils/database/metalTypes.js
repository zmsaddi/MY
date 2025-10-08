// src/utils/database/metalTypes.js
import { db, saveDatabase, safe, lastId, generateSheetCode, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';

// Re-export code generator for convenience
export { generateSheetCode };

/* ============================================
   METAL TYPES MANAGEMENT
   ============================================ */

export function getMetalTypes(activeOnly = false) {
  if (!db) return [];
  
  try {
    const sql = activeOnly
      ? 'SELECT * FROM metal_types WHERE is_active = 1 ORDER BY id'
      : 'SELECT * FROM metal_types ORDER BY id';
    
    const stmt = db.prepare(sql);
    const metals = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      metals.push({
        id: row.id,
        name_ar: row.name_ar,
        name_en: row.name_en,
        abbreviation: row.abbreviation,
        density: row.density,
        is_active: row.is_active ?? 1,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return metals;
  } catch (e) {
    console.error('Get metal types error:', e);
    return [];
  }
}

export function addMetalType(data) {
  try {
    const errors = [];
    
    const nameError = validators.required(data.name_ar, 'اسم المعدن');
    if (nameError) errors.push(nameError);
    
    const abbrError = validators.required(data.abbreviation, 'اختصار المعدن');
    if (abbrError) errors.push(abbrError);
    
    if (data.density) {
      const densityError = validators.positiveNumber(data.density, 'الكثافة');
      if (densityError) errors.push(densityError);
    }
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare(`INSERT INTO metal_types
      (name_ar, name_en, abbreviation, density, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?)`);

    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.abbreviation.toUpperCase().trim(),
      data.density ? safe(data.density) : null,
      data.is_active !== false ? 1 : 0,
      getCurrentUser()
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add metal type error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateMetalType(metalId, data) {
  try {
    const stmt = db.prepare(`UPDATE metal_types SET
      name_ar = ?,
      name_en = ?,
      abbreviation = ?,
      density = ?,
      is_active = ?,
      updated_by = ?
      WHERE id = ?`);

    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.abbreviation.toUpperCase().trim(),
      data.density ? safe(data.density) : null,
      data.is_active ? 1 : 0,
      getCurrentUser(),
      metalId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update metal type error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   GRADES MANAGEMENT
   ============================================ */

export function getGrades(metalTypeId = null, activeOnly = false) {
  if (!db) return [];
  
  try {
    let sql = 'SELECT g.*, m.name_ar as metal_name FROM grades g JOIN metal_types m ON g.metal_type_id = m.id';
    const params = [];
    
    if (metalTypeId) {
      sql += ' WHERE g.metal_type_id = ?';
      params.push(metalTypeId);
      if (activeOnly) {
        sql += ' AND g.is_active = 1';
      }
    } else if (activeOnly) {
      sql += ' WHERE g.is_active = 1';
    }
    
    sql += ' ORDER BY g.metal_type_id, g.name';
    
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const grades = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      grades.push({
        id: row.id,
        metal_type_id: row.metal_type_id,
        name: row.name,
        is_active: row.is_active ?? 1,
        metal_name: row.metal_name,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return grades;
  } catch (e) {
    console.error('Get grades error:', e);
    return [];
  }
}

export function addGrade(data) {
  try {
    const errors = [];
    
    const metalError = validators.required(data.metal_type_id, 'نوع المعدن');
    if (metalError) errors.push(metalError);
    
    const nameError = validators.required(data.name, 'اسم الدرجة');
    if (nameError) errors.push(nameError);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare('INSERT INTO grades (metal_type_id, name, is_active, created_by) VALUES (?, ?, ?, ?)');
    stmt.run([
      data.metal_type_id,
      data.name.trim(),
      data.is_active !== false ? 1 : 0,
      getCurrentUser()
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add grade error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateGrade(gradeId, data) {
  try {
    const stmt = db.prepare('UPDATE grades SET name = ?, is_active = ?, updated_by = ? WHERE id = ?');
    stmt.run([
      data.name.trim(),
      data.is_active ? 1 : 0,
      getCurrentUser(),
      gradeId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update grade error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   FINISHES MANAGEMENT
   ============================================ */

export function getFinishes(metalTypeId = null, activeOnly = false) {
  if (!db) return [];
  
  try {
    let sql = 'SELECT f.*, m.name_ar as metal_name FROM finishes f JOIN metal_types m ON f.metal_type_id = m.id';
    const params = [];
    
    if (metalTypeId) {
      sql += ' WHERE f.metal_type_id = ?';
      params.push(metalTypeId);
      if (activeOnly) {
        sql += ' AND f.is_active = 1';
      }
    } else if (activeOnly) {
      sql += ' WHERE f.is_active = 1';
    }
    
    sql += ' ORDER BY f.metal_type_id, f.name_ar';
    
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const finishes = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      finishes.push({
        id: row.id,
        metal_type_id: row.metal_type_id,
        name_ar: row.name_ar,
        name_en: row.name_en,
        is_active: row.is_active ?? 1,
        metal_name: row.metal_name,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return finishes;
  } catch (e) {
    console.error('Get finishes error:', e);
    return [];
  }
}

export function addFinish(data) {
  try {
    const errors = [];
    
    const metalError = validators.required(data.metal_type_id, 'نوع المعدن');
    if (metalError) errors.push(metalError);
    
    const nameError = validators.required(data.name_ar, 'اسم التشطيب');
    if (nameError) errors.push(nameError);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare('INSERT INTO finishes (metal_type_id, name_ar, name_en, is_active, created_by) VALUES (?, ?, ?, ?, ?)');
    stmt.run([
      data.metal_type_id,
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.is_active !== false ? 1 : 0,
      getCurrentUser()
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add finish error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateFinish(finishId, data) {
  try {
    const stmt = db.prepare('UPDATE finishes SET name_ar = ?, name_en = ?, is_active = ?, updated_by = ? WHERE id = ?');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.is_active ? 1 : 0,
      getCurrentUser(),
      finishId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update finish error:', e);
    return { success: false, error: parseDbError(e) };
  }
}