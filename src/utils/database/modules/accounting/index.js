// src/utils/database/modules/accounting/index.js
/**
 * Enhanced Accounting Module
 *
 * This module provides comprehensive accounting functionality including:
 * - Balance tracking and calculation
 * - Aging analysis (receivables/payables)
 * - Transaction management
 * - Account statements
 * - Reconciliation
 *
 * @module accounting
 */

// Balance management
export {
  calculateCustomerBalance,
  calculateSupplierBalance,
  getCustomerBalance,
  getSupplierBalance,
  rebuildCustomerBalanceTrail,
  rebuildSupplierBalanceTrail,
  getAllCustomerBalances,
  getAllSupplierBalances,
} from './balances.js';

// Aging analysis
export {
  getCustomerAgingReport,
  getSupplierAgingReport,
  getAgingSummary,
  getOverdueAccounts,
} from './aging.js';

// Note: Additional modules to be added:
// - statements.js (detailed account statements)
// - transactions.js (transaction CRUD operations)
// - reconciliation.js (account reconciliation)
// - journalEntries.js (double-entry bookkeeping)
// - financialStatements.js (P&L, Balance Sheet, Cash Flow)
