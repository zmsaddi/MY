// src/components/common/forms/FormField.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { TextField, FormHelperText } from '@mui/material';

/**
 * Standardized form field with consistent validation and error handling
 * @param {string} label - Field label
 * @param {string} value - Field value
 * @param {Function} onChange - Change handler
 * @param {string} error - Error message
 * @param {boolean} required - Is field required
 * @param {string} type - Input type
 * @param {boolean} disabled - Is field disabled
 * @param {string} helperText - Helper text
 * @param {boolean} multiline - Multiline input
 * @param {number} rows - Number of rows for multiline
 */
function FormField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  type = 'text',
  disabled = false,
  helperText,
  multiline = false,
  rows = 1,
  fullWidth = true,
  size = 'small',
  placeholder,
  InputProps,
  ...otherProps
}) {
  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  // Auto-shrink label for date fields and fields with values to prevent overlap
  const shouldShrink = type === 'date' || type === 'datetime-local' || type === 'number' || !!value;
  const inputLabelProps = shouldShrink ? { shrink: true } : undefined;

  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      label={label}
      name={name}
      value={value || ''}
      onChange={handleChange}
      error={!!error}
      helperText={error || helperText}
      required={required}
      type={type}
      disabled={disabled}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      placeholder={placeholder}
      InputProps={InputProps}
      InputLabelProps={inputLabelProps}
      {...otherProps}
    />
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  helperText: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  placeholder: PropTypes.string,
  InputProps: PropTypes.object,
};

export default FormField;
