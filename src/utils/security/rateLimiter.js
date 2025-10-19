// src/utils/security/rateLimiter.js
// Rate Limiting Module for API and Database Operations

/**
 * Rate limiter configuration
 */
const DEFAULT_CONFIG = {
  // Login attempts
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 30 * 60 * 1000, // 30 minutes block
    message: 'Too many login attempts, please try again later'
  },
  // API requests
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests, please slow down'
  },
  // Database operations
  database: {
    maxOperations: 50,
    windowMs: 1000, // 1 second
    message: 'Database operation rate limit exceeded'
  },
  // File uploads
  upload: {
    maxUploads: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Upload limit exceeded'
  },
  // Password reset
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Too many password reset attempts'
  }
};

/**
 * Storage for rate limit data
 */
class RateLimitStore {
  constructor() {
    this.store = new Map();
    this.blockedKeys = new Map();

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get or create entry for a key
   * @param {string} key
   */
  getEntry(key) {
    if (!this.store.has(key)) {
      this.store.set(key, {
        attempts: [],
        firstAttempt: Date.now(),
        blocked: false
      });
    }
    return this.store.get(key);
  }

  /**
   * Record an attempt
   * @param {string} key
   */
  recordAttempt(key) {
    const entry = this.getEntry(key);
    entry.attempts.push(Date.now());
    return entry;
  }

  /**
   * Check if key is blocked
   * @param {string} key
   */
  isBlocked(key) {
    const blockInfo = this.blockedKeys.get(key);
    if (!blockInfo) return false;

    // Check if block has expired
    if (Date.now() > blockInfo.expiresAt) {
      this.blockedKeys.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Block a key
   * @param {string} key
   * @param {number} duration - Block duration in milliseconds
   */
  block(key, duration) {
    this.blockedKeys.set(key, {
      blockedAt: Date.now(),
      expiresAt: Date.now() + duration
    });
  }

  /**
   * Unblock a key
   * @param {string} key
   */
  unblock(key) {
    this.blockedKeys.delete(key);
    this.store.delete(key);
  }

  /**
   * Clean expired attempts from a key's history
   * @param {string} key
   * @param {number} windowMs
   */
  cleanExpiredAttempts(key, windowMs) {
    const entry = this.store.get(key);
    if (!entry) return;

    const now = Date.now();
    entry.attempts = entry.attempts.filter(
      timestamp => now - timestamp < windowMs
    );

    if (entry.attempts.length === 0) {
      this.store.delete(key);
    }
  }

  /**
   * Clean up all expired entries
   */
  cleanup() {
    const now = Date.now();

    // Clean expired blocks
    for (const [key, blockInfo] of this.blockedKeys) {
      if (now > blockInfo.expiresAt) {
        this.blockedKeys.delete(key);
      }
    }

    // Clean old attempt records (older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    for (const [key, entry] of this.store) {
      if (now - entry.firstAttempt > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      totalKeys: this.store.size,
      blockedKeys: this.blockedKeys.size,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        attempts: entry.attempts.length,
        firstAttempt: new Date(entry.firstAttempt).toISOString()
      })),
      blocked: Array.from(this.blockedKeys.entries()).map(([key, info]) => ({
        key,
        blockedAt: new Date(info.blockedAt).toISOString(),
        expiresAt: new Date(info.expiresAt).toISOString()
      }))
    };
  }
}

/**
 * Main Rate Limiter class
 */
