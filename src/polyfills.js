// src/polyfills.js
// Polyfill for Node crypto module in browser environment
// This prevents "Module 'crypto' has been externalized" warnings

// Create comprehensive polyfills BEFORE any other code runs
if (typeof window !== 'undefined') {
  // Add crypto.randomBytes polyfill
  if (!window.crypto.randomBytes) {
    window.crypto.randomBytes = function(size) {
      const bytes = new Uint8Array(size);
      window.crypto.getRandomValues(bytes);
      return bytes;
    };
  }

  // Mock the require function to return our polyfilled crypto
  // This intercepts bcryptjs's attempt to require('crypto')
  if (!window.require) {
    window.require = function(module) {
      if (module === 'crypto') {
        return {
          randomBytes: function(size) {
            const bytes = new Uint8Array(size);
            window.crypto.getRandomValues(bytes);
            return bytes;
          }
        };
      }
      // For other modules, throw an error (this is what would happen normally)
      throw new Error(`Cannot find module '${module}'`);
    };
  }

  // Also mock the module object to prevent "module is not defined" errors
  if (typeof module === 'undefined') {
    window.module = { exports: {} };
  }

  // Set global.crypto if it doesn't exist
  if (typeof global === 'undefined') {
    window.global = window;
  }
  if (!global.crypto) {
    global.crypto = window.crypto;
  }
}