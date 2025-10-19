// src/components/common/EmptyState.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';

/**
 * Empty state component for tables and lists
 * @param {React.Component} icon - Icon component to display
 * @param {string} title - Main title
 * @param {string} description - Description text
 * @param {string} actionLabel - Button label
 * @param {Function} onAction - Button click handler
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      {Icon && (
        <Icon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      )}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

export default EmptyState;
