// src/utils/database/saveWithTransition.js
import { startTransition } from 'react';
import { saveDatabase as coreSaveDatabase } from './core.js';

/**
 * Wrapper for saveDatabase that uses React 18's startTransition
 * to prevent Suspense boundary violations during synchronous input events
 *
 * This prevents the warning:
 * "A component suspended while responding to synchronous input"
 */
export function saveDatabase() {
  return new Promise((resolve, reject) => {
    // Use startTransition to mark this update as non-urgent
    // This allows React to handle it properly with Suspense
    startTransition(() => {
      coreSaveDatabase()
        .then(resolve)
        .catch(reject);
    });
  });
}

/**
 * For immediate saves that must happen synchronously
 * (e.g., before page unload)
 */
export { saveDatabaseImmediate } from './core.js';

/**
 * Use requestIdleCallback for non-critical saves
 * This is the most performant option for background saves
 */
export function saveDatabaseIdle() {
  return new Promise((resolve, reject) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        coreSaveDatabase()
          .then(resolve)
          .catch(reject);
      }, { timeout: 2000 }); // 2 second timeout
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        coreSaveDatabase()
          .then(resolve)
          .catch(reject);
      }, 100);
    }
  });
}