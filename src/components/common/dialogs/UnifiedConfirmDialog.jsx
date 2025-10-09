import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
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
  loading = false
}) {
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

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          {getIcon()}
          <Typography
            variant="body1"
            sx={{
              mt: 2,
              textAlign: 'center',
              color: 'text.secondary',
              lineHeight: 1.6
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          disabled={loading}
          sx={{ borderRadius: 1.5 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          fullWidth
          disabled={loading}
          sx={{ borderRadius: 1.5 }}
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
  loading: PropTypes.bool
};
