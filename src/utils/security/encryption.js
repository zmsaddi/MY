// src/utils/security/encryption.js
/**
 * Database Encryption Module
 * Provides secure encryption/decryption for sensitive data in LocalStorage
 * Uses AES-256 encryption with dynamic key generation
 */

/**
 * Simple AES encryption implementation using Web Crypto API
 * Falls back to basic encoding if crypto not available
 */
class DatabaseEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.initializeKey();
  }

  /**
   * Initialize or retrieve the encryption key
   * The key is stored in sessionStorage for the current session only
   */
  initializeKey() {
    // Check if we already have a key for this session
    const existingKey = sessionStorage.getItem('_db_enc_key');

    if (existingKey) {
      this.encryptionKey = existingKey;
    } else {
      // Generate a new key for this session
      this.encryptionKey = this.generateKey();
      sessionStorage.setItem('_db_enc_key', this.encryptionKey);
    }
  }

  /**
   * Generate a secure random key
   * @returns {string} Base64 encoded key
   */
  generateKey() {
    if (typeof window !== 'undefined' && window.crypto) {
      // Browser environment with Web Crypto API
      const array = new Uint8Array(32); // 256 bits
      window.crypto.getRandomValues(array);
      return btoa(String.fromCharCode.apply(null, array));
    } else {
      // Fallback for non-browser or older environments
      const timestamp = Date.now().toString(36);
      const random1 = Math.random().toString(36).substring(2, 15);
      const random2 = Math.random().toString(36).substring(2, 15);
      const key = `${timestamp}_${random1}_${random2}`.padEnd(32, 'x');
      return btoa(key);
    }
  }

  /**
   * Generate initialization vector for encryption
   * @returns {Uint8Array} Random IV
   */
  generateIV() {
    if (typeof window !== 'undefined' && window.crypto) {
      const iv = new Uint8Array(12); // 96 bits for GCM
      window.crypto.getRandomValues(iv);
      return iv;
    } else {
      // Fallback IV generation
      const iv = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        iv[i] = Math.floor(Math.random() * 256);
      }
      return iv;
    }
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string} data - Data to encrypt
   * @returns {Promise<string>} Encrypted data as base64 string
   */
  async encrypt(data) {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      // Fallback to basic obfuscation if Web Crypto API not available
      return this.obfuscate(data);
    }

    try {
      // Convert key from base64 to raw format
      const keyData = Uint8Array.from(atob(this.encryptionKey), c => c.charCodeAt(0));

      // Import the key
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: this.algorithm },
        false,
        ['encrypt']
      );

      // Generate IV
      const iv = this.generateIV();

      // Convert data to Uint8Array
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Encrypt the data
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode.apply(null, combined));

    } catch (error) {
      console.error('Encryption failed, falling back to obfuscation:', error);
      return this.obfuscate(data);
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param {string} encryptedData - Base64 encrypted data
   * @returns {Promise<string>} Decrypted data
   */
  async decrypt(encryptedData) {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      // Fallback to basic deobfuscation if Web Crypto API not available
      return this.deobfuscate(encryptedData);
    }

    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Convert key from base64 to raw format
      const keyData = Uint8Array.from(atob(this.encryptionKey), c => c.charCodeAt(0));

      // Import the key
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: this.algorithm },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);

    } catch (error) {
      console.error('Decryption failed, falling back to deobfuscation:', error);
      return this.deobfuscate(encryptedData);
    }
  }

  /**
   * Basic obfuscation fallback (NOT cryptographically secure)
   * Used only when Web Crypto API is not available
   * @param {string} data - Data to obfuscate
   * @returns {string} Obfuscated data
   */
  obfuscate(data) {
    // Simple XOR obfuscation with the key
    const key = this.encryptionKey;
    let result = '';

    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }

    return btoa(result);
  }

  /**
   * Basic deobfuscation fallback (NOT cryptographically secure)
   * Used only when Web Crypto API is not available
   * @param {string} obfuscatedData - Obfuscated data
   * @returns {string} Original data
   */
  deobfuscate(obfuscatedData) {
    try {
      const data = atob(obfuscatedData);
      const key = this.encryptionKey;
      let result = '';

      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }

      return result;
    } catch (error) {
      console.error('Deobfuscation failed:', error);
      return obfuscatedData; // Return as-is if deobfuscation fails
    }
  }

  /**
   * Clear the encryption key (for logout)
   */
  clearKey() {
    sessionStorage.removeItem('_db_enc_key');
    this.encryptionKey = null;
  }

  /**
   * Check if encryption is available
   * @returns {boolean} True if Web Crypto API is available
   */
  isSecureEncryptionAvailable() {
    return typeof window !== 'undefined' &&
           window.crypto &&
           window.crypto.subtle &&
           typeof window.crypto.subtle.encrypt === 'function';
  }

  /**
   * Get security status
   * @returns {Object} Security information
   */
  getSecurityStatus() {
    return {
      encryptionAvailable: this.isSecureEncryptionAvailable(),
      algorithm: this.isSecureEncryptionAvailable() ? 'AES-256-GCM' : 'XOR Obfuscation',
      keyLength: this.keyLength,
      keyPresent: !!this.encryptionKey,
      warning: !this.isSecureEncryptionAvailable() ?
        'Web Crypto API not available. Using fallback obfuscation which is NOT cryptographically secure.' : null
    };
  }
}

// Create singleton instance
const encryption = new DatabaseEncryption();

// Export functions for use in other modules
export const encryptData = async (data) => encryption.encrypt(data);
export const decryptData = async (data) => encryption.decrypt(data);
export const clearEncryptionKey = () => encryption.clearKey();
export const getSecurityStatus = () => encryption.getSecurityStatus();
export const isSecureEncryptionAvailable = () => encryption.isSecureEncryptionAvailable();

export default encryption;