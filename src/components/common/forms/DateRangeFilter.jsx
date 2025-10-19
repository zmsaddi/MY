// src/components/common/forms/DateRangeFilter.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, TextField, Button, ButtonGroup } from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';

/**
 * Reusable date range filter with quick presets
 */
function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  showPresets = true,
}) {
  const handlePreset = (preset) => {
    const today = new Date();
    let from, to;

    switch (preset) {
      case 'today':
        from = to = today.toISOString().split('T')[0];
        break;
      case 'this-week':
        from = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
        to = new Date().toISOString().split('T')[0];
        break;
      case 'this-month':
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        to = new Date().toISOString().split('T')[0];
        break;
      case 'this-year':
        from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        to = new Date().toISOString().split('T')[0];
        break;
      case 'last-month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last-year':
        from = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        to = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    onFromDateChange(from);
    onToDateChange(to);
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="من تاريخ"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="إلى تاريخ"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        {showPresets && (
          <Grid item xs={12} md={6}>
            <ButtonGroup size="small" variant="outlined" fullWidth>
              <Button onClick={() => handlePreset('today')} startIcon={<TodayIcon />}>
                اليوم
              </Button>
              <Button onClick={() => handlePreset('this-month')}>
                هذا الشهر
              </Button>
              <Button onClick={() => handlePreset('this-year')}>
                هذا العام
              </Button>
              <Button onClick={() => handlePreset('last-month')}>
                الشهر الماضي
              </Button>
            </ButtonGroup>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

DateRangeFilter.propTypes = {
  fromDate: PropTypes.string.isRequired,
  toDate: PropTypes.string.isRequired,
  onFromDateChange: PropTypes.func.isRequired,
  onToDateChange: PropTypes.func.isRequired,
  showPresets: PropTypes.bool,
};

export default DateRangeFilter;
