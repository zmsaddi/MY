# Quick Database Reset Reference

## 🚀 To Clean Database Before Testing

### Method 1: Browser Console (Fastest)

1. Open browser (F12)
2. Paste this code:

```javascript
// Import reset utility
import { resetDatabaseToInitialState, getDatabaseStats } from './src/utils/database/reset.js';

// Check before
console.table(getDatabaseStats());

// Reset
const result = resetDatabaseToInitialState();
console.log(result.message);

// Check after
console.table(getDatabaseStats());

// Reload page
window.location.reload();
```

---

### Method 2: localStorage Manual Delete

1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Find LocalStorage → your domain
4. Delete key: `metalsheets_database`
5. Reload page (F5)

---

## 📊 Quick Reset Functions

| Function | What it does | Safety |
|----------|--------------|--------|
| `clearTransactionalData()` | Deletes sales, inventory, payments. Keeps customers/suppliers | ⚠️ Medium |
| `resetDatabaseToInitialState()` | Deletes all data. Keeps users & company settings | 🔴 High |
| `deleteStoredDatabase()` | Deletes EVERYTHING from localStorage | ☠️ DANGER |

---

## ✅ Before ANY Reset

```bash
# ALWAYS do this first:
1. Export backup (downloadable JSON)
2. Verify backup file exists
3. Then proceed with reset
```

---

## 🎯 Most Common Use Case

**Clean database before testing**:

```javascript
import { resetDatabaseToInitialState } from './src/utils/database/reset.js';

resetDatabaseToInitialState();
// Now add your test data
```

---

## 📁 Files Created

- `src/utils/database/reset.js` - Reset functions
- `src/components/features/settings/DatabaseResetSection.jsx` - UI component
- `DATABASE_RESET_GUIDE.md` - Full guide (read this for details)

---

**Quick Tip**: For testing, use `resetDatabaseToInitialState()` → keeps users, deletes all data
