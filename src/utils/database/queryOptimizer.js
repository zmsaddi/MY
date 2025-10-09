// src/utils/database/queryOptimizer.js
// Query Optimization and N+1 Problem Prevention

import { db } from './core.js';

/**
 * Query Cache Manager
 */
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 60000; // 1 minute default TTL
    this.maxSize = 100;
  }

  /**
   * Generate cache key from query and params
   */
  generateKey(query, params = []) {
    return `${query}_${JSON.stringify(params)}`;
  }

  /**
   * Get cached result
   */
  get(query, params) {
    const key = this.generateKey(query, params);
    const cached = this.cache.get(key);

    if (cached) {
      if (Date.now() - cached.timestamp < this.ttl) {
        cached.hits++;
        return cached.data;
      }
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Store query result in cache
   */
  set(query, params, data) {
    const key = this.generateKey(query, params);

    // Enforce max cache size
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      size: this.cache.size,
      entries: []
    };

    for (const [key, value] of this.cache) {
      stats.entries.push({
        key: key.substring(0, 50),
        age: Date.now() - value.timestamp,
        hits: value.hits
      });
    }

    return stats;
  }
}

/**
 * Batch Query Executor
 */
class BatchQueryExecutor {
  constructor() {
    this.batches = new Map();
    this.flushInterval = 10; // Flush after 10ms
    this.maxBatchSize = 50;
  }

  /**
   * Add query to batch
   */
  addToBatch(type, query, params, resolver) {
    if (!this.batches.has(type)) {
      this.batches.set(type, []);
      setTimeout(() => this.flush(type), this.flushInterval);
    }

    const batch = this.batches.get(type);
    batch.push({ query, params, resolver });

    if (batch.length >= this.maxBatchSize) {
      this.flush(type);
    }
  }

  /**
   * Execute batched queries
   */
  flush(type) {
    const batch = this.batches.get(type);
    if (!batch || batch.length === 0) return;

    this.batches.delete(type);

    try {
      // Execute all queries in a single transaction
      db.run('BEGIN');

      const results = batch.map(({ query, params }) => {
        const stmt = db.prepare(query);
        if (params) stmt.bind(params);

        const result = [];
        while (stmt.step()) {
          result.push(stmt.getAsObject());
        }
        stmt.free();

        return result;
      });

      db.run('COMMIT');

      // Resolve all promises
      batch.forEach(({ resolver }, index) => {
        resolver(results[index]);
      });
    } catch (error) {
      db.run('ROLLBACK');
      batch.forEach(({ resolver }) => {
        resolver(Promise.reject(error));
      });
    }
  }
}

// Create singleton instances
const queryCache = new QueryCache();
const batchExecutor = new BatchQueryExecutor();

/**
 * Optimized query functions
 */

/**
 * Get sales with customer data (avoid N+1)
 */
