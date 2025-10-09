// src/utils/validation/inputSanitizer.js
/**
 * Comprehensive Input Sanitization and Validation Module
 * Prevents SQL Injection and other security vulnerabilities
 */

/**
 * Validates and sanitizes numeric input
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: number|null, error: string|null}
 */
export function validateNumber(value, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    positive = false,
    allowNull = false
  } = options;

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    if (allowNull) {
      return { valid: true, value: null, error: null };
    }
    return { valid: false, value: null, error: 'القيمة مطلوبة' };
  }

  // Convert to number
  const num = Number(value);

  // Check if valid number
  if (isNaN(num)) {
    return { valid: false, value: null, error: 'القيمة يجب أن تكون رقم' };
  }

  // Check integer requirement
  if (integer && !Number.isInteger(num)) {
    return { valid: false, value: null, error: 'القيمة يجب أن تكون عدد صحيح' };
  }

  // Check positive requirement
  if (positive && num <= 0) {
    return { valid: false, value: null, error: 'القيمة يجب أن تكون موجبة' };
  }

  // Check range
  if (num < min) {
    return { valid: false, value: null, error: `القيمة يجب أن تكون أكبر من أو تساوي ${min}` };
  }
  if (num > max) {
    return { valid: false, value: null, error: `القيمة يجب أن تكون أقل من أو تساوي ${max}` };
  }

  return { valid: true, value: num, error: null };
}

/**
 * Validates and sanitizes string input
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: string|null, error: string|null}
 */
export function validateString(value, options = {}) {
  const {
    minLength = 0,
    maxLength = 1000,
    pattern = null,
    allowNull = false,
    trim = true,
    allowedChars = null,
    blockSqlKeywords = true
  } = options;

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    if (allowNull) {
      return { valid: true, value: null, error: null };
    }
    return { valid: false, value: null, error: 'القيمة مطلوبة' };
  }

  // Convert to string and trim if needed
  let str = String(value);
  if (trim) {
    str = str.trim();
  }

  // Check length
  if (str.length < minLength) {
    return { valid: false, value: null, error: `الطول يجب أن يكون ${minLength} حرف على الأقل` };
  }
  if (str.length > maxLength) {
    return { valid: false, value: null, error: `الطول يجب أن لا يتجاوز ${maxLength} حرف` };
  }

  // Check pattern if provided
  if (pattern && !pattern.test(str)) {
    return { valid: false, value: null, error: 'القيمة لا تطابق النمط المطلوب' };
  }

  // Check allowed characters
  if (allowedChars && !new RegExp(`^[${allowedChars}]+$`).test(str)) {
    return { valid: false, value: null, error: 'القيمة تحتوي على أحرف غير مسموحة' };
  }

  // Block SQL keywords for security
  if (blockSqlKeywords) {
    const sqlKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'CREATE', 'ALTER',
      'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', '/*', '*/', 'XP_', 'SP_'
    ];

    const upperStr = str.toUpperCase();
    for (const keyword of sqlKeywords) {
      if (upperStr.includes(keyword)) {
        return { valid: false, value: null, error: 'القيمة تحتوي على كلمات محظورة' };
      }
    }
  }

  return { valid: true, value: str, error: null };
}

/**
 * Validates date input
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: string|null, error: string|null}
 */
export function validateDate(value, options = {}) {
  const {
    minDate = null,
    maxDate = new Date(),
    allowFuture = false,
    allowNull = false
  } = options;

  // Handle null/undefined
  if (!value) {
    if (allowNull) {
      return { valid: true, value: null, error: null };
    }
    return { valid: false, value: null, error: 'التاريخ مطلوب' };
  }

  // Parse date
  const date = new Date(value);

  // Check if valid date
  if (isNaN(date.getTime())) {
    return { valid: false, value: null, error: 'التاريخ غير صحيح' };
  }

  // Check future dates
  if (!allowFuture && date > new Date()) {
    return { valid: false, value: null, error: 'التاريخ لا يمكن أن يكون في المستقبل' };
  }

  // Check date range
  if (minDate && date < new Date(minDate)) {
    return { valid: false, value: null, error: `التاريخ يجب أن يكون بعد ${minDate}` };
  }
  if (maxDate && date > new Date(maxDate)) {
    return { valid: false, value: null, error: `التاريخ يجب أن يكون قبل ${maxDate}` };
  }

  // Return ISO format
  return { valid: true, value: date.toISOString().split('T')[0], error: null };
}

/**
 * Validates email input
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: string|null, error: string|null}
 */
