/**
 * IndexedDB Manager - نظام إدارة قاعدة البيانات المحسّن
 * يوفر سعة تخزين أكبر بكثير من localStorage (جيجابايتات بدلاً من 5MB)
 * مع دعم كامل للتشفير والنسخ الاحتياطي
 */

import { encryptData, decryptData } from '../security/encryption.js';

const DB_NAME = 'MetalSheetsDB';
const DB_VERSION = 41; // تحديث النسخة لتكون أعلى من النسخة الموجودة
const STORE_NAME = 'database';
const BACKUP_STORE = 'backups';
const SETTINGS_STORE = 'settings';

/**
 * فئة إدارة IndexedDB
 */
class IndexedDBManager {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.initPromise = null;
  }

  /**
   * تهيئة قاعدة البيانات
   */
  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initDB();
    return this.initPromise;
  }

  /**
   * التهيئة الفعلية لقاعدة البيانات
   */
  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('خطأ في فتح IndexedDB:', request.error);
        reject(new Error(`فشل فتح قاعدة البيانات: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ تم تهيئة IndexedDB بنجاح');

        // معالج إغلاق قاعدة البيانات
        this.db.onclose = () => {
          console.log('تم إغلاق قاعدة البيانات، إعادة الاتصال...');
          this.isReady = false;
          this.db = null;
          this.initPromise = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // إنشاء مخزن البيانات الرئيسي
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const mainStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false
          });
          mainStore.createIndex('timestamp', 'timestamp', { unique: false });
          mainStore.createIndex('type', 'type', { unique: false });
        }

        // إنشاء مخزن النسخ الاحتياطية
        if (!db.objectStoreNames.contains(BACKUP_STORE)) {
          const backupStore = db.createObjectStore(BACKUP_STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          backupStore.createIndex('date', 'date', { unique: false });
          backupStore.createIndex('version', 'version', { unique: false });
        }

        // إنشاء مخزن الإعدادات
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }

        console.log('✅ تم ترقية مخطط IndexedDB إلى الإصدار', DB_VERSION);
      };

      request.onblocked = () => {
        console.warn('⚠️ قاعدة البيانات محظورة. يرجى إغلاق جميع علامات التبويب الأخرى.');
      };
    });
  }

  /**
   * التحقق من الجاهزية
   */
  async ensureReady() {
    if (!this.isReady) {
      await this.init();
    }
    return this.db;
  }

  /**
   * حفظ قاعدة البيانات
   */
  async saveDatabase(data, encrypted = true) {
    await this.ensureReady();

    return new Promise(async (resolve, reject) => {
      try {
        // تحضير البيانات للحفظ - await لـ encryptData
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const finalData = encrypted ? await encryptData(dataString) : dataString;

        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record = {
          id: 'main_database',
          data: finalData,
          timestamp: new Date().toISOString(),
          type: 'database',
          encrypted: encrypted,
          size: new Blob([finalData]).size
        };

        const request = store.put(record);

        request.onsuccess = () => {
          const sizeInMB = record.size / (1024 * 1024);
          console.log(`✅ تم حفظ قاعدة البيانات (${sizeInMB.toFixed(2)} MB)`);
          resolve({
            success: true,
            size: sizeInMB,
            encrypted: encrypted
          });
        };

        request.onerror = () => {
          console.error('خطأ في حفظ البيانات:', request.error);
          reject(new Error(`فشل حفظ قاعدة البيانات: ${request.error}`));
        };

        transaction.onerror = () => {
          console.error('خطأ في المعاملة:', transaction.error);
          reject(new Error(`خطأ في المعاملة: ${transaction.error}`));
        };

      } catch (error) {
        console.error('خطأ في حفظ قاعدة البيانات:', error);
        reject(error);
      }
    });
  }

  /**
   * تحميل قاعدة البيانات
   */
  async loadDatabase() {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('main_database');

        request.onsuccess = async () => {
          const record = request.result;

          if (!record) {
            console.log('لا توجد قاعدة بيانات محفوظة');
            resolve(null);
            return;
          }

          try {
            let data = record.data;

            // فك التشفير إذا لزم - await لـ decryptData
            if (record.encrypted) {
              data = await decryptData(data);
            }

            // تحويل البيانات إذا كانت JSON
            if (typeof data === 'string' && data.startsWith('[')) {
              data = JSON.parse(data);
            }

            console.log(`✅ تم تحميل قاعدة البيانات (${(record.size / (1024 * 1024)).toFixed(2)} MB)`);
            resolve(data);

          } catch (decryptError) {
            console.error('خطأ في فك تشفير البيانات:', decryptError);
            reject(new Error('فشل فك تشفير قاعدة البيانات'));
          }
        };

        request.onerror = () => {
          console.error('خطأ في تحميل البيانات:', request.error);
          reject(new Error(`فشل تحميل قاعدة البيانات: ${request.error}`));
        };

      } catch (error) {
        console.error('خطأ في تحميل قاعدة البيانات:', error);
        reject(error);
      }
    });
  }

  /**
   * إنشاء نسخة احتياطية
   */
  async createBackup(data, description = 'نسخة احتياطية تلقائية') {
    await this.ensureReady();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db.transaction([BACKUP_STORE], 'readwrite');
        const store = transaction.objectStore(BACKUP_STORE);

        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        // CRITICAL FIX: await encryptData to avoid storing [object Promise]
        const encryptedData = await encryptData(dataString);

        const backup = {
          data: encryptedData,
          date: new Date().toISOString(),
          description: description,
          version: DB_VERSION,
          size: new Blob([encryptedData]).size
        };

        const request = store.add(backup);

        request.onsuccess = () => {
          console.log(`✅ تم إنشاء نسخة احتياطية #${request.result}`);

          // تنظيف النسخ القديمة (الاحتفاظ بآخر 10 نسخ)
          this.cleanOldBackups(10);

          resolve({
            success: true,
            backupId: request.result,
            size: backup.size / (1024 * 1024)
          });
        };

        request.onerror = () => {
          console.error('خطأ في إنشاء النسخة الاحتياطية:', request.error);
          reject(new Error(`فشل إنشاء النسخة الاحتياطية: ${request.error}`));
        };

      } catch (error) {
        console.error('خطأ في النسخ الاحتياطي:', error);
        reject(error);
      }
    });
  }

  /**
   * استرجاع نسخة احتياطية
   */
  async restoreBackup(backupId) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([BACKUP_STORE], 'readonly');
        const store = transaction.objectStore(BACKUP_STORE);
        const request = store.get(backupId);

        request.onsuccess = async () => {
          const backup = request.result;

          if (!backup) {
            reject(new Error('النسخة الاحتياطية غير موجودة'));
            return;
          }

          try {
            // CRITICAL FIX: await decryptData to properly decrypt backup
            const decryptedData = await decryptData(backup.data);
            const data = JSON.parse(decryptedData);

            console.log(`✅ تم استرجاع النسخة الاحتياطية #${backupId}`);
            resolve(data);

          } catch (error) {
            console.error('خطأ في استرجاع النسخة:', error);
            reject(new Error('فشل فك تشفير النسخة الاحتياطية'));
          }
        };

        request.onerror = () => {
          reject(new Error(`فشل استرجاع النسخة: ${request.error}`));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * قائمة النسخ الاحتياطية
   */
  async listBackups() {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([BACKUP_STORE], 'readonly');
        const store = transaction.objectStore(BACKUP_STORE);
        const index = store.index('date');
        const request = index.openCursor(null, 'prev'); // ترتيب تنازلي حسب التاريخ

        const backups = [];

        request.onsuccess = () => {
          const cursor = request.result;

          if (cursor) {
            backups.push({
              id: cursor.primaryKey,
              date: cursor.value.date,
              description: cursor.value.description,
              size: cursor.value.size / (1024 * 1024),
              version: cursor.value.version
            });
            cursor.continue();
          } else {
            resolve(backups);
          }
        };

        request.onerror = () => {
          reject(new Error(`فشل قراءة النسخ الاحتياطية: ${request.error}`));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * تنظيف النسخ القديمة
   */
  async cleanOldBackups(keepCount = 10) {
    try {
      const backups = await this.listBackups();

      if (backups.length <= keepCount) return;

      const toDelete = backups.slice(keepCount);
      const transaction = this.db.transaction([BACKUP_STORE], 'readwrite');
      const store = transaction.objectStore(BACKUP_STORE);

      for (const backup of toDelete) {
        store.delete(backup.id);
        console.log(`🗑️ حذف النسخة الاحتياطية القديمة #${backup.id}`);
      }

    } catch (error) {
      console.error('خطأ في تنظيف النسخ القديمة:', error);
    }
  }

  /**
   * حفظ إعداد
   */
  async saveSetting(key, value) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);

        const request = store.put({ key, value, updated: new Date().toISOString() });

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`فشل حفظ الإعداد: ${request.error}`));

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * قراءة إعداد
   */
  async getSetting(key) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result?.value || null);
        };
        request.onerror = () => reject(new Error(`فشل قراءة الإعداد: ${request.error}`));

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * حذف قاعدة البيانات بالكامل
   */
  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isReady = false;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        console.log('✅ تم حذف قاعدة البيانات بالكامل');
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`فشل حذف قاعدة البيانات: ${request.error}`));
      };

      request.onblocked = () => {
        console.warn('⚠️ حذف قاعدة البيانات محظور. أغلق جميع علامات التبويب.');
      };
    });
  }

  /**
   * الحصول على معلومات التخزين
   */
  async getStorageInfo() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageInMB = estimate.usage / (1024 * 1024);
        const quotaInMB = estimate.quota / (1024 * 1024);
        const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);

        return {
          used: usageInMB.toFixed(2) + ' MB',
          available: (quotaInMB - usageInMB).toFixed(2) + ' MB',
          total: quotaInMB.toFixed(2) + ' MB',
          percentUsed: percentUsed + '%'
        };
      }
      return null;
    } catch (error) {
      console.error('خطأ في الحصول على معلومات التخزين:', error);
      return null;
    }
  }

  /**
   * هجرة البيانات من localStorage
   */
  async migrateFromLocalStorage() {
    try {
      const oldData = localStorage.getItem('metalsheets_database');

      if (!oldData) {
        console.log('لا توجد بيانات في localStorage للهجرة');
        return { migrated: false, reason: 'No data found' };
      }

      // فك التشفير إذا لزم
      let decryptedData;
      try {
        decryptedData = await decryptData(oldData);
      } catch {
        // إذا فشل فك التشفير، جرب استخدام البيانات كما هي
        decryptedData = oldData;
      }

      // حفظ في IndexedDB
      await this.saveDatabase(decryptedData, true);

      // إنشاء نسخة احتياطية من البيانات القديمة
      await this.createBackup(decryptedData, 'هجرة من localStorage');

      // حذف من localStorage بعد النجاح
      localStorage.removeItem('metalsheets_database');

      console.log('✅ تمت هجرة البيانات من localStorage إلى IndexedDB');
      return {
        migrated: true,
        size: new Blob([decryptedData]).size / (1024 * 1024)
      };

    } catch (error) {
      console.error('خطأ في هجرة البيانات:', error);
      return {
        migrated: false,
        error: error.message
      };
    }
  }
}

// إنشاء مثيل واحد للاستخدام في التطبيق
const indexedDBManager = new IndexedDBManager();

// تصدير المثيل والفئة
export default indexedDBManager;
export { IndexedDBManager };