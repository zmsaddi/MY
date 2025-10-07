// src/utils/database/reports.js
import { db, safe, round2 } from './core.js';

/* ============================================
   PROFIT BREAKDOWN REPORT
   ============================================ */

export function getProfitBreakdown(dateFrom = null, dateTo = null) {
  if (!db) return {
    materials: { revenue: 0, cogs: 0, gross: 0 },
    services: { revenue: 0, cost: 0, gross: 0 },
    expenses: { total: 0 },
    total: { revenue: 0, cost: 0, gross: 0, net: 0 }
  };
  
  try {
    let dateWhere = '';
    const params = [];
    
    if (dateFrom) {
      dateWhere += ' AND s.sale_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateWhere += ' AND s.sale_date <= ?';
      params.push(dateTo);
    }
    
    // Materials revenue
    const matRevStmt = db.prepare(`
      SELECT COALESCE(SUM(si.total_price), 0) as total
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE COALESCE(si.item_type, 'material') = 'material' ${dateWhere}
    `);
    if (params.length > 0) matRevStmt.bind(params);
    
    let matRevenue = 0;
    if (matRevStmt.step()) {
      const row = matRevStmt.getAsObject();
      matRevenue = safe(row.total, 0);
    }
    matRevStmt.free();
    
    // Materials COGS
    const matCogsStmt = db.prepare(`
      SELECT COALESCE(SUM(si.cogs_total), 0) as total
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE COALESCE(si.item_type, 'material') = 'material' ${dateWhere}
    `);
    if (params.length > 0) matCogsStmt.bind(params);
    
    let matCogs = 0;
    if (matCogsStmt.step()) {
      const row = matCogsStmt.getAsObject();
      matCogs = safe(row.total, 0);
    }
    matCogsStmt.free();
    
    // Services revenue
    const srvRevStmt = db.prepare(`
      SELECT COALESCE(SUM(si.total_price), 0) as total
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.item_type = 'service' ${dateWhere}
    `);
    if (params.length > 0) srvRevStmt.bind(params);
    
    let srvRevenue = 0;
    if (srvRevStmt.step()) {
      const row = srvRevStmt.getAsObject();
      srvRevenue = safe(row.total, 0);
    }
    srvRevStmt.free();
    
    // Services cost
    const srvCostStmt = db.prepare(`
      SELECT COALESCE(SUM(si.service_cost_total), 0) as total
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.item_type = 'service' ${dateWhere}
    `);
    if (params.length > 0) srvCostStmt.bind(params);
    
    let srvCost = 0;
    if (srvCostStmt.step()) {
      const row = srvCostStmt.getAsObject();
      srvCost = safe(row.total, 0);
    }
    srvCostStmt.free();
    
    // Expenses
    let expenseWhere = '';
    const expParams = [];
    if (dateFrom) {
      expenseWhere += ' WHERE expense_date >= ?';
      expParams.push(dateFrom);
    }
    if (dateTo) {
      expenseWhere += dateFrom ? ' AND' : ' WHERE';
      expenseWhere += ' expense_date <= ?';
      expParams.push(dateTo);
    }
    
    const expStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses ${expenseWhere}
    `);
    if (expParams.length > 0) expStmt.bind(expParams);
    
    let totalExpenses = 0;
    if (expStmt.step()) {
      const row = expStmt.getAsObject();
      totalExpenses = safe(row.total, 0);
    }
    expStmt.free();
    
    const materials = {
      revenue: round2(matRevenue),
      cogs: round2(matCogs),
      gross: round2(matRevenue - matCogs)
    };
    
    const services = {
      revenue: round2(srvRevenue),
      cost: round2(srvCost),
      gross: round2(srvRevenue - srvCost)
    };
    
    const totalRevenue = materials.revenue + services.revenue;
    const totalDirectCost = materials.cogs + services.cost;
    const grossProfit = totalRevenue - totalDirectCost;
    const netProfit = grossProfit - totalExpenses;
    
    return {
      materials,
      services,
      expenses: { total: round2(totalExpenses) },
      total: {
        revenue: round2(totalRevenue),
        directCost: round2(totalDirectCost),
        gross: round2(grossProfit),
        expenses: round2(totalExpenses),
        net: round2(netProfit)
      }
    };
    
  } catch (e) {
    console.error('Get profit breakdown error:', e);
    return {
      materials: { revenue: 0, cogs: 0, gross: 0 },
      services: { revenue: 0, cost: 0, gross: 0 },
      expenses: { total: 0 },
      total: { revenue: 0, cost: 0, gross: 0, net: 0 }
    };
  }
}

/* ============================================
   BEST SELLING MATERIALS
   ============================================ */

export function getBestSellingMaterials(dateFrom = null, dateTo = null, limit = 10) {
  if (!db) return [];
  
  try {
    let dateWhere = '';
    const params = [];
    
    if (dateFrom) {
      dateWhere += ' AND s.sale_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateWhere += ' AND s.sale_date <= ?';
      params.push(dateTo);
    }
    
    const sql = `
      SELECT
        sh.id as sheet_id,
        sh.code,
        sh.length_mm,
        sh.width_mm,
        sh.thickness_mm,
        m.name_ar as metal_name,
        COALESCE(SUM(si.quantity_sold), 0) as quantity,
        COALESCE(SUM(si.total_price), 0) as revenue,
        COALESCE(SUM(si.cogs_total), 0) as cogs
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN sheets sh ON sh.id = si.sheet_id
      JOIN metal_types m ON m.id = sh.metal_type_id
      WHERE COALESCE(si.item_type, 'material') = 'material' ${dateWhere}
      GROUP BY sh.id, sh.code, sh.length_mm, sh.width_mm, sh.thickness_mm, m.name_ar
      ORDER BY quantity DESC, revenue DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const materials = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      materials.push({
        sheet_id: row.sheet_id,
        code: row.code,
        metal_name: row.metal_name,
        length_mm: row.length_mm,
        width_mm: row.width_mm,
        thickness_mm: row.thickness_mm,
        quantity: row.quantity,
        revenue: round2(row.revenue),
        cogs: round2(row.cogs),
        profit: round2(row.revenue - row.cogs)
      });
    }
    stmt.free();
    
    return materials;
  } catch (e) {
    console.error('Get best selling materials error:', e);
    return [];
  }
}

