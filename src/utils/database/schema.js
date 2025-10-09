// src/utils/database/schema.js
import { db, hasColumn, saveDatabase } from './core.js';
import bcrypt from 'bcryptjs';

/* ============================================
   TABLE CREATION FUNCTIONS
   ============================================ */

function createUsersTable() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
  )`);

  // Create default admin user WITHOUT password for initial setup
  const cnt = db.exec('SELECT COUNT(1) FROM users')?.[0]?.values?.[0]?.[0] ?? 0;
  if (cnt === 0) {
    // Create admin with empty password - requires setup on first login
    // Empty string password hash indicates password needs to be set
    const emptyPasswordHash = ''; // Empty hash = no password set yet

    const stmt = db.prepare(`INSERT INTO users (
      id, username, password_hash, display_name, is_active, created_by
    ) VALUES (1, ?, ?, ?, 1, ?)`);
    stmt.run(['admin', emptyPasswordHash, 'Administrator', 'System']);
    stmt.free();

    // Display setup instructions
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     🔐 INITIAL SETUP REQUIRED                  ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║  Username: admin                               ║');
    console.log('║  Password: (not set - leave blank)            ║');
    console.log('║                                                ║');
    console.log('║  ⚠️  IMPORTANT: Set password on first login    ║');
    console.log('║     for security!                             ║');
    console.log('╚════════════════════════════════════════════════╝\n');
  }
}

function createCompanyProfileTable() {
  db.run(`CREATE TABLE IF NOT EXISTS company_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL DEFAULT 'Metal Sheets Company',
    company_name_en TEXT,
    address TEXT,
    phone1 TEXT,
    phone2 TEXT,
    email TEXT,
    tax_number TEXT,
    base_currency TEXT DEFAULT 'USD',
    default_payment_method TEXT DEFAULT 'Cash',
    logo_base64 TEXT,
    vat_rate REAL DEFAULT 0.0,
    vat_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  const cnt = db.exec('SELECT COUNT(1) FROM company_profile')?.[0]?.values?.[0]?.[0] ?? 0;
  if (cnt === 0) {
    const stmt = db.prepare(`INSERT INTO company_profile (
      id, company_name, company_name_en, address, phone1,
      base_currency, default_payment_method, vat_rate, vat_enabled
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([
      'شركة الصفائح المعدنية', 
      'Metal Sheets Company', 
      'Damascus - Syria', 
      '+963-11-1234567',
      'USD',
      'Cash',
      0.0,
      1
    ]);
    stmt.free();
  }
}

function createCurrenciesTable() {
  db.run(`CREATE TABLE IF NOT EXISTS currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    symbol TEXT NOT NULL,
    exchange_rate REAL NOT NULL DEFAULT 1.0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

function createPaymentMethodsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

function createBasicTables() {
  db.run(`CREATE TABLE IF NOT EXISTS metal_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    abbreviation TEXT NOT NULL UNIQUE,
    density REAL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_type_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id) ON DELETE CASCADE,
    UNIQUE(metal_type_id, name)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS finishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_type_id INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id) ON DELETE CASCADE,
    UNIQUE(metal_type_id, name_ar)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    company_name TEXT,
    phone1 TEXT,
    phone2 TEXT,
    address TEXT,
    email TEXT,
    tax_number TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT,
    phone1 TEXT,
    phone2 TEXT,
    address TEXT,
    email TEXT,
    tax_number TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

function createInventoryTables() {
  db.run(`CREATE TABLE IF NOT EXISTS sheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    metal_type_id INTEGER NOT NULL,
    grade_id INTEGER,
    finish_id INTEGER,
    length_mm INTEGER NOT NULL,
    width_mm INTEGER NOT NULL,
    thickness_mm REAL NOT NULL,
    weight_per_sheet_kg REAL,
    is_remnant INTEGER NOT NULL DEFAULT 0,
    parent_sheet_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY (metal_type_id) REFERENCES metal_types(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (finish_id) REFERENCES finishes(id),
    FOREIGN KEY (parent_sheet_id) REFERENCES sheets(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sheet_id INTEGER NOT NULL,
    supplier_id INTEGER,
    quantity_original INTEGER NOT NULL,
    quantity_remaining INTEGER NOT NULL,
    price_per_kg REAL,
    total_cost REAL,
    storage_location TEXT,
    received_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movement_type TEXT NOT NULL,
    sheet_id INTEGER NOT NULL,
    batch_id INTEGER,
    quantity INTEGER NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id),
    FOREIGN KEY (batch_id) REFERENCES batches(id)
  )`);
}

function createServiceTypesTable() {
  db.run(`CREATE TABLE IF NOT EXISTS service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    default_cost REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

function createSalesTables() {
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    sale_date DATE NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    fx_rate REAL DEFAULT 1.0,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    item_type TEXT DEFAULT 'material',
    sheet_id INTEGER,
    batch_id INTEGER,
    quantity_sold INTEGER,
    unit_price REAL,
    total_price REAL,
    sold_dimensions TEXT,
    sold_weight REAL,
    is_custom_size INTEGER DEFAULT 0,
    service_type_id INTEGER,
    material_description TEXT,
    service_price REAL,
    notes TEXT,
    cogs_per_unit REAL,
    cogs_total REAL,
    service_cost REAL,
    service_cost_total REAL,
    service_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE SET NULL
  )`);
}

function createPaymentsTables() {
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    batch_id INTEGER,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
  )`);
}

function createAccountingTables() {
  db.run(`CREATE TABLE IF NOT EXISTS customer_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    amount REAL NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    balance_after REAL NOT NULL,
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS supplier_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    amount REAL NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    balance_after REAL NOT NULL,
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
  )`);
}

function createExpensesTable() {
  db.run(`CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
  )`);
}

function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_batches_sheet_id ON batches(sheet_id)',
    'CREATE INDEX IF NOT EXISTS idx_batches_supplier_id ON batches(supplier_id)',
    'CREATE INDEX IF NOT EXISTS idx_batches_received_date ON batches(received_date)',
    'CREATE INDEX IF NOT EXISTS idx_sheets_code ON sheets(code)',
    'CREATE INDEX IF NOT EXISTS idx_sheets_metal_type_id ON sheets(metal_type_id)',
    'CREATE INDEX IF NOT EXISTS idx_sheets_grade_id ON sheets(grade_id)',
    'CREATE INDEX IF NOT EXISTS idx_sheets_finish_id ON sheets(finish_id)',
    'CREATE INDEX IF NOT EXISTS idx_sheets_is_remnant ON sheets(is_remnant)',
    'CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)',
    'CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_item_type ON sale_items(item_type)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sheet_id ON sale_items(sheet_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_batch_id ON sale_items(batch_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_service_type_id ON sale_items(service_type_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_payments_batch_id ON supplier_payments(batch_id)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date)',
    'CREATE INDEX IF NOT EXISTS idx_customer_trans_customer_id ON customer_transactions(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_customer_trans_date ON customer_transactions(transaction_date)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_trans_supplier_id ON supplier_transactions(supplier_id)',
    'CREATE INDEX IF NOT EXISTS idx_supplier_trans_date ON supplier_transactions(transaction_date)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_movements_sheet_id ON inventory_movements(sheet_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch_id ON inventory_movements(batch_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type)'
  ];

  indexes.forEach(sql => {
    try { db.run(sql); } catch (e) { console.error('Index creation error:', e); }
  });
}