export function validateEmail(value, options = {}) {
  const { allowNull = true } = options;

  // Handle null/undefined
  if (!value) {
    if (allowNull) {
      return { valid: true, value: null, error: null };
    }
    return { valid: false, value: null, error: 'البريد الإلكتروني مطلوب' };
  }

  const email = String(value).toLowerCase().trim();

  // Basic email pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(email)) {
    return { valid: false, value: null, error: 'البريد الإلكتروني غير صحيح' };
  }

  // Additional security checks
  if (email.length > 254) {
    return { valid: false, value: null, error: 'البريد الإلكتروني طويل جداً' };
  }

  return { valid: true, value: email, error: null };
}

/**
 * Validates phone number input
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: string|null, error: string|null}
 */
export function validatePhone(value, options = {}) {
  const { allowNull = true } = options;

  // Handle null/undefined
  if (!value) {
    if (allowNull) {
      return { valid: true, value: null, error: null };
    }
    return { valid: false, value: null, error: 'رقم الهاتف مطلوب' };
  }

  // Remove spaces and special characters except + and digits
  const phone = String(value).replace(/[^\d+]/g, '');

  // Check length (minimum 7 digits for local, up to 15 for international)
  if (phone.length < 7 || phone.length > 15) {
    return { valid: false, value: null, error: 'رقم الهاتف غير صحيح' };
  }

  return { valid: true, value: phone, error: null };
}

/**
 * Validates currency code
 * @param {any} value - The value to validate
 * @returns {Object} {valid: boolean, value: string|null, error: string|null}
 */
export function validateCurrencyCode(value) {
  const allowedCurrencies = ['USD', 'SYP', 'EUR', 'AED', 'SAR', 'TRY'];

  if (!value || !allowedCurrencies.includes(String(value).toUpperCase())) {
    return { valid: false, value: null, error: 'رمز العملة غير صحيح' };
  }

  return { valid: true, value: String(value).toUpperCase(), error: null };
}

/**
 * Validates array of items
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: array|null, error: string|null}
 */
export function validateArray(value, options = {}) {
  const {
    minLength = 0,
    maxLength = 1000,
    allowNull = false
  } = options;

  // Handle null/undefined
  if (!value) {
    if (allowNull) {
      return { valid: true, value: null, error: null };
    }
    return { valid: false, value: null, error: 'القائمة مطلوبة' };
  }

  // Check if array
  if (!Array.isArray(value)) {
    return { valid: false, value: null, error: 'القيمة يجب أن تكون قائمة' };
  }

  // Check length
  if (value.length < minLength) {
    return { valid: false, value: null, error: `القائمة يجب أن تحتوي على ${minLength} عنصر على الأقل` };
  }
  if (value.length > maxLength) {
    return { valid: false, value: null, error: `القائمة يجب أن لا تتجاوز ${maxLength} عنصر` };
  }

  return { valid: true, value: value, error: null };
}

/**
 * Validates ID (must be positive integer)
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: number|null, error: string|null}
 */
export function validateId(value, options = {}) {
  const { allowNull = false } = options;

  return validateNumber(value, {
    min: 1,
    integer: true,
    positive: true,
    allowNull
  });
}

/**
 * Validates username
 * @param {any} value - The value to validate
 * @returns {Object} {valid: boolean, value: string|null, error: string|null}
 */
export function validateUsername(value) {
  return validateString(value, {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    allowNull: false,
    blockSqlKeywords: true
  });
}

/**
 * Main validation function for any field
 * @param {string} fieldType - Type of field to validate
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {Object} {valid: boolean, value: any, error: string|null}
 */
export function validateField(fieldType, value, options = {}) {
  switch (fieldType) {
    case 'number':
      return validateNumber(value, options);
    case 'string':
      return validateString(value, options);
    case 'date':
      return validateDate(value, options);
    case 'email':
      return validateEmail(value, options);
    case 'phone':
      return validatePhone(value, options);
    case 'currency':
      return validateCurrencyCode(value);
    case 'array':
      return validateArray(value, options);
    case 'id':
      return validateId(value, options);
    case 'username':
      return validateUsername(value);
    default:
      return { valid: false, value: null, error: 'نوع الحقل غير معروف' };
  }
}

/**
 * Batch validation for multiple fields
 * @param {Object} fields - Object with field definitions
 * @param {Object} data - Data to validate
 * @returns {Object} {valid: boolean, errors: Object, sanitized: Object}
 */
export function validateMultiple(fields, data) {
  const errors = {};
  const sanitized = {};
  let valid = true;

  for (const [key, config] of Object.entries(fields)) {
    const { type, options = {} } = config;
    const result = validateField(type, data[key], options);

    if (!result.valid) {
      errors[key] = result.error;
      valid = false;
    } else {
      sanitized[key] = result.value;
    }
  }

  return { valid, errors, sanitized };
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return String(text).replace(/[&<>"'\/]/g, (s) => map[s]);
}

export default {
  validateNumber,
  validateString,
  validateDate,
  validateEmail,
  validatePhone,
  validateCurrencyCode,
  validateArray,
  validateId,
  validateUsername,
  validateField,
  validateMultiple,
  escapeHtml
};