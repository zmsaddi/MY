// src/utils/database/optimisticLock.js
// Optimistic Locking for Race Condition Prevention

import { db } from './core.js';

/**
 * Version control for optimistic locking
 */
class VersionControl {
  constructor() {
    this.versionCache = new Map();
    this.lockTimeout = 30000; // 30 seconds default timeout
  }

  /**
   * Get current version of a record
   * @param {string} table
   * @param {number} id
   * @returns {number}
   */
  getVersion(table, id) {
    try {
      const stmt = db.prepare(`
        SELECT version FROM ${table}_versions
        WHERE record_id = ? AND table_name = ?
      `);
      stmt.bind([id, table]);

      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result.version || 0;
      }

      stmt.free();
      return 0;
    } catch (error) {
      // Version table might not exist yet
      return 0;
    }
  }

  /**
   * Increment version for a record
   * @param {string} table
   * @param {number} id
   * @returns {number} New version number
   */
  incrementVersion(table, id) {
    const currentVersion = this.getVersion(table, id);
    const newVersion = currentVersion + 1;

    try {
      // Update or insert version
      db.run(`
        INSERT INTO ${table}_versions (record_id, table_name, version, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(record_id, table_name)
        DO UPDATE SET version = ?, updated_at = datetime('now')
      `, [id, table, newVersion, newVersion]);

      return newVersion;
    } catch (error) {
      console.error('Version increment failed:', error);
      throw error;
    }
  }

  /**
   * Check if version is still valid
   * @param {string} table
   * @param {number} id
   * @param {number} expectedVersion
   * @returns {boolean}
   */
  checkVersion(table, id, expectedVersion) {
    const currentVersion = this.getVersion(table, id);
    return currentVersion === expectedVersion;
  }
}

/**
 * Optimistic Lock Manager
 */
class OptimisticLockManager {
  constructor() {
    this.versionControl = new VersionControl();
    this.activeLocks = new Map();
    this.conflictHandlers = new Map();
  }

  /**
   * Acquire optimistic lock
   * @param {string} resource - Resource identifier (table:id)
   * @param {number} expectedVersion - Expected version number
   * @returns {Object}
   */
  async acquireLock(resource, expectedVersion = null) {
    const [table, id] = resource.split(':');

    if (expectedVersion !== null) {
      const isValid = this.versionControl.checkVersion(table, id, expectedVersion);
      if (!isValid) {
        return {
          success: false,
          error: 'Version conflict detected',
          currentVersion: this.versionControl.getVersion(table, id),
          expectedVersion
        };
      }
    }

    const lockId = `${resource}_${Date.now()}`;
    this.activeLocks.set(lockId, {
      resource,
      acquiredAt: Date.now(),
      version: this.versionControl.getVersion(table, id)
    });

    return {
      success: true,
      lockId,
      version: this.versionControl.getVersion(table, id)
    };
  }

  /**
   * Release optimistic lock with version update
   * @param {string} lockId
   * @param {boolean} updateVersion - Whether to increment version
   * @returns {Object}
   */
  releaseLock(lockId, updateVersion = true) {
    const lock = this.activeLocks.get(lockId);
    if (!lock) {
      return { success: false, error: 'Lock not found' };
    }

    const [table, id] = lock.resource.split(':');
    let newVersion = lock.version;

    if (updateVersion) {
      newVersion = this.versionControl.incrementVersion(table, id);
    }

    this.activeLocks.delete(lockId);

    return {
      success: true,
      oldVersion: lock.version,
      newVersion
    };
  }

  /**
   * Register conflict handler
   * @param {string} resource
   * @param {Function} handler
   */
  registerConflictHandler(resource, handler) {
    this.conflictHandlers.set(resource, handler);
  }

  /**
   * Handle version conflict
   * @param {string} resource
   * @param {Object} conflictData
   */
  async handleConflict(resource, conflictData) {
    const handler = this.conflictHandlers.get(resource);
    if (handler) {
      return await handler(conflictData);
    }

    // Default conflict resolution strategy
    return this.defaultConflictResolution(conflictData);
  }

  /**
   * Default conflict resolution
   * @param {Object} conflictData
   */
  defaultConflictResolution(conflictData) {
    console.warn('Version conflict detected:', conflictData);

    return {
      strategy: 'retry',
      message: 'The data has been modified by another user. Please refresh and try again.',
      shouldRefresh: true
    };
  }

  /**
   * Clean up expired locks
   */
  cleanupExpiredLocks() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [lockId, lock] of this.activeLocks) {
      if (now - lock.acquiredAt > timeout) {
        this.activeLocks.delete(lockId);
      }
    }
  }
}

/**
 * Distributed Lock for critical sections
 */
class DistributedLock {
  constructor() {
    this.locks = new Map();
    this.waitQueue = new Map();
  }