/* ============================================
   DEFAULT DATA INSERTION
   ============================================ */

function insertDefaultMetals() {
  const count = db.exec('SELECT COUNT(*) as cnt FROM metal_types')?.[0]?.values?.[0]?.[0] || 0;
  if (count > 0) return;
  
  const metals = [
    ['ستانلس ستيل', 'Stainless Steel', 'SS', 7.93],
    ['حديد', 'Steel', 'ST', 7.85],
    ['ألمنيوم', 'Aluminum', 'AL', 2.70],
    ['مجلفن', 'Galvanized', 'GV', 7.85],
    ['نحاس', 'Copper', 'CU', 8.96],
  ];
  
  const metalStmt = db.prepare('INSERT INTO metal_types (name_ar, name_en, abbreviation, density) VALUES (?, ?, ?, ?)');
  metals.forEach((m) => {
    try { metalStmt.run(m); } catch (e) { console.error('Metal insert error:', e); }
  });
  metalStmt.free();
  
  const grades = [
    [1, '304'],
    [1, '316'],
    [1, '430'],
    [1, '201']
  ];
  
  const gradeStmt = db.prepare('INSERT INTO grades (metal_type_id, name) VALUES (?, ?)');
  grades.forEach((g) => {
    try { gradeStmt.run(g); } catch (e) { console.error('Grade insert error:', e); }
  });
  gradeStmt.free();
  
  const finishes = [
    [1, '2B', '2B'],
    [1, 'F1', 'F1'],
    [1, 'BRUSHED', 'Brushed'],
    [1, 'MIRROR', 'Mirror'],
    [1, 'GOLD', 'Gold'],
  ];
  
  const finishStmt = db.prepare('INSERT INTO finishes (metal_type_id, name_ar, name_en) VALUES (?, ?, ?)');
  finishes.forEach((f) => {
    try { finishStmt.run(f); } catch (e) { console.error('Finish insert error:', e); }
  });
  finishStmt.free();
}

