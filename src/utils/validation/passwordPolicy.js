// src/utils/validation/passwordPolicy.js
// Password Policy and Validation Module

/**
 * Common weak passwords to block
 */
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'abc123', 'password1', 'password123', 'admin',
  'letmein', 'welcome', 'monkey', '1234', '12345',
  'dragon', 'master', 'football', 'baseball', 'iloveyou',
  'trustno1', 'sunshine', 'princess', 'starwars', 'whatever',
  'shadow', 'cheese', 'computer', 'chocolate', 'soccer',
  'password1234', 'qwerty123', 'admin123', 'pass', 'passw0rd'
];

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  preventSequential: true,
  preventRepeating: true
};

/**
 * Check if password contains sequential characters
 * @param {string} password
 * @returns {boolean}
 */
function hasSequentialChars(password) {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba',
    '01234567890',
    '09876543210',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ];

  const lowerPass = password.toLowerCase();

  for (const seq of sequences) {
    for (let i = 0; i <= lowerPass.length - 3; i++) {
      const chunk = lowerPass.substring(i, i + 3);
      if (seq.includes(chunk)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if password has repeating characters
 * @param {string} password
 * @returns {boolean}
 */
function hasRepeatingChars(password) {
  // Check for same character repeated 3+ times
  return /(.)\1{2,}/.test(password);
}

/**
 * Calculate password entropy (bits)
 * @param {string} password
 * @returns {number}
 */
function calculateEntropy(password) {
  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  const entropy = password.length * Math.log2(charsetSize);
  return Math.round(entropy);
}

/**
 * Get password strength score (0-100)
 * @param {string} password
 * @returns {number}
 */
function getStrengthScore(password) {
  let score = 0;

  // Length scoring (max 30 points)
  const lengthScore = Math.min(30, (password.length / 20) * 30);
  score += lengthScore;

  // Complexity scoring (max 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Entropy scoring (max 30 points)
  const entropy = calculateEntropy(password);
  const entropyScore = Math.min(30, (entropy / 100) * 30);
  score += entropyScore;

  // Penalties
  if (hasSequentialChars(password)) score -= 15;
  if (hasRepeatingChars(password)) score -= 15;
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) score = Math.min(score, 10);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get strength level from score
 * @param {number} score
 * @returns {string}
 */
function getStrengthLevel(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'weak';
  return 'very_weak';
}

/**
 * Validate password against policy
 * @param {string} password
 * @param {Object} options
 * @returns {Object}
 */
export function validatePassword(password, options = {}) {
  const requirements = { ...PASSWORD_REQUIREMENTS, ...options };
  const errors = [];
  const warnings = [];

  // Check if password exists
  if (!password) {
    return {
      valid: false,
      errors: ['Password is required'],
      warnings: [],
      strength: { score: 0, level: 'very_weak', entropy: 0 }
    };
  }

  // Type check
  if (typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Password must be a string'],
      warnings: [],
      strength: { score: 0, level: 'very_weak', entropy: 0 }
    };
  }

  // Length validation
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Character requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Security checks
  if (requirements.preventCommonPasswords) {
    const lowerPass = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPass)) {
      errors.push('This password is too common. Please choose a more unique password');
    }
  }

  if (requirements.preventSequential && hasSequentialChars(password)) {
    warnings.push('Password contains sequential characters which reduces security');
  }

  if (requirements.preventRepeating && hasRepeatingChars(password)) {
    warnings.push('Password contains repeating characters which reduces security');
  }

  // Check against user information if provided
  if (requirements.preventUserInfo && options.userInfo) {
    const { username, email, fullName } = options.userInfo;
    const lowerPass = password.toLowerCase();

    if (username && lowerPass.includes(username.toLowerCase())) {
      errors.push('Password should not contain your username');
    }

    if (email) {
      const emailPart = email.split('@')[0].toLowerCase();
      if (lowerPass.includes(emailPart)) {
        errors.push('Password should not contain parts of your email');
      }
    }

    if (fullName) {
      const nameParts = fullName.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length > 2 && lowerPass.includes(part)) {
          errors.push('Password should not contain parts of your name');
          break;
        }
      }
    }
  }

  // Calculate strength
  const score = getStrengthScore(password);
  const level = getStrengthLevel(score);
  const entropy = calculateEntropy(password);

  // Add warning for weak passwords
  if (score < 60 && errors.length === 0) {
    warnings.push('Consider using a stronger password for better security');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    strength: {
      score,
      level,
      entropy,
      feedback: getStrengthFeedback(level)
    }
  };
}

/**
 * Get feedback message based on strength level
 * @param {string} level
 * @returns {string}
 */
