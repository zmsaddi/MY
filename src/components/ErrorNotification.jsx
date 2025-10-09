// src/components/ErrorNotification.jsx
import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Box,
  Typography,
  Collapse
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Global Error Notification Component
 * Displays errors as push notifications with copy functionality
 */
export default function ErrorNotification({ error, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-close after 10 seconds if not expanded
  useEffect(() => {
    if (error && !expanded) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, expanded, onClose]);

  const handleCopy = async () => {
    try {
      const errorText = `
خطأ في النظام / System Error
---------------------------
الرسالة / Message: ${error?.message || 'خطأ غير معروف'}
النوع / Type: ${error?.type || 'ERROR'}
الوقت / Time: ${new Date().toLocaleString('ar-SA')}
${error?.details ? `\nالتفاصيل / Details:\n${JSON.stringify(error.details, null, 2)}` : ''}
${error?.stack ? `\nStack Trace:\n${error.stack}` : ''}
      `.trim();

      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  if (!error) return null;

  const severity = error.severity || 'error';
  const title = error.title || (severity === 'error' ? 'خطأ' : severity === 'warning' ? 'تحذير' : 'معلومة');

  return (
    <Snackbar
      open={!!error}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{
        top: '80px !important',
        maxWidth: '600px',
        width: '95%'
      }}
    >
      <Alert
        severity={severity}
        sx={{
          width: '100%',
          boxShadow: 3,
          '& .MuiAlert-message': {
            width: '100%',
            fontSize: '1rem'
          }
        }}
        action={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setExpanded(!expanded)}
              sx={{ opacity: 0.7 }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Button
              size="small"
              color="inherit"
              onClick={onClose}
              sx={{ fontWeight: 700 }}
            >
              حسناً
            </Button>
          </Box>
        }
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
          {title}
        </AlertTitle>

        <Typography sx={{ mb: 1, fontSize: '0.95rem' }}>
          {error.message || 'حدث خطأ غير متوقع'}
        </Typography>

        {error.code && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.8 }}>
            كود الخطأ: {error.code}
          </Typography>
        )}

        <Collapse in={expanded} timeout="auto">
          <Box sx={{
            mt: 2,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 2,
            borderRadius: 1
          }}>
            {error.details && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  التفاصيل التقنية:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    bgcolor: 'rgba(0,0,0,0.1)',
                    p: 1,
                    borderRadius: 1,
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  {typeof error.details === 'string'
                    ? error.details
                    : JSON.stringify(error.details, null, 2)}
                </Typography>
              </Box>
            )}

            {error.stack && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Stack Trace:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    bgcolor: 'rgba(0,0,0,0.1)',
                    p: 1,
                    borderRadius: 1,
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  {error.stack}
                </Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
              onClick={handleCopy}
              fullWidth
              sx={{ mt: 1 }}
              color={copied ? 'success' : 'inherit'}
            >
              {copied ? 'تم النسخ!' : 'نسخ معلومات الخطأ'}
            </Button>
          </Box>
        </Collapse>

        {!expanded && (
          <Button
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{ mt: 1 }}
            variant="outlined"
            color="inherit"
          >
            {copied ? 'تم النسخ!' : 'نسخ'}
          </Button>
        )}
      </Alert>
    </Snackbar>
  );
}
