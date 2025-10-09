// src/utils/database/core.js
import initSqlJs from 'sql.js';
import { validators, parseDbError } from '../validators.js';
import { encryptData, decryptData, getSecurityStatus } from '../security/encryption.js';

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
      const backupData = {
        timestamp: new Date().toISOString(),
        size: sizeInMB.toFixed(2) + ' MB',
        data: exportResult.data
      };

      localStorage.setItem('metalsheets_auto_backup', JSON.stringify(backupData));

      if (process.env.NODE_ENV === 'development') {
        console.info(`✅ Auto backup created: ${sizeInMB.toFixed(2)} MB`);
      }
    }
  } catch (err) {
    console.error('Auto backup error:', err);
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

    if (sizeInMB > 4.5) {
      console.warn(`⚠️ Database size: ${sizeInMB.toFixed(2)} MB - approaching limit!`);
    }

    const encrypted = await encryptData(serialized);
    localStorage.setItem('metalsheets_database', encrypted);

    return { success: true, size: sizeInMB, encrypted: true };

  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'تجاوز حد التخزين! يرجى تصدير البيانات وأرشفة القديمة.',
        quotaExceeded: true
      };
    }
    return { success: false, error: e.message };
  }
}

export async function saveDatabase() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  return new Promise((resolve) => {
    saveTimeout = setTimeout(async () => {
      const result = await saveDatabaseImmediate();
      resolve(result);
    }, 300);
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

    const saved = localStorage.getItem('metalsheets_database');

    if (saved) {
      try {
        db = new SQL.Database(new Uint8Array(JSON.parse(saved)));
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
        console.warn('Database corrupted, recreating:', e);
        localStorage.removeItem('metalsheets_database');
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