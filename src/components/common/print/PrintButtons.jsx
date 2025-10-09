// src/components/common/print/PrintButtons.jsx
import { Box, Button, Tooltip, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * Reusable Print and PDF buttons component
 * Automatically appears in appropriate contexts
 */
export default function PrintButtons({
  onPrint,
  onPDF,
  isPrinting = false,
  disabled = false,
  variant = 'contained',
  size = 'medium',
  showPrint = true,
  showPDF = true,
  sx = {}
}) {
  if (!showPrint && !showPDF) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, ...sx }}>
      {showPrint && (
        <Tooltip title="طباعة">
          <span>
            <Button
              variant={variant}
              size={size}
              startIcon={isPrinting ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
              onClick={onPrint}
              disabled={disabled || isPrinting}
            >
              طباعة
            </Button>
          </span>
        </Tooltip>
      )}

      {showPDF && (
        <Tooltip title="تصدير PDF">
          <span>
            <Button
              variant={variant === 'contained' ? 'outlined' : 'contained'}
              size={size}
              startIcon={isPrinting ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
              onClick={onPDF}
              disabled={disabled || isPrinting}
            >
              PDF
            </Button>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
