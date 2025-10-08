// src/utils/constants/transactionTypes.js

/**
 * Transaction Types
 * Centralized constants for transaction categorization
 */

export const TRANSACTION_TYPES = {
  // Customer transactions
  SALE: 'sale',
  PAYMENT: 'payment',
  CREDIT_NOTE: 'credit_note',
  ADJUSTMENT: 'adjustment',

  // Supplier transactions
  PURCHASE: 'purchase',
  SUPPLIER_PAYMENT: 'payment',
  DEBIT_NOTE: 'debit_note',

  // General
  REFUND: 'refund',
};

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.SALE]: 'مبيعات',
  [TRANSACTION_TYPES.PAYMENT]: 'دفعة',
  [TRANSACTION_TYPES.CREDIT_NOTE]: 'إشعار دائن',
  [TRANSACTION_TYPES.ADJUSTMENT]: 'تعديل',
  [TRANSACTION_TYPES.PURCHASE]: 'مشتريات',
  [TRANSACTION_TYPES.SUPPLIER_PAYMENT]: 'دفعة للمورد',
  [TRANSACTION_TYPES.DEBIT_NOTE]: 'إشعار مدين',
  [TRANSACTION_TYPES.REFUND]: 'استرجاع',
};

export const PAYMENT_STATUSES = {
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
  OVERDUE: 'overdue',
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.PAID]: 'مدفوع',
  [PAYMENT_STATUSES.PARTIAL]: 'دفع جزئي',
  [PAYMENT_STATUSES.UNPAID]: 'غير مدفوع',
  [PAYMENT_STATUSES.OVERDUE]: 'متأخر',
};

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUSES.PAID]: 'success',
  [PAYMENT_STATUSES.PARTIAL]: 'warning',
  [PAYMENT_STATUSES.UNPAID]: 'default',
  [PAYMENT_STATUSES.OVERDUE]: 'error',
};