function getStrengthFeedback(level) {
  const feedback = {
    strong: 'Excellent! This is a strong password.',
    good: 'Good password, but could be stronger.',
    fair: 'Fair password. Consider adding more complexity.',
    weak: 'Weak password. Please add more characters and variety.',
    very_weak: 'Very weak password. This password is not secure.'
  };

  return feedback[level] || 'Unknown strength level';
}

/**
 * Generate a strong random password
 * @param {Object} options
 * @returns {string}
 */
export function generateSecurePassword(options = {}) {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecialChars = true,
    excludeAmbiguous = true
  } = options;

  let charset = '';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Build charset
  if (includeLowercase) charset += excludeAmbiguous ? lowercase.replace(/[l]/g, '') : lowercase;
  if (includeUppercase) charset += excludeAmbiguous ? uppercase.replace(/[IO]/g, '') : uppercase;
  if (includeNumbers) charset += excludeAmbiguous ? numbers.replace(/[01]/g, '') : numbers;
  if (includeSpecialChars) charset += special;

  if (!charset) {
    throw new Error('At least one character type must be included');
  }

  // Generate password
  let password = '';
  const crypto = typeof window !== 'undefined' && window.crypto ? window.crypto : null;

  if (crypto) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
  } else {
    // Fallback for non-browser environments
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
  }

  // Ensure at least one character from each required type
  let finalPassword = password;
  if (includeLowercase && !/[a-z]/.test(finalPassword)) {
    const char = lowercase[Math.floor(Math.random() * lowercase.length)];
    const pos = Math.floor(Math.random() * finalPassword.length);
    finalPassword = finalPassword.substring(0, pos) + char + finalPassword.substring(pos + 1);
  }

  if (includeUppercase && !/[A-Z]/.test(finalPassword)) {
    const char = uppercase[Math.floor(Math.random() * uppercase.length)];
    const pos = Math.floor(Math.random() * finalPassword.length);
    finalPassword = finalPassword.substring(0, pos) + char + finalPassword.substring(pos + 1);
  }

  if (includeNumbers && !/[0-9]/.test(finalPassword)) {
    const char = numbers[Math.floor(Math.random() * numbers.length)];
    const pos = Math.floor(Math.random() * finalPassword.length);
    finalPassword = finalPassword.substring(0, pos) + char + finalPassword.substring(pos + 1);
  }

  if (includeSpecialChars && !/[^a-zA-Z0-9]/.test(finalPassword)) {
    const char = special[Math.floor(Math.random() * special.length)];
    const pos = Math.floor(Math.random() * finalPassword.length);
    finalPassword = finalPassword.substring(0, pos) + char + finalPassword.substring(pos + 1);
  }

  return finalPassword;
}

/**
 * Check if password needs to be changed
 * @param {Date} lastChanged
 * @param {number} maxAgeDays
 * @returns {boolean}
 */
export function passwordNeedsChange(lastChanged, maxAgeDays = 90) {
  if (!lastChanged) return true;

  const now = new Date();
  const changed = new Date(lastChanged);
  const diffDays = Math.floor((now - changed) / (1000 * 60 * 60 * 24));

  return diffDays >= maxAgeDays;
}

/**
 * Check if user is using default password
 * @param {string} password
 * @param {string} defaultPassword
 * @returns {boolean}
 */
export function isUsingDefaultPassword(password, defaultPassword) {
  if (!password || !defaultPassword) return false;
  return password === defaultPassword;
}

/**
 * Get password change requirements message
 * @param {Object} requirements
 * @returns {string}
 */
export function getPasswordRequirementsMessage(requirements = PASSWORD_REQUIREMENTS) {
  const messages = [];

  messages.push(`• At least ${requirements.minLength} characters`);

  if (requirements.requireUppercase) {
    messages.push('• At least one uppercase letter (A-Z)');
  }

  if (requirements.requireLowercase) {
    messages.push('• At least one lowercase letter (a-z)');
  }

  if (requirements.requireNumbers) {
    messages.push('• At least one number (0-9)');
  }

  if (requirements.requireSpecialChars) {
    messages.push('• At least one special character (!@#$%^&*...)');
  }

  if (requirements.preventCommonPasswords) {
    messages.push('• Not a common password');
  }

  if (requirements.preventUserInfo) {
    messages.push('• Should not contain your username or email');
  }

  return messages.join('\n');
}

export default {
  validatePassword,
  generateSecurePassword,
  passwordNeedsChange,
  isUsingDefaultPassword,
  getPasswordRequirementsMessage,
  PASSWORD_REQUIREMENTS
};