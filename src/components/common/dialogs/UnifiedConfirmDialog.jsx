import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  Divider
} from '@mui/material';
import { useState } from 'react';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function UnifiedConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  confirmColor = 'primary',
  loading = false,
  requireTextConfirm = false,
  confirmWord = ''
}) {
  const [textInput, setTextInput] = useState('');
  const isConfirmDisabled = requireTextConfirm ? textInput !== confirmWord : false;
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
      case 'error':
        return <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ fontSize: 48, color: 'info.main' }} />;
    }
  };

  const handleConfirm = async (event) => {
    // Blur the button to prevent aria-hidden focus warning
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleClose = (event, reason) => {
    // Blur active element to prevent aria-hidden focus warning
    requestAnimationFrame(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    // Reset text input when closing
    setTextInput('');
    onClose?.(event, reason);
  };

  const handleManualClose = (event) => {
    if (loading) return;

    // Blur the close button
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    onClose?.(event, 'manual');
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // CRITICAL FIX: Prevent closing when clicking outside (backdrop)
        // Only allow closing via escape key or explicit close button
        if (reason === 'backdropClick') {
          return;
        }
        handleClose(event, reason);
      }}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      disableEscapeKeyDown={loading}
      PaperProps={{
        sx: {
          borderRadius: 4,
          m: { xs: 2, sm: 3 },
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          minHeight: '280px'
        }
      }}
    >
      <DialogTitle sx={{
        pb: 3,
        pt: 4,
        px: 4,
        backgroundColor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.65rem' },
              color: 'text.primary'
            }}
          >
            {title}
          </Typography>
          <IconButton
            size="large"
            onClick={handleManualClose}
            disabled={loading}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CloseIcon fontSize="medium" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        px: 4,
        py: 4,
        minHeight: '180px',
        maxHeight: 'calc(90vh - 280px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          {getIcon()}
          <Typography
            variant="body1"
            sx={{
              mt: 3,
              textAlign: 'center',
              color: 'text.primary',
              lineHeight: 1.9,
              whiteSpace: 'pre-line',
              fontSize: '1.2rem',
              fontWeight: 500,
              maxWidth: '600px'
            }}
          >
            {message}
          </Typography>

          {requireTextConfirm && (
            <TextField
              fullWidth
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`اكتب "${confirmWord}" للتأكيد`}
              sx={{
                mt: 4,
                maxWidth: '500px',
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.15rem',
                  borderRadius: 2,
                  '& fieldset': {
                    borderWidth: 2
                  },
                  '&:hover fieldset': {
                    borderWidth: 2
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: 2
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.15rem',
                  padding: '14px 16px',
                  fontWeight: 500
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '1rem',
                  marginTop: 1,
                  fontWeight: 500
                }
              }}
              size="medium"
              autoFocus
              error={textInput.length > 0 && textInput !== confirmWord}
              helperText={
                textInput.length > 0 && textInput !== confirmWord
                  ? `يجب كتابة "${confirmWord}" بالضبط`
                  : ''
              }
            />
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{
        px: 4,
        py: 3,
        gap: 2,
        backgroundColor: 'grey.50'
      }}>
        <Button
          onClick={(e) => {
            e.currentTarget.blur();
            onClose?.(e);
          }}
          variant="outlined"
          fullWidth
          size="large"
          disabled={loading}
          sx={{
            borderRadius: 2.5,
            fontSize: '1.1rem',
            py: 1.5,
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          fullWidth
          size="large"
          disabled={loading || isConfirmDisabled}
          sx={{
            borderRadius: 2.5,
            fontSize: '1.1rem',
            py: 1.5,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'جاري المعالجة...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UnifiedConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['warning', 'error', 'info']),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string,
  loading: PropTypes.bool,
  requireTextConfirm: PropTypes.bool,
  confirmWord: PropTypes.string
};
