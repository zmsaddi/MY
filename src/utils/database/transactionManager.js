// src/utils/database/transactionManager.js
// Comprehensive Transaction Management Module

import { db } from './core.js';

/**
 * Transaction status enum
 */
export const TransactionStatus = {
  IDLE: 'idle',
  IN_PROGRESS: 'in_progress',
  COMMITTED: 'committed',
  ROLLED_BACK: 'rolled_back',
  ERROR: 'error'
};

/**
 * Transaction Manager Class
 * Ensures proper transaction handling with automatic rollback on errors
 */
class TransactionManager {
  constructor() {
    this.currentTransaction = null;
    this.transactionStack = [];
    this.transactionDepth = 0;
    this.status = TransactionStatus.IDLE;
    this.operations = [];
    this.startTime = null;
  }

  /**
   * Begin a new transaction or savepoint
   */
  begin() {
    try {
      if (this.transactionDepth === 0) {
        // Begin main transaction
        db.run('BEGIN IMMEDIATE');
        this.currentTransaction = {
          id: Date.now(),
          depth: 0,
          status: TransactionStatus.IN_PROGRESS,
          startTime: Date.now(),
          operations: []
        };
        this.status = TransactionStatus.IN_PROGRESS;
        this.startTime = Date.now();
      } else {
        // Create savepoint for nested transaction
        const savepointName = `sp_${this.transactionDepth}_${Date.now()}`;
        db.run(`SAVEPOINT ${savepointName}`);
        this.transactionStack.push({
          savepointName,
          depth: this.transactionDepth,
          operations: []
        });
      }
      this.transactionDepth++;
      return { success: true, depth: this.transactionDepth };
    } catch (error) {
      console.error('Transaction begin failed:', error);
      this.status = TransactionStatus.ERROR;
      return { success: false, error: error.message };
    }
  }

