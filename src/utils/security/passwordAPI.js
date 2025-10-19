// src/utils/security/passwordAPI.js
// Password hashing API using bcryptjs with WebCrypto fallback

import { hashSync, compareSync } from './initSecurity.js';

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
export function hashPassword(password) {
  return hashSync(password, 10);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {boolean} True if password matches
 */
export function verifyPassword(password, hash) {
  return compareSync(password, hash);
}

/**
 * Hash a password synchronously
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
export function hashPasswordSync(password) {
  return hashSync(password, 10);
}

/**
 * Verify a password synchronously
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {boolean} True if password matches
 */
export function verifyPasswordSync(password, hash) {
  return compareSync(password, hash);
}

export default {
  hashPassword,
  verifyPassword,
  hashPasswordSync,
  verifyPasswordSync
};
