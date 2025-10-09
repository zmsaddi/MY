// src/utils/database/inventory.js
import { db, tx, saveDatabase, safe, lastId, generateSheetCode, getCurrentUser, hasColumn } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { insertSupplierTransactionInline } from './accounting.js';
import { withErrorHandler } from './errorHandler.js';

/* ============================================
   INVENTORY MOVEMENTS
   ============================================ */

export function recordInventoryMovement(movementType, sheetId, batchId, quantity, referenceType = null, referenceId = null, notes = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO inventory_movements 
      (movement_type, sheet_id, batch_id, quantity, reference_type, reference_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      movementType,
      sheetId,
      batchId || null,
      safe(quantity),
      referenceType,
      referenceId,
      notes
    ]);
    stmt.free();
    
  } catch (e) {
    console.error('Record inventory movement error:', e);
  }
}

/* ============================================
   SHEETS - GET ALL
   ============================================ */

export function getAllSheets() {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT
        s.*,
        mt.name_ar as metal_name,
        mt.abbreviation as metal_abbr,
        g.name as grade_name,
        f.name_ar as finish_name,
        COALESCE(SUM(b.quantity_remaining), 0) as total_quantity,
        COUNT(DISTINCT b.id) as batch_count,
        MIN(b.price_per_kg) as min_price,
        MAX(b.price_per_kg) as max_price
      FROM sheets s
      LEFT JOIN metal_types mt ON s.metal_type_id = mt.id
      LEFT JOIN grades g ON s.grade_id = g.id
      LEFT JOIN finishes f ON s.finish_id = f.id
      LEFT JOIN batches b ON s.id = b.sheet_id AND b.quantity_remaining > 0
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    
    const sheets = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      sheets.push({
        id: row.id,
        code: row.code,
        metal_type_id: row.metal_type_id,
        metal_name: row.metal_name,
        metal_abbr: row.metal_abbr,
        grade_id: row.grade_id,
        grade_name: row.grade_name,
        finish_id: row.finish_id,
        finish_name: row.finish_name,
        length_mm: row.length_mm,
        width_mm: row.width_mm,
        thickness_mm: row.thickness_mm,
        weight_per_sheet_kg: row.weight_per_sheet_kg,
        is_remnant: row.is_remnant,
        parent_sheet_id: row.parent_sheet_id,
        total_quantity: row.total_quantity || 0,
        batch_count: row.batch_count || 0,
        min_price: row.min_price || 0,
        max_price: row.max_price || 0,
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

/* ============================================
   ADD SHEET WITH INITIAL BATCH
   ============================================ */

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
    
    const existingStmt = db.prepare('SELECT id FROM sheets WHERE code = ? AND is_remnant = ?');
    existingStmt.bind([sheetCode, sheetData.is_remnant ? 1 : 0]);
    
    let sheetId = null;
    let isLinked = false;
    
    if (existingStmt.step()) {
      sheetId = existingStmt.getAsObject().id;
      isLinked = true;
      existingStmt.free();

      // Check if created_by column exists
      const hasCreatedBy = hasColumn('batches', 'created_by');

      const batchStmt = hasCreatedBy
        ? db.prepare(`
            INSERT INTO batches
            (sheet_id, supplier_id, quantity_original, quantity_remaining,
             price_per_kg, total_cost, storage_location, received_date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
        : db.prepare(`
            INSERT INTO batches
            (sheet_id, supplier_id, quantity_original, quantity_remaining,
             price_per_kg, total_cost, storage_location, received_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

      const batchValues = [
        sheetId,
        batchData.supplier_id || null,
        safe(batchData.quantity, 0),
        safe(batchData.quantity, 0),
        batchData.price_per_kg ? safe(batchData.price_per_kg) : null,
        batchData.total_cost ? safe(batchData.total_cost) : null,
        batchData.storage_location ? batchData.storage_location.trim() : null,
        batchData.received_date,
        batchData.notes ? batchData.notes.trim() : null
      ];

      if (hasCreatedBy) {
        batchValues.push(getCurrentUser());
      }

      batchStmt.run(batchValues);
      batchStmt.free();

      const batchId = lastId();

      recordInventoryMovement('IN', sheetId, batchId, safe(batchData.quantity, 0), 'purchase', null, 'إضافة دفعة لصفيحة موجودة');
      
      if (batchData.supplier_id && safe(batchData.total_cost, 0) > 0) {
        insertSupplierTransactionInline({
          supplier_id: batchData.supplier_id,
          transaction_type: 'purchase',
          amount: safe(batchData.total_cost),
          reference_type: 'batch',
          reference_id: batchId,
          transaction_date: batchData.received_date,
          notes: `شراء دفعة - ${sheetCode}`
        });
      }
      
      tx.commit();
      saveDatabase();
      
      return { success: true, sheetId, batchId, code: sheetCode, linked: true };
      
    } else {
      existingStmt.free();
      
      const sheetStmt = db.prepare(`
        INSERT INTO sheets
        (code, metal_type_id, grade_id, finish_id, length_mm, width_mm, thickness_mm,
         weight_per_sheet_kg, is_remnant, parent_sheet_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

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
        sheetData.parent_sheet_id || null,
        getCurrentUser()
      ]);
      sheetStmt.free();
      
      sheetId = lastId();
      
      // Check if created_by column exists
      const hasCreatedBy = hasColumn('batches', 'created_by');

      const batchStmt = hasCreatedBy
        ? db.prepare(`
            INSERT INTO batches
            (sheet_id, supplier_id, quantity_original, quantity_remaining,
             price_per_kg, total_cost, storage_location, received_date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
        : db.prepare(`
            INSERT INTO batches
            (sheet_id, supplier_id, quantity_original, quantity_remaining,
             price_per_kg, total_cost, storage_location, received_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

      const batchValues = [
        sheetId,
        batchData.supplier_id || null,
        safe(batchData.quantity, 0),
        safe(batchData.quantity, 0),
        batchData.price_per_kg ? safe(batchData.price_per_kg) : null,
        batchData.total_cost ? safe(batchData.total_cost) : null,
        batchData.storage_location ? batchData.storage_location.trim() : null,
        batchData.received_date,
        batchData.notes ? batchData.notes.trim() : null
      ];

      if (hasCreatedBy) {
        batchValues.push(getCurrentUser());
      }

      batchStmt.run(batchValues);
      batchStmt.free();

      const batchId = lastId();

      recordInventoryMovement('IN', sheetId, batchId, safe(batchData.quantity, 0), 'purchase', null, 'إضافة صفيحة جديدة مع دفعة');
      
      if (batchData.supplier_id && safe(batchData.total_cost, 0) > 0) {
        insertSupplierTransactionInline({
          supplier_id: batchData.supplier_id,
          transaction_type: 'purchase',
          amount: safe(batchData.total_cost),
          reference_type: 'batch',
          reference_id: batchId,
          transaction_date: batchData.received_date,
          notes: `شراء دفعة - ${sheetCode}`
        });
      }
      
      tx.commit();
      saveDatabase();
      
      return { success: true, sheetId, batchId, code: sheetCode, linked: false };
    }
    
  } catch (e) {
    tx.rollback();
    console.error('Add sheet with batch error:', e);

    // Show global error notification
    withErrorHandler(
      () => { throw e; },
      'حفظ الصفيحة والدفعة',
      { details: { sheetData, batchData } }
    );

    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   BATCHES - GET BY SHEET
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
        created_at: row.created_at,
        created_by: row.created_by,
        updated_by: row.updated_by
      };
    }
    stmt.free();
    
    return batch;
  } catch (e) {
    console.error('Get batch by id error:', e);
    return null;
  }
}

/* ============================================
   ADD BATCH TO EXISTING SHEET
   ============================================ */

export function addBatchToSheet(data) {
  try {
    tx.begin();
    
    const validationError = validators.validateBatch(data);
    if (validationError) {
      tx.rollback();
      return { success: false, error: validationError };
    }
    
    // Check if created_by column exists
    const hasCreatedBy = hasColumn('batches', 'created_by');

    const stmt = hasCreatedBy
      ? db.prepare(`
          INSERT INTO batches
          (sheet_id, supplier_id, quantity_original, quantity_remaining,
           price_per_kg, total_cost, storage_location, received_date, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
      : db.prepare(`
          INSERT INTO batches
          (sheet_id, supplier_id, quantity_original, quantity_remaining,
           price_per_kg, total_cost, storage_location, received_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    const values = [
      data.sheet_id,
      data.supplier_id || null,
      safe(data.quantity, 0),
      safe(data.quantity, 0),
      data.price_per_kg ? safe(data.price_per_kg) : null,
      data.total_cost ? safe(data.total_cost) : null,
      data.storage_location ? data.storage_location.trim() : null,
      data.received_date,
      data.notes ? data.notes.trim() : null
    ];

    if (hasCreatedBy) {
      values.push(getCurrentUser());
    }

    stmt.run(values);
    stmt.free();
    
    const batchId = lastId();
    
    recordInventoryMovement('IN', data.sheet_id, batchId, safe(data.quantity, 0), 'purchase', null, 'إضافة دفعة');
    
    if (data.supplier_id && safe(data.total_cost, 0) > 0) {
      insertSupplierTransactionInline({
        supplier_id: data.supplier_id,
        transaction_type: 'purchase',
        amount: safe(data.total_cost),
        reference_type: 'batch',
        reference_id: batchId,
        transaction_date: data.received_date,
        notes: `شراء دفعة - Sheet#${data.sheet_id}`
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

/* ============================================
   UPDATE BATCH
   ============================================ */

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

    fields.push('updated_by = ?');
    values.push(getCurrentUser());
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

/* ============================================
   PRUNE EMPTY BATCHES
   ============================================ */

export function pruneEmptyBatches() {
  if (!db) return { success: false, count: 0 };
  
  try {
    const stmt = db.prepare('DELETE FROM batches WHERE quantity_remaining <= 0');
    stmt.run();
    const changes = db.getRowsModified();
    stmt.free();
    
    if (changes > 0) {
      saveDatabase();
    }
    
    return { success: true, count: changes };
  } catch (e) {
    console.error('Prune empty batches error:', e);
    return { success: false, count: 0, error: parseDbError(e) };
  }
}
