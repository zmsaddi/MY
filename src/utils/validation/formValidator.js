// src/utils/validation/formValidator.js
// Comprehensive Form Validation Module

import {
  validateNumber,
  validateString,
  validateEmail,
  validatePhone,
  validateDate
} from './inputSanitizer.js';

/**
 * Customer Form Validation
 */
export function validateCustomerForm(data) {
  const errors = {};
  const sanitized = {};

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'اسم العميل مطلوب (حرفان على الأقل)';
  } else {
    sanitized.name = validateString(data.name, {
      minLength: 2,
      maxLength: 100,
      sqlSafe: true
    });
  }

  // Phone validation
  if (data.phone) {
    const phoneResult = validatePhone(data.phone);
    if (!phoneResult.valid) {
      errors.phone = phoneResult.error;
    } else {
      sanitized.phone = phoneResult.value;
    }
  } else {
    sanitized.phone = '';
  }

  // Address validation
  if (data.address) {
    sanitized.address = validateString(data.address, {
      maxLength: 255,
      sqlSafe: true
    });
  } else {
    sanitized.address = '';
  }

  // Email validation
  if (data.email) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) {
      errors.email = emailResult.error;
    } else {
      sanitized.email = emailResult.value;
    }
  } else {
    sanitized.email = '';
  }

  // Tax Number validation
  if (data.tax_number) {
    sanitized.tax_number = validateString(data.tax_number, {
      maxLength: 50,
      pattern: /^[A-Z0-9-]+$/i,
      sqlSafe: true
    });
  } else {
    sanitized.tax_number = '';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Supplier Form Validation
 */
export function validateSupplierForm(data) {
  const errors = {};
  const sanitized = {};

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'اسم المورد مطلوب (حرفان على الأقل)';
  } else {
    sanitized.name = validateString(data.name, {
      minLength: 2,
      maxLength: 100,
      sqlSafe: true
    });
  }

  // Phone validation
  if (data.phone) {
    const phoneResult = validatePhone(data.phone);
    if (!phoneResult.valid) {
      errors.phone = phoneResult.error;
    } else {
      sanitized.phone = phoneResult.value;
    }
  } else {
    sanitized.phone = '';
  }

  // Address validation
  if (data.address) {
    sanitized.address = validateString(data.address, {
      maxLength: 255,
      sqlSafe: true
    });
  } else {
    sanitized.address = '';
  }

  // Email validation
  if (data.email) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) {
      errors.email = emailResult.error;
    } else {
      sanitized.email = emailResult.value;
    }
  } else {
    sanitized.email = '';
  }

  // Tax Number validation
  if (data.tax_number) {
    sanitized.tax_number = validateString(data.tax_number, {
      maxLength: 50,
      pattern: /^[A-Z0-9-]+$/i,
      sqlSafe: true
    });
  } else {
    sanitized.tax_number = '';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Inventory Form Validation
 */
export function validateInventoryForm(data) {
  const errors = {};
  const sanitized = {};

  // Sheet Type validation
  if (!data.type || data.type.trim().length < 2) {
    errors.type = 'نوع اللوح مطلوب';
  } else {
    sanitized.type = validateString(data.type, {
      minLength: 2,
      maxLength: 50,
      sqlSafe: true
    });
  }

  // Thickness validation
  const thickness = validateNumber(data.thickness, {
    min: 0.1,
    max: 100,
    allowNull: false
  });
  if (thickness === null) {
    errors.thickness = 'السماكة مطلوبة (0.1 - 100 مم)';
  } else {
    sanitized.thickness = thickness;
  }

  // Width validation
  const width = validateNumber(data.width, {
    min: 1,
    max: 10000,
    allowNull: false
  });
  if (width === null) {
    errors.width = 'العرض مطلوب (1 - 10000 مم)';
  } else {
    sanitized.width = width;
  }

  // Length validation
  const length = validateNumber(data.length, {
    min: 1,
    max: 20000,
    allowNull: false
  });
  if (length === null) {
    errors.length = 'الطول مطلوب (1 - 20000 مم)';
  } else {
    sanitized.length = length;
  }

  // Quantity validation
  const quantity = validateNumber(data.quantity, {
    min: 0,
    integer: true,
    allowNull: false
  });
  if (quantity === null) {
    errors.quantity = 'الكمية مطلوبة';
  } else {
    sanitized.quantity = quantity;
  }

  // Price validation
  const price = validateNumber(data.price_per_sheet, {
    min: 0,
    allowNull: false
  });
  if (price === null) {
    errors.price_per_sheet = 'السعر مطلوب';
  } else {
    sanitized.price_per_sheet = price;
  }

  // Weight validation
  if (data.weight_per_sheet !== undefined && data.weight_per_sheet !== '') {
    const weight = validateNumber(data.weight_per_sheet, {
      min: 0,
      allowNull: true
    });
    sanitized.weight_per_sheet = weight;
  }

  // Location validation
  if (data.location) {
    sanitized.location = validateString(data.location, {
      maxLength: 100,
      sqlSafe: true
    });
  } else {
    sanitized.location = '';
  }

  // Notes validation
  if (data.notes) {
    sanitized.notes = validateString(data.notes, {
      maxLength: 500,
      sqlSafe: true
    });
  } else {
    sanitized.notes = '';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Expense Form Validation
 */
export function validateExpenseForm(data) {
  const errors = {};
  const sanitized = {};

  // Description validation
  if (!data.description || data.description.trim().length < 3) {
    errors.description = 'وصف المصروف مطلوب (3 أحرف على الأقل)';
  } else {
    sanitized.description = validateString(data.description, {
      minLength: 3,
      maxLength: 255,
      sqlSafe: true
    });
  }

  // Amount validation
  const amount = validateNumber(data.amount, {
    min: 0.01,
    allowNull: false
  });
  if (amount === null) {
    errors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
  } else {
    sanitized.amount = amount;
  }

  // Category validation
  if (!data.category || data.category.trim().length < 2) {
    errors.category = 'فئة المصروف مطلوبة';
  } else {
    sanitized.category = validateString(data.category, {
      minLength: 2,
      maxLength: 50,
      sqlSafe: true
    });
  }

  // Date validation
  if (data.expense_date) {
    const dateResult = validateDate(data.expense_date);
    if (!dateResult.valid) {
      errors.expense_date = dateResult.error;
    } else {
      sanitized.expense_date = dateResult.value;
    }
  } else {
    sanitized.expense_date = new Date().toISOString().split('T')[0];
  }

  // Reference validation
  if (data.reference) {
    sanitized.reference = validateString(data.reference, {
      maxLength: 100,
      sqlSafe: true
    });
  } else {
    sanitized.reference = '';
  }

  // Notes validation
  if (data.notes) {
    sanitized.notes = validateString(data.notes, {
      maxLength: 500,
      sqlSafe: true
    });
  } else {
    sanitized.notes = '';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Payment Form Validation
 */
export function validatePaymentForm(data) {
  const errors = {};
  const sanitized = {};

  // Amount validation
  const amount = validateNumber(data.amount, {
    min: 0.01,
    allowNull: false
  });
  if (amount === null) {
    errors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
  } else {
    sanitized.amount = amount;
  }

  // Payment Method validation
  if (!data.payment_method) {
    errors.payment_method = 'طريقة الدفع مطلوبة';
  } else {
    const validMethods = ['cash', 'bank', 'check', 'card'];
    if (!validMethods.includes(data.payment_method)) {
      errors.payment_method = 'طريقة دفع غير صالحة';
    } else {
      sanitized.payment_method = data.payment_method;
    }
  }

  // Payment Date validation
  if (data.payment_date) {
    const dateResult = validateDate(data.payment_date);
    if (!dateResult.valid) {
      errors.payment_date = dateResult.error;
    } else {
      sanitized.payment_date = dateResult.value;
    }
  } else {
    sanitized.payment_date = new Date().toISOString().split('T')[0];
  }

  // Reference Number validation
  if (data.reference_number) {
    sanitized.reference_number = validateString(data.reference_number, {
      maxLength: 100,
      sqlSafe: true
    });
  } else {
    sanitized.reference_number = '';
  }

  // Notes validation
  if (data.notes) {
    sanitized.notes = validateString(data.notes, {
      maxLength: 500,
      sqlSafe: true
    });
  } else {
    sanitized.notes = '';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * User Form Validation
 */
export function validateUserForm(data) {
  const errors = {};
  const sanitized = {};

  // Username validation
  if (!data.username || data.username.trim().length < 3) {
    errors.username = 'اسم المستخدم مطلوب (3 أحرف على الأقل)';
  } else {
    // Username should be alphanumeric with underscores only
    const username = data.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      errors.username = 'اسم المستخدم يجب أن يكون أحرف إنجليزية وأرقام فقط (3-30 حرف)';
    } else {
      sanitized.username = username;
    }
  }

  // Display Name validation
  if (!data.display_name || data.display_name.trim().length < 2) {
    errors.display_name = 'الاسم المعروض مطلوب (حرفان على الأقل)';
  } else {
    sanitized.display_name = validateString(data.display_name, {
      minLength: 2,
      maxLength: 100,
      sqlSafe: true
    });
  }

  // Password validation (only for new users)
  if (data.password !== undefined) {
    // Password policy is handled separately in passwordPolicy.js
    // Here we just do basic checks
    if (!data.password || data.password.length < 8) {
      errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else {
      sanitized.password = data.password; // Don't modify password
    }
  }

  // Role validation
  if (data.role) {
    const validRoles = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(data.role)) {
      errors.role = 'دور غير صالح';
    } else {
      sanitized.role = data.role;
    }
  }

  // Active status validation
  if (data.is_active !== undefined) {
    sanitized.is_active = Boolean(data.is_active);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Settings Form Validation
 */
export function validateSettingsForm(data) {
  const errors = {};
  const sanitized = {};

  // Company Name validation
  if (data.company_name) {
    sanitized.company_name = validateString(data.company_name, {
      minLength: 2,
      maxLength: 200,
      sqlSafe: true
    });
  }

  // VAT Rate validation
  if (data.vat_rate !== undefined) {
    const vatRate = validateNumber(data.vat_rate, {
      min: 0,
      max: 100,
      allowNull: false
    });
    if (vatRate === null) {
      errors.vat_rate = 'نسبة الضريبة يجب أن تكون بين 0 و 100';
    } else {
      sanitized.vat_rate = vatRate;
    }
  }

  // Currency validation
  if (data.currency) {
    sanitized.currency = validateString(data.currency, {
      maxLength: 10,
      pattern: /^[A-Z]{3}$/,
      sqlSafe: true
    });
  }

  // Density validation
  if (data.material_density !== undefined) {
    const density = validateNumber(data.material_density, {
      min: 0.1,
      max: 50,
      allowNull: false
    });
    if (density === null) {
      errors.material_density = 'الكثافة يجب أن تكون بين 0.1 و 50';
    } else {
      sanitized.material_density = density;
    }
  }

  // Exchange Rate validation
  if (data.exchange_rate !== undefined) {
    const rate = validateNumber(data.exchange_rate, {
      min: 0.0001,
      allowNull: false
    });
    if (rate === null) {
      errors.exchange_rate = 'سعر الصرف يجب أن يكون أكبر من صفر';
    } else {
      sanitized.exchange_rate = rate;
    }
  }

  // Backup Settings validation
  if (data.auto_backup !== undefined) {
    sanitized.auto_backup = Boolean(data.auto_backup);
  }

  if (data.backup_interval !== undefined) {
    const interval = validateNumber(data.backup_interval, {
      min: 1,
      max: 30,
      integer: true,
      allowNull: false
    });
    if (interval === null) {
      errors.backup_interval = 'فترة النسخ الاحتياطي يجب أن تكون بين 1 و 30 يوم';
    } else {
      sanitized.backup_interval = interval;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Generic form validation wrapper
 */
export function validateForm(formType, data) {
  switch (formType) {
    case 'customer':
      return validateCustomerForm(data);
    case 'supplier':
      return validateSupplierForm(data);
    case 'inventory':
      return validateInventoryForm(data);
    case 'expense':
      return validateExpenseForm(data);
    case 'payment':
      return validatePaymentForm(data);
    case 'user':
      return validateUserForm(data);
    case 'settings':
      return validateSettingsForm(data);
    default:
      return {
        valid: false,
        errors: { form: 'نوع النموذج غير معروف' },
        data: {}
      };
  }
}

/**
 * Batch validation for multiple items
 */
export function validateBatch(items, validator) {
  const results = [];
  const allErrors = [];
  let allValid = true;

  items.forEach((item, index) => {
    const result = validator(item);
    results.push(result);

    if (!result.valid) {
      allValid = false;
      allErrors.push({
        index,
        errors: result.errors
      });
    }
  });

  return {
    valid: allValid,
    results,
    errors: allErrors,
    validItems: results.filter(r => r.valid).map(r => r.data),
    invalidCount: allErrors.length
  };
}

/**
 * Real-time validation helper
 */
export function createFieldValidator(fieldName, validationRules) {
  return (value) => {
    const errors = [];

    // Required check
    if (validationRules.required && !value) {
      errors.push(`${fieldName} مطلوب`);
    }

    // Type checks
    if (value && validationRules.type) {
      switch (validationRules.type) {
        case 'number':
          const numVal = validateNumber(value, validationRules);
          if (numVal === null) {
            errors.push(`${fieldName} يجب أن يكون رقم صالح`);
          }
          break;
        case 'email':
          const emailResult = validateEmail(value);
          if (!emailResult.valid) {
            errors.push(emailResult.error);
          }
          break;
        case 'phone':
          const phoneResult = validatePhone(value);
          if (!phoneResult.valid) {
            errors.push(phoneResult.error);
          }
          break;
        case 'date':
          const dateResult = validateDate(value);
          if (!dateResult.valid) {
            errors.push(dateResult.error);
          }
          break;
      }
    }

    // Custom validation
    if (validationRules.custom) {
      const customError = validationRules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };
}

export default {
  validateCustomerForm,
  validateSupplierForm,
  validateInventoryForm,
  validateExpenseForm,
  validatePaymentForm,
  validateUserForm,
  validateSettingsForm,
  validateForm,
  validateBatch,
  createFieldValidator
};