function insertDefaultCurrencies() {
  const count = db.exec('SELECT COUNT(*) as cnt FROM currencies')?.[0]?.values?.[0]?.[0] || 0;
  if (count > 0) return;
  
  const currencies = [
    ['USD', 'دولار أمريكي', 'US Dollar', '$', 1.0],
    ['SYP', 'ليرة سورية', 'Syrian Pound', 'ل.س', 14000.0]
  ];
  
  const stmt = db.prepare('INSERT INTO currencies (code, name_ar, name_en, symbol, exchange_rate) VALUES (?, ?, ?, ?, ?)');
  currencies.forEach((c) => {
    try { stmt.run(c); } catch (e) { console.error('Currency insert error:', e); }
  });
  stmt.free();
}

function insertDefaultPaymentMethods() {
  const count = db.exec('SELECT COUNT(*) as cnt FROM payment_methods')?.[0]?.values?.[0]?.[0] || 0;
  if (count > 0) return;
  
  const methods = [
    ['نقدي', 'Cash'],
    ['تحويل بنكي', 'Bank Transfer'],
    ['شيك', 'Check'],
    ['بطاقة ائتمان', 'Credit Card']
  ];
  
  const stmt = db.prepare('INSERT INTO payment_methods (name_ar, name_en) VALUES (?, ?)');
  methods.forEach((m) => {
    try { stmt.run(m); } catch (e) { console.error('Payment method insert error:', e); }
  });
  stmt.free();
}

function insertDefaultServices() {
  const count = db.exec('SELECT COUNT(*) as cnt FROM service_types')?.[0]?.values?.[0]?.[0] || 0;
  if (count > 0) return;
  
  const services = [
    ['ليزر', 'Laser', 0, 1],
    ['طعج', 'Bending', 0, 1],
    ['لف', 'Curving', 0, 1],
    ['بلص', 'Spinning', 0, 1],
    ['كبس', 'Pressing', 0, 1],
    ['لحام', 'Welding', 0, 1]
  ];
  
  const stmt = db.prepare('INSERT INTO service_types (name_ar, name_en, default_cost, is_default) VALUES (?, ?, ?, ?)');
  services.forEach(s => {
    try { stmt.run(s); } catch (e) { console.error('Service insert error:', e); }
  });
  stmt.free();
}

function insertDefaultExpenseCategories() {
  const count = db.exec('SELECT COUNT(*) as cnt FROM expense_categories')?.[0]?.values?.[0]?.[0] || 0;
  if (count > 0) return;
  
  const categories = [
    ['رواتب', 'Salaries'],
    ['إيجار', 'Rent'],
    ['كهرباء', 'Electricity'],
    ['ماء', 'Water'],
    ['صيانة', 'Maintenance'],
    ['مواصلات', 'Transportation'],
    ['اتصالات', 'Communications'],
    ['أخرى', 'Other']
  ];
  
  const stmt = db.prepare('INSERT INTO expense_categories (name_ar, name_en) VALUES (?, ?)');
  categories.forEach(c => {
    try { stmt.run(c); } catch (e) { console.error('Expense category insert error:', e); }
  });
  stmt.free();
}

/* ============================================
   MIGRATIONS
   ============================================ */