export function getSalesWithCustomers(filters = {}) {
  const cacheKey = 'sales_with_customers';
  const cached = queryCache.get(cacheKey, filters);
  if (cached) return cached;

  let query = `
    SELECT
      s.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.address as customer_address,
      c.tax_number as customer_tax_number
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.startDate) {
    query += ' AND s.sale_date >= ?';
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ' AND s.sale_date <= ?';
    params.push(filters.endDate);
  }

  if (filters.customerId) {
    query += ' AND s.customer_id = ?';
    params.push(filters.customerId);
  }

  query += ' ORDER BY s.sale_date DESC, s.id DESC';

  try {
    const stmt = db.prepare(query);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    queryCache.set(cacheKey, filters, results);
    return results;
  } catch (error) {
    console.error('getSalesWithCustomers error:', error);
    return [];
  }
}

/**
 * Get sale items with inventory data (avoid N+1)
 */
export function getSaleItemsWithInventory(saleId) {
  const query = `
    SELECT
      si.*,
      i.type as sheet_type,
      i.thickness,
      i.width,
      i.length,
      i.weight_per_sheet,
      i.location
    FROM sale_items si
    LEFT JOIN inventory i ON si.sheet_id = i.id
    WHERE si.sale_id = ?
    ORDER BY si.id
  `;

  try {
    const stmt = db.prepare(query);
    stmt.bind([saleId]);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('getSaleItemsWithInventory error:', error);
    return [];
  }
}

/**
 * Get inventory with supplier data (avoid N+1)
 */
export function getInventoryWithSuppliers(filters = {}) {
  const cacheKey = 'inventory_with_suppliers';
  const cached = queryCache.get(cacheKey, filters);
  if (cached) return cached;

  let query = `
    SELECT
      i.*,
      s.name as supplier_name,
      s.phone as supplier_phone,
      (i.quantity * i.price_per_sheet) as total_value,
      (i.quantity * COALESCE(i.weight_per_sheet, 0)) as total_weight
    FROM inventory i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.type) {
    query += ' AND i.type = ?';
    params.push(filters.type);
  }

  if (filters.supplierId) {
    query += ' AND i.supplier_id = ?';
    params.push(filters.supplierId);
  }

  if (filters.minQuantity !== undefined) {
    query += ' AND i.quantity >= ?';
    params.push(filters.minQuantity);
  }

  query += ' ORDER BY i.type, i.thickness';

  try {
    const stmt = db.prepare(query);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    queryCache.set(cacheKey, filters, results);
    return results;
  } catch (error) {
    console.error('getInventoryWithSuppliers error:', error);
    return [];
  }
}

/**
 * Get customer with balance and transaction count
 */
export function getCustomersWithStats() {
  const query = `
    SELECT
      c.*,
      COALESCE(SUM(CASE
        WHEN t.transaction_type IN ('sale', 'sale_return')
        THEN t.amount
        ELSE 0
      END), 0) as total_sales,
      COALESCE(SUM(CASE
        WHEN t.transaction_type = 'payment_received'
        THEN t.amount
        ELSE 0
      END), 0) as total_payments,
      COALESCE(SUM(CASE
        WHEN t.transaction_type IN ('sale', 'sale_return')
        THEN t.amount
        WHEN t.transaction_type = 'payment_received'
        THEN -t.amount
        ELSE 0
      END), 0) as balance,
      COUNT(DISTINCT CASE
        WHEN t.transaction_type IN ('sale', 'sale_return')
        THEN t.reference_id
      END) as sale_count
    FROM customers c
    LEFT JOIN accounting_transactions t ON c.id = t.party_id
      AND t.party_type = 'customer'
    GROUP BY c.id
    ORDER BY c.name
  `;

  try {
    const result = db.exec(query);
    if (!result.length) return [];

    const [columns, ...rows] = [result[0].columns, ...result[0].values];
    return rows.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  } catch (error) {
    console.error('getCustomersWithStats error:', error);
    return [];
  }
}

/**
 * Get suppliers with balance and transaction count
 */
export function getSuppliersWithStats() {
  const query = `
    SELECT
      s.*,
      COALESCE(SUM(CASE
        WHEN t.transaction_type = 'purchase'
        THEN t.amount
        ELSE 0
      END), 0) as total_purchases,
      COALESCE(SUM(CASE
        WHEN t.transaction_type = 'payment_made'
        THEN t.amount
        ELSE 0
      END), 0) as total_payments,
      COALESCE(SUM(CASE
        WHEN t.transaction_type = 'purchase'
        THEN t.amount
        WHEN t.transaction_type = 'payment_made'
        THEN -t.amount
        ELSE 0
      END), 0) as balance,
      COUNT(DISTINCT CASE
        WHEN t.transaction_type = 'purchase'
        THEN t.reference_id
      END) as purchase_count
    FROM suppliers s
    LEFT JOIN accounting_transactions t ON s.id = t.party_id
      AND t.party_type = 'supplier'
    GROUP BY s.id
    ORDER BY s.name
  `;

  try {
    const result = db.exec(query);
    if (!result.length) return [];

    const [columns, ...rows] = [result[0].columns, ...result[0].values];
    return rows.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  } catch (error) {
    console.error('getSuppliersWithStats error:', error);
    return [];
  }
}

