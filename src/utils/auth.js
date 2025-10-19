// src/utils/auth.js
// Session management and authentication utilities

const SESSION_KEY = 'metalsheets_current_user';
const LAST_ACTIVITY_KEY = 'metalsheets_last_activity';
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

/* ============================================
   SESSION MANAGEMENT
   ============================================ */

export function saveSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    updateLastActivity();
    return true;
  } catch (e) {
    console.error('Failed to save session:', e);
    return false;
  }
}

export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;

    // Check if session has expired due to inactivity
    if (isSessionExpired()) {
      clearSession();
      return null;
    }

    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to get session:', e);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear session:', e);
    return false;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function getCurrentUser() {
  const session = getSession();
  return session ? session.username : 'System';
}

export function getCurrentUserDisplay() {
  const session = getSession();
  return session ? (session.display_name || session.username) : 'System';
}

/* ============================================
   INACTIVITY TRACKING
   ============================================ */

export function updateLastActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (e) {
    console.error('Failed to update last activity:', e);
  }
}

export function getLastActivity() {
  try {
    const timestamp = localStorage.getItem(LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (e) {
    console.error('Failed to get last activity:', e);
    return null;
  }
}

export function isSessionExpired() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;

  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;

  return timeSinceLastActivity > INACTIVITY_TIMEOUT;
}

export function getRemainingTime() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return INACTIVITY_TIMEOUT;

  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;
  const remaining = INACTIVITY_TIMEOUT - timeSinceLastActivity;

  return remaining > 0 ? remaining : 0;
}
