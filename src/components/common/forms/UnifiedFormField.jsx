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
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontWeight: 500,
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {label}
          {required && (
            <Typography component="span" sx={{ color: 'error.main', fontSize: '1.2rem' }}>
              *
            </Typography>
          )}
        </Typography>
      )}
      <TextField
        value={value}
        onChange={onChange}
        name={name}
        type={type}
        error={!!error}
        helperText={error || helperText}
        disabled={disabled}
        multiline={multiline}
        rows={rows}
        fullWidth={fullWidth}
        autoFocus={autoFocus}
        required={required}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
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
