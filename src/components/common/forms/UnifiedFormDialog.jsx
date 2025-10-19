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
      onClose={(event, reason) => {
        // CRITICAL FIX: Prevent closing when clicking outside (backdrop)
        // Only allow closing via escape key or explicit close button
        if (reason === 'backdropClick') {
          return;
        }
        if (loading) {
          return;
        }
        onClose(event, reason);
      }}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableRestoreFocus
      disableEscapeKeyDown={loading}
      PaperProps={{
        sx: {
          minHeight: '400px',
          maxHeight: '95vh',
          m: { xs: 1, sm: 3 },
          borderRadius: 4,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{
          pb: 3,
          pt: 4,
          px: 4,
          backgroundColor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, pr: 2 }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  mb: subtitle ? 1.5 : 0,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  color: 'primary.main',
                  letterSpacing: '-0.02em'
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    fontSize: '1.1rem',
                    lineHeight: 1.7,
                    fontWeight: 400
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <IconButton
              size="large"
              onClick={onClose}
              disabled={loading}
              sx={{
                mt: -1,
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
          pt: 4,
          pb: 4,
          px: 4,
          minHeight: '200px',
          maxHeight: 'calc(90vh - 250px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: 'background.paper',
          '& > *': {
            mb: 3
          },
          '& > *:last-child': {
            mb: 0
          }
        }}>
          {children}
        </DialogContent>

        <Divider sx={{ borderColor: 'divider' }} />

        <DialogActions sx={{
          px: 4,
          py: 3,
          gap: 2,
          backgroundColor: 'grey.50'
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            size="large"
            sx={{
              minWidth: 140,
              borderRadius: 2.5,
              fontSize: '1.1rem',
              py: 1.5,
              px: 3,
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
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{
              minWidth: 140,
              borderRadius: 2.5,
              fontSize: '1.1rem',
              py: 1.5,
              px: 3,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.2s ease'
            }}
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
