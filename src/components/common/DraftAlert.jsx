// src/components/common/DraftAlert.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Box } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Alert component to notify users about saved drafts
 * @param {boolean} show - Whether to show the alert
 * @param {Function} onRestore - Callback when user clicks restore
 * @param {Function} onDiscard - Callback when user clicks discard
 * @param {string} message - Alert message
 */
function DraftAlert({
  show,
  onRestore,
  onDiscard,
  message = 'تم العثور على مسودة محفوظة من جلسة سابقة',
}) {
  if (!show) return null;

  return (
    <Alert
      severity="info"
      icon={<SaveIcon />}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" size="small" onClick={onRestore}>
            استعادة
          </Button>
          <Button color="inherit" size="small" onClick={onDiscard}>
            تجاهل
          </Button>
        </Box>
      }
    >
      {message}
    </Alert>
  );
}

DraftAlert.propTypes = {
  show: PropTypes.bool.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
  message: PropTypes.string,
};

export default DraftAlert;