  /**
   * Acquire exclusive lock
   * @param {string} resource
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise}
   */
  async acquire(resource, timeout = 5000) {
    const startTime = Date.now();

    while (this.locks.has(resource)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Lock acquisition timeout for resource: ${resource}`);
      }

      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const lockToken = `${resource}_${Date.now()}_${Math.random()}`;
    this.locks.set(resource, {
      token: lockToken,
      acquiredAt: Date.now(),
      holder: 'current_process'
    });

    return lockToken;
  }

  /**
   * Release exclusive lock
   * @param {string} resource
   * @param {string} token
   */
  release(resource, token) {
    const lock = this.locks.get(resource);

    if (!lock) {
      return { success: false, error: 'Lock not found' };
    }

    if (lock.token !== token) {
      return { success: false, error: 'Invalid lock token' };
    }

    this.locks.delete(resource);

    // Notify waiting threads
    const queue = this.waitQueue.get(resource);
    if (queue && queue.length > 0) {
      const next = queue.shift();
      next.resolve();
    }

    return { success: true };
  }

  /**
   * Try to acquire lock (non-blocking)
   * @param {string} resource
   * @returns {Object}
   */
  tryAcquire(resource) {
    if (this.locks.has(resource)) {
      return { success: false, locked: true };
    }

    const lockToken = `${resource}_${Date.now()}_${Math.random()}`;
    this.locks.set(resource, {
      token: lockToken,
      acquiredAt: Date.now(),
      holder: 'current_process'
    });

    return { success: true, token: lockToken };
  }

  /**
   * Check if resource is locked
   * @param {string} resource
   */
  isLocked(resource) {
    return this.locks.has(resource);
  }
}

/**
 * Semaphore for resource limiting
 */
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentCount = 0;
    this.waitQueue = [];
  }

  /**
   * Acquire semaphore
   */
  async acquire() {
    if (this.currentCount < this.maxConcurrency) {
      this.currentCount++;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release semaphore
   */
  release() {
    this.currentCount--;

    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.currentCount++;
      resolve();
    }
  }

  /**
   * Execute function with semaphore protection
   * @param {Function} fn
   */
  async withSemaphore(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Create singleton instances
const optimisticLockManager = new OptimisticLockManager();
const distributedLock = new DistributedLock();

// Create semaphores for different resources
const databaseSemaphore = new Semaphore(10); // Max 10 concurrent DB operations
const fileSemaphore = new Semaphore(5);      // Max 5 concurrent file operations

/**
 * Execute database operation with optimistic locking
 * @param {Object} options
 */
export async function withOptimisticLock(options) {
  const {
    table,
    id,
    operation,
    expectedVersion = null,
    maxRetries = 3
  } = options;

  const resource = `${table}:${id}`;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Acquire optimistic lock
    const lock = await optimisticLockManager.acquireLock(resource, expectedVersion);

    if (!lock.success) {
      // Handle version conflict
      const resolution = await optimisticLockManager.handleConflict(resource, {
        currentVersion: lock.currentVersion,
        expectedVersion: lock.expectedVersion,
        attempt
      });

      if (resolution.strategy === 'retry' && attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }

      throw new Error(resolution.message || 'Version conflict could not be resolved');
    }

    try {
      // Execute operation
      const result = await operation(lock.version);

      // Release lock and update version
      optimisticLockManager.releaseLock(lock.lockId, true);

      return result;
    } catch (error) {
      lastError = error;
      optimisticLockManager.releaseLock(lock.lockId, false);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Operation failed after max retries');
}

/**
 * Execute critical section with distributed lock
 * @param {string} resource
 * @param {Function} operation
 * @param {number} timeout
 */
export async function withDistributedLock(resource, operation, timeout = 5000) {
  const token = await distributedLock.acquire(resource, timeout);

  try {
    return await operation();
  } finally {
    distributedLock.release(resource, token);
  }
}

/**
 * Execute with semaphore protection
 * @param {Function} operation
 * @param {string} type - 'database' or 'file'
 */
export async function withSemaphore(operation, type = 'database') {
  const semaphore = type === 'file' ? fileSemaphore : databaseSemaphore;
  return await semaphore.withSemaphore(operation);
}

/**
 * Initialize version tables for optimistic locking
 */
export function initializeVersionTables() {
  const tables = ['inventory', 'sales', 'customers', 'suppliers', 'expenses'];

  tables.forEach(table => {
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS ${table}_versions (
          record_id INTEGER,
          table_name TEXT,
          version INTEGER DEFAULT 0,
          updated_at TEXT,
          PRIMARY KEY (record_id, table_name)
        )
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_${table}_versions_record
        ON ${table}_versions(record_id)
      `);
    } catch (error) {
      console.error(`Failed to create version table for ${table}:`, error);
    }
  });
}

// Cleanup interval for expired locks
setInterval(() => {
  optimisticLockManager.cleanupExpiredLocks();
}, 60000); // Clean every minute

// Export everything
export {
  optimisticLockManager,
  distributedLock,
  databaseSemaphore,
  fileSemaphore,
  OptimisticLockManager,
  DistributedLock,
  Semaphore
};

export default {
  withOptimisticLock,
  withDistributedLock,
  withSemaphore,
  initializeVersionTables,
  optimisticLockManager,
  distributedLock
};