// src/utils/database/sales.js
import { db, tx, saveDatabase, safe, round2, lastId, currencyHelpers, generateInvoiceNumber, getCurrentUser } from './core.js';
import { validators, parseDbError } from '../validators.js';
import { getCompanyProfile } from './profile.js';
import { getCurrencies } from './currencies.js';
import { getBatchesBySheetId, recordInventoryMovement, pruneEmptyBatches } from './inventory.js';
import { insertCustomerTransactionInline } from './accounting.js';
import { withErrorHandler } from './errorHandler.js';

// Re-export for convenience
export { generateInvoiceNumber };

const { toBase } = currencyHelpers;

/* ============================================
   SALES RETRIEVAL
   ============================================ */

export function getAllSales() {
  if (!db) return [];
  
  try {
    const stmt = db.prepare(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.company_name,
        COALESCE(SUM(p.amount), 0) as total_paid
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN payments p ON s.id = p.sale_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    
    const sales = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const totalAmount = safe(row.total_amount);
      const totalPaid = safe(row.total_paid);
      
      sales.push({
        id: row.id,
        invoice_number: row.invoice_number,
        customer_id: row.customer_id,
        sale_date: row.sale_date,
        currency_code: row.currency_code || 'USD',
        fx_rate: row.fx_rate || 1.0,
        subtotal: row.subtotal,
        discount: row.discount,
        tax: row.tax,
        total_amount: totalAmount,
        payment_status: row.payment_status,
        notes: row.notes,
        customer_name: row.customer_name,
        company_name: row.company_name,
        total_paid: totalPaid,
        remaining: round2(totalAmount - totalPaid),
        created_at: row.created_at
      });
    }
    stmt.free();
    
    return sales;
  } catch (e) {
    console.error('Get all sales error:', e);
    return [];
  }
}