export function runMigrations() {
  if (!hasColumn('company_profile', 'vat_rate')) {
    db.run(`ALTER TABLE company_profile ADD COLUMN vat_rate REAL DEFAULT 0.0`);
  }
  if (!hasColumn('company_profile', 'vat_enabled')) {
    db.run(`ALTER TABLE company_profile ADD COLUMN vat_enabled INTEGER DEFAULT 1`);
  }
  
  if (!hasColumn('company_profile', 'base_currency')) {
    db.run(`ALTER TABLE company_profile ADD COLUMN base_currency TEXT DEFAULT 'USD'`);
  }
  
  if (!hasColumn('company_profile', 'default_payment_method')) {
    db.run(`ALTER TABLE company_profile ADD COLUMN default_payment_method TEXT DEFAULT 'Cash'`);
  }
  
  if (!hasColumn('sales', 'currency_code')) {
    db.run(`ALTER TABLE sales ADD COLUMN currency_code TEXT DEFAULT 'USD'`);
  }
  if (!hasColumn('sales', 'fx_rate')) {
    db.run(`ALTER TABLE sales ADD COLUMN fx_rate REAL DEFAULT 1.0`);
  }
  
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.length ? tables[0].values.map(r => r[0]) : [];
  
  if (!tableNames.includes('service_types')) {
    createServiceTypesTable();
    insertDefaultServices();
  } else if (!hasColumn('service_types', 'default_cost')) {
    db.run(`ALTER TABLE service_types ADD COLUMN default_cost REAL DEFAULT 0`);
  }
  
  if (!hasColumn('sale_items', 'item_type')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN item_type TEXT DEFAULT 'material'`);
  }
  if (!hasColumn('sale_items', 'service_type_id')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN service_type_id INTEGER`);
  }
  if (!hasColumn('sale_items', 'material_description')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN material_description TEXT`);
  }
  if (!hasColumn('sale_items', 'service_price')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN service_price REAL`);
  }
  if (!hasColumn('sale_items', 'notes')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN notes TEXT`);
  }
  if (!hasColumn('sale_items', 'cogs_per_unit')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN cogs_per_unit REAL`);
  }
  if (!hasColumn('sale_items', 'cogs_total')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN cogs_total REAL`);
  }
  if (!hasColumn('sale_items', 'service_cost')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN service_cost REAL`);
  }
  if (!hasColumn('sale_items', 'service_cost_total')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN service_cost_total REAL`);
  }
  if (!hasColumn('sale_items', 'service_notes')) {
    db.run(`ALTER TABLE sale_items ADD COLUMN service_notes TEXT`);
  }
  
  if (!tableNames.includes('currencies')) {
    createCurrenciesTable();
    insertDefaultCurrencies();
  }
  
  if (!tableNames.includes('payment_methods')) {
    createPaymentMethodsTable();
    insertDefaultPaymentMethods();
  }
  
  if (!tableNames.includes('expense_categories')) {
    createExpensesTable();
    insertDefaultExpenseCategories();
  }
  
  if (!tableNames.includes('supplier_payments')) {
    db.run(`CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      batch_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      payment_method TEXT,
      payment_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    )`);
  }
  
  if (!hasColumn('metal_types', 'is_active')) {
    db.run(`ALTER TABLE metal_types ADD COLUMN is_active INTEGER DEFAULT 1`);
  }
  if (!hasColumn('grades', 'is_active')) {
    db.run(`ALTER TABLE grades ADD COLUMN is_active INTEGER DEFAULT 1`);
  }

  // Add created_by and updated_by columns to sheets table
  if (!hasColumn('sheets', 'created_by')) {
    db.run(`ALTER TABLE sheets ADD COLUMN created_by TEXT`);
  }
  if (!hasColumn('sheets', 'updated_by')) {
    db.run(`ALTER TABLE sheets ADD COLUMN updated_by TEXT`);
  }
  if (!hasColumn('sheets', 'updated_at')) {
    db.run(`ALTER TABLE sheets ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
  }
  if (!hasColumn('finishes', 'is_active')) {
    db.run(`ALTER TABLE finishes ADD COLUMN is_active INTEGER DEFAULT 1`);
  }

  // Create users table if not exists
  if (!tableNames.includes('users')) {
    createUsersTable();
  }

  // Add audit columns to all tables
  addAuditColumns();

  insertDefaultCurrencies();
  insertDefaultPaymentMethods();
  insertDefaultServices();
  insertDefaultExpenseCategories();

  createIndexes();
  saveDatabase();
}

/* ============================================
   AUDIT TRAIL - Add created_by/updated_by to all tables
   ============================================ */

function addAuditColumns() {
  const tables = [
    'company_profile', 'currencies', 'payment_methods', 'metal_types', 'grades',
    'finishes', 'suppliers', 'customers', 'sheets', 'batches', 'inventory_movements',
    'service_types', 'sales', 'sale_items', 'payments', 'supplier_payments',
    'customer_transactions', 'supplier_transactions', 'expense_categories', 'expenses'
  ];

  let columnsAdded = false;

  tables.forEach(table => {
    try {
      // Check if table exists first
      const tableExists = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
      if (!tableExists.length || !tableExists[0].values.length) {
        console.warn(`Table ${table} does not exist, skipping audit columns`);
        return;
      }

      if (!hasColumn(table, 'created_by')) {
        db.run(`ALTER TABLE ${table} ADD COLUMN created_by TEXT`);
        console.log(`Added created_by column to ${table}`);
        columnsAdded = true;
      }
      if (!hasColumn(table, 'updated_by')) {
        db.run(`ALTER TABLE ${table} ADD COLUMN updated_by TEXT`);
        console.log(`Added updated_by column to ${table}`);
        columnsAdded = true;
      }
    } catch (e) {
      console.error(`Failed to add audit columns to ${table}:`, e);
    }
  });

  // Save database if columns were added
  if (columnsAdded) {
    console.log('Audit columns added, saving database...');
    saveDatabase();
  }
}

/* ============================================
   EXPORTED FUNCTIONS
   ============================================ */

export function createAllTables() {
  createUsersTable();
  createCompanyProfileTable();
  createCurrenciesTable();
  createPaymentMethodsTable();
  createBasicTables();
  createInventoryTables();
  createServiceTypesTable();
  createSalesTables();
  createPaymentsTables();
  createAccountingTables();
  createExpensesTable();
  createIndexes();
  saveDatabase();
}

export function insertDefaultData() {
  insertDefaultMetals();
  insertDefaultCurrencies();
  insertDefaultPaymentMethods();
  insertDefaultServices();
  insertDefaultExpenseCategories();
  saveDatabase();
}