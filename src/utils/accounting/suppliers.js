// src/utils/accounting/suppliers.js
// نظام محاسبة الموردين

import { getDb } from '../database/core';

/**
 * الحصول على رصيد المورد
 */
export function getSupplierBalance(supplierId) {
  const db = getDb();

  // إجمالي المشتريات من المورد
  const purchases = db.prepare(`
    SELECT
      COALESCE(SUM(b.total_cost), 0) as total_purchases
    FROM batches b
    WHERE b.supplier_id = ?
  `).get(supplierId);

  // إجمالي المدفوعات للمورد
  const payments = db.prepare(`
    SELECT
      COALESCE(SUM(p.amount), 0) as total_payments
    FROM supplier_payments p
    WHERE p.supplier_id = ?
  `).get(supplierId);

  const totalPurchases = purchases?.total_purchases || 0;
  const totalPayments = payments?.total_payments || 0;
  const balance = totalPurchases - totalPayments;

  return {
    total_purchases: totalPurchases,
    total_payments: totalPayments,
    balance: balance, // المبلغ المستحق للمورد
    status: balance === 0 ? 'settled' : (balance > 0 ? 'payable' : 'overpaid')
  };
}

/**
 * إضافة دفعة للمورد
 */
export function addSupplierPayment(data) {
  const db = getDb();

  try {
    const result = db.prepare(`
      INSERT INTO supplier_payments (
        supplier_id, amount, payment_date, payment_method,
        reference_number, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      data.supplier_id,
      data.amount,
      data.payment_date,
      data.payment_method || null,
      data.reference_number || null,
      data.notes || null
    );

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على كشف حساب المورد
 */
export function getSupplierStatement(supplierId, startDate, endDate) {
  const db = getDb();

  // المشتريات
  const purchases = db.prepare(`
    SELECT
      'purchase' as type,
      b.id,
      b.received_date as date,
      s.code as sheet_code,
      b.quantity,
      b.total_cost as debit,
      0 as credit,
      b.notes
    FROM batches b
    JOIN sheets s ON b.sheet_id = s.id
    WHERE b.supplier_id = ?
      AND b.received_date BETWEEN ? AND ?
    ORDER BY b.received_date
  `).all(supplierId, startDate, endDate);

  // المدفوعات
  const payments = db.prepare(`
    SELECT
      'payment' as type,
      p.id,
      p.payment_date as date,
      p.reference_number,
      0 as quantity,
      0 as debit,
      p.amount as credit,
      p.notes
    FROM supplier_payments p
    WHERE p.supplier_id = ?
      AND p.payment_date BETWEEN ? AND ?
    ORDER BY p.payment_date
  `).all(supplierId, startDate, endDate);

  // دمج وترتيب
  const transactions = [...purchases, ...payments].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // حساب الرصيد التدريجي
  let runningBalance = 0;
  transactions.forEach(t => {
    runningBalance += (t.debit - t.credit);
    t.balance = runningBalance;
  });

  return {
    transactions,
    summary: {
      total_debit: transactions.reduce((sum, t) => sum + t.debit, 0),
      total_credit: transactions.reduce((sum, t) => sum + t.credit, 0),
      final_balance: runningBalance
    }
  };
}

export default {
  getSupplierBalance,
  addSupplierPayment,
  getSupplierStatement
};