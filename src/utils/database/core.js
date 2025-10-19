// src/utils/database/core.js
import initSqlJs from 'sql.js';
import { validators, parseDbError } from '../validators.js';
import { encryptData, decryptData, getSecurityStatus } from '../security/encryption.js';
import indexedDBManager from './indexedDBManager.js';

export let db = null;

// Global current user context (set by App.jsx after login)
let currentUserContext = 'System';

export function setCurrentUser(username) {
  currentUserContext = username || 'System';
}

export function getCurrentUser() {
  return currentUserContext;
}

/* ============================================
   TRANSACTION HELPERS
   ============================================ */

export const tx = {
  begin(mode = 'DEFERRED') {
    try {
      db.run(`BEGIN ${mode}`);
    } catch (e) {
      console.error('Begin transaction failed:', e);
    }
  },
  commit() {
    try {
      db.run('COMMIT');
    } catch (e) {
      console.error('Commit failed:', e);
    }
  },
  rollback() {
    try {
      db.run('ROLLBACK');
    } catch (e) {}
  },
};

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const safe = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function lastId() {
  try {
    const res = db.exec('SELECT last_insert_rowid() AS id');
    return res?.[0]?.values?.[0]?.[0] ?? null;
  } catch {
    return null;
  }
}

export function hasColumn(table, col) {
  try {
    const r = db.exec(`PRAGMA table_info(${table})`);
    return r.length && r[0].values.some((row) => row[1] === col);
  } catch {
    return false;
  }
}

/* ============================================
   DATABASE PERSISTENCE
   ============================================ */

const AUTO_BACKUP_SIZE_MB = 4.0;
let saveTimeout = null;
let pendingBackup = false;

async function performAutoBackup(sizeInMB) {
  if (pendingBackup) return;
  pendingBackup = true;

  try {
    const { exportDatabaseToJSON } = await import('./reset.js');
    const exportResult = exportDatabaseToJSON();

    if (exportResult.success) {
      // استخدام IndexedDB للنسخ الاحتياطية الكبيرة
      const backupResult = await indexedDBManager.createBackup(
        exportResult.data,
        `نسخة احتياطية تلقائية - ${sizeInMB.toFixed(2)} MB`
      );

      console.log(`✅ نسخة احتياطية في IndexedDB: ${backupResult.size.toFixed(2)} MB`);

      // محاولة حفظ نسخة صغيرة في localStorage للتوافق
      try {
        const backupData = {
          timestamp: new Date().toISOString(),
          size: sizeInMB.toFixed(2) + ' MB',
          indexedDBBackupId: backupResult.backupId
        };
        localStorage.setItem('metalsheets_auto_backup_meta', JSON.stringify(backupData));
      } catch (e) {
        // تجاهل أخطاء localStorage
      }

      if (process.env.NODE_ENV === 'development') {
        console.info(`✅ Auto backup created in IndexedDB: ${sizeInMB.toFixed(2)} MB`);
      }
    }
  } catch (err) {
    console.error('خطأ في النسخ الاحتياطي:', err);
  } finally {
    pendingBackup = false;
  }
}

async function saveDatabaseImmediate() {
  if (!db) return { success: false, error: 'No database' };

  try {
    const data = db.export();
    const serialized = JSON.stringify(Array.from(data));
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);

    if (sizeInMB >= AUTO_BACKUP_SIZE_MB && !pendingBackup) {
      requestIdleCallback(() => performAutoBackup(sizeInMB), { timeout: 5000 });
    }

    // لا حاجة للتحذير من الحجم مع IndexedDB - لدينا جيجابايتات!
    if (sizeInMB > 100) {
      console.log(`📊 حجم قاعدة البيانات: ${sizeInMB.toFixed(2)} MB`);
    }

    // استخدام IndexedDB بدلاً من localStorage
    const result = await indexedDBManager.saveDatabase(serialized, true);

    // الاحتفاظ بنسخة في localStorage للتوافق المؤقت
    try {
      const encrypted = await encryptData(serialized);
      localStorage.setItem('metalsheets_database_backup', encrypted);
    } catch (e) {
      // تجاهل أخطاء localStorage - لدينا IndexedDB
      console.log('localStorage full, using IndexedDB only');
    }

    return result;

  } catch (e) {
    console.error('خطأ في حفظ قاعدة البيانات:', e);
    return { success: false, error: e.message };
  }
}

export async function saveDatabase() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  return new Promise((resolve) => {
    saveTimeout = setTimeout(() => {
      // Use requestIdleCallback for non-blocking save when available
      // This prevents React 18 Suspense violations during click handlers
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          const result = await saveDatabaseImmediate();
          resolve(result);
        }, { timeout: 1000 }); // 1 second timeout
      } else {
        // Fallback to setTimeout for browsers without requestIdleCallback
        setTimeout(async () => {
          const result = await saveDatabaseImmediate();
          resolve(result);
        }, 0);
      }
    }, 300); // 300ms debounce
  });
}

