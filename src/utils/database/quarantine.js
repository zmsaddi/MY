// src/utils/database/quarantine.js
/**
 * Database Quarantine System
 * Safely handles corrupted databases without immediate deletion
 */

const QUARANTINE_KEY_PREFIX = 'metalsheets_quarantine_';
const MAX_QUARANTINE_ITEMS = 3;

/**
 * Quarantine a corrupted database for later recovery
 * @param {string} data - The corrupted database data
 * @param {Error} error - The error that caused the corruption
 * @returns {object} Quarantine result with id and timestamp
 */
export function quarantineDatabase(data, error) {
  try {
    const timestamp = new Date().toISOString();
    const quarantineId = `${QUARANTINE_KEY_PREFIX}${Date.now()}`;

    const quarantineData = {
      id: quarantineId,
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      data: data ? data.substring(0, 1000) : null, // Store first 1KB for inspection
      fullDataAvailable: !!data,
      encryptionKeyId: localStorage.getItem('_db_enc_key_v2') ? 'v2' : 'unknown',
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    };

    // Store quarantine metadata
    localStorage.setItem(quarantineId, JSON.stringify(quarantineData));

    // Store full data in IndexedDB if available
    if (data && typeof indexedDB !== 'undefined') {
      storeQuarantineDataInIndexedDB(quarantineId, data).catch(console.error);
    }

    // Clean old quarantine items
    cleanOldQuarantineItems();

    return {
      success: true,
      quarantineId,
      timestamp,
      message: 'تم حفظ قاعدة البيانات التالفة للفحص'
    };
  } catch (e) {
    console.error('Failed to quarantine database:', e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Store full quarantine data in IndexedDB
 */
async function storeQuarantineDataInIndexedDB(quarantineId, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MetalSheetsQuarantine', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('quarantine')) {
        db.createObjectStore('quarantine', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['quarantine'], 'readwrite');
      const store = transaction.objectStore('quarantine');

      const record = {
        id: quarantineId,
        data: data,
        timestamp: new Date().toISOString()
      };

      const addRequest = store.put(record);

      addRequest.onsuccess = () => {
        console.log(`Quarantine data stored in IndexedDB: ${quarantineId}`);
        resolve();
      };

      addRequest.onerror = () => {
        console.error('Failed to store quarantine data in IndexedDB');
        reject(addRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get list of quarantined databases
 */
export function getQuarantinedDatabases() {
  const quarantined = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(QUARANTINE_KEY_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        quarantined.push(data);
      } catch (e) {
        console.error(`Failed to parse quarantine data for ${key}:`, e);
      }
    }
  }

  return quarantined.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

/**
 * Attempt to recover a quarantined database
 */
export async function recoverQuarantinedDatabase(quarantineId) {
  try {
    // Get metadata
    const metadata = localStorage.getItem(quarantineId);
    if (!metadata) {
      throw new Error('Quarantine metadata not found');
    }

    const quarantineData = JSON.parse(metadata);

    // Try to get full data from IndexedDB
    const fullData = await getQuarantineDataFromIndexedDB(quarantineId);

    if (!fullData) {
      throw new Error('Full quarantine data not available');
    }

    return {
      success: true,
      data: fullData,
      metadata: quarantineData
    };
  } catch (e) {
    console.error('Failed to recover quarantined database:', e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Get quarantine data from IndexedDB
 */
async function getQuarantineDataFromIndexedDB(quarantineId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MetalSheetsQuarantine', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('quarantine')) {
        resolve(null);
        return;
      }

      const transaction = db.transaction(['quarantine'], 'readonly');
      const store = transaction.objectStore('quarantine');
      const getRequest = store.get(quarantineId);

      getRequest.onsuccess = () => {
        resolve(getRequest.result?.data || null);
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Delete a quarantined database
 */
export async function deleteQuarantinedDatabase(quarantineId) {
  try {
    // Remove from localStorage
    localStorage.removeItem(quarantineId);

    // Remove from IndexedDB
    await deleteQuarantineDataFromIndexedDB(quarantineId);

    return { success: true };
  } catch (e) {
    console.error('Failed to delete quarantined database:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete quarantine data from IndexedDB
 */
async function deleteQuarantineDataFromIndexedDB(quarantineId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MetalSheetsQuarantine', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('quarantine')) {
        resolve();
        return;
      }

      const transaction = db.transaction(['quarantine'], 'readwrite');
      const store = transaction.objectStore('quarantine');
      const deleteRequest = store.delete(quarantineId);

      deleteRequest.onsuccess = () => {
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Clean old quarantine items (keep only the most recent ones)
 */
function cleanOldQuarantineItems() {
  const quarantined = getQuarantinedDatabases();

  if (quarantined.length > MAX_QUARANTINE_ITEMS) {
    const toDelete = quarantined.slice(MAX_QUARANTINE_ITEMS);

    toDelete.forEach(item => {
      deleteQuarantinedDatabase(item.id).catch(console.error);
    });

    console.log(`Cleaned ${toDelete.length} old quarantine items`);
  }
}

/**
 * Check if there are any quarantined databases
 */
export function hasQuarantinedDatabases() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(QUARANTINE_KEY_PREFIX)) {
      return true;
    }
  }
  return false;
}

/**
 * Get quarantine statistics
 */
export function getQuarantineStats() {
  const quarantined = getQuarantinedDatabases();

  return {
    count: quarantined.length,
    latest: quarantined[0] || null,
    totalSize: quarantined.reduce((sum, item) =>
      sum + (item.data?.length || 0), 0
    )
  };
}