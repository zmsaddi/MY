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
    setAction(defaultAction);
    setOrientation('portrait');
    setIncludeLogo(showLogo);
    setMargins('normal');
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
        handleClose(event, reason);
      }}
      maxWidth="lg"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 4,
          m: { xs: 2, sm: 3 },
          minHeight: '500px',
          maxHeight: '95vh',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)'
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {action === 'print' ? <PrintIcon fontSize="large" color="primary" /> : <PictureAsPdfIcon fontSize="large" color="primary" />}
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: 'primary.main'
            }}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        px: 4,
        py: 4,
        maxHeight: 'calc(90vh - 250px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'background.paper'
      }}>
        <Alert
          severity="info"
          sx={{
            mb: 4,
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="body1" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            <strong>اسم المستند:</strong> {documentName}
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            <strong>النوع:</strong> {documentType}
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            <strong>الصفحات المتوقعة:</strong> {estimatedPages}
          </Typography>
        </Alert>

        <Divider sx={{ my: 3 }} />

        <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
          <FormLabel
            component="legend"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: '1.2rem',
              color: 'text.primary'
            }}
          >
            الإجراء
          </FormLabel>
          <RadioGroup
            value={action}
            onChange={(e) => setAction(e.target.value)}
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '1.1rem',
                fontWeight: 500
              }
            }}
          >
            <FormControlLabel
              value="print"
              control={<Radio size="medium" />}
              label="طباعة مباشرة"
              sx={{ mb: 1.5 }}
            />
            <FormControlLabel
              value="pdf"
              control={<Radio size="medium" />}
              label="تصدير كملف PDF"
              sx={{ mb: 1.5 }}
            />
            <FormControlLabel
              value="preview"
              control={<Radio size="medium" />}
              label="معاينة قبل الطباعة"
            />
          </RadioGroup>
        </FormControl>

        {showOrientation && (
          <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
            <FormLabel
              component="legend"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '1.2rem',
                color: 'text.primary'
              }}
            >
              اتجاه الصفحة
            </FormLabel>
            <RadioGroup
              row
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '1.1rem',
                  fontWeight: 500
                }
              }}
            >
              <FormControlLabel
                value="portrait"
                control={<Radio size="medium" />}
                label="طولي (عمودي)"
                sx={{ mr: 4 }}
              />
              <FormControlLabel
                value="landscape"
                control={<Radio size="medium" />}
                label="عرضي (أفقي)"
              />
            </RadioGroup>
          </FormControl>
        )}

        {showMargins && (
          <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
            <FormLabel
              component="legend"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '1.2rem',
                color: 'text.primary'
              }}
            >
              الهوامش
            </FormLabel>
            <RadioGroup
              row
              value={margins}
              onChange={(e) => setMargins(e.target.value)}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '1.1rem',
                  fontWeight: 500
                }
              }}
            >
              <FormControlLabel
                value="narrow"
                control={<Radio size="medium" />}
                label="ضيقة"
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="normal"
                control={<Radio size="medium" />}
                label="عادية"
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="wide"
                control={<Radio size="medium" />}
                label="واسعة"
              />
            </RadioGroup>
          </FormControl>
        )}

        <FormControl fullWidth sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
                size="medium"
              />
            }
            label="تضمين شعار الشركة"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '1.1rem',
                fontWeight: 500
              }
            }}
          />
        </FormControl>
      </DialogContent>

      <Divider />

      <DialogActions sx={{
        px: 4,
        py: 3,
        gap: 2,
        backgroundColor: 'grey.50'
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
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
          إلغاء
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="large"
          startIcon={action === 'print' ? <PrintIcon /> : <PictureAsPdfIcon />}
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
          {action === 'print' ? 'طباعة' : action === 'pdf' ? 'تصدير PDF' : 'معاينة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
