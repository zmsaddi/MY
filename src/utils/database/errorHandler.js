// src/utils/database/errorHandler.js
// Global error handler for database operations
import { showError } from '../../hooks/useErrorHandler.js';
import { parseDbError } from '../validators.js';

/**
 * Wraps a database operation with global error handling
 * @param {Function} operation - The database operation to execute
 * @param {string} context - Description of what operation is being performed
 * @param {Object} options - Additional options
 * @returns {*} Result of the operation or null on error
 */
export function withErrorHandler(operation, context = 'Database Operation', options = {}) {
  try {
    return operation();
  } catch (error) {
    console.error(`[${context}] Database Error:`, error);

    // Parse the error message
    const errorMessage = error.message || String(error);
    let userMessage = 'حدث خطأ في قاعدة البيانات';
    let errorCode = 'DB_ERROR';

    // Parse specific database errors
    if (errorMessage.includes('UNIQUE constraint failed')) {
      const match = errorMessage.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
      const tableName = match?.[1] || 'unknown';
      const columnName = match?.[2] || 'unknown';

      // User-friendly messages for common constraints
      if (columnName === 'code') {
        userMessage = 'هذا الرمز مستخدم مسبقاً. الرجاء استخدام رمز آخر.';
      } else if (columnName === 'username') {
        userMessage = 'اسم المستخدم موجود مسبقاً. الرجاء اختيار اسم آخر.';
      } else {
        userMessage = `القيمة موجودة مسبقاً في حقل: ${columnName}`;
      }
      errorCode = 'UNIQUE_CONSTRAINT';

    } else if (errorMessage.includes('FOREIGN KEY constraint failed')) {
      userMessage = 'لا يمكن حذف أو تعديل هذا السجل لأنه مرتبط بسجلات أخرى';
      errorCode = 'FOREIGN_KEY';

    } else if (errorMessage.includes('NOT NULL constraint failed')) {
      const match = errorMessage.match(/NOT NULL constraint failed: (\w+)\.(\w+)/);
      const columnName = match?.[2] || 'unknown';
      userMessage = `الحقل "${columnName}" مطلوب ولا يمكن تركه فارغاً`;
      errorCode = 'NOT_NULL';

    } else if (errorMessage.includes('no such table')) {
      userMessage = 'خطأ في بنية قاعدة البيانات. الرجاء تحديث النظام.';
      errorCode = 'NO_TABLE';

    } else if (errorMessage.includes('no such column')) {
      const match = errorMessage.match(/no such column: (\w+)/);
      const columnName = match?.[1] || 'unknown';
      userMessage = `عمود "${columnName}" غير موجود في قاعدة البيانات. الرجاء تحديث النظام.`;
      errorCode = 'NO_COLUMN';

    } else if (errorMessage.includes('syntax error')) {
      userMessage = 'خطأ في صياغة استعلام قاعدة البيانات';
      errorCode = 'SYNTAX_ERROR';

    } else if (errorMessage.toLowerCase().includes('permission')) {
      userMessage = 'ليس لديك صلاحية لتنفيذ هذه العملية';
      errorCode = 'PERMISSION';
    }

    // Show global error notification
    if (typeof showError === 'function') {
      showError(userMessage, {
        title: `خطأ: ${context}`,
        severity: 'error',
        code: errorCode,
        details: {
          operation: context,
          errorMessage: errorMessage,
          timestamp: new Date().toISOString(),
          ...options.details
        },
        stack: error.stack
      });
    } else {
      // Fallback to console if global handler not available
      console.error('Global error handler not available. Error:', {
        context,
        message: userMessage,
        code: errorCode,
        originalError: errorMessage
      });
    }

    // Re-throw if specified
    if (options.rethrow) {
      throw error;
    }

    return null;
  }
}

/**
 * Wraps an async database operation with global error handling
 * @param {Function} operation - The async database operation to execute
 * @param {string} context - Description of what operation is being performed
 * @param {Object} options - Additional options
 * @returns {Promise<*>} Result of the operation or null on error
 */
export async function withErrorHandlerAsync(operation, context = 'Database Operation', options = {}) {
  try {
    return await operation();
  } catch (error) {
    console.error(`[${context}] Database Error:`, error);

    // Parse the error message (same logic as sync version)
    const errorMessage = error.message || String(error);
    let userMessage = 'حدث خطأ في قاعدة البيانات';
    let errorCode = 'DB_ERROR';

    if (errorMessage.includes('UNIQUE constraint failed')) {
      const match = errorMessage.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
      const columnName = match?.[2] || 'unknown';

      if (columnName === 'code') {
        userMessage = 'هذا الرمز مستخدم مسبقاً. الرجاء استخدام رمز آخر.';
      } else if (columnName === 'username') {
        userMessage = 'اسم المستخدم موجود مسبقاً. الرجاء اختيار اسم آخر.';
      } else {
        userMessage = `القيمة موجودة مسبقاً في حقل: ${columnName}`;
      }
      errorCode = 'UNIQUE_CONSTRAINT';

    } else if (errorMessage.includes('FOREIGN KEY constraint failed')) {
      userMessage = 'لا يمكن حذف أو تعديل هذا السجل لأنه مرتبط بسجلات أخرى';
      errorCode = 'FOREIGN_KEY';

    } else if (errorMessage.includes('NOT NULL constraint failed')) {
      const match = errorMessage.match(/NOT NULL constraint failed: (\w+)\.(\w+)/);
      const columnName = match?.[2] || 'unknown';
      userMessage = `الحقل "${columnName}" مطلوب ولا يمكن تركه فارغاً`;
      errorCode = 'NOT_NULL';

    } else if (errorMessage.includes('no such column')) {
      const match = errorMessage.match(/no such column: (\w+)/);
      const columnName = match?.[1] || 'unknown';
      userMessage = `عمود "${columnName}" غير موجود في قاعدة البيانات. الرجاء تحديث النظام.`;
      errorCode = 'NO_COLUMN';
    }

    // Show global error notification
    if (typeof showError === 'function') {
      showError(userMessage, {
        title: `خطأ: ${context}`,
        severity: 'error',
        code: errorCode,
        details: {
          operation: context,
          errorMessage: errorMessage,
          timestamp: new Date().toISOString(),
          ...options.details
        },
        stack: error.stack
      });
    }

    if (options.rethrow) {
      throw error;
    }

    return null;
  }
}
