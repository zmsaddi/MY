import { TextField, Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

export default function UnifiedFormField({
  label,
  value,
  onChange,
  name,
  type = 'text',
  required = false,
  error = null,
  helperText = '',
  disabled = false,
  multiline = false,
  rows = 1,
  fullWidth = true,
  autoFocus = false,
  ...otherProps
}) {
  // Handle number inputs with regex validation instead of type="number"
  const handleChange = (e) => {
    if (type === 'number') {
      const inputValue = e.target.value;
      // Allow empty, digits, and single decimal point
      if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
        onChange(e);
      }
    } else {
      onChange(e);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {label && (
        <Typography
          variant="body1"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '1.1rem'
          }}
        >
          {label}
          {required && (
            <Typography component="span" sx={{ color: 'error.main', fontSize: '1.3rem', fontWeight: 700 }}>
              *
            </Typography>
          )}
        </Typography>
      )}
      <TextField
        value={value}
        onChange={handleChange}
        name={name}
        type={type === 'number' ? 'text' : type}
        error={!!error}
        helperText={error || helperText}
        disabled={disabled}
        multiline={multiline}
        rows={rows}
        fullWidth={fullWidth}
        autoFocus={autoFocus}
        required={required}
        size="medium"
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
            fontSize: '1.15rem',
            borderRadius: 2,
            '& fieldset': {
              borderWidth: 2,
              borderColor: 'divider'
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
              borderWidth: 2
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
              borderColor: 'primary.main'
            },
            '&.Mui-error fieldset': {
              borderWidth: 2
            }
          },
          '& .MuiInputBase-input': {
            fontSize: '1.15rem',
            padding: '14px 16px',
            fontWeight: 500
          },
          '& .MuiInputBase-input::placeholder': {
            fontSize: '1.05rem',
            opacity: 0.6
          },
          '& .MuiFormHelperText-root': {
            fontSize: '1rem',
            marginTop: 1,
            marginLeft: 0.5,
            fontWeight: 500
          },
          // RTL support for native select - move arrow to left side
          '& .MuiNativeSelect-select': {
            paddingRight: '16px !important',
            paddingLeft: '40px !important'
          },
          '& .MuiNativeSelect-icon': {
            left: '12px',
            right: 'auto'
          }
        }}
        {...otherProps}
      />
    </Box>
  );
}

UnifiedFormField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  fullWidth: PropTypes.bool,
  autoFocus: PropTypes.bool
};
