// src/utils/database/purchaseReports.js
import { db } from './core.js';

export function getPurchasesBySupplier(supplierId = null, startDate = null, endDate = null) {
  if (!db) return [];
  
  try {
    let sql = `
      SELECT 
        b.id,
        b.received_date,
        b.quantity_original,
        b.quantity_remaining,
        b.price_per_kg,
        b.total_cost,
        b.storage_location,
        b.notes,
        s.name as supplier_name,
        sh.code as sheet_code,
        mt.name_ar as metal_name,
        sh.length_mm,
        sh.width_mm,
        sh.thickness_mm
      FROM batches b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      LEFT JOIN sheets sh ON b.sheet_id = sh.id
      LEFT JOIN metal_types mt ON sh.metal_type_id = mt.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (supplierId) {
      sql += ' AND b.supplier_id = ?';
      params.push(supplierId);
    }
    
    if (startDate) {
      sql += ' AND b.received_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND b.received_date <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY b.received_date DESC, b.id DESC';
    
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const purchases = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      purchases.push({
        id: row.id,
        received_date: row.received_date,
        supplier_name: row.supplier_name || 'بدون مورد',
        sheet_code: row.sheet_code,
        metal_name: row.metal_name,
        dimensions: `${row.length_mm}×${row.width_mm}×${row.thickness_mm}`,
        quantity_original: row.quantity_original,
        quantity_remaining: row.quantity_remaining,
        quantity_sold: row.quantity_original - row.quantity_remaining,
        price_per_kg: row.price_per_kg,
        total_cost: row.total_cost,
        storage_location: row.storage_location,
        notes: row.notes
      });
    }
    stmt.free();
    
    return purchases;
  } catch (e) {
    console.error('Get purchases by supplier error:', e);
    return [];
  }
}

export function getPurchasesSummary(startDate = null, endDate = null) {
  if (!db) return {
    total_purchases: 0,
    total_cost: 0,
    total_quantity: 0,
    by_supplier: [],
    by_material: []
  };
  
  try {
    let sql = 'SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0) as total, COALESCE(SUM(quantity_original), 0) as qty FROM batches WHERE 1=1';
    const params = [];
    
    if (startDate) {
      sql += ' AND received_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND received_date <= ?';
      params.push(endDate);
    }
    
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    let summary = { total_purchases: 0, total_cost: 0, total_quantity: 0 };
    if (stmt.step()) {
      const row = stmt.getAsObject();
      summary = {
        total_purchases: row.count || 0,
        total_cost: row.total || 0,
        total_quantity: row.qty || 0
      };
    }
    stmt.free();
    
    // By supplier
    let supplierSql = `
      SELECT 
        COALESCE(s.name, 'بدون مورد') as supplier_name,
        COUNT(b.id) as purchase_count,
        COALESCE(SUM(b.total_cost), 0) as total_cost,
        COALESCE(SUM(b.quantity_original), 0) as total_quantity
      FROM batches b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE 1=1
    `;
    
    if (startDate) supplierSql += ' AND b.received_date >= ?';
    if (endDate) supplierSql += ' AND b.received_date <= ?';
    supplierSql += ' GROUP BY b.supplier_id ORDER BY total_cost DESC';
    
    const suppStmt = db.prepare(supplierSql);
    if (params.length > 0) {
      suppStmt.bind(params);
    }
    
    const by_supplier = [];
    while (suppStmt.step()) {
      const row = suppStmt.getAsObject();
      by_supplier.push({
        supplier_name: row.supplier_name,
        purchase_count: row.purchase_count,
        total_cost: row.total_cost,
        total_quantity: row.total_quantity
      });
    }
    suppStmt.free();
    
    // By material
    let materialSql = `
      SELECT 
        mt.name_ar as metal_name,
        COUNT(b.id) as purchase_count,
        COALESCE(SUM(b.total_cost), 0) as total_cost,
        COALESCE(SUM(b.quantity_original), 0) as total_quantity
      FROM batches b
      LEFT JOIN sheets sh ON b.sheet_id = sh.id
      LEFT JOIN metal_types mt ON sh.metal_type_id = mt.id
      WHERE 1=1
    `;
    
    if (startDate) materialSql += ' AND b.received_date >= ?';
    if (endDate) materialSql += ' AND b.received_date <= ?';
    materialSql += ' GROUP BY sh.metal_type_id ORDER BY total_cost DESC';
    
    const matStmt = db.prepare(materialSql);
    if (params.length > 0) {
      matStmt.bind(params);
    }
    
    const by_material = [];
    while (matStmt.step()) {
      const row = matStmt.getAsObject();
      by_material.push({
        metal_name: row.metal_name,
        purchase_count: row.purchase_count,
        total_cost: row.total_cost,
        total_quantity: row.total_quantity
      });
    }
    matStmt.free();
    
    return {
      ...summary,
      by_supplier,
      by_material
    };
  } catch (e) {
    console.error('Get purchases summary error:', e);
    return {
      total_purchases: 0,
      total_cost: 0,
      total_quantity: 0,
      by_supplier: [],
      by_material: []
    };
  }
}