class RateLimiter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new RateLimitStore();
  }

  /**
   * Generate rate limit key
   * @param {string} type - Type of rate limit (login, api, etc.)
   * @param {string} identifier - User identifier (IP, username, etc.)
   */
  generateKey(type, identifier) {
    return `${type}:${identifier}`;
  }

  /**
   * Check if action is allowed
   * @param {string} type - Type of rate limit
   * @param {string} identifier - User identifier
   */
  async checkLimit(type, identifier) {
    const config = this.config[type];
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const key = this.generateKey(type, identifier);

    // Check if blocked
    if (this.store.isBlocked(key)) {
      const blockInfo = this.store.blockedKeys.get(key);
      const remainingTime = Math.ceil((blockInfo.expiresAt - Date.now()) / 1000);

      return {
        allowed: false,
        blocked: true,
        message: config.message,
        retryAfter: remainingTime,
        reason: 'blocked'
      };
    }

    // Clean expired attempts
    this.store.cleanExpiredAttempts(key, config.windowMs);

    // Get current attempts
    const entry = this.store.getEntry(key);
    const recentAttempts = entry.attempts.filter(
      timestamp => Date.now() - timestamp < config.windowMs
    );

    // Check limit
    const limit = config.maxAttempts || config.maxRequests || config.maxOperations || config.maxUploads;

    if (recentAttempts.length >= limit) {
      // Block if configured
      if (config.blockDuration) {
        this.store.block(key, config.blockDuration);
      }

      return {
        allowed: false,
        blocked: !!config.blockDuration,
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
        reason: 'rate_limit',
        attempts: recentAttempts.length,
        limit
      };
    }

    return {
      allowed: true,
      remaining: limit - recentAttempts.length,
      limit,
      resetAt: recentAttempts.length > 0
        ? new Date(recentAttempts[0] + config.windowMs).toISOString()
        : null
    };
  }

  /**
   * Record an action
   * @param {string} type
   * @param {string} identifier
   * @param {boolean} success - Whether the action was successful
   */
  async recordAction(type, identifier, success = true) {
    const config = this.config[type];
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const key = this.generateKey(type, identifier);

    // Record attempt
    this.store.recordAttempt(key);

    // For login attempts, reset on successful login
    if (type === 'login' && success) {
      this.store.unblock(key);
    }

    return {
      recorded: true,
      key,
      timestamp: Date.now()
    };
  }

  /**
   * Reset rate limit for a key
   * @param {string} type
   * @param {string} identifier
   */
  reset(type, identifier) {
    const key = this.generateKey(type, identifier);
    this.store.unblock(key);
    return { reset: true, key };
  }

  /**
   * Get current status for a key
   * @param {string} type
   * @param {string} identifier
   */
  getStatus(type, identifier) {
    const config = this.config[type];
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const key = this.generateKey(type, identifier);
    const entry = this.store.store.get(key);
    const isBlocked = this.store.isBlocked(key);
    const limit = config.maxAttempts || config.maxRequests || config.maxOperations || config.maxUploads;

    if (!entry) {
      return {
        key,
        attempts: 0,
        limit,
        blocked: false,
        remaining: limit
      };
    }

    // Count recent attempts
    const recentAttempts = entry.attempts.filter(
      timestamp => Date.now() - timestamp < config.windowMs
    );

    return {
      key,
      attempts: recentAttempts.length,
      limit,
      blocked: isBlocked,
      remaining: Math.max(0, limit - recentAttempts.length),
      firstAttempt: entry.firstAttempt,
      lastAttempt: entry.attempts[entry.attempts.length - 1] || null
    };
  }

  /**
   * Middleware for Express/API routes
   * @param {string} type
   */
  middleware(type = 'api') {
    return async (req, res, next) => {
      // Get identifier (IP address or user ID)
      const identifier = req.user?.id || req.ip || 'unknown';

      try {
        const result = await this.checkLimit(type, identifier);

        if (!result.allowed) {
          // Set rate limit headers
          res.setHeader('X-RateLimit-Limit', result.limit || 0);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', new Date(Date.now() + (result.retryAfter * 1000)).toISOString());

          if (result.retryAfter) {
            res.setHeader('Retry-After', result.retryAfter);
          }

          return res.status(429).json({
            error: 'Too Many Requests',
            message: result.message,
            retryAfter: result.retryAfter
          });
        }

        // Record the action
        await this.recordAction(type, identifier);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', result.limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);

        if (result.resetAt) {
          res.setHeader('X-RateLimit-Reset', result.resetAt);
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // Don't block on error
        next();
      }
    };
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return this.store.getStats();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Login rate limiter wrapper
 * @param {string} username
 * @param {boolean} success
 */
export async function checkLoginAttempt(username, success = false) {
  if (success) {
    await rateLimiter.recordAction('login', username, true);
    return { allowed: true };
  }

  const check = await rateLimiter.checkLimit('login', username);
  if (check.allowed) {
    await rateLimiter.recordAction('login', username, false);
  }
  return check;
}

/**
 * API rate limiter wrapper
 * @param {string} identifier
 */
export async function checkAPILimit(identifier) {
  const check = await rateLimiter.checkLimit('api', identifier);
  if (check.allowed) {
    await rateLimiter.recordAction('api', identifier);
  }
  return check;
}

/**
 * Database operation rate limiter
 * @param {string} operation
 * @param {string} userId
 */
export async function checkDatabaseLimit(operation, userId = 'system') {
  const identifier = `${operation}:${userId}`;
  const check = await rateLimiter.checkLimit('database', identifier);
  if (check.allowed) {
    await rateLimiter.recordAction('database', identifier);
  }
  return check;
}

/**
 * Password reset rate limiter
 * @param {string} email
 */
export async function checkPasswordResetLimit(email) {
  const check = await rateLimiter.checkLimit('passwordReset', email);
  if (check.allowed) {
    await rateLimiter.recordAction('passwordReset', email);
  }
  return check;
}

// Export the singleton instance and helpers
export { rateLimiter, RateLimiter, RateLimitStore };

export default {
  rateLimiter,
  checkLoginAttempt,
  checkAPILimit,
  checkDatabaseLimit,
  checkPasswordResetLimit,
  middleware: (type) => rateLimiter.middleware(type)
};