// src/utils/database/accounting-reconciliation.js
// Comprehensive accounting reconciliation and balance recalculation module

import { db, tx, saveDatabase, safe, round2 } from './core.js';

/**
 * Recalculates all supplier balances from scratch based on transactions
 * This ensures consistency between purchases and payments
 */
export function recalculateAllSupplierBalances() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    tx.begin();

    // Get all suppliers
    const suppliersStmt = db.prepare('SELECT id FROM suppliers');
    const suppliers = [];
    while (suppliersStmt.step()) {
      const row = suppliersStmt.getAsObject();
      suppliers.push(row.id);
    }
    suppliersStmt.free();

    // Recalculate each supplier's balance
    for (const supplierId of suppliers) {
      recalculateSupplierBalance(supplierId);
    }

    tx.commit();
    saveDatabase();

    return {
      success: true,
      message: `Successfully recalculated balances for ${suppliers.length} suppliers`
    };
  } catch (e) {
    tx.rollback();
    console.error('Recalculate all supplier balances error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Recalculates a single supplier's transaction history and balances
 */
export function recalculateSupplierBalance(supplierId) {
  if (!db) return false;

  try {
    // Delete existing transactions and rebuild from scratch
    const deleteStmt = db.prepare('DELETE FROM supplier_transactions WHERE supplier_id = ?');
    deleteStmt.run([supplierId]);
    deleteStmt.free();

    let runningBalance = 0;

    // Add all purchases (batches)
    const purchasesStmt = db.prepare(`
      SELECT id, total_cost, received_date
      FROM batches
      WHERE supplier_id = ? AND total_cost > 0
      ORDER BY received_date, id
    `);
    purchasesStmt.bind([supplierId]);

    while (purchasesStmt.step()) {
      const batch = purchasesStmt.getAsObject();
      runningBalance = round2(runningBalance + safe(batch.total_cost));

      const insertStmt = db.prepare(`
        INSERT INTO supplier_transactions
        (supplier_id, transaction_type, amount, reference_type, reference_id,
         balance_after, transaction_date, notes)
        VALUES (?, 'purchase', ?, 'batch', ?, ?, ?, 'شراء دفعة')
      `);
      insertStmt.run([
        supplierId,
        safe(batch.total_cost),
        batch.id,
        runningBalance,
        batch.received_date
      ]);
      insertStmt.free();
    }
    purchasesStmt.free();

    // Add all payments
    const paymentsStmt = db.prepare(`
      SELECT id, amount, payment_date, notes
      FROM supplier_payments
      WHERE supplier_id = ?
      ORDER BY payment_date, id
    `);
    paymentsStmt.bind([supplierId]);

    while (paymentsStmt.step()) {
      const payment = paymentsStmt.getAsObject();
      runningBalance = round2(runningBalance - safe(payment.amount));

      const insertStmt = db.prepare(`
        INSERT INTO supplier_transactions
        (supplier_id, transaction_type, amount, reference_type, reference_id,
         balance_after, transaction_date, notes)
        VALUES (?, 'payment', ?, 'payment', ?, ?, ?, ?)
      `);
      insertStmt.run([
        supplierId,
        -safe(payment.amount),
        payment.id,
        runningBalance,
        payment.payment_date,
        payment.notes || 'دفعة للمورد'
      ]);
      insertStmt.free();
    }
    paymentsStmt.free();

    return true;
  } catch (e) {
    console.error('Recalculate supplier balance error:', e);
    return false;
  }
}

/**
 * Recalculates all customer balances from scratch based on transactions
 */
export function recalculateAllCustomerBalances() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    tx.begin();

    // Get all customers
    const customersStmt = db.prepare('SELECT id FROM customers');
    const customers = [];
    while (customersStmt.step()) {
      const row = customersStmt.getAsObject();
      customers.push(row.id);
    }
    customersStmt.free();

    // Recalculate each customer's balance
    for (const customerId of customers) {
      recalculateCustomerBalance(customerId);
    }

    tx.commit();
    saveDatabase();

    return {
      success: true,
      message: `Successfully recalculated balances for ${customers.length} customers`
    };
  } catch (e) {
    tx.rollback();
    console.error('Recalculate all customer balances error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Recalculates a single customer's transaction history and balances
 */
export function recalculateCustomerBalance(customerId) {
  if (!db) return false;

  try {
    // Delete existing transactions and rebuild from scratch
    const deleteStmt = db.prepare('DELETE FROM customer_transactions WHERE customer_id = ?');
    deleteStmt.run([customerId]);
    deleteStmt.free();

    let runningBalance = 0;

    // Add all sales
    const salesStmt = db.prepare(`
      SELECT id, invoice_number, total_amount, sale_date
      FROM sales
      WHERE customer_id = ?
      ORDER BY sale_date, id
    `);
    salesStmt.bind([customerId]);

    while (salesStmt.step()) {
      const sale = salesStmt.getAsObject();
      runningBalance = round2(runningBalance + safe(sale.total_amount));

      const insertStmt = db.prepare(`
        INSERT INTO customer_transactions
        (customer_id, transaction_type, amount, reference_type, reference_id,
         balance_after, transaction_date, notes)
        VALUES (?, 'sale', ?, 'sale', ?, ?, ?, ?)
      `);
      insertStmt.run([
        customerId,
        safe(sale.total_amount),
        sale.id,
        runningBalance,
        sale.sale_date,
        `فاتورة ${sale.invoice_number}`
      ]);
      insertStmt.free();
    }
    salesStmt.free();

    // Add all payments
    const paymentsStmt = db.prepare(`
      SELECT id, amount, payment_date, notes
      FROM payments
      WHERE customer_id = ?
      ORDER BY payment_date, id
    `);
    paymentsStmt.bind([customerId]);

    while (paymentsStmt.step()) {
      const payment = paymentsStmt.getAsObject();
      runningBalance = round2(runningBalance - safe(payment.amount));

      const insertStmt = db.prepare(`
        INSERT INTO customer_transactions
        (customer_id, transaction_type, amount, reference_type, reference_id,
         balance_after, transaction_date, notes)
        VALUES (?, 'payment', ?, 'payment', ?, ?, ?, ?)
      `);
      insertStmt.run([
        customerId,
        -safe(payment.amount),
        payment.id,
        runningBalance,
        payment.payment_date,
        payment.notes || 'دفعة من العميل'
      ]);
      insertStmt.free();
    }
    paymentsStmt.free();

    return true;
  } catch (e) {
    console.error('Recalculate customer balance error:', e);
    return false;
  }
}

/**
 * Performs a complete accounting reconciliation
 * This should be run to fix any accounting inconsistencies
 */
export function performCompleteReconciliation() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    const supplierResult = recalculateAllSupplierBalances();
    if (!supplierResult.success) {
      return supplierResult;
    }

    const customerResult = recalculateAllCustomerBalances();
    if (!customerResult.success) {
      return customerResult;
    }

    return {
      success: true,
      message: 'Complete accounting reconciliation successful',
      details: {
        suppliers: supplierResult.message,
        customers: customerResult.message
      }
    };
  } catch (e) {
    console.error('Complete reconciliation error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Gets accounting summary for dashboard
 */
export function getAccountingSummary() {
  if (!db) return {
    suppliers: { total: 0, totalOwed: 0, totalPaid: 0 },
    customers: { total: 0, totalOwed: 0, totalReceived: 0 },
    inventory: { totalValue: 0, totalCost: 0 },
    expenses: { total: 0 }
  };

  try {
    // Supplier summary
    const supplierStmt = db.prepare(`
      SELECT
        COUNT(DISTINCT supplier_id) as count,
        COALESCE(SUM(CASE WHEN balance_after > 0 THEN balance_after ELSE 0 END), 0) as total_owed
      FROM (
        SELECT supplier_id, balance_after,
               ROW_NUMBER() OVER (PARTITION BY supplier_id ORDER BY id DESC) as rn
        FROM supplier_transactions
      ) WHERE rn = 1
    `);

    let supplierSummary = { total: 0, totalOwed: 0, totalPaid: 0 };
    if (supplierStmt.step()) {
      const row = supplierStmt.getAsObject();
      supplierSummary.total = row.count || 0;
      supplierSummary.totalOwed = row.total_owed || 0;
    }
    supplierStmt.free();

    // Customer summary
    const customerStmt = db.prepare(`
      SELECT
        COUNT(DISTINCT customer_id) as count,
        COALESCE(SUM(CASE WHEN balance_after > 0 THEN balance_after ELSE 0 END), 0) as total_owed
      FROM (
        SELECT customer_id, balance_after,
               ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY id DESC) as rn
        FROM customer_transactions
      ) WHERE rn = 1
    `);

    let customerSummary = { total: 0, totalOwed: 0, totalReceived: 0 };
    if (customerStmt.step()) {
      const row = customerStmt.getAsObject();
      customerSummary.total = row.count || 0;
      customerSummary.totalOwed = row.total_owed || 0;
    }
    customerStmt.free();

    // Inventory summary
    const inventoryStmt = db.prepare(`
      SELECT
        COALESCE(SUM(quantity_remaining * price_per_kg), 0) as total_value,
        COALESCE(SUM(
          CASE
            WHEN quantity_original > 0
            THEN (total_cost * quantity_remaining / quantity_original)
            ELSE 0
          END
        ), 0) as total_cost
      FROM batches
      WHERE quantity_remaining > 0
    `);

    let inventorySummary = { totalValue: 0, totalCost: 0 };
    if (inventoryStmt.step()) {
      const row = inventoryStmt.getAsObject();
      inventorySummary.totalValue = row.total_value || 0;
      inventorySummary.totalCost = row.total_cost || 0;
    }
    inventoryStmt.free();

    // Expenses summary
    const expenseStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
    `);

    let expenseTotal = 0;
    if (expenseStmt.step()) {
      const row = expenseStmt.getAsObject();
      expenseTotal = row.total || 0;
    }
    expenseStmt.free();

    return {
      suppliers: supplierSummary,
      customers: customerSummary,
      inventory: inventorySummary,
      expenses: { total: expenseTotal }
    };
  } catch (e) {
    console.error('Get accounting summary error:', e);
    return {
      suppliers: { total: 0, totalOwed: 0, totalPaid: 0 },
      customers: { total: 0, totalOwed: 0, totalReceived: 0 },
      inventory: { totalValue: 0, totalCost: 0 },
      expenses: { total: 0 }
    };
  }
}