/**
 * Bulk load related data
 */
export async function bulkLoadRelations(entityType, ids, relations) {
  const results = new Map();

  // Initialize results
  ids.forEach(id => {
    results.set(id, {});
  });

  // Load each relation
  for (const relation of relations) {
    const { name, query, key } = relation;

    // Build IN clause
    const placeholders = ids.map(() => '?').join(',');
    const fullQuery = query.replace('{{IDS}}', placeholders);

    try {
      const stmt = db.prepare(fullQuery);
      stmt.bind(ids);

      const relationData = new Map();
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const entityId = row[key];

        if (!relationData.has(entityId)) {
          relationData.set(entityId, []);
        }
        relationData.get(entityId).push(row);
      }
      stmt.free();

      // Add to results
      ids.forEach(id => {
        const entityResult = results.get(id);
        entityResult[name] = relationData.get(id) || [];
      });
    } catch (error) {
      console.error(`Error loading relation ${name}:`, error);
    }
  }

  return results;
}

/**
 * Preload associations to avoid N+1
 */
export function preloadAssociations(entities, association) {
  const { foreignKey, targetTable, targetKey, as } = association;

  // Collect all foreign key values
  const foreignKeys = [...new Set(entities.map(e => e[foreignKey]).filter(Boolean))];

  if (foreignKeys.length === 0) {
    return entities;
  }

  // Load all associated records in one query
  const placeholders = foreignKeys.map(() => '?').join(',');
  const query = `SELECT * FROM ${targetTable} WHERE ${targetKey} IN (${placeholders})`;

  try {
    const stmt = db.prepare(query);
    stmt.bind(foreignKeys);

    const associationMap = new Map();
    while (stmt.step()) {
      const row = stmt.getAsObject();
      associationMap.set(row[targetKey], row);
    }
    stmt.free();

    // Attach associations to entities
    return entities.map(entity => ({
      ...entity,
      [as]: associationMap.get(entity[foreignKey]) || null
    }));
  } catch (error) {
    console.error('preloadAssociations error:', error);
    return entities;
  }
}

/**
 * Query batcher for multiple similar queries
 */
export function createQueryBatcher(baseQuery, paramKey) {
  const pending = new Map();
  let timeoutId = null;

  const executeBatch = () => {
    if (pending.size === 0) return;

    const params = Array.from(pending.keys());
    const placeholders = params.map(() => '?').join(',');
    const query = baseQuery.replace('{{PARAMS}}', placeholders);

    try {
      const stmt = db.prepare(query);
      stmt.bind(params);

      const results = new Map();
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const key = row[paramKey];

        if (!results.has(key)) {
          results.set(key, []);
        }
        results.get(key).push(row);
      }
      stmt.free();

      // Resolve all pending promises
      pending.forEach((resolver, param) => {
        resolver(results.get(param) || []);
      });
    } catch (error) {
      // Reject all pending promises
      pending.forEach(resolver => resolver(Promise.reject(error)));
    }

    pending.clear();
    timeoutId = null;
  };

  return (param) => {
    return new Promise((resolve) => {
      pending.set(param, resolve);

      if (!timeoutId) {
        timeoutId = setTimeout(executeBatch, 10);
      }
    });
  };
}

/**
 * Clear all caches
 */
export function clearQueryCache() {
  queryCache.clear();
}

/**
 * Get query statistics
 */
export function getQueryStats() {
  return {
    cache: queryCache.getStats()
  };
}

// Export utilities
export default {
  getSalesWithCustomers,
  getSaleItemsWithInventory,
  getInventoryWithSuppliers,
  getCustomersWithStats,
  getSuppliersWithStats,
  bulkLoadRelations,
  preloadAssociations,
  createQueryBatcher,
  clearQueryCache,
  getQueryStats
};