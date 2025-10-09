// src/hooks/useErrorHandler.js
import { useState, useCallback, useEffect } from 'react';

/**
 * Global Error Handler Hook
 * Provides consistent error handling across the application
 */

// Global error state
let globalErrorCallback = null;

export function setGlobalErrorHandler(callback) {
  globalErrorCallback = callback;
}

export function useErrorHandler() {
  const [error, setError] = useState(null);

  // Register global handler
  useEffect(() => {
    setGlobalErrorHandler(setError);
    return () => {
      setGlobalErrorHandler(null);
    };
  }, []);

  const handleError = useCallback((err, context = {}) => {
    console.error('Error caught:', err, context);

    let errorObj = {
      message: 'حدث خطأ غير متوقع',
      severity: 'error',
      timestamp: new Date().toISOString(),
      ...context
    };

    // Parse different error types
    if (typeof err === 'string') {
      errorObj.message = err;
    } else if (err instanceof Error) {
      errorObj.message = err.message || errorObj.message;
      errorObj.stack = err.stack;
      errorObj.name = err.name;
    } else if (err && typeof err === 'object') {
      errorObj = { ...errorObj, ...err };
    }

    // Add code if available
    if (err.code) {
      errorObj.code = err.code;
    }

    // Parse database errors
    if (errorObj.message.includes('UNIQUE constraint failed')) {
      errorObj.message = 'هذا السجل موجود مسبقاً';
      errorObj.title = 'خطأ في البيانات';
      errorObj.code = 'DB_UNIQUE';
    } else if (errorObj.message.includes('FOREIGN KEY constraint failed')) {
      errorObj.message = 'لا يمكن حذف هذا السجل لأنه مرتبط بسجلات أخرى';
      errorObj.title = 'خطأ في العلاقات';
      errorObj.code = 'DB_FK';
    } else if (errorObj.message.includes('NOT NULL constraint failed')) {
      errorObj.message = 'يجب إدخال جميع الحقول المطلوبة';
      errorObj.title = 'حقول مطلوبة';
      errorObj.code = 'DB_NULL';
    }

    // Parse network errors
    if (err.name === 'NetworkError' || errorObj.message.includes('network')) {
      errorObj.message = 'خطأ في الاتصال بالشبكة';
      errorObj.title = 'خطأ في الاتصال';
      errorObj.severity = 'warning';
      errorObj.code = 'NET_ERROR';
    }

    // Parse validation errors
    if (errorObj.code?.startsWith('VALIDATION_')) {
      errorObj.title = 'خطأ في البيانات المدخلة';
      errorObj.severity = 'warning';
    }

    setError(errorObj);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}

/**
 * Global error function - can be called from anywhere
 */
export function showError(error, context = {}) {
  if (globalErrorCallback) {
    globalErrorCallback({
      message: typeof error === 'string' ? error : error.message,
      ...context,
      ...(typeof error === 'object' ? error : {})
    });
  } else {
    console.error('Global error handler not initialized:', error);
  }
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandler(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      showError(error, context);
      throw error;
    }
  };
}
