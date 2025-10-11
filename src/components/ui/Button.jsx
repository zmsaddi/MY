import { Button as MuiButton } from '@mui/material';
import PropTypes from 'prop-types';
import { designTokens } from '../../theme/tokens';

export const Button = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  sx = {},
  ...props
}) => {
  const sizeMap = {
    small: { height: 32, px: 2, fontSize: '0.8125rem' },
    medium: { height: 40, px: 3, fontSize: '0.875rem' },
    large: { height: 48, px: 4, fontSize: '0.9375rem' },
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      onClick={onClick}
      type={type}
      sx={{
        minHeight: dimensions.height,
        px: dimensions.px,
        fontSize: dimensions.fontSize,
        borderRadius: designTokens.borderRadius.md,
        fontWeight: designTokens.typography.fontWeight.semibold,
        textTransform: 'none',
        boxShadow: 'none',
        minWidth: 44,
        '&:hover': {
          boxShadow: designTokens.shadows.sm,
        },
        '&:focus-visible': {
          outline: `2px solid ${designTokens.colors.primary.main}`,
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        ...sx,
      }}
      {...props}
    >
      {loading ? 'جاري التحميل...' : children}
    </MuiButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  sx: PropTypes.object,
};

export default Button;
