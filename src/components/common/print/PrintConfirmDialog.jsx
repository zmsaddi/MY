// src/components/common/print/PrintConfirmDialog.jsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Typography,
  Box,
  Divider,
  Alert
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * Print Confirmation Dialog Component
 * Shows before any print/PDF operation with customization options
 */
export default function PrintConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'تأكيد الطباعة',
  documentName = 'المستند',
  documentType = 'تقرير',
  estimatedPages = 1,
  defaultAction = 'print', // 'print' or 'pdf'
  showLogo = true,
  showOrientation = true,
  showMargins = false
}) {
  const [action, setAction] = useState(defaultAction);
  const [orientation, setOrientation] = useState('portrait');
  const [includeLogo, setIncludeLogo] = useState(showLogo);
  const [margins, setMargins] = useState('normal');

  const handleConfirm = () => {
    onConfirm({
      action,
      orientation,
      includeLogo,
      margins,
      pageSize: 'A4'
    });
  };

  const handleClose = () => {
    // Reset to defaults
    setAction(defaultAction);
    setOrientation('portrait');
    setIncludeLogo(showLogo);
    setMargins('normal');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {action === 'print' ? <PrintIcon /> : <PictureAsPdfIcon />}
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Document Summary */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>اسم المستند:</strong> {documentName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>النوع:</strong> {documentType}
          </Typography>
          <Typography variant="body2">
            <strong>الصفحات المتوقعة:</strong> {estimatedPages}
          </Typography>
        </Alert>

        <Divider sx={{ my: 2 }} />

        {/* Action Selection */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
            الإجراء
          </FormLabel>
          <RadioGroup
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <FormControlLabel
              value="print"
              control={<Radio />}
              label="طباعة مباشرة"
            />
            <FormControlLabel
              value="pdf"
              control={<Radio />}
              label="تصدير كملف PDF"
            />
            <FormControlLabel
              value="preview"
              control={<Radio />}
              label="معاينة قبل الطباعة"
            />
          </RadioGroup>
        </FormControl>

        {/* Orientation Selection */}
        {showOrientation && (
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              اتجاه الصفحة
            </FormLabel>
            <RadioGroup
              row
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
            >
              <FormControlLabel
                value="portrait"
                control={<Radio />}
                label="طولي (عمودي)"
              />
              <FormControlLabel
                value="landscape"
                control={<Radio />}
                label="عرضي (أفقي)"
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* Margins Selection */}
        {showMargins && (
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              الهوامش
            </FormLabel>
            <RadioGroup
              row
              value={margins}
              onChange={(e) => setMargins(e.target.value)}
            >
              <FormControlLabel
                value="narrow"
                control={<Radio />}
                label="ضيقة"
              />
              <FormControlLabel
                value="normal"
                control={<Radio />}
                label="عادية"
              />
              <FormControlLabel
                value="wide"
                control={<Radio />}
                label="واسعة"
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* Logo Option */}
        <FormControl fullWidth>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
              />
            }
            label="تضمين شعار الشركة"
          />
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          size="large"
        >
          إلغاء
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="large"
          startIcon={action === 'print' ? <PrintIcon /> : <PictureAsPdfIcon />}
        >
          {action === 'print' ? 'طباعة' : action === 'pdf' ? 'تصدير PDF' : 'معاينة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