export function getSaleById(saleId) {
  if (!db) return null;
  
  try {
    const stmt = db.prepare(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.company_name,
        c.phone1,
        c.address,
        COALESCE(SUM(p.amount), 0) as total_paid
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN payments p ON s.id = p.sale_id
      WHERE s.id = ?
      GROUP BY s.id
    `);
    stmt.bind([saleId]);
    
    let sale = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const totalAmount = safe(row.total_amount);
      const totalPaid = safe(row.total_paid);
      
      sale = {
        id: row.id,
        invoice_number: row.invoice_number,
        customer_id: row.customer_id,
        sale_date: row.sale_date,
        currency_code: row.currency_code || 'USD',
        fx_rate: row.fx_rate || 1.0,
        subtotal: row.subtotal,
        discount: row.discount,
        tax: row.tax,
        total_amount: totalAmount,
        payment_status: row.payment_status,
        notes: row.notes,
        customer_name: row.customer_name,
        company_name: row.company_name,
        customer_phone: row.phone1,
        customer_address: row.address,
        total_paid: totalPaid,
        remaining: round2(totalAmount - totalPaid),
        created_at: row.created_at,
        items: []
      };
    }
    stmt.free();
    
    if (!sale) return null;
    
    // Get material items
    const matStmt = db.prepare(`
      SELECT 
        si.*,
        sh.code,
        sh.length_mm,
        sh.width_mm,
        sh.thickness_mm,
        m.name_ar as metal_name
      FROM sale_items si
      JOIN sheets sh ON si.sheet_id = sh.id
      JOIN metal_types m ON sh.metal_type_id = m.id
      WHERE si.sale_id = ? AND COALESCE(si.item_type, 'material') = 'material'
    `);
    matStmt.bind([saleId]);
    
    while (matStmt.step()) {
      const row = matStmt.getAsObject();
      sale.items.push({
        id: row.id,
        item_type: 'material',
        sheet_id: row.sheet_id,
        batch_id: row.batch_id,
        quantity_sold: row.quantity_sold,
        unit_price: row.unit_price,
        total_price: row.total_price,
        sold_dimensions: row.sold_dimensions,
        sold_weight: row.sold_weight,
        is_custom_size: row.is_custom_size,
        code: row.code,
        metal_name: row.metal_name,
        length_mm: row.length_mm,
        width_mm: row.width_mm,
        thickness_mm: row.thickness_mm,
        cogs_per_unit: row.cogs_per_unit,
        cogs_total: row.cogs_total
      });
    }
    matStmt.free();
    
    // Get service items
    const srvStmt = db.prepare(`
      SELECT 
        si.*,
        st.name_ar as service_name_ar,
        st.name_en as service_name_en
      FROM sale_items si
      LEFT JOIN service_types st ON si.service_type_id = st.id
      WHERE si.sale_id = ? AND si.item_type = 'service'
    `);
    srvStmt.bind([saleId]);
    
    while (srvStmt.step()) {
      const row = srvStmt.getAsObject();
      sale.items.push({
        id: row.id,
        item_type: 'service',
        service_type_id: row.service_type_id,
        quantity_sold: row.quantity_sold || 1,
        service_price: row.service_price,
        total_price: row.total_price,
        material_description: row.material_description,
        notes: row.notes,
        service_name_ar: row.service_name_ar,
        service_name_en: row.service_name_en,
        service_cost: row.service_cost,
        service_cost_total: row.service_cost_total
      });
    }
    srvStmt.free();
    
    return sale;
  } catch (e) {
    console.error('Get sale by id error:', e);
    return null;
  }
}

/* ============================================
   SALES PROCESSING - FIFO LOGIC
   ============================================ */

function processSaleItemFIFO(saleId, item, saleCurrency, baseCurrency, exchangeRates) {
  let remaining = safe(item.quantity, 0);
  if (remaining <= 0) throw new Error('كمية غير صحيحة');
  
  const sheetStmt = db.prepare('SELECT weight_per_sheet_kg FROM sheets WHERE id = ?');
  sheetStmt.bind([item.sheet_id]);
  
  let weightPerSheet = 0;
  if (sheetStmt.step()) {
    const row = sheetStmt.getAsObject();
    weightPerSheet = safe(row.weight_per_sheet_kg, 0);
  }
  sheetStmt.free();
  
  const hasCustomWeight = item.is_custom_size && safe(item.sold_weight, 0) > 0;
  const weightPerUnitCustom = hasCustomWeight ? (safe(item.sold_weight) / safe(item.quantity)) : null;
  
  const unitPriceBase = round2(toBase(safe(item.unit_price), saleCurrency, baseCurrency, exchangeRates));
  
  const batches = getBatchesBySheetId(item.sheet_id);
  
  for (const batch of batches) {
    if (remaining <= 0) break;
    
    const qty = Math.min(remaining, safe(batch.quantity_remaining, 0));
    if (qty <= 0) continue;
    
    const rowWeight = round2((hasCustomWeight ? weightPerUnitCustom : weightPerSheet) * qty);
    const cogsPerUnit = round2(safe(batch.price_per_kg, 0) * (hasCustomWeight ? weightPerUnitCustom : weightPerSheet));
    const cogsTotal = round2(safe(batch.price_per_kg, 0) * rowWeight);
    
    const itemStmt = db.prepare(`
      INSERT INTO sale_items
      (sale_id, item_type, sheet_id, batch_id, quantity_sold, unit_price, total_price,
       sold_dimensions, sold_weight, is_custom_size, cogs_per_unit, cogs_total)
      VALUES (?, 'material', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    itemStmt.run([
      saleId,
      item.sheet_id,
      batch.id,
      qty,
      unitPriceBase,
      round2(qty * unitPriceBase),
      item.sold_dimensions || null,
      rowWeight,
      item.is_custom_size ? 1 : 0,
      cogsPerUnit,
      cogsTotal
    ]);
    itemStmt.free();
    
    const updateStmt = db.prepare('UPDATE batches SET quantity_remaining = quantity_remaining - ? WHERE id = ?');
    updateStmt.run([qty, batch.id]);
    updateStmt.free();
    
    recordInventoryMovement('OUT', item.sheet_id, batch.id, qty, 'sale', saleId, `بيع - فاتورة ${saleId}`);
    
    remaining -= qty;
  }
  
  if (remaining > 0) {
    throw new Error(`الكمية المطلوبة (${item.quantity}) تتجاوز المخزون المتاح`);
  }
}

function processSaleItemService(saleId, item, saleCurrency, baseCurrency, exchangeRates) {
  const qty = safe(item.quantity, 1);
  const servicePriceBase = round2(toBase(safe(item.service_price), saleCurrency, baseCurrency, exchangeRates));
  const totalPriceBase = round2(servicePriceBase * qty);
  
  let unitCostBase;
  if (Number.isFinite(Number(item.service_cost))) {
    unitCostBase = round2(toBase(safe(item.service_cost), saleCurrency, baseCurrency, exchangeRates));
  } else if (item.service_type_id) {
    const costStmt = db.prepare('SELECT COALESCE(default_cost, 0) as cost FROM service_types WHERE id = ?');
    costStmt.bind([item.service_type_id]);
    
    if (costStmt.step()) {
      const row = costStmt.getAsObject();
      unitCostBase = safe(row.cost, 0);
    } else {
      unitCostBase = 0;
    }
    costStmt.free();
  } else {
    unitCostBase = 0;
  }
  
  const totalCostBase = round2(unitCostBase * qty);
  
  const stmt = db.prepare(`
    INSERT INTO sale_items
    (sale_id, item_type, service_type_id, quantity_sold, service_price, total_price,
     material_description, notes, service_cost, service_cost_total)
    VALUES (?, 'service', ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    saleId,
    item.service_type_id || null,
    qty,
    servicePriceBase,
    totalPriceBase,
    item.material_description ? item.material_description.trim() : null,
    item.notes ? item.notes.trim() : null,
    unitCostBase,
    totalCostBase
  ]);
  stmt.free();
}

/* ============================================
   PROCESS SALE - MAIN FUNCTION
   ============================================ */

export function processSale(saleData) {
  try {
    tx.begin();
    
    const validationError = validators.validateSale(saleData);
    if (validationError) {
      tx.rollback();
      return { success: false, error: validationError };
    }
    
    const profile = getCompanyProfile();
    const vatEnabled = !!(profile?.vat_enabled);
    const vatRate = safe(profile?.vat_rate, 0);
    const baseCurrency = profile?.base_currency || 'USD';
    const saleCurrency = saleData.currency_code || baseCurrency;
    
    const exchangeRates = {};
    const currencies = getCurrencies(true);
    currencies.forEach(c => {
      exchangeRates[c.code] = safe(c.exchange_rate, 1);
    });
    
    let subtotalSaleCur = 0;
    for (const item of saleData.items) {
      if (item.item_type === 'service') {
        subtotalSaleCur += safe(item.service_price) * safe(item.quantity, 1);
      } else {
        subtotalSaleCur += safe(item.unit_price) * safe(item.quantity, 1);
      }
    }
    subtotalSaleCur = round2(subtotalSaleCur);
    
    const discountSaleCur = safe(saleData.discount, 0);
    const taxSaleCur = vatEnabled ? round2((subtotalSaleCur - discountSaleCur) * (vatRate / 100)) : 0;
    const totalSaleCur = round2(subtotalSaleCur - discountSaleCur + taxSaleCur);
    
    const subtotalBase = round2(toBase(subtotalSaleCur, saleCurrency, baseCurrency, exchangeRates));
    const discountBase = round2(toBase(discountSaleCur, saleCurrency, baseCurrency, exchangeRates));
    const taxBase = round2(toBase(taxSaleCur, saleCurrency, baseCurrency, exchangeRates));
    const totalBase = round2(toBase(totalSaleCur, saleCurrency, baseCurrency, exchangeRates));
    
    const amountPaidInput = safe(saleData.amount_paid, 0);
    const amountPaidBase = round2(toBase(amountPaidInput, saleCurrency, baseCurrency, exchangeRates));
    
    let paymentStatus = 'unpaid';
    if (amountPaidBase >= totalBase) paymentStatus = 'paid';
    else if (amountPaidBase > 0) paymentStatus = 'partial';
    
    const saleStmt = db.prepare(`
      INSERT INTO sales
      (invoice_number, customer_id, sale_date, currency_code, fx_rate,
       subtotal, discount, tax, total_amount, payment_status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    saleStmt.run([
      saleData.invoice_number,
      saleData.customer_id || null,
      saleData.sale_date,
      saleCurrency,
      exchangeRates[saleCurrency] || 1.0,
      subtotalBase,
      discountBase,
      taxBase,
      totalBase,
      paymentStatus,
      saleData.notes ? saleData.notes.trim() : null,
      getCurrentUser()
    ]);
    saleStmt.free();
    
    const saleId = lastId();
    
    for (const item of saleData.items) {
      if (item.item_type === 'service') {
        processSaleItemService(saleId, item, saleCurrency, baseCurrency, exchangeRates);
      } else {
        processSaleItemFIFO(saleId, item, saleCurrency, baseCurrency, exchangeRates);
      }
    }
    
    if (amountPaidBase > 0) {
      const payStmt = db.prepare(`
        INSERT INTO payments 
        (sale_id, customer_id, amount, payment_method, payment_date, notes) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      payStmt.run([
        saleId,
        saleData.customer_id || null,
        amountPaidBase,
        saleData.payment_method || profile?.default_payment_method || 'Cash',
        saleData.sale_date,
        null
      ]);
      payStmt.free();
    }
    
    if (saleData.customer_id) {
      insertCustomerTransactionInline({
        customer_id: saleData.customer_id,
        transaction_type: 'sale',
        amount: totalBase,
        reference_type: 'sale',
        reference_id: saleId,
        transaction_date: saleData.sale_date,
        notes: `فاتورة ${saleData.invoice_number}`
      });
      
      if (amountPaidBase > 0) {
        insertCustomerTransactionInline({
          customer_id: saleData.customer_id,
          transaction_type: 'payment',
          amount: -amountPaidBase,
          reference_type: 'payment',
          reference_id: saleId,
          transaction_date: saleData.sale_date,
          notes: `دفعة فورية - فاتورة ${saleData.invoice_number}`
        });
      }
    }
    
    tx.commit();
    saveDatabase();
    
    return { success: true, saleId, invoice_number: saleData.invoice_number };
    
  } catch (e) {
    tx.rollback();
    console.error('Process sale error:', e);

    // Show global error notification
    withErrorHandler(
      () => { throw e; },
      'حفظ عملية البيع',
      { details: { saleData, items } }
    );

    return { success: false, error: parseDbError(e) };
  }
}

/* ============================================
   DELETE SALE - WITH INVENTORY RESTORATION
   ============================================ */

export function deleteSale(saleId) {
  try {
    tx.begin();
    
    const itemsStmt = db.prepare(`
      SELECT sheet_id, batch_id, quantity_sold 
      FROM sale_items 
      WHERE sale_id = ? AND COALESCE(item_type, 'material') = 'material'
    `);
    itemsStmt.bind([saleId]);
    
    while (itemsStmt.step()) {
      const row = itemsStmt.getAsObject();
      
      const updateStmt = db.prepare('UPDATE batches SET quantity_remaining = quantity_remaining + ? WHERE id = ?');
      updateStmt.run([row.quantity_sold, row.batch_id]);
      updateStmt.free();
    }
    itemsStmt.free();
    
    // Delete customer transactions related to this sale
    const deleteSaleTrans = db.prepare('DELETE FROM customer_transactions WHERE reference_type = ? AND reference_id = ?');
    deleteSaleTrans.run(['sale', saleId]);
    deleteSaleTrans.free();
    
    // Delete customer transactions related to payments for this sale
    const deletePaymentTrans = db.prepare(`
      DELETE FROM customer_transactions 
      WHERE reference_type = 'payment' 
      AND reference_id IN (SELECT id FROM payments WHERE sale_id = ?)
    `);
    deletePaymentTrans.run([saleId]);
    deletePaymentTrans.free();
    
    const deletePayments = db.prepare('DELETE FROM payments WHERE sale_id = ?');
    deletePayments.run([saleId]);
    deletePayments.free();
    
    const deleteItems = db.prepare('DELETE FROM sale_items WHERE sale_id = ?');
    deleteItems.run([saleId]);
    deleteItems.free();
    
    const deleteMovements = db.prepare('DELETE FROM inventory_movements WHERE reference_type = ? AND reference_id = ?');
    deleteMovements.run(['sale', saleId]);
    deleteMovements.free();
    
    const deleteSale = db.prepare('DELETE FROM sales WHERE id = ?');
    deleteSale.run([saleId]);
    deleteSale.free();
    
    tx.commit();
    
    // Prune empty batches synchronously
    pruneEmptyBatches();
    
    saveDatabase();
    
    return { success: true };
    
  } catch (e) {
    tx.rollback();
    console.error('Delete sale error:', e);
    return { success: false, error: parseDbError(e) };
  }
}
