// src/utils/database/index.js
// Main database entry point - exports everything from all modules

/* ============================================
   CORE & UTILITIES
   ============================================ */
export {
  db,
  tx,
  round2,
  safe,
  lastId,
  hasColumn,
  saveDatabase,
  currencyHelpers,
  generateSheetCode,
  generateInvoiceNumber,
  initDatabase
} from './core.js';

/* ============================================
   SCHEMA & MIGRATIONS
   ============================================ */
export {
  createAllTables,
  insertDefaultData,
  runMigrations
} from './schema.js';

/* ============================================
   COMPANY PROFILE
   ============================================ */
export {
  getCompanyProfile,
  updateCompanyProfile
} from './profile.js';

/* ============================================
   CURRENCIES
   ============================================ */
export {
  getBaseCurrencyInfo,
  getCurrencies,
  addCurrency,
  updateCurrency
} from './currencies.js';

/* ============================================
   PAYMENT METHODS
   ============================================ */
export {
  getPaymentMethods,
  getPaymentMethodsForUI,
  addPaymentMethod,
  updatePaymentMethod
} from './paymentMethods.js';

/* ============================================
   SERVICES
   ============================================ */
export {
  getServiceTypes,
  addServiceType,
  updateServiceType
} from './services.js';

/* ============================================
   METAL TYPES, GRADES, FINISHES
   ============================================ */
export {
  getMetalTypes,
  addMetalType,
  updateMetalType,
  getGrades,
  addGrade,
  updateGrade,
  getFinishes,
  addFinish,
  updateFinish
} from './metalTypes.js';

/* ============================================
   CUSTOMERS
   ============================================ */
export {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer
} from './customers.js';

/* ============================================
   SUPPLIERS & SUPPLIER PAYMENTS
   ============================================ */
export {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  addSupplierPayment,
  getSupplierPayments,
  getSupplierBalance,
  getAllSuppliersWithBalances
} from './suppliers.js';

/* ============================================
   INVENTORY - SHEETS & BATCHES
   ============================================ */
export {
  recordInventoryMovement,
  getAllSheets,
  addSheetWithBatch,
  getBatchesBySheetId,
  getBatchById,        // NEW
  addBatchToSheet,
  updateBatch,         // NEW
  pruneEmptyBatches
} from './inventory.js';

/* ============================================
   SALES
   ============================================ */
export {
  getAllSales,
  getSaleById,
  processSale,
  deleteSale
} from './sales.js';

/* ============================================
   ACCOUNTING
   ============================================ */
export {
  getCustomerBalance,
  getCustomerStatement,
  getSupplierStatement,
  insertCustomerTransactionInline,
  insertSupplierTransactionInline,
  settleCustomerPayment,
  settleSupplierPayment
} from './accounting.js';

/* ============================================
   EXPENSES
   ============================================ */
export {
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense
} from './expenses.js';

/* ============================================
   REPORTS & ANALYTICS
   ============================================ */
export {
  getProfitBreakdown,
  getBestSellingMaterials,
  getBestSellingServices,
  getExpensesSummaryByCategory,
  getInventoryValue,
  getTopCustomers,
  getSalesSummary
} from './reports.js';

/* ============================================
   PURCHASE REPORTS
   ============================================ */
export {
  getPurchasesBySupplier,
  getPurchasesSummary
} from './purchaseReports.js';