/**
 * Get the latest auto backup info (if exists)
 */
export function getAutoBackupInfo() {
  try {
    const backupKey = 'metalsheets_auto_backup';
    const backupData = localStorage.getItem(backupKey);

    if (!backupData) {
      return { exists: false };
    }

    const backup = JSON.parse(backupData);
    return {
      exists: true,
      timestamp: backup.timestamp,
      size: backup.size,
      date: new Date(backup.timestamp).toLocaleString('ar')
    };
  } catch (e) {
    console.error('Get auto backup info error:', e);
    return { exists: false, error: e.message };
  }
}

/**
 * Delete the auto backup
 */
export function deleteAutoBackup() {
  try {
    localStorage.removeItem('metalsheets_auto_backup');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/* ============================================
   CURRENCY HELPERS
   ============================================ */

function toBase(amount, fromCurrency, baseCurrency, exchangeRates) {
  const a = safe(amount, 0);
  if (fromCurrency === baseCurrency) return a;
  
  const rate = exchangeRates[fromCurrency];
  if (!rate) return a;
  
  return round2(a * rate);
}

function fromBase(amount, toCurrency, baseCurrency, exchangeRates) {
  const a = safe(amount, 0);
  if (toCurrency === baseCurrency) return a;
  
  const rate = exchangeRates[toCurrency];
  if (!rate) return a;
  
  return round2(a / rate);
}

export const currencyHelpers = { toBase, fromBase, round2 };

/* ============================================
   WEIGHT CALCULATION HELPERS
   ============================================ */

/**
 * Calculate weight per cm² for a sheet
 * @param {number} weightPerSheetKg - Weight of one sheet in kg
 * @param {number} lengthMm - Length in millimeters
 * @param {number} widthMm - Width in millimeters
 * @returns {number|null} Weight per cm² in kg/cm², or null if inputs invalid
 */
export function calculateWeightPerCm2(weightPerSheetKg, lengthMm, widthMm) {
  console.log('🔢 calculateWeightPerCm2 called:', { weightPerSheetKg, lengthMm, widthMm });

  if (!weightPerSheetKg || weightPerSheetKg <= 0 || !lengthMm || lengthMm <= 0 || !widthMm || widthMm <= 0) {
    console.warn('❌ Invalid input for calculateWeightPerCm2');
    return null;
  }

  // Convert mm to cm: 1 mm = 0.1 cm
  const lengthCm = lengthMm / 10;
  const widthCm = widthMm / 10;

  // Calculate area in cm²
  const areaCm2 = lengthCm * widthCm;

  // Calculate weight per cm²
  const weightPerCm2 = weightPerSheetKg / areaCm2;

  console.log('✅ calculateWeightPerCm2 result:', weightPerCm2);
  return weightPerCm2;
}

/**
 * Calculate weight for a given area based on weight per cm²
 * @param {number} weightPerCm2 - Weight per cm² in kg/cm²
 * @param {number} lengthMm - Length in millimeters
 * @param {number} widthMm - Width in millimeters
 * @returns {number} Weight in kg
 */
export function calculateWeightFromCm2(weightPerCm2, lengthMm, widthMm) {
  if (!weightPerCm2 || weightPerCm2 <= 0 || !lengthMm || lengthMm <= 0 || !widthMm || widthMm <= 0) {
    return 0;
  }

  // Convert mm to cm
  const lengthCm = lengthMm / 10;
  const widthCm = widthMm / 10;

  // Calculate area in cm²
  const areaCm2 = lengthCm * widthCm;

  // Calculate total weight
  const weight = weightPerCm2 * areaCm2;

  return weight;
}

/* ============================================
   CODE GENERATION
   ============================================ */

export function generateSheetCode(metalTypeId, length, width, thickness, gradeId = null, finishId = null, isRemnant = false) {
  if (!db) return '';
  
  try {
    // Get metal abbreviation
    const metalStmt = db.prepare('SELECT abbreviation FROM metal_types WHERE id = ?');
    metalStmt.bind([metalTypeId]);
    let metalAbbr = '';
    if (metalStmt.step()) {
      metalAbbr = metalStmt.getAsObject().abbreviation;
    }
    metalStmt.free();
    
    if (!metalAbbr) return '';
    
    // Add R prefix for remnants: RSS, RST, RAL, etc.
    const prefix = isRemnant ? `R${metalAbbr}` : metalAbbr;
    
    // Get grade name or use 'xx'
    let gradeName = 'xx';
    if (gradeId) {
      const gradeStmt = db.prepare('SELECT name FROM grades WHERE id = ?');
      gradeStmt.bind([gradeId]);
      if (gradeStmt.step()) {
        gradeName = gradeStmt.getAsObject().name || 'xx';
      }
      gradeStmt.free();
    }
    
    // Get finish name or use 'xx'
    let finishName = 'xx';
    if (finishId) {
      const finishStmt = db.prepare('SELECT name_en FROM finishes WHERE id = ?');
      finishStmt.bind([finishId]);
      if (finishStmt.step()) {
        finishName = finishStmt.getAsObject().name_en || 'xx';
      }
      finishStmt.free();
    }
    
    // Format thickness as integer if whole number, otherwise one decimal
    const thk = Number(thickness);
    const thicknessStr = thk % 1 === 0 ? String(Math.round(thk)) : thk.toFixed(1);
    
    // Format: PREFIX-LengthxWidthxThickness-Grade-Finish
    // Example: SS-3000x1500x3-304-2B or RST-3000x1500x3-xx-xx
    return `${prefix}-${length}x${width}x${thicknessStr}-${gradeName}-${finishName}`;
    
  } catch (e) {
    console.error('Generate sheet code error:', e);
    return '';
  }
}

export function generateInvoiceNumber() {
  try {
    const stmt = db.prepare('SELECT invoice_number FROM sales ORDER BY id DESC LIMIT 1');
    
    let lastNumber = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const lastInvoice = String(row.invoice_number);
      const match = lastInvoice.match(/INV-(\d+)/);
      if (match) {
        lastNumber = parseInt(match[1], 10);
      }
    }
    stmt.free();
    
    const newNumber = lastNumber + 1;
    return `INV-${String(newNumber).padStart(4, '0')}`;
    
  } catch (e) {
    return 'INV-0001';
  }
}

/* ============================================
   DATABASE INITIALIZATION
   ============================================ */

export async function initDatabase() {
  try {
    const SQL = await initSqlJs({
      locateFile: (f) => `https://sql.js.org/dist/${f}`
    });

    // تهيئة IndexedDB أولاً
    await indexedDBManager.init();

    // محاولة التحميل من IndexedDB أولاً
    let saved = null;
    try {
      saved = await indexedDBManager.loadDatabase();
      console.log('تم تحميل قاعدة البيانات من IndexedDB');
    } catch (e) {
      console.log('لا توجد بيانات في IndexedDB، البحث في localStorage...');
    }

    // إذا لم توجد في IndexedDB، حاول من localStorage (للتوافق)
    if (!saved) {
      saved = localStorage.getItem('metalsheets_database');

      if (saved) {
        // هجرة البيانات من localStorage إلى IndexedDB
        console.log('🔄 هجرة البيانات من localStorage إلى IndexedDB...');
        await indexedDBManager.migrateFromLocalStorage();
      }
    }

    if (saved) {
      try {
        const dataArray = typeof saved === 'string' ? JSON.parse(saved) : saved;
        db = new SQL.Database(new Uint8Array(dataArray));
        const hasTables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");

        if (hasTables.length === 0) {
          throw new Error('No tables found');
        }

        // Enable critical SQLite pragmas
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL'); // Better concurrency
        db.run('PRAGMA synchronous = NORMAL'); // Better performance

        // Import schema functions for migrations
        const { runMigrations } = await import('./schema.js');
        runMigrations();

      } catch (e) {
        console.error('Database corruption detected:', e);

        // Import quarantine functions
        const { quarantineDatabase, hasQuarantinedDatabases } = await import('./quarantine.js');

        // Quarantine the corrupted data instead of immediately deleting
        const quarantineResult = quarantineDatabase(saved, e);

        if (quarantineResult.success) {
          console.warn(`Database quarantined with ID: ${quarantineResult.quarantineId}`);
          console.warn('User should be prompted to export or attempt recovery before recreating');

          // Check if user has been warned about quarantined databases
          const hasBeenWarned = sessionStorage.getItem('quarantine_warning_shown');

          if (!hasBeenWarned && hasQuarantinedDatabases()) {
            sessionStorage.setItem('quarantine_warning_shown', 'true');
            // In a real app, show a dialog here
            console.error('⚠️ Database corruption detected. Data has been quarantined for recovery.');
            console.error('Please export your data or contact support before proceeding.');
          }
        }

        // Only clear and recreate after quarantine
        localStorage.removeItem('metalsheets_database');
        localStorage.removeItem('metalsheets_database_backup');

        // Create fresh database
        db = new SQL.Database();

        // Enable critical SQLite pragmas for new DB
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');

        // Import and create all tables
        const { createAllTables, insertDefaultData } = await import('./schema.js');
        createAllTables();
        insertDefaultData();
      }
    } else {
      db = new SQL.Database();

      // Enable critical SQLite pragmas for new DB
      db.run('PRAGMA foreign_keys = ON');
      db.run('PRAGMA journal_mode = WAL');
      db.run('PRAGMA synchronous = NORMAL');

      // Import and create all tables
      const { createAllTables, insertDefaultData } = await import('./schema.js');
      createAllTables();
      insertDefaultData();
    }
    
    return db;
    
  } catch (e) {
    console.error('Database initialization failed:', e);
    throw e;
  }
}