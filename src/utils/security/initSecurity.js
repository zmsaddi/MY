// src/utils/security/initSecurity.js
// CRITICAL: This module MUST be imported BEFORE any password hashing operations
// It configures bcryptjs to use WebCrypto API instead of Node's crypto module

import bcrypt from 'bcryptjs';

// Immediately register the WebCrypto fallback BEFORE any bcrypt operations
// This prevents bcryptjs from ever attempting to require('crypto')
if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
  bcrypt.setRandomFallback((len) => {
    const buf = new Uint8Array(len);
    window.crypto.getRandomValues(buf);
    return Array.from(buf);
  });
  console.log('✓ bcrypt WebCrypto fallback registered');
}

// Export the configured bcrypt instance
export default bcrypt;
export const { hashSync, compareSync, genSaltSync, genSalt, hash, compare } = bcrypt;
