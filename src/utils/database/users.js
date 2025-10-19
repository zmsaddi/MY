// src/utils/database/users.js
import { db, tx, saveDatabase, lastId } from './core.js';
// Use passwordAPI that runs in Electron main process (eliminates bcrypt from renderer)
import { hashPasswordSync, verifyPasswordSync } from '../security/passwordAPI.js';
import {
  validatePassword,
  generateSecurePassword,
  passwordNeedsChange,
  isUsingDefaultPassword,
  PASSWORD_REQUIREMENTS
} from '../validation/passwordPolicy.js';

/* ============================================
   PASSWORD HASHING
   ============================================ */

// Note: These functions use Electron IPC when available (main process bcrypt)
// Falls back to browser bcrypt in web/dev environment
export function hashPassword(password) {
  return hashPasswordSync(password);
}

export function verifyPassword(password, hash) {
  return verifyPasswordSync(password, hash);
}

/* ============================================
   USER OPERATIONS
   ============================================ */

export function getAllUsers() {
  try {
    const result = db.exec(`
      SELECT id, username, display_name, is_active, created_at, created_by
      FROM users
      ORDER BY username ASC
    `);

    if (!result.length) return [];

    const [columns, ...rows] = [result[0].columns, ...result[0].values];
    return rows.map(row => {
      const user = {};
      columns.forEach((col, i) => user[col] = row[i]);
      return user;
    });
  } catch (e) {
    console.error('Get users error:', e);
    return [];
  }
}

export function getUserById(id) {
  try {
    const stmt = db.prepare(`
      SELECT id, username, display_name, is_active, created_at, created_by
      FROM users WHERE id = ?
    `);
    stmt.bind([id]);

    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  } catch (e) {
    console.error('Get user by id error:', e);
    return null;
  }
}

export function getUserByUsername(username) {
  try {
    const stmt = db.prepare(`
      SELECT id, username, password_hash, display_name, is_active
      FROM users WHERE username = ? COLLATE NOCASE
    `);
    stmt.bind([username]);

    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  } catch (e) {
    console.error('Get user by username error:', e);
    return null;
  }
}

export function authenticateUser(username, password) {
  const user = getUserByUsername(username);

  if (!user) {
    return { success: false, error: 'اسم المستخدم غير موجود' };
  }

  if (!user.is_active) {
    return { success: false, error: 'هذا الحساب معطل' };
  }

  // Check if user has no password set (initial setup)
  const hasNoPassword = !user.password_hash || user.password_hash === '';

  if (hasNoPassword) {
    // Allow login without password for initial setup
    if (password && password !== '') {
      return { success: false, error: 'لم يتم تعيين كلمة مرور بعد. اترك حقل كلمة المرور فارغاً' };
    }

    // Force password change on first login
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name
      },
      requirePasswordChange: true,
      passwordWarnings: ['يجب تعيين كلمة مرور للحساب'],
      isInitialSetup: true
    };
  }

  // Normal password verification for users with passwords
  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'كلمة المرور غير صحيحة' };
  }

  // Check if password needs to be changed
  let requirePasswordChange = false;
  let passwordWarnings = [];

  // Check password strength
  const passwordValidation = validatePassword(password, {
    userInfo: { username: user.username }
  });

  if (!passwordValidation.valid || passwordValidation.strength.score < 60) {
    requirePasswordChange = true;
    passwordWarnings.push('كلمة المرور الحالية ضعيفة ويجب تغييرها');
  }

  // Check if using default password
  if (user.is_default_password) {
    requirePasswordChange = true;
    passwordWarnings.push('يجب تغيير كلمة المرور الافتراضية');
  }

  // Check password age (if last_password_change column exists)
  if (user.last_password_change) {
    if (passwordNeedsChange(user.last_password_change)) {
      requirePasswordChange = true;
      passwordWarnings.push('انتهت صلاحية كلمة المرور ويجب تغييرها');
    }
  }

  // Return user without password hash
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name
    },
    requirePasswordChange,
    passwordWarnings
  };
}

export function addUser(data, currentUser) {
  const { username, password, display_name } = data;

  // Validation
  if (!username || username.trim().length < 3) {
    throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  }

  // Validate password against policy
  const passwordValidation = validatePassword(password, {
    userInfo: {
      username: username.trim(),
      fullName: display_name
    }
  });

  if (!passwordValidation.valid) {
    throw new Error(`كلمة المرور غير صالحة:\n${passwordValidation.errors.join('\n')}`);
  }

  if (passwordValidation.strength.score < 60) {
    throw new Error('كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى');
  }

  // Check if username exists
  const existing = getUserByUsername(username);
  if (existing) {
    throw new Error('اسم المستخدم موجود مسبقاً');
  }

  tx.begin();
  try {
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, is_active, created_at, created_by)
      VALUES (?, ?, ?, 1, datetime('now'), ?)
    `);

    stmt.run([
      username.trim(),
      hashPassword(password),
      display_name || username,
      currentUser
    ]);
    stmt.free();

    const userId = lastId();
    tx.commit();
    saveDatabase();

    return { success: true, userId };
  } catch (e) {
    tx.rollback();
    throw new Error(`فشل إضافة المستخدم: ${e.message}`);
  }
}

export function updateUser(userId, data, currentUser) {
  const { display_name, is_active } = data;

  tx.begin();
  try {
    const stmt = db.prepare(`
      UPDATE users
      SET display_name = ?,
          is_active = ?,
          updated_at = datetime('now'),
          updated_by = ?
      WHERE id = ?
    `);

    stmt.run([display_name, is_active ? 1 : 0, currentUser, userId]);
    stmt.free();

    tx.commit();
    saveDatabase();

    return { success: true };
  } catch (e) {
    tx.rollback();
    throw new Error(`فشل تحديث المستخدم: ${e.message}`);
  }
}

export function changeUserPassword(userId, newPassword, currentUser) {
  // Get user info for validation
  const user = getUserById(userId);
  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  // Validate password against policy
  const passwordValidation = validatePassword(newPassword, {
    userInfo: {
      username: user.username,
      fullName: user.display_name
    }
  });

  if (!passwordValidation.valid) {
    throw new Error(`كلمة المرور غير صالحة:\n${passwordValidation.errors.join('\n')}`);
  }

  if (passwordValidation.strength.score < 60) {
    throw new Error('كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى');
  }

  tx.begin();
  try {
    const stmt = db.prepare(`
      UPDATE users
      SET password_hash = ?,
          updated_at = datetime('now'),
          updated_by = ?
      WHERE id = ?
    `);

    stmt.run([hashPassword(newPassword), currentUser, userId]);
    stmt.free();

    tx.commit();
    saveDatabase();

    return { success: true };
  } catch (e) {
    tx.rollback();
    throw new Error(`فشل تغيير كلمة المرور: ${e.message}`);
  }
}

export function deleteUser(userId) {
  // Prevent deleting the main admin user (id = 1)
  if (userId === 1) {
    throw new Error('لا يمكن حذف المستخدم الرئيسي');
  }

  tx.begin();
  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run([userId]);
    stmt.free();

    tx.commit();
    saveDatabase();

    return { success: true };
  } catch (e) {
    tx.rollback();
    throw new Error(`فشل حذف المستخدم: ${e.message}`);
  }
}
