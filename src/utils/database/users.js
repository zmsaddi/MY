// src/utils/database/users.js
import { db, tx, saveDatabase, lastId } from './core.js';
import CryptoJS from 'crypto-js';

/* ============================================
   PASSWORD HASHING
   ============================================ */

export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
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

  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'كلمة المرور غير صحيحة' };
  }

  // Return user without password hash
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name
    }
  };
}

export function addUser(data, currentUser) {
  const { username, password, display_name } = data;

  // Validation
  if (!username || username.trim().length < 3) {
    throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  }

  if (!password || password.length < 4) {
    throw new Error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
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
  if (!newPassword || newPassword.length < 4) {
    throw new Error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
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
