// src/components/common/ConfirmDialog.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Divider
} from '@mui/material';

/**
 * Confirmation dialog component
 * @param {boolean} open - Whether dialog is open
 * @param {Function} onClose - Close handler
 * @param {Function} onConfirm - Confirm handler
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmLabel - Confirm button label (default: "تأكيد")
 * @param {string} cancelLabel - Cancel button label (default: "إلغاء")
 * @param {string} confirmColor - Confirm button color (default: "error")
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'تأكيد',
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  confirmColor = 'error',
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
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
        onClose(event, reason);
      }}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 4,
          m: { xs: 2, sm: 3 },
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          minHeight: '250px'
        }
      }}
    >
      <DialogTitle sx={{
        fontSize: { xs: '1.5rem', sm: '1.65rem' },
        fontWeight: 700,
        pt: 4,
        pb: 3,
        px: 4,
        backgroundColor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{
        px: 4,
        py: 4,
        minHeight: '120px',
        maxHeight: 'calc(90vh - 280px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'background.paper'
      }}>
        <DialogContentText sx={{
          fontSize: '1.2rem',
          lineHeight: 1.9,
          color: 'text.primary',
          fontWeight: 500,
          textAlign: 'center'
        }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions sx={{
        px: 4,
        py: 3,
        gap: 2,
        backgroundColor: 'grey.50'
      }}>
        <Button
          onClick={onClose}
          size="large"
          variant="outlined"
          fullWidth
          sx={{
            minWidth: 140,
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
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant="contained"
          size="large"
          fullWidth
          sx={{
            minWidth: 140,
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
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  confirmColor: PropTypes.oneOf(['inherit', 'primary', 'secondary', 'error', 'info', 'success', 'warning']),
};

export default ConfirmDialog;
