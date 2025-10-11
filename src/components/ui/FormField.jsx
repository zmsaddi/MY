import { TextField, FormControl, FormLabel, FormHelperText, Box } from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from '../../contexts/TranslationContext';
import { designTokens } from '../../theme/tokens';

export const FormField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  type = 'text',
  multiline = false,
  rows = 4,
  placeholder,
  fullWidth = true,
  autoFocus = false,
  inputProps = {},
  sx = {},
  ...props
}) => {
  const { t } = useTranslation();
  const hasError = Boolean(error);

  return (
    <FormControl fullWidth={fullWidth} error={hasError} sx={{ mb: 2, ...sx }}>
      {label && (
        <FormLabel
          htmlFor={name}
          required={required}
          sx={{
            mb: 0.5,
            fontSize: designTokens.typography.fontSize.sm,
            fontWeight: designTokens.typography.fontWeight.medium,
            color: hasError ? 'error.main' : 'text.primary',
            '& .MuiFormLabel-asterisk': {
              color: 'error.main',
              marginInlineStart: '4px',
            },
          }}
        >
          {label}
        </FormLabel>
      )}

      <TextField
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={hasError}
        disabled={disabled}
        type={type}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        placeholder={placeholder}
        fullWidth={fullWidth}
        autoFocus={autoFocus}
        required={required}
        variant="outlined"
        size="small"
        inputProps={{
          'aria-label': label,
          'aria-required': required,
          'aria-invalid': hasError,
          'aria-describedby': helperText || error ? `${name}-helper-text` : undefined,
          style: {
            minHeight: 44,
          },
          ...inputProps,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.md,
            '&:focus-within': {
              outline: `2px solid ${designTokens.colors.primary.main}`,
              outlineOffset: 2,
            },
          },
          '& input, & textarea': {
            fontSize: designTokens.typography.fontSize.base,
          },
        }}
        {...props}
      />

      {(helperText || error) && (
        <FormHelperText
          id={`${name}-helper-text`}
          error={hasError}
          sx={{
            mt: 0.5,
            fontSize: designTokens.typography.fontSize.xs,
            marginInlineStart: 0,
          }}
        >
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
  autoFocus: PropTypes.bool,
  inputProps: PropTypes.object,
  sx: PropTypes.object,
};

export default FormField;
