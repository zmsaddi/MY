// src/utils/database/reset.js
import { db, saveDatabase, getCurrentUser } from './core.js';

/**
 * Database Reset & Clean Utilities
 *
 * IMPORTANT: These functions permanently delete data!
 * Use with caution and ensure users understand the consequences.
 */

/**
 * Clear all transactional data (sales, payments, inventory movements)
 * Keeps configuration data (users, company, metal types, etc.)
 */
export function clearTransactionalData() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // Clear sales and related data
    db.run('DELETE FROM sale_items');
    db.run('DELETE FROM sales');

    // Clear payments
    db.run('DELETE FROM payments');
    db.run('DELETE FROM supplier_payments');

    // Clear transactions (accounting)
    db.run('DELETE FROM customer_transactions');
    db.run('DELETE FROM supplier_transactions');

    // Clear inventory movements
    db.run('DELETE FROM inventory_movements');

    // Clear batches and sheets
    db.run('DELETE FROM batches');
    db.run('DELETE FROM sheets');

    // Clear expenses
    db.run('DELETE FROM expenses');

    // Reset auto-increment counters
    db.run('DELETE FROM sqlite_sequence WHERE name IN ("sales", "sale_items", "payments", "supplier_payments", "customer_transactions", "supplier_transactions", "inventory_movements", "batches", "sheets", "expenses")');

    db.run('COMMIT');
    saveDatabase();

    return {
      success: true,
      message: 'تم حذف جميع البيانات التشغيلية بنجاح',
      clearedTables: [
        'المبيعات',
        'عناصر المبيعات',
        'المدفوعات',
        'دفعات الموردين',
        'معاملات العملاء',
        'معاملات الموردين',
        'حركات المخزون',
        'الدفعات',
        'الصفائح',
        'المصاريف'
      ]
    };

  } catch (e) {
    db.run('ROLLBACK');
    console.error('Clear transactional data error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Clear all master data (customers, suppliers, etc.)
 * Keeps system configuration (users, company, settings)
 */
export function clearMasterData() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // First clear transactional data (has foreign keys)
    const transResult = clearTransactionalData();
    if (!transResult.success) {
      throw new Error(transResult.error);
    }

    // Now clear master data
    db.run('DELETE FROM customers');
    db.run('DELETE FROM suppliers');

    // Reset auto-increment
    db.run('DELETE FROM sqlite_sequence WHERE name IN ("customers", "suppliers")');

    db.run('COMMIT');
    saveDatabase();

    return {
      success: true,
      message: 'تم حذف جميع البيانات الأساسية والتشغيلية',
      clearedTables: [
        ...transResult.clearedTables,
        'العملاء',
        'الموردين'
      ]
    };

  } catch (e) {
    db.run('ROLLBACK');
    console.error('Clear master data error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Reset ALL database to initial state
 * Keeps ONLY: Users, Company Profile, System Settings
 * Deletes: All master data, all transactions, all inventory
 */
export function resetDatabaseToInitialState() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // Clear all transactional data
    db.run('DELETE FROM sale_items');
    db.run('DELETE FROM sales');
    db.run('DELETE FROM payments');
    db.run('DELETE FROM supplier_payments');
    db.run('DELETE FROM customer_transactions');
    db.run('DELETE FROM supplier_transactions');
    db.run('DELETE FROM inventory_movements');
    db.run('DELETE FROM batches');
    db.run('DELETE FROM sheets');
    db.run('DELETE FROM expenses');

    // Clear master data
    db.run('DELETE FROM customers');
    db.run('DELETE FROM suppliers');

    // Clear expense categories (but keep default ones)
    // We'll re-insert default categories below
    db.run('DELETE FROM expense_categories');

    // Reset all auto-increment counters
    db.run('DELETE FROM sqlite_sequence');

    // Re-insert default expense categories
    const defaultCategories = [
      ['رواتب', 'مرتبات الموظفين'],
      ['إيجار', 'إيجار المكان'],
      ['كهرباء وماء', 'فواتير الخدمات'],
      ['صيانة', 'صيانة المعدات والأجهزة'],
      ['وقود', 'وقود السيارات'],
      ['مواصلات', 'تكاليف النقل والمواصلات'],
      ['اتصالات', 'هاتف وإنترنت'],
      ['أدوات مكتبية', 'قرطاسية ومستلزمات'],
      ['ضيافة', 'قهوة وضيافة'],
      ['أخرى', 'مصاريف متفرقة']
    ];

    const catStmt = db.prepare('INSERT INTO expense_categories (name, description) VALUES (?, ?)');
    for (const [name, desc] of defaultCategories) {
      catStmt.run([name, desc]);
    }
    catStmt.free();

    db.run('COMMIT');
    saveDatabase();

    return {
      success: true,
      message: 'تم إعادة تعيين قاعدة البيانات بنجاح',
      info: 'تم الاحتفاظ بالمستخدمين وإعدادات الشركة والنظام فقط',
      clearedAll: true
    };

  } catch (e) {
    db.run('ROLLBACK');
    console.error('Reset database error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * DANGEROUS: Delete EVERYTHING including users and company profile
 * This effectively creates a completely fresh database
 * Requires re-setup of company and users
 */
export function completelyWipeDatabase() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    // Get list of all tables
    const tables = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    `);

    if (!tables || !tables[0]) {
      return { success: false, error: 'Could not read tables' };
    }

    db.run('BEGIN TRANSACTION');

    // Delete all data from all tables
    const tableNames = tables[0].values.map(row => row[0]);

    for (const table of tableNames) {
      db.run(`DELETE FROM ${table}`);
    }

    // Reset all auto-increment counters
    db.run('DELETE FROM sqlite_sequence');

    db.run('COMMIT');
    saveDatabase();

    return {
      success: true,
      message: 'تم مسح قاعدة البيانات بالكامل',
      warning: 'يجب إعادة إعداد الشركة والمستخدمين',
      tablesWiped: tableNames.length
    };

  } catch (e) {
    db.run('ROLLBACK');
    console.error('Complete wipe error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get database statistics (record counts)
 */
export function getDatabaseStats() {
  if (!db) return null;

  try {
    const stats = {};

    const tables = [
      { name: 'users', label: 'المستخدمين' },
      { name: 'customers', label: 'العملاء' },
      { name: 'suppliers', label: 'الموردين' },
      { name: 'sheets', label: 'الصفائح' },
      { name: 'batches', label: 'الدفعات' },
      { name: 'sales', label: 'المبيعات' },
      { name: 'sale_items', label: 'عناصر المبيعات' },
      { name: 'payments', label: 'المدفوعات' },
      { name: 'supplier_payments', label: 'دفعات الموردين' },
      { name: 'expenses', label: 'المصاريف' },
      { name: 'customer_transactions', label: 'معاملات العملاء' },
      { name: 'supplier_transactions', label: 'معاملات الموردين' },
      { name: 'inventory_movements', label: 'حركات المخزون' },
    ];

    for (const table of tables) {
      const result = db.exec(`SELECT COUNT(*) as count FROM ${table.name}`);
      const count = result[0]?.values[0]?.[0] || 0;
      stats[table.name] = { label: table.label, count };
    }

    return stats;

  } catch (e) {
    console.error('Get database stats error:', e);
    return null;
  }
}

/**
 * Export database to JSON for backup
 */
export function exportDatabaseToJSON() {
  if (!db) return null;

  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: getCurrentUser(),
      version: '2.0.0',
      tables: {}
    };

    // Tables to export
    const tables = [
      'users', 'company_profile', 'currencies', 'payment_methods',
      'metal_types', 'grades', 'finishes', 'service_types',
      'customers', 'suppliers', 'expense_categories',
      'sheets', 'batches', 'sales', 'sale_items',
      'payments', 'supplier_payments', 'expenses',
      'customer_transactions', 'supplier_transactions',
      'inventory_movements'
    ];

    for (const table of tables) {
      const result = db.exec(`SELECT * FROM ${table}`);

      if (result && result[0]) {
        const columns = result[0].columns;
        const rows = result[0].values.map(row => {
          const obj = {};
          columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });

        exportData.tables[table] = rows;
      } else {
        exportData.tables[table] = [];
      }
    }

    return {
      success: true,
      data: exportData,
      stats: getDatabaseStats()
    };

  } catch (e) {
    console.error('Export database error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete database from localStorage completely
 * Next page reload will create fresh database
 */
export function deleteStoredDatabase() {
  try {
    localStorage.removeItem('metalsheets_database');
    return {
      success: true,
      message: 'تم حذف قاعدة البيانات من التخزين المحلي',
      info: 'سيتم إنشاء قاعدة بيانات جديدة عند إعادة تحميل الصفحة'
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