/* ============================================
   BEST SELLING SERVICES
   ============================================ */

export function getBestSellingServices(dateFrom = null, dateTo = null, limit = 10) {
  if (!db) return [];
  
  try {
    let dateWhere = '';
    const params = [];
    
    if (dateFrom) {
      dateWhere += ' AND s.sale_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateWhere += ' AND s.sale_date <= ?';
      params.push(dateTo);
    }
    
    const sql = `
      SELECT
        st.id as service_type_id,
        COALESCE(st.name_ar, 'خدمة') as name_ar,
        COALESCE(SUM(si.quantity_sold), 0) as quantity,
        COALESCE(SUM(si.total_price), 0) as revenue,
        COALESCE(SUM(si.service_cost_total), 0) as cost
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN service_types st ON st.id = si.service_type_id
      WHERE si.item_type = 'service' ${dateWhere}
      GROUP BY st.id, st.name_ar
      ORDER BY quantity DESC, revenue DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const services = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      services.push({
        service_type_id: row.service_type_id,
        name_ar: row.name_ar,
        quantity: row.quantity,
        revenue: round2(row.revenue),
        cost: round2(row.cost),
        profit: round2(row.revenue - row.cost)
      });
    }
    stmt.free();
    
    return services;
  } catch (e) {
    console.error('Get best selling services error:', e);
    return [];
  }
}

/* ============================================
   EXPENSES SUMMARY BY CATEGORY
   ============================================ */

export function getExpensesSummaryByCategory(dateFrom = null, dateTo = null) {
  if (!db) return [];
  
  try {
    let dateWhere = '';
    const params = [];
    
    if (dateFrom) {
      dateWhere += ' WHERE e.expense_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateWhere += dateFrom ? ' AND' : ' WHERE';
      dateWhere += ' e.expense_date <= ?';
      params.push(dateTo);
    }
    
    const sql = `
      SELECT
        c.id as category_id,
        c.name_ar,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
      FROM expense_categories c
      LEFT JOIN expenses e ON e.category_id = c.id ${dateWhere}
      GROUP BY c.id, c.name_ar
      HAVING total > 0
      ORDER BY total DESC
    `;
    
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const summary = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      summary.push({
        category_id: row.category_id,
        name_ar: row.name_ar,
        total: round2(row.total),
        count: row.count
      });
    }
    stmt.free();
    
    return summary;
  } catch (e) {
    console.error('Get expenses summary error:', e);
    return [];
  }
}

/* ============================================
   INVENTORY VALUE
   ============================================ */

export function getInventoryValue() {
  if (!db) return { totalCost: 0, totalQuantity: 0, totalWeight: 0 };
  
  try {
    const stmt = db.prepare(`
      SELECT
        COALESCE(SUM(b.quantity_remaining * b.price_per_kg * COALESCE(s.weight_per_sheet_kg, 0)), 0) as total_cost,
        COALESCE(SUM(b.quantity_remaining), 0) as total_quantity,
        COALESCE(SUM(b.quantity_remaining * COALESCE(s.weight_per_sheet_kg, 0)), 0) as total_weight
      FROM batches b
      JOIN sheets s ON s.id = b.sheet_id
      WHERE b.quantity_remaining > 0 AND b.price_per_kg IS NOT NULL
    `);
    
    let result = { totalCost: 0, totalQuantity: 0, totalWeight: 0 };
    if (stmt.step()) {
      const row = stmt.getAsObject();
      result = {
        totalCost: round2(row.total_cost),
        totalQuantity: row.total_quantity,
        totalWeight: round2(row.total_weight)
      };
    }
    stmt.free();
    
    return result;
  } catch (e) {
    console.error('Get inventory value error:', e);
    return { totalCost: 0, totalQuantity: 0, totalWeight: 0 };
  }
}

/* ============================================
   TOP CUSTOMERS
   ============================================ */

export function getTopCustomers(dateFrom = null, dateTo = null, limit = 10) {
  if (!db) return [];
  
  try {
    let dateWhere = '';
    const params = [];
    
    if (dateFrom) {
      dateWhere += ' AND s.sale_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateWhere += ' AND s.sale_date <= ?';
      params.push(dateTo);
    }
    
    const sql = `
      SELECT
        c.id,
        c.name,
        c.company_name,
        COUNT(DISTINCT s.id) as invoice_count,
        COALESCE(SUM(s.total_amount), 0) as total_sales
      FROM customers c
      JOIN sales s ON s.customer_id = c.id
      WHERE 1=1 ${dateWhere}
      GROUP BY c.id, c.name, c.company_name
      ORDER BY total_sales DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const customers = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      customers.push({
        id: row.id,
        name: row.name,
        company_name: row.company_name,
        invoice_count: row.invoice_count,
        total_sales: round2(row.total_sales)
      });
    }
    stmt.free();
    
    return customers;
  } catch (e) {
    console.error('Get top customers error:', e);
    return [];
  }
}