  /**
   * Commit current transaction or release savepoint
   */
  commit() {
    try {
      if (this.transactionDepth === 0) {
        console.warn('No active transaction to commit');
        return { success: false, error: 'No active transaction' };
      }

      this.transactionDepth--;

      if (this.transactionDepth === 0) {
        // Commit main transaction
        db.run('COMMIT');
        this.status = TransactionStatus.COMMITTED;
        const duration = Date.now() - this.startTime;

        // Log transaction metrics
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Transaction committed (${duration}ms, ${this.operations.length} operations)`);
        }

        // Reset state
        this.currentTransaction = null;
        this.operations = [];
        this.startTime = null;

        return { success: true, duration, operations: this.operations.length };
      } else {
        // Release savepoint
        const savepoint = this.transactionStack.pop();
        if (savepoint) {
          db.run(`RELEASE SAVEPOINT ${savepoint.savepointName}`);
        }
        return { success: true, depth: this.transactionDepth };
      }
    } catch (error) {
      console.error('Transaction commit failed:', error);
      this.rollback();
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback current transaction or to savepoint
   */
  rollback() {
    try {
      if (this.transactionDepth === 0) {
        console.warn('No active transaction to rollback');
        return { success: false, error: 'No active transaction' };
      }

      this.transactionDepth--;

      if (this.transactionDepth === 0) {
        // Rollback main transaction
        db.run('ROLLBACK');
        this.status = TransactionStatus.ROLLED_BACK;

        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Transaction rolled back (${this.operations.length} operations discarded)`);
        }

        // Reset state
        this.currentTransaction = null;
        this.operations = [];
        this.startTime = null;

        return { success: true };
      } else {
        // Rollback to savepoint
        const savepoint = this.transactionStack.pop();
        if (savepoint) {
          db.run(`ROLLBACK TO SAVEPOINT ${savepoint.savepointName}`);
          db.run(`RELEASE SAVEPOINT ${savepoint.savepointName}`);
        }
        return { success: true, depth: this.transactionDepth };
      }
    } catch (error) {
      console.error('Transaction rollback failed:', error);
      // Force rollback
      try {
        db.run('ROLLBACK');
      } catch (e) {
        // Silent fail
      }
      this.transactionDepth = 0;
      this.transactionStack = [];
      this.status = TransactionStatus.ERROR;
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute operation within transaction
   * @param {Function} operation - Function to execute
   * @param {string} description - Operation description for logging
   */
  async execute(operation, description = 'Operation') {
    if (this.transactionDepth === 0) {
      throw new Error('No active transaction');
    }

    const opStart = Date.now();
    this.operations.push({
      description,
      startTime: opStart,
      status: 'pending'
    });

    try {
      const result = await operation();
      const duration = Date.now() - opStart;

      this.operations[this.operations.length - 1] = {
        ...this.operations[this.operations.length - 1],
        status: 'success',
        duration
      };

      return result;
    } catch (error) {
      this.operations[this.operations.length - 1] = {
        ...this.operations[this.operations.length - 1],
        status: 'error',
        error: error.message
      };
      throw error;
    }
  }

  /**
   * Get current transaction status
   */
  getStatus() {
    return {
      status: this.status,
      depth: this.transactionDepth,
      hasActiveTransaction: this.transactionDepth > 0,
      operations: this.operations.length,
      duration: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Check if transaction is active
   */
  isActive() {
    return this.transactionDepth > 0;
  }
}

// Create singleton instance
const transactionManager = new TransactionManager();

/**
 * Execute a function within a transaction with automatic rollback on error
 * @param {Function} fn - Async function to execute
 * @param {string} description - Transaction description
 * @returns {Promise}
 */
export async function withTransaction(fn, description = 'Transaction') {
  const beginResult = transactionManager.begin();

  if (!beginResult.success) {
    throw new Error(`Failed to begin transaction: ${beginResult.error}`);
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Starting transaction: ${description}`);
    }

    const result = await fn(transactionManager);

    const commitResult = transactionManager.commit();
    if (!commitResult.success) {
      throw new Error(`Failed to commit transaction: ${commitResult.error}`);
    }

    return result;
  } catch (error) {
    console.error(`Transaction failed: ${description}`, error);
    transactionManager.rollback();
    throw error;
  }
}

/**
 * Execute multiple operations in a single transaction
 * @param {Array} operations - Array of {fn, description} objects
 * @returns {Promise}
 */
export async function batchTransaction(operations) {
  return withTransaction(async (tx) => {
    const results = [];

    for (const { fn, description } of operations) {
      try {
        const result = await tx.execute(fn, description);
        results.push({ success: true, result, description });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          description
        });
        throw error; // Propagate to trigger rollback
      }
    }

    return results;
  }, 'Batch Transaction');
}

/**
 * Deadlock detection and retry mechanism
 * @param {Function} fn - Function to execute
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 */
export async function withDeadlockRetry(fn, maxRetries = 3, retryDelay = 100) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is due to database lock/busy
      if (error.message && (
        error.message.includes('database is locked') ||
        error.message.includes('SQLITE_BUSY')
      )) {
        if (attempt < maxRetries) {
          console.warn(`Database locked, retrying (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Transaction isolation level helper
 * SQLite doesn't support full isolation levels, but we can simulate
 */
export function setIsolationLevel(level = 'DEFERRED') {
  // SQLite transaction types: DEFERRED, IMMEDIATE, EXCLUSIVE
  const validLevels = ['DEFERRED', 'IMMEDIATE', 'EXCLUSIVE'];

  if (!validLevels.includes(level)) {
    throw new Error(`Invalid isolation level: ${level}`);
  }

  return level;
}

/**
 * Lock table for exclusive access during critical operations
 * @param {string} tableName
 */
export function lockTable(tableName) {
  try {
    // SQLite doesn't have table-level locks, but we can use EXCLUSIVE transaction
    db.run('BEGIN EXCLUSIVE');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a mutex for critical sections
 */
class DatabaseMutex {
  constructor(name) {
    this.name = name;
    this.locked = false;
    this.queue = [];
  }

  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }

  async withLock(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Create mutexes for critical resources
export const inventoryMutex = new DatabaseMutex('inventory');
export const salesMutex = new DatabaseMutex('sales');
export const accountingMutex = new DatabaseMutex('accounting');

/**
 * Enhanced transaction with mutex lock
 * @param {Function} fn
 * @param {DatabaseMutex} mutex
 * @param {string} description
 */
export async function withMutexTransaction(fn, mutex, description) {
  return mutex.withLock(() => withTransaction(fn, description));
}

// Export transaction manager instance for direct access if needed
export { transactionManager };

// Export default transaction helpers
export default {
  withTransaction,
  batchTransaction,
  withDeadlockRetry,
  withMutexTransaction,
  setIsolationLevel,
  lockTable,
  transactionManager,
  TransactionStatus,
  inventoryMutex,
  salesMutex,
  accountingMutex
};