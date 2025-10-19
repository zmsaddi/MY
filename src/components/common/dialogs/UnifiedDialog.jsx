import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import { useTranslation } from '../../../hooks/useTranslation';

const variantConfig = {
  info: { palette: 'info', Icon: InfoOutlinedIcon },
  success: { palette: 'success', Icon: CheckCircleOutlineIcon },
  warning: { palette: 'warning', Icon: WarningAmberRoundedIcon },
  error: { palette: 'error', Icon: ErrorOutlineIcon },
  confirm: { palette: 'primary', Icon: HelpOutlineIcon },
  destructive: { palette: 'error', Icon: ReportGmailerrorredIcon }
};

export default function UnifiedDialog({
  open,
  onClose,
  variant = 'info',
  title,
  description = '',
  children = null,
  primaryAction = null,
  secondaryAction = null,
  extraActions = [],
  maxWidth = 'sm',
  allowBackdropClose = true,
  allowEscapeClose = true,
  requireAcknowledgement = false,
  acknowledgementLabel,
  icon = null
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
    }
  }, [open]);

  const config = useMemo(() => {
    return variantConfig[variant] ?? variantConfig.info;
  }, [variant]);

  const paletteColor = theme.palette[config.palette]?.main || theme.palette.info.main;
  const iconColor = paletteColor;
  const iconBackground = alpha(paletteColor, 0.12);
  const effectiveAllowBackdrop = variant === 'destructive' ? false : allowBackdropClose;
  const effectiveAllowEscape = variant === 'destructive' ? false : allowEscapeClose;

  const handleDialogClose = (event, reason) => {
    if (!effectiveAllowBackdrop && reason === 'backdropClick') return;
    if (!effectiveAllowEscape && reason === 'escapeKeyDown') return;

    // Blur active element to prevent aria-hidden focus warning
    requestAnimationFrame(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    onClose?.(event, reason);
  };

  const handleManualClose = (event) => {
    if (primaryAction?.loading) return;

    // Blur the close button to prevent aria-hidden focus warning
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    onClose?.(event, 'manual');
  };

  const primaryColor = primaryAction?.color || (variant === 'destructive' ? 'error' : config.palette);
  const primaryVariant = primaryAction?.variant || 'contained';
  const secondaryColor = secondaryAction?.color || 'inherit';
  const secondaryVariant = secondaryAction?.variant || 'outlined';

  const primaryDisabled =
    (!primaryAction || primaryAction.disabled) ||
    (primaryAction?.loading ?? false) ||
    (requireAcknowledgement && !acknowledged);

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth={maxWidth}
      fullWidth
      disableEscapeKeyDown={!effectiveAllowEscape}
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: theme.shadows[variant === 'destructive' ? 10 : 6]
          }
        }
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {onClose && (
            <IconButton size="small" onClick={handleManualClose} disabled={primaryAction?.loading}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 0, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: iconBackground,
              color: iconColor,
              flexShrink: 0
            }}
          >
            {icon || <config.Icon sx={{ fontSize: 28 }} />}
          </Box>
          <Box sx={{ flex: 1 }}>
            {description ? (
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {description}
              </Typography>
            ) : null}
            {children ? (
              <Box sx={{ mt: description ? 2.5 : 0 }}>
                {children}
              </Box>
            ) : null}
            {requireAcknowledgement ? (
              <FormControlLabel
                sx={{ mt: 2.5 }}
                control={
                  <Checkbox
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                }
                label={acknowledgementLabel || t('common.confirmAction')}
              />
            ) : null}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-start'
        }}
      >
        {primaryAction ? (
          <Button
            onClick={async (event) => {
              if (primaryAction.onClick) {
                await primaryAction.onClick(event);
              }
            }}
            variant={primaryVariant}
            color={primaryColor}
            disabled={primaryDisabled}
            sx={{ minWidth: 140, borderRadius: 2 }}
          >
            {primaryAction.loading ? (primaryAction.loadingLabel || t('common.processing')) : primaryAction.label}
          </Button>
        ) : null}
        {secondaryAction ? (
          <Button
            onClick={(event) => {
              if (secondaryAction.onClick) {
                secondaryAction.onClick(event);
              } else {
                handleManualClose(event);
              }
            }}
            variant={secondaryVariant}
            color={secondaryColor}
            disabled={secondaryAction.disabled}
            sx={{ minWidth: 140, borderRadius: 2 }}
          >
            {secondaryAction.label}
          </Button>
        ) : null}
        {extraActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant || 'text'}
            color={action.color || 'primary'}
            disabled={action.disabled}
            sx={{ minWidth: 140, borderRadius: 2 }}
          >
            {action.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}

UnifiedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error', 'confirm', 'destructive']),
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    color: PropTypes.string,
    variant: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    loadingLabel: PropTypes.string
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    color: PropTypes.string,
    variant: PropTypes.string,
    disabled: PropTypes.bool
  }),
  extraActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      color: PropTypes.string,
      variant: PropTypes.string,
      disabled: PropTypes.bool
    })
  ),
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  allowBackdropClose: PropTypes.bool,
  allowEscapeClose: PropTypes.bool,
  requireAcknowledgement: PropTypes.bool,
  acknowledgementLabel: PropTypes.string,
  icon: PropTypes.node
};
