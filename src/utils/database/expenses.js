// src/utils/database/expenses.js
import { db, saveDatabase, safe, lastId } from './core.js';
import { validators, parseDbError } from '../validators.js';

/* ============================================
   EXPENSE CATEGORIES
   ============================================ */

export function getExpenseCategories(activeOnly = true) {
  if (!db) return [];
  
  try {
    const sql = activeOnly
      ? 'SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name_ar'
      : 'SELECT * FROM expense_categories ORDER BY name_ar';
    
    const stmt = db.prepare(sql);
    const categories = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      categories.push({
        id: row.id,
        name_ar: row.name_ar,
        name_en: row.name_en,
        is_active: row.is_active,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return categories;
  } catch (e) {
    console.error('Get expense categories error:', e);
    return [];
  }
}

export function addExpenseCategory(data) {
  try {
    const nameError = validators.required(data.name_ar, 'اسم الفئة');
    if (nameError) {
      return { success: false, error: nameError };
    }
    
    const stmt = db.prepare('INSERT INTO expense_categories (name_ar, name_en, is_active) VALUES (?, ?, ?)');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.is_active !== false ? 1 : 0
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add expense category error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateExpenseCategory(categoryId, data) {
  try {
    const stmt = db.prepare('UPDATE expense_categories SET name_ar = ?, name_en = ?, is_active = ? WHERE id = ?');
    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.is_active ? 1 : 0,
      categoryId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update expense category error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   EXPENSES
   ============================================ */

export function getAllExpenses(fromDate = null, toDate = null) {
  if (!db) return [];
  
  try {
    let sql = `
      SELECT e.*, c.name_ar as category_name
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
    `;
    const params = [];
    
    if (fromDate || toDate) {
      sql += ' WHERE';
      if (fromDate) {
        sql += ' e.expense_date >= ?';
        params.push(fromDate);
        if (toDate) sql += ' AND';
      }
      if (toDate) {
        sql += ' e.expense_date <= ?';
        params.push(toDate);
      }
    }
    
    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const expenses = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      expenses.push({
        id: row.id,
        category_id: row.category_id,
        category_name: row.category_name,
        amount: row.amount,
        description: row.description,
        expense_date: row.expense_date,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at
      });
    }
    stmt.free();
    
    return expenses;
  } catch (e) {
    console.error('Get all expenses error:', e);
    return [];
  }
}

export function addExpense(data) {
  try {
    const errors = [];
    
    const categoryError = validators.required(data.category_id, 'فئة المصروف');
    if (categoryError) errors.push(categoryError);
    
    const amountError = validators.positiveNumber(data.amount, 'المبلغ');
    if (amountError) errors.push(amountError);
    
    const descError = validators.required(data.description, 'الوصف');
    if (descError) errors.push(descError);
    
    const dateError = validators.dateNotFuture(data.expense_date, 'تاريخ المصروف');
    if (dateError) errors.push(dateError);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare(`
      INSERT INTO expenses 
      (category_id, amount, description, expense_date, notes) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      data.category_id,
      safe(data.amount),
      data.description.trim(),
      data.expense_date,
      data.notes ? data.notes.trim() : null
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add expense error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateExpense(expenseId, data) {
  try {
    const errors = [];
    
    const amountError = validators.positiveNumber(data.amount, 'المبلغ');
    if (amountError) errors.push(amountError);
    
    const descError = validators.required(data.description, 'الوصف');
    if (descError) errors.push(descError);
    
    const dateError = validators.dateNotFuture(data.expense_date, 'تاريخ المصروف');
    if (dateError) errors.push(dateError);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare(`
      UPDATE expenses SET 
        category_id = ?,
        amount = ?,
        description = ?,
        expense_date = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run([
      data.category_id,
      safe(data.amount),
      data.description.trim(),
      data.expense_date,
      data.notes ? data.notes.trim() : null,
      expenseId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update expense error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function deleteExpense(expenseId) {
  try {
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run([expenseId]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Delete expense error:', e);
    return { success: false, error: parseDbError(e) };
  }
}