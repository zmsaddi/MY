// src/utils/database/profile.js
import { db, saveDatabase, safe, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { withErrorHandler } from './errorHandler.js';

/* ============================================
   COMPANY PROFILE
   ============================================ */

export function getCompanyProfile() {
  if (!db) return null;
  
  try {
    const stmt = db.prepare('SELECT * FROM company_profile WHERE id = 1');
    
    let profile = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      profile = {
        id: row.id,
        company_name: row.company_name,
        company_name_en: row.company_name_en,
        address: row.address,
        phone1: row.phone1,
        phone2: row.phone2,
        email: row.email,
        tax_number: row.tax_number,
        base_currency: row.base_currency || 'USD',
        default_payment_method: row.default_payment_method || 'Cash',
        logo_base64: row.logo_base64,
        vat_rate: row.vat_rate ?? 0,
        vat_enabled: row.vat_enabled ?? 1,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    }
    stmt.free();
    
    return profile;
  } catch (e) {
    console.error('Get company profile error:', e);
    return null;
  }
}

export function updateCompanyProfile(data) {
  try {
    const errors = [];
    
    if (!data.company_name || data.company_name.trim() === '') {
      errors.push('اسم الشركة مطلوب');
    }
    
    if (data.email) {
      const emailError = validators.email(data.email);
      if (emailError) errors.push(emailError);
    }
    
    if (data.phone1) {
      const phoneError = validators.phone(data.phone1);
      if (phoneError) errors.push(phoneError);
    }
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }
    
    const stmt = db.prepare(`UPDATE company_profile SET
      company_name = ?,
      company_name_en = ?,
      address = ?,
      phone1 = ?,
      phone2 = ?,
      email = ?,
      tax_number = ?,
      base_currency = ?,
      default_payment_method = ?,
      logo_base64 = ?,
      vat_rate = ?,
      vat_enabled = ?,
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`);

    stmt.run([
      data.company_name,
      data.company_name_en || null,
      data.address || null,
      data.phone1 || null,
      data.phone2 || null,
      data.email || null,
      data.tax_number || null,
      data.base_currency || 'USD',
      data.default_payment_method || 'Cash',
      data.logo_base64 || null,
      safe(data.vat_rate, 0),
      data.vat_enabled ? 1 : 0,
      getCurrentUser()
    ]);
    stmt.free();
    
    saveDatabase();
    return { success: true };
    
  } catch (e) {
    console.error('Update company profile error:', e);
    withErrorHandler(() => { throw e; }, 'تحديث بيانات الشركة', { details: { profileData } });
    return { success: false, error: parseDbError(e) };
  }
}