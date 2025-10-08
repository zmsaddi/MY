// src/utils/database/currencies.js
import { db, saveDatabase, safe, lastId, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { getCompanyProfile } from './profile.js';

/* ============================================
   CURRENCY INFO HELPER
   ============================================ */

export function getBaseCurrencyInfo() {
  if (!db) return { code: 'USD', symbol: '$', exchangeRate: 1 };
  
  try {
    const profile = getCompanyProfile();
    const baseCurrency = profile?.base_currency || 'USD';
    
    const stmt = db.prepare('SELECT code, symbol, exchange_rate FROM currencies WHERE code = ?');
    stmt.bind([baseCurrency]);
    
    let info = { code: baseCurrency, symbol: '$', exchangeRate: 1 };
    if (stmt.step()) {
      const row = stmt.getAsObject();
      info = {
        code: row.code,
        symbol: row.symbol,
        exchangeRate: row.exchange_rate || 1
      };
    }
    stmt.free();
    
    return info;
  } catch (e) {
    console.error('Get base currency info error:', e);
    return { code: 'USD', symbol: '$', exchangeRate: 1 };
  }
}

/* ============================================
   CURRENCIES MANAGEMENT
   ============================================ */

export function getCurrencies(activeOnly = false) {
  if (!db) return [];
  
  try {
    const sql = activeOnly 
      ? 'SELECT * FROM currencies WHERE is_active = 1 ORDER BY code'
      : 'SELECT * FROM currencies ORDER BY code';
    
    const stmt = db.prepare(sql);
    const currencies = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      currencies.push({
        id: row.id,
        code: row.code,
        name_ar: row.name_ar,
        name_en: row.name_en,
        symbol: row.symbol,
        exchange_rate: row.exchange_rate,
        is_active: row.is_active,
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return currencies;
  } catch (e) {
    console.error('Get currencies error:', e);
    return [];
  }
}

export function addCurrency(data) {
  try {
    const errors = [];
    
    const codeError = validators.required(data.code, 'كود العملة');
    if (codeError) errors.push(codeError);
    
    const nameArError = validators.required(data.name_ar, 'اسم العملة بالعربي');
    if (nameArError) errors.push(nameArError);
    
    const rateError = validators.positiveNumber(data.exchange_rate, 'سعر الصرف');
    if (rateError) errors.push(rateError);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare(`INSERT INTO currencies
      (code, name_ar, name_en, symbol, exchange_rate, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    stmt.run([
      data.code.toUpperCase().trim(),
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.symbol || data.code,
      safe(data.exchange_rate, 1),
      data.is_active ? 1 : 0,
      getCurrentUser()
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true, id: lastId() };
    
  } catch (e) {
    console.error('Add currency error:', e);
    return { success: false, error: parseDbError(e) };
  }
}

export function updateCurrency(currencyId, data) {
  try {
    const rateError = validators.positiveNumber(data.exchange_rate, 'سعر الصرف');
    if (rateError) {
      return { success: false, error: rateError };
    }
    
    const stmt = db.prepare(`UPDATE currencies SET
      name_ar = ?,
      name_en = ?,
      symbol = ?,
      exchange_rate = ?,
      is_active = ?,
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`);

    stmt.run([
      data.name_ar.trim(),
      data.name_en ? data.name_en.trim() : null,
      data.symbol || data.code,
      safe(data.exchange_rate, 1),
      data.is_active ? 1 : 0,
      getCurrentUser(),
      currencyId
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update currency error:', e);
    return { success: false, error: parseDbError(e) };
  }
}