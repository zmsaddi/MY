// src/utils/database/inventory.js
import { db, tx, saveDatabase, safe, lastId, generateSheetCode } from './core.js';
import { validators, parseDbError } from '../validators.js';

/* ============================================
   INVENTORY MOVEMENTS
   ============================================ */

export function recordInventoryMovement(movementType, sheetId, batchId, quantity, referenceType, referenceId, notes) {
  try {
    const stmt = db.prepare(`
      INSERT INTO inventory_movements 
      (movement_type, sheet_id, batch_id, quantity, reference_type, reference_id, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run([
      movementType,
      sheetId,
      batchId || null,
      quantity,
      referenceType || null,
      referenceId || null,
      notes || null
    ]);
    stmt.free();
  } catch (e) {
    console.error('Record inventory movement error:', e);
  }
}

/* ============================================
   SHEETS MANAGEMENT
   ============================================ */

export function getAllSheets() {
  if (!db) return [];
  
  try {
    const stmt = db.prepare(`
      SELECT 
        s.id, s.code, s.length_mm, s.width_mm, s.thickness_mm, s.weight_per_sheet_kg,
        s.metal_type_id, s.grade_id, s.finish_id, s.is_remnant, s.parent_sheet_id, s.created_at,
        m.name_ar as metal_name, m.abbreviation as metal_abbr,
        g.name as grade_name,
        f.name_ar as finish_name,
        COALESCE(SUM(CASE WHEN b.quantity_remaining > 0 THEN b.quantity_remaining ELSE 0 END), 0) as total_quantity,
        MIN(b.price_per_kg) as min_price,
        MAX(b.price_per_kg) as max_price
      FROM sheets s
      JOIN metal_types m ON s.metal_type_id = m.id
      LEFT JOIN grades g ON s.grade_id = g.id
      LEFT JOIN finishes f ON s.finish_id = f.id
      LEFT JOIN batches b ON s.id = b.sheet_id
      GROUP BY s.id
      ORDER BY s.is_remnant ASC, s.created_at DESC
    `);
    
    const sheets = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      sheets.push({
        id: row.id,
        code: row.code,
        metal_type_id: row.metal_type_id,
        grade_id: row.grade_id,
        finish_id: row.finish_id,
        length_mm: row.length_mm,
        width_mm: row.width_mm,
        thickness_mm: row.thickness_mm,
        weight_per_sheet_kg: row.weight_per_sheet_kg,
        is_remnant: row.is_remnant,
        parent_sheet_id: row.parent_sheet_id,
        metal_name: row.metal_name,
        metal_abbr: row.metal_abbr,
        grade_name: row.grade_name || 'XX',
        finish_name: row.finish_name || 'XX',
        total_quantity: row.total_quantity || 0,
        min_price: row.min_price,
        max_price: row.max_price,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return sheets;
  } catch (e) {
    console.error('Get all sheets error:', e);
    return [];
  }
}

export function addSheetWithBatch(sheetData, batchData) {
  try {
    tx.begin();
    
    const sheetValidationError = validators.validateSheet(sheetData);
    if (sheetValidationError) {
      tx.rollback();
      return { success: false, error: sheetValidationError };
    }
    
    const batchValidationError = validators.validateBatch(batchData);
    if (batchValidationError) {
      tx.rollback();
      return { success: false, error: batchValidationError };
    }
    
    let sheetCode = sheetData.code;
    if (!sheetCode || sheetCode.trim() === '' || sheetData.autoGenerateCode) {
      sheetCode = generateSheetCode(
        sheetData.metal_type_id,
        sheetData.length_mm,
        sheetData.width_mm,
        sheetData.thickness_mm,
        sheetData.grade_id || null,
        sheetData.finish_id || null,
        sheetData.is_remnant || false
      );
    }
    
    // Check if sheet with same code already exists
    const existingStmt = db.prepare('SELECT id FROM sheets WHERE code = ? AND is_remnant = ?');
    existingStmt.bind([sheetCode, sheetData.is_remnant ? 1 : 0]);
    
    let sheetId = null;
    if (existingStmt.step()) {
      // Sheet exists - use existing sheet
      sheetId = existingStmt.getAsObject().id;
      existingStmt.free();
      
      // Add batch to existing sheet
      const batchStmt = db.prepare(`
        INSERT INTO batches 
        (sheet_id, supplier_id, quantity_original, quantity_remaining, 
         price_per_kg, total_cost, storage_location, received_date, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      batchStmt.run([
        sheetId,
        batchData.supplier_id || null,
        safe(batchData.quantity, 0),
        safe(batchData.quantity, 0),
        batchData.price_per_kg ? safe(batchData.price_per_kg) : null,
        batchData.total_cost ? safe(batchData.total_cost) : null,
        batchData.storage_location ? batchData.storage_location.trim() : null,
        batchData.received_date,
        batchData.notes ? batchData.notes.trim() : null
      ]);
      batchStmt.free();
      
      const batchId = lastId();
      
      recordInventoryMovement('IN', sheetId, batchId, safe(batchData.quantity, 0), 'purchase', null, 'إضافة دفعة لصفيحة موجودة');
      
      if (batchData.supplier_id && safe(batchData.total_cost, 0) > 0) {
        import('./accounting.js').then(({ insertSupplierTransactionInline }) => {
          insertSupplierTransactionInline({
            supplier_id: batchData.supplier_id,
            transaction_type: 'purchase',
            amount: safe(batchData.total_cost),
            reference_type: 'batch',
            reference_id: batchId,
            transaction_date: batchData.received_date,
            notes: `شراء دفعة - ${sheetCode}`
          });
        });
      }
      
      tx.commit();
      saveDatabase();
      
      return { success: true, sheetId, batchId, code: sheetCode, linked: true };
      
    } else {
      existingStmt.free();
      
      // Sheet doesn't exist - create new one
      const sheetStmt = db.prepare(`
        INSERT INTO sheets 
        (code, metal_type_id, grade_id, finish_id, length_mm, width_mm, thickness_mm, 
         weight_per_sheet_kg, is_remnant, parent_sheet_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      sheetStmt.run([
        sheetCode,
        sheetData.metal_type_id,
        sheetData.grade_id || null,
        sheetData.finish_id || null,
        sheetData.length_mm,
        sheetData.width_mm,
        safe(sheetData.thickness_mm),
        sheetData.weight_per_sheet_kg ? safe(sheetData.weight_per_sheet_kg) : null,
        sheetData.is_remnant ? 1 : 0,
        sheetData.parent_sheet_id || null
      ]);
      sheetStmt.free();
      
      sheetId = lastId();
      
      const batchStmt = db.prepare(`
        INSERT INTO batches 
        (sheet_id, supplier_id, quantity_original, quantity_remaining, 
         price_per_kg, total_cost, storage_location, received_date, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      batchStmt.run([
        sheetId,
        batchData.supplier_id || null,
        safe(batchData.quantity, 0),
        safe(batchData.quantity, 0),
        batchData.price_per_kg ? safe(batchData.price_per_kg) : null,
        batchData.total_cost ? safe(batchData.total_cost) : null,
        batchData.storage_location ? batchData.storage_location.trim() : null,
        batchData.received_date,
        batchData.notes ? batchData.notes.trim() : null
      ]);
      batchStmt.free();
      
      const batchId = lastId();
      
      recordInventoryMovement('IN', sheetId, batchId, safe(batchData.quantity, 0), 'purchase', null, 'إضافة دفعة جديدة');
      
      if (batchData.supplier_id && safe(batchData.total_cost, 0) > 0) {
        import('./accounting.js').then(({ insertSupplierTransactionInline }) => {
          insertSupplierTransactionInline({
            supplier_id: batchData.supplier_id,
            transaction_type: 'purchase',
            amount: safe(batchData.total_cost),
            reference_type: 'batch',
            reference_id: batchId,
            transaction_date: batchData.received_date,
            notes: `شراء دفعة - ${sheetCode}`
          });
        });
      }
      
      tx.commit();
      saveDatabase();
      
      return { success: true, sheetId, batchId, code: sheetCode, linked: false };
    }
    
  } catch (e) {
    tx.rollback();
    console.error('Add sheet with batch error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   BATCHES MANAGEMENT
   ============================================ */

export function getBatchesBySheetId(sheetId, includeEmpty = false) {
  if (!db) return [];
  
  try {
    const sql = includeEmpty 
      ? `SELECT b.*, s.name as supplier_name 
         FROM batches b
         LEFT JOIN suppliers s ON b.supplier_id = s.id
         WHERE b.sheet_id = ?
         ORDER BY b.received_date ASC`
      : `SELECT b.*, s.name as supplier_name 
         FROM batches b
         LEFT JOIN suppliers s ON b.supplier_id = s.id
         WHERE b.sheet_id = ? AND b.quantity_remaining > 0
         ORDER BY b.received_date ASC`;
    
    const stmt = db.prepare(sql);
    stmt.bind([sheetId]);
    
    const batches = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      batches.push({
        id: row.id,
        sheet_id: row.sheet_id,
        supplier_id: row.supplier_id,
        quantity_original: row.quantity_original,
        quantity_remaining: row.quantity_remaining,
        price_per_kg: row.price_per_kg,
        total_cost: row.total_cost,
        storage_location: row.storage_location,
        received_date: row.received_date,
        notes: row.notes,
        supplier_name: row.supplier_name,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return batches;
  } catch (e) {
    console.error('Get batches error:', e);
    return [];
  }
}

export function getBatchById(batchId) {
  if (!db) return null;
  
  try {
    const stmt = db.prepare(`
      SELECT 
        b.*,
        s.name as supplier_name,
        sh.code as sheet_code
      FROM batches b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      LEFT JOIN sheets sh ON b.sheet_id = sh.id
      WHERE b.id = ?
    `);
    stmt.bind([batchId]);
    
    let batch = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      batch = {
        id: row.id,
        sheet_id: row.sheet_id,
        sheet_code: row.sheet_code,
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        quantity_original: row.quantity_original,
        quantity_remaining: row.quantity_remaining,
        price_per_kg: row.price_per_kg,
        total_cost: row.total_cost,
        storage_location: row.storage_location,
        received_date: row.received_date,
        notes: row.notes,
        created_at: row.created_at
      };
    }
    stmt.free();
    
    return batch;
  } catch (e) {
    console.error('Get batch by id error:', e);
    return null;
  }
}

export function addBatchToSheet(data) {
  try {
    tx.begin();
    
    const validationError = validators.validateBatch(data);
    if (validationError) {
      tx.rollback();
      return { success: false, error: validationError };
    }
    
    const stmt = db.prepare(`
      INSERT INTO batches
      (sheet_id, supplier_id, quantity_original, quantity_remaining, 
       price_per_kg, total_cost, storage_location, received_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      data.sheet_id,
      data.supplier_id || null,
      safe(data.quantity, 0),
      safe(data.quantity, 0),
      data.price_per_kg ? safe(data.price_per_kg) : null,
      data.total_cost ? safe(data.total_cost) : null,
      data.storage_location ? data.storage_location.trim() : null,
      data.received_date,
      data.notes ? data.notes.trim() : null
    ]);
    stmt.free();
    
    const batchId = lastId();
    
    recordInventoryMovement('IN', data.sheet_id, batchId, safe(data.quantity, 0), 'purchase', null, 'إضافة دفعة');
    
    if (data.supplier_id && safe(data.total_cost, 0) > 0) {
      import('./accounting.js').then(({ insertSupplierTransactionInline }) => {
        insertSupplierTransactionInline({
          supplier_id: data.supplier_id,
          transaction_type: 'purchase',
          amount: safe(data.total_cost),
          reference_type: 'batch',
          reference_id: batchId,
          transaction_date: data.received_date,
          notes: `شراء دفعة - Sheet#${data.sheet_id}`
        });
      });
    }
    
    tx.commit();
    saveDatabase();
    
    return { success: true, id: batchId };
    
  } catch (e) {
    tx.rollback();
    console.error('Add batch error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateBatch(batchId, updates) {
  if (!db) return { success: false, error: 'قاعدة البيانات غير متاحة' };
  
  try {
    tx.begin();
    
    const fields = [];
    const values = [];
    
    if (updates.quantity_original !== undefined) {
      fields.push('quantity_original = ?');
      values.push(safe(updates.quantity_original));
    }
    if (updates.price_per_kg !== undefined) {
      fields.push('price_per_kg = ?');
      values.push(updates.price_per_kg ? safe(updates.price_per_kg) : null);
    }
    if (updates.total_cost !== undefined) {
      fields.push('total_cost = ?');
      values.push(updates.total_cost ? safe(updates.total_cost) : null);
    }
    if (updates.storage_location !== undefined) {
      fields.push('storage_location = ?');
      values.push(updates.storage_location ? updates.storage_location.trim() : null);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes ? updates.notes.trim() : null);
    }
    
    if (fields.length === 0) {
      tx.rollback();
      return { success: false, error: 'لا توجد تحديثات' };
    }
    
    values.push(batchId);
    const sql = `UPDATE batches SET ${fields.join(', ')} WHERE id = ?`;
    
    const stmt = db.prepare(sql);
    stmt.run(values);
    stmt.free();
    
    tx.commit();
    saveDatabase();
    
    return { success: true };
    
  } catch (e) {
    tx.rollback();
    console.error('Update batch error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function pruneEmptyBatches() {
  try {
    const stmt = db.prepare('DELETE FROM batches WHERE quantity_remaining <= 0');
    stmt.run();
    stmt.free();
    
    saveDatabase();
    return { success: true };
  } catch (e) {
    console.error('Prune batches error:', e);
    return { success: false, error: e.message };
  }
}