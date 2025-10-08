// src/components/inventory/SheetFilters.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Sheet filters component for inventory
 * Extracted from InventoryTab to reduce component size
 */
function SheetFilters({
  searchTerm,
  onSearchChange,
  filterMetalType,
  onMetalTypeChange,
  metalTypes,
  filterThkMin,
  onThkMinChange,
  filterThkMax,
  onThkMaxChange,
  filterQtyMin,
  onQtyMinChange,
  filterQtyMax,
  onQtyMaxChange,
  showAdvanced,
  onToggleAdvanced,
  onResetFilters,
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="بحث (كود، معدن، درجة، إنهاء...)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Metal Type Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="نوع المعدن"
            value={filterMetalType}
            onChange={(e) => onMetalTypeChange(e.target.value)}
          >
            <MenuItem value="">الكل</MenuItem>
            {metalTypes.map((mt) => (
              <MenuItem key={mt.id} value={mt.id}>
                {mt.name} ({mt.abbreviation})
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Advanced Filters Toggle */}
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterAltIcon />}
            onClick={() => onToggleAdvanced(!showAdvanced)}
          >
            فلاتر متقدمة
          </Button>
        </Grid>

        {/* Reset Filters */}
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<RestartAltIcon />}
            onClick={onResetFilters}
          >
            إعادة تعيين
          </Button>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Accordion expanded={showAdvanced} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">فلاتر متقدمة</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Thickness Range */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="السماكة - من (mm)"
                value={filterThkMin}
                onChange={(e) => onThkMinChange(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="السماكة - إلى (mm)"
                value={filterThkMax}
                onChange={(e) => onThkMaxChange(e.target.value)}
              />
            </Grid>

            {/* Quantity Range */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="الكمية - من"
                value={filterQtyMin}
                onChange={(e) => onQtyMinChange(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="الكمية - إلى"
                value={filterQtyMax}
                onChange={(e) => onQtyMaxChange(e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

SheetFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filterMetalType: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onMetalTypeChange: PropTypes.func.isRequired,
  metalTypes: PropTypes.array.isRequired,
  filterThkMin: PropTypes.string.isRequired,
  onThkMinChange: PropTypes.func.isRequired,
  filterThkMax: PropTypes.string.isRequired,
  onThkMaxChange: PropTypes.func.isRequired,
  filterQtyMin: PropTypes.string.isRequired,
  onQtyMinChange: PropTypes.func.isRequired,
  filterQtyMax: PropTypes.string.isRequired,
  onQtyMaxChange: PropTypes.func.isRequired,
  showAdvanced: PropTypes.bool.isRequired,
  onToggleAdvanced: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
};

export default SheetFilters;
