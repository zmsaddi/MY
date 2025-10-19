// src/utils/security/cryptoShim.js
// Browser-compatible crypto shim for bcryptjs
// This prevents Vite warnings about Node's crypto module being externalized

export const randomBytes = (size) => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const buffer = new Uint8Array(size);
    window.crypto.getRandomValues(buffer);
    return buffer;
  }
  // Fallback for environments without crypto.getRandomValues
  throw new Error('crypto.getRandomValues is not available');
};

export default {
  randomBytes
};
