// src/components/common/dialogs/BaseDialog.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Base dialog component with consistent structure
 * Provides loading states, responsive design, and close handling
 */
function BaseDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  loading = false,
  disableBackdropClick = false,
}) {
  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableRestoreFocus
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      {/* Title with close button */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <IconButton
          edge="end"
          onClick={onClose}
          disabled={loading}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          children
        )}
      </DialogContent>

      {/* Actions */}
      {actions && <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>}
    </Dialog>
  );
}

BaseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  actions: PropTypes.node,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
};

export default BaseDialog;
