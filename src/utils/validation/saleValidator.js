// src/utils/validation/saleValidator.js
/**
 * Comprehensive Sale Validation Module
 * Validates all sale-related data before processing
 */

import {
  validateString,
  validateNumber,
  validateDate,
  validateId,
  validateCurrencyCode,
  validateArray
} from './inputSanitizer.js';

/**
 * Validates sale data before processing
 * @param {Object} saleData - Sale data to validate
 * @returns {Object} {valid: boolean, errors: Object, sanitized: Object}
 */
export function validateSaleData(saleData) {
  const errors = {};
  const sanitized = {};

  // Basic sale data validation
  if (!saleData || typeof saleData !== 'object') {
    return {
      valid: false,
      errors: { general: 'بيانات البيع غير صحيحة' },
      sanitized: null
    };
  }

  // Validate invoice number
  const invoiceResult = validateString(saleData.invoice_number, {
    minLength: 1,
    maxLength: 50,
    allowNull: false,
    pattern: /^[A-Z0-9\-\/]+$/i
  });
  if (!invoiceResult.valid) {
    errors.invoice_number = invoiceResult.error;
  } else {
    sanitized.invoice_number = invoiceResult.value;
  }

  // Validate customer ID (optional)
  if (saleData.customer_id) {
    const customerResult = validateId(saleData.customer_id, { allowNull: true });
    if (!customerResult.valid) {
      errors.customer_id = customerResult.error;
    } else {
      sanitized.customer_id = customerResult.value;
    }
  } else {
    sanitized.customer_id = null;
  }

  // Validate sale date
  const dateResult = validateDate(saleData.sale_date, {
    allowFuture: false,
    minDate: '2020-01-01'
  });
  if (!dateResult.valid) {
    errors.sale_date = dateResult.error;
  } else {
    sanitized.sale_date = dateResult.value;
  }

  // Validate currency code
  if (saleData.currency_code) {
    const currencyResult = validateCurrencyCode(saleData.currency_code);
    if (!currencyResult.valid) {
      errors.currency_code = currencyResult.error;
    } else {
      sanitized.currency_code = currencyResult.value;
    }
  } else {
    sanitized.currency_code = 'USD'; // Default
  }

  // Validate discount (optional)
  if (saleData.discount !== undefined && saleData.discount !== null) {
    const discountResult = validateNumber(saleData.discount, {
      min: 0,
      allowNull: true
    });
    if (!discountResult.valid) {
      errors.discount = discountResult.error;
    } else {
      sanitized.discount = discountResult.value || 0;
    }
  } else {
    sanitized.discount = 0;
  }

  // Validate amount paid (optional)
  if (saleData.amount_paid !== undefined && saleData.amount_paid !== null) {
    const amountResult = validateNumber(saleData.amount_paid, {
      min: 0,
      allowNull: true
    });
    if (!amountResult.valid) {
      errors.amount_paid = amountResult.error;
    } else {
      sanitized.amount_paid = amountResult.value || 0;
    }
  } else {
    sanitized.amount_paid = 0;
  }

  // Validate payment method
  if (saleData.payment_method) {
    const methodResult = validateString(saleData.payment_method, {
      maxLength: 50,
      allowNull: true,
      blockSqlKeywords: true
    });
    if (!methodResult.valid) {
      errors.payment_method = methodResult.error;
    } else {
      sanitized.payment_method = methodResult.value;
    }
  } else {
    sanitized.payment_method = 'Cash';
  }

  // Validate notes (optional)
  if (saleData.notes) {
    const notesResult = validateString(saleData.notes, {
      maxLength: 500,
      allowNull: true,
      blockSqlKeywords: true
    });
    if (!notesResult.valid) {
      errors.notes = notesResult.error;
    } else {
      sanitized.notes = notesResult.value;
    }
  } else {
    sanitized.notes = null;
  }

  // Validate items array
  const itemsResult = validateArray(saleData.items, {
    minLength: 1,
    maxLength: 100
  });
  if (!itemsResult.valid) {
    errors.items = itemsResult.error;
  } else {
    // Validate each item
    const validatedItems = [];
    let itemsValid = true;

    for (let i = 0; i < saleData.items.length; i++) {
      const item = saleData.items[i];
      const itemValidation = validateSaleItem(item);

      if (!itemValidation.valid) {
        errors[`item_${i}`] = itemValidation.errors;
        itemsValid = false;
      } else {
        validatedItems.push(itemValidation.sanitized);
      }
    }

    if (itemsValid) {
      sanitized.items = validatedItems;
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { valid: isValid, errors, sanitized: isValid ? sanitized : null };
}

/**
 * Validates a single sale item
 * @param {Object} item - Sale item to validate
 * @returns {Object} {valid: boolean, errors: Object, sanitized: Object}
 */
export function validateSaleItem(item) {
  const errors = {};
  const sanitized = {};

  if (!item || typeof item !== 'object') {
    return {
      valid: false,
      errors: { general: 'بيانات العنصر غير صحيحة' },
      sanitized: null
    };
  }

  // Validate item type
  const validTypes = ['material', 'service'];
  if (!validTypes.includes(item.item_type)) {
    sanitized.item_type = 'material'; // Default
  } else {
    sanitized.item_type = item.item_type;
  }

  if (sanitized.item_type === 'material') {
    // Validate material item
    if (item.sheet_id) {
      const sheetResult = validateId(item.sheet_id);
      if (!sheetResult.valid) {
        errors.sheet_id = sheetResult.error;
      } else {
        sanitized.sheet_id = sheetResult.value;
      }
    }

    if (item.batch_id) {
      const batchResult = validateId(item.batch_id);
      if (!batchResult.valid) {
        errors.batch_id = batchResult.error;
      } else {
        sanitized.batch_id = batchResult.value;
      }
    }

    // Validate quantity
    const qtyResult = validateNumber(item.quantity, {
      min: 1,
      integer: true,
      positive: true
    });
    if (!qtyResult.valid) {
      errors.quantity = qtyResult.error;
    } else {
      sanitized.quantity = qtyResult.value;
    }

    // Validate unit price
    const priceResult = validateNumber(item.unit_price, {
      min: 0,
      positive: true
    });
    if (!priceResult.valid) {
      errors.unit_price = priceResult.error;
    } else {
      sanitized.unit_price = priceResult.value;
    }

    // Validate dimensions if provided
    if (item.custom_length) {
      const lengthResult = validateNumber(item.custom_length, {
        min: 1,
        positive: true
      });
      if (!lengthResult.valid) {
        errors.custom_length = lengthResult.error;
      } else {
        sanitized.custom_length = lengthResult.value;
      }
    }

    if (item.custom_width) {
      const widthResult = validateNumber(item.custom_width, {
        min: 1,
        positive: true
      });
      if (!widthResult.valid) {
        errors.custom_width = widthResult.error;
      } else {
        sanitized.custom_width = widthResult.value;
      }
    }

    sanitized.is_custom_size = item.is_custom_size || false;

  } else if (sanitized.item_type === 'service') {
    // Validate service item
    if (item.service_type_id) {
      const serviceResult = validateId(item.service_type_id);
      if (!serviceResult.valid) {
        errors.service_type_id = serviceResult.error;
      } else {
        sanitized.service_type_id = serviceResult.value;
      }
    }

    // Validate service price
    const priceResult = validateNumber(item.service_price, {
      min: 0
    });
    if (!priceResult.valid) {
      errors.service_price = priceResult.error;
    } else {
      sanitized.service_price = priceResult.value;
    }

    // Validate material description
    if (item.material_description) {
      const descResult = validateString(item.material_description, {
        maxLength: 200,
        allowNull: true,
        blockSqlKeywords: true
      });
      if (!descResult.valid) {
        errors.material_description = descResult.error;
      } else {
        sanitized.material_description = descResult.value;
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { valid: isValid, errors, sanitized: isValid ? sanitized : null };
}

/**
 * Validates batch data
 * @param {Object} batchData - Batch data to validate
 * @returns {Object} {valid: boolean, errors: Object, sanitized: Object}
 */
export function validateBatchData(batchData) {
  const errors = {};
  const sanitized = {};

  if (!batchData || typeof batchData !== 'object') {
    return {
      valid: false,
      errors: { general: 'بيانات الدفعة غير صحيحة' },
      sanitized: null
    };
  }

  // Validate sheet ID
  const sheetResult = validateId(batchData.sheet_id);
  if (!sheetResult.valid) {
    errors.sheet_id = sheetResult.error;
  } else {
    sanitized.sheet_id = sheetResult.value;
  }

  // Validate supplier ID (optional)
  if (batchData.supplier_id) {
    const supplierResult = validateId(batchData.supplier_id, { allowNull: true });
    if (!supplierResult.valid) {
      errors.supplier_id = supplierResult.error;
    } else {
      sanitized.supplier_id = supplierResult.value;
    }
  } else {
    sanitized.supplier_id = null;
  }

  // Validate quantity
  const qtyResult = validateNumber(batchData.quantity, {
    min: 1,
    integer: true,
    positive: true
  });
  if (!qtyResult.valid) {
    errors.quantity = qtyResult.error;
  } else {
    sanitized.quantity = qtyResult.value;
    sanitized.quantity_original = qtyResult.value;
    sanitized.quantity_remaining = qtyResult.value;
  }

  // Validate price per kg (optional)
  if (batchData.price_per_kg !== undefined && batchData.price_per_kg !== null) {
    const priceResult = validateNumber(batchData.price_per_kg, {
      min: 0,
      allowNull: true
    });
    if (!priceResult.valid) {
      errors.price_per_kg = priceResult.error;
    } else {
      sanitized.price_per_kg = priceResult.value;
    }
  } else {
    sanitized.price_per_kg = null;
  }

  // Validate total cost (optional)
  if (batchData.total_cost !== undefined && batchData.total_cost !== null) {
    const costResult = validateNumber(batchData.total_cost, {
      min: 0,
      allowNull: true
    });
    if (!costResult.valid) {
      errors.total_cost = costResult.error;
    } else {
      sanitized.total_cost = costResult.value;
    }
  } else {
    sanitized.total_cost = null;
  }

  // Validate received date
  const dateResult = validateDate(batchData.received_date, {
    allowFuture: false,
    minDate: '2020-01-01'
  });
  if (!dateResult.valid) {
    errors.received_date = dateResult.error;
  } else {
    sanitized.received_date = dateResult.value;
  }

  // Validate storage location (optional)
  if (batchData.storage_location) {
    const locationResult = validateString(batchData.storage_location, {
      maxLength: 100,
      allowNull: true,
      blockSqlKeywords: true
    });
    if (!locationResult.valid) {
      errors.storage_location = locationResult.error;
    } else {
      sanitized.storage_location = locationResult.value;
    }
  } else {
    sanitized.storage_location = null;
  }

  // Validate notes (optional)
  if (batchData.notes) {
    const notesResult = validateString(batchData.notes, {
      maxLength: 500,
      allowNull: true,
      blockSqlKeywords: true
    });
    if (!notesResult.valid) {
      errors.notes = notesResult.error;
    } else {
      sanitized.notes = notesResult.value;
    }
  } else {
    sanitized.notes = null;
  }

  const isValid = Object.keys(errors).length === 0;
  return { valid: isValid, errors, sanitized: isValid ? sanitized : null };
}

export default {
  validateSaleData,
  validateSaleItem,
  validateBatchData
};