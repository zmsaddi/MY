import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import { dialogDefaults } from '../../../theme/designSystem';

export default function UnifiedFormDialog({
  open,
  onClose,
  onSubmit,
  title,
  subtitle = null,
  children,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  showDivider = true
}) {
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (onSubmit) {
      await onSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      {...dialogDefaults}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: subtitle ? 0.5 : 0 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={onClose}
              disabled={loading}
              sx={{ mt: -0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {showDivider && <Divider />}

        <DialogContent sx={{ pt: 3 }}>
          {children}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{ minWidth: 100, borderRadius: 1.5 }}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 100, borderRadius: 1.5 }}
          >
            {loading ? 'جاري الحفظ...' : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

UnifiedFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  loading: PropTypes.bool,
  maxWidth: PropTypes.string,
  fullWidth: PropTypes.bool,
  showDivider: PropTypes.bool
};
