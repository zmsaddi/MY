// src/utils/textFieldHelpers.js

/**
 * TextField Helper Utilities
 * Provides standardized props for Material-UI TextField components
 * to prevent label overlap issues
 */

/**
 * Get standardized props for date input fields
 * Prevents label overlap by ensuring label always shrinks
 */
export function getDateFieldProps() {
  return {
    type: 'date',
    InputLabelProps: {
      shrink: true,
    },
  };
}

/**
 * Get standardized props for number input fields
 * Use when field has initial value or is in an edit form
 */
export function getNumberFieldProps(hasValue = false) {
  return hasValue
    ? {
        type: 'number',
        InputLabelProps: {
          shrink: true,
        },
      }
    : {
        type: 'number',
      };
}

/**
 * Get standardized props for currency input fields
 * Always shrinks label for proper currency symbol display
 */
export function getCurrencyFieldProps() {
  return {
    type: 'number',
    InputLabelProps: {
      shrink: true,
    },
  };
}

/**
 * Get standardized props for text fields with values
 * Use in edit forms where value is pre-filled
 */
export function getTextFieldProps(hasValue = false) {
  return hasValue
    ? {
        InputLabelProps: {
          shrink: true,
        },
      }
    : {};
}

/**
 * Check if a field should have shrink label
 * Based on field type and whether it has a value
 */
export function shouldShrinkLabel(type, value) {
  // Always shrink for date fields
  if (type === 'date') return true;

  // Always shrink for datetime-local
  if (type === 'datetime-local') return true;

  // Shrink if value exists
  if (value !== undefined && value !== null && value !== '') return true;

  return false;
}

/**
 * Get complete TextField props based on type and value
 * One-stop function for all TextField needs
 */
export function getTextFieldPropsAuto(type = 'text', value = null) {
  const shrink = shouldShrinkLabel(type, value);

  const props = {
    type,
  };

  if (shrink) {
    props.InputLabelProps = {
      shrink: true,
    };
  }

  return props;
}
