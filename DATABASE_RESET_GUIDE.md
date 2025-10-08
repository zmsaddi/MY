# Database Reset & Clean Guide

## 🎯 Overview

This guide explains how to clean and reset your database before running tests or starting fresh with the Metal Sheets Management System.

---

## 🛠️ Available Tools

### 1. Database Reset Utilities (Backend)

**File**: `src/utils/database/reset.js`

**Functions**:

#### `clearTransactionalData()` ⚠️
Clears all operational data while keeping configuration.

**Deletes**:
- ✅ Sales and sale items
- ✅ Payments (customer & supplier)
- ✅ Customer/supplier transactions
- ✅ Inventory movements
- ✅ Batches and sheets
- ✅ Expenses

**Keeps**:
- ✅ Users
- ✅ Company profile
- ✅ Customers
- ✅ Suppliers
- ✅ System settings (currencies, payment methods, metal types, etc.)

**Use Case**: Clean up test sales and inventory while keeping your customer/supplier lists

---

#### `clearMasterData()` 🔴
Clears all master data and transactional data.

**Deletes**:
- ✅ Everything from `clearTransactionalData()`
- ✅ Customers
- ✅ Suppliers

**Keeps**:
- ✅ Users
- ✅ Company profile
- ✅ System settings

**Use Case**: Complete data reset while keeping system configuration

---

#### `resetDatabaseToInitialState()` 🔴
Resets database to factory state.

**Deletes**:
- ✅ All transactional data
- ✅ All master data (customers, suppliers)
- ✅ Custom expense categories

**Keeps**:
- ✅ Users
- ✅ Company profile
- ✅ System settings (currencies, payment methods, metal types, etc.)

**Restores**:
- ✅ Default expense categories

**Use Case**: Fresh start while keeping company info and users

---

#### `deleteStoredDatabase()` ☠️ DANGEROUS
Completely removes database from browser storage.

**Deletes**:
- ❌ EVERYTHING (including users and company profile)

**Result**:
- Page reload creates a completely fresh database
- Requires full system setup again

**Use Case**: Complete system reset, testing fresh installation

---

#### `exportDatabaseToJSON()` 📦
Exports complete database backup.

**Exports**:
- All tables to JSON format
- Includes metadata (date, user, version)
- Full data preservation

**Use Case**: Backup before major changes

---

#### `getDatabaseStats()` 📊
Gets record counts for all tables.

**Returns**:
- Count of records in each table
- Table labels in Arabic
- Useful for verification

---

### 2. Database Reset UI Component

**File**: `src/components/features/settings/DatabaseResetSection.jsx`

**Features**:
- ✅ Visual database statistics
- ✅ Export backup button
- ✅ Four reset options with confirmation dialogs
- ✅ Success/error notifications
- ✅ Warning messages

---

## 📝 How to Use

### Option 1: Using the UI (Recommended)

**Steps**:

1. **Add to Settings Tab** (if not already added):
   ```jsx
   // In src/components/tabs/SettingsTab.jsx
   import DatabaseResetSection from '../features/settings/DatabaseResetSection';

   // Add in your settings sections:
   <DatabaseResetSection onDataReset={() => {
     // Refresh any data displays
     loadAllData();
   }} />
   ```

2. **Navigate**: Open Settings Tab → Find "صيانة قاعدة البيانات" section

3. **Review Statistics**: Check how many records exist in each table

4. **Export Backup** (IMPORTANT):
   - Click "تصدير نسخة احتياطية (JSON)"
   - Save the file somewhere safe

5. **Choose Reset Option**:
   - **حذف البيانات التشغيلية** - Clear sales/inventory only
   - **حذف البيانات الأساسية** - Clear customers/suppliers too
   - **إعادة تعيين كاملة** - Reset to factory state
   - **حذف من التخزين المحلي** - Complete wipe (DANGEROUS)

6. **Confirm**: Click "نعم، متأكد" in the confirmation dialog

7. **Verify**: Check statistics table to confirm deletion

---

### Option 2: Using Browser Console

**Steps**:

1. Open browser developer tools (F12)

2. Go to Console tab

3. Run the desired command:

```javascript
// Import functions
import {
  clearTransactionalData,
  clearMasterData,
  resetDatabaseToInitialState,
  exportDatabaseToJSON,
  getDatabaseStats
} from './src/utils/database/reset.js';

// Check current stats
const stats = getDatabaseStats();
console.table(stats);

// Export backup first!
const backup = exportDatabaseToJSON();
console.log('Backup:', backup);

// Clear transactional data only
const result = clearTransactionalData();
console.log(result);

// OR reset to initial state
const result2 = resetDatabaseToInitialState();
console.log(result2);

// Check stats again
const newStats = getDatabaseStats();
console.table(newStats);
```

---

### Option 3: Using Code (For Testing)

```javascript
// In your test setup or component
import { resetDatabaseToInitialState } from './utils/database/reset';

function setupTestEnvironment() {
  // Reset database
  const result = resetDatabaseToInitialState();

  if (result.success) {
    console.log('Database reset successful');
    // Now add test data
    addTestCustomers();
    addTestProducts();
    addTestSales();
  } else {
    console.error('Reset failed:', result.error);
  }
}
```

---

## ⚠️ Important Warnings

### Before Any Reset:

1. **ALWAYS EXPORT BACKUP FIRST** ✅
   - Use `exportDatabaseToJSON()` or UI export button
   - Save the JSON file
   - Test that you can open and read it

2. **UNDERSTAND WHAT YOU'RE DELETING** ⚠️
   - Read the function description carefully
   - Check database statistics
   - Confirm you have backups

3. **TEST IN DEVELOPMENT FIRST** 🧪
   - Try reset on test data
   - Verify expected behavior
   - Then apply to real data

4. **CANNOT BE UNDONE** 🚫
   - Deletes are permanent
   - No undo/redo
   - Only backup can restore data

---

## 🔄 Common Scenarios

### Scenario 1: Testing New Features

**Need**: Clean transactional data, keep master data

**Solution**:
```javascript
clearTransactionalData();
// Keeps customers, suppliers, settings
// Deletes sales, inventory, payments
```

**Then**: Add test sales, test inventory, etc.

---

### Scenario 2: New Year / Accounting Period

**Need**: Archive old data, start fresh

**Steps**:
1. Export full backup (archive 2024 data)
2. `resetDatabaseToInitialState()`
3. Re-import customers/suppliers if needed
4. Start new year transactions

---

### Scenario 3: Complete Fresh Start

**Need**: Reset everything like new installation

**Steps**:
1. Export backup (if needed)
2. `deleteStoredDatabase()`
3. Reload page
4. Go through setup wizard
5. Configure company, users, settings

---

### Scenario 4: Before Demo/Presentation

**Need**: Clean data, professional examples

**Steps**:
1. `resetDatabaseToInitialState()`
2. Add professional demo customers
3. Add sample products
4. Add realistic sales data
5. Export as "demo database"

---

## 📊 What Gets Deleted - Detailed Table

| Function | Users | Company | Settings | Customers | Suppliers | Sales | Inventory | Payments | Expenses |
|----------|-------|---------|----------|-----------|-----------|-------|-----------|----------|----------|
| `clearTransactionalData()` | ✅ Keep | ✅ Keep | ✅ Keep | ✅ Keep | ✅ Keep | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete |
| `clearMasterData()` | ✅ Keep | ✅ Keep | ✅ Keep | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete |
| `resetDatabaseToInitialState()` | ✅ Keep | ✅ Keep | ✅ Keep | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete |
| `deleteStoredDatabase()` | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete |

---

## 🧪 Testing Workflow

### Complete Test Cycle:

```javascript
// 1. Export current state
const backup = exportDatabaseToJSON();
saveToFile(backup.data, 'pre-test-backup.json');

// 2. Check current state
const beforeStats = getDatabaseStats();
console.table(beforeStats);

// 3. Reset to clean state
const resetResult = resetDatabaseToInitialState();
console.log('Reset:', resetResult.message);

// 4. Verify clean state
const afterStats = getDatabaseStats();
console.table(afterStats);
// Should show 0 for sales, customers, suppliers, etc.

// 5. Add test data
addTestCustomer('Test Customer 1');
addTestCustomer('Test Customer 2');
addTestSupplier('Test Supplier 1');

// 6. Run your tests
runTests();

// 7. After tests, reset again if needed
resetDatabaseToInitialState();
```

---

## 🎯 Best Practices

### DO ✅

- ✅ Always export backup before reset
- ✅ Check statistics before and after
- ✅ Use least destructive option first
- ✅ Test reset on sample data
- ✅ Document what you're doing
- ✅ Keep exported backups organized by date

### DON'T ❌

- ❌ Reset without backup
- ❌ Use `deleteStoredDatabase()` unless absolutely needed
- ❌ Reset production data without user consent
- ❌ Forget to verify reset was successful
- ❌ Ignore warning messages

---

## 📦 Backup File Format

**Exported JSON structure**:
```json
{
  "exportDate": "2025-01-09T12:00:00.000Z",
  "exportedBy": "admin",
  "version": "2.0.0",
  "tables": {
    "users": [ /* user records */ ],
    "customers": [ /* customer records */ ],
    "sales": [ /* sales records */ ],
    // ... all tables
  }
}
```

**File size**: Typically 100KB - 5MB depending on data volume

---

## 🔧 Troubleshooting

### Issue: "Database not initialized"

**Solution**: Wait for app to fully load, then try again

### Issue: Reset doesn't seem to work

**Solution**:
1. Check browser console for errors
2. Verify `getDatabaseStats()` shows expected counts
3. Try page reload
4. Check if localStorage is full

### Issue: Can't export backup

**Solution**:
1. Check browser console for errors
2. Try smaller date range
3. Clear browser cache
4. Use Firefox/Chrome (better JSON support)

### Issue: Reset deletes but data reappears

**Solution**:
1. Check if multiple tabs are open
2. Verify `saveDatabase()` is being called
3. Check localStorage quota
4. Try hard refresh (Ctrl+F5)

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review `src/utils/database/reset.js` source code
3. Check browser console for error messages
4. Test with sample data first

---

**Created**: 2025-01-09
**Version**: 2.0.0
**Status**: ✅ Production Ready