/* ============================================
   SALES SUMMARY
   ============================================ */

export function getSalesSummary(dateFrom = null, dateTo = null) {
  if (!db) return {
    totalSales: 0,
    totalInvoices: 0,
    averageInvoice: 0,
    totalPaid: 0,
    totalUnpaid: 0
  };
  
  try {
    let dateWhere = '';
    const params = [];
    
    if (dateFrom) {
      dateWhere += ' WHERE sale_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateWhere += dateFrom ? ' AND' : ' WHERE';
      dateWhere += ' sale_date <= ?';
      params.push(dateTo);
    }
    
    const stmt = db.prepare(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_invoices,
        COALESCE(AVG(total_amount), 0) as average_invoice
      FROM sales ${dateWhere}
    `);
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    let summary = {
      totalSales: 0,
      totalInvoices: 0,
      averageInvoice: 0
    };
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      summary = {
        totalSales: round2(row.total_sales),
        totalInvoices: row.total_invoices,
        averageInvoice: round2(row.average_invoice)
      };
    }
    stmt.free();
    
    const payStmt = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN total_amount ELSE 0 END), 0) as total_unpaid
      FROM sales ${dateWhere}
    `);
    
    if (params.length > 0) {
      payStmt.bind(params);
    }
    
    if (payStmt.step()) {
      const row = payStmt.getAsObject();
      summary.totalPaid = round2(row.total_paid);
      summary.totalUnpaid = round2(row.total_unpaid);
    }
    payStmt.free();
    
    return summary;
  } catch (e) {
    console.error('Get sales summary error:', e);
    return {
      totalSales: 0,
      totalInvoices: 0,
      averageInvoice: 0,
      totalPaid: 0,
      totalUnpaid: 0
    };
  }
}