// src/components/common/WeightPriceEntry.jsx
import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Typography,
  Box,
  Alert
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Unified Weight and Price Entry Component
 * Provides consistent weight and pricing input across all forms
 */
export default function WeightPriceEntry({
  mode = 'both', // 'weight', 'price', or 'both'
  weightMode: initialWeightMode,
  pricingMode: initialPricingMode,
  label,
  value,
  totalWeight,
  pricePerKg,
  pricePerPiece,
  totalCost,
  quantity = 1,
  weight,
  onChange,
  currencySymbol = '$',
  showBatchPrice = false,
  disabled = false,
  errors: propErrors = {}
}) {
  // Initialize formData from props
  const [formData, setFormDataState] = useState(() => ({
    weight_input_mode: initialWeightMode || 'per_sheet',
    weight_per_sheet: value || '',
    total_weight: totalWeight || '',
    pricing_mode: initialPricingMode || 'per_kg',
    price_per_kg: pricePerKg || '',
    price_per_piece: pricePerPiece || '',
    total_cost: totalCost || '',
  }));

  const [errors, setErrors] = useState(propErrors);

  // Update formData when props change
  useEffect(() => {
    setFormDataState(prev => ({
      ...prev,
      weight_per_sheet: value || prev.weight_per_sheet,
      total_weight: totalWeight || prev.total_weight,
      price_per_kg: pricePerKg || prev.price_per_kg,
      price_per_piece: pricePerPiece || prev.price_per_piece,
      total_cost: totalCost || prev.total_cost,
    }));
  }, [value, totalWeight, pricePerKg, pricePerPiece, totalCost]);

  const setFormData = (newData) => {
    setFormDataState(newData);
  };
  // Calculate derived values
  const calculateDerivedValues = (mode, data) => {
    const qty = Number(quantity) || 1;

    if (mode === 'weight') {
      if (data.weight_input_mode === 'per_sheet' && data.weight_per_sheet) {
        const total = Number(data.weight_per_sheet) * qty;
        return { ...data, total_weight: total.toFixed(3) };
      } else if (data.weight_input_mode === 'total' && data.total_weight) {
        const perSheet = Number(data.total_weight) / qty;
        return { ...data, weight_per_sheet: perSheet.toFixed(3) };
      }
    }

    if (mode === 'price') {
      if (data.pricing_mode === 'per_kg' && data.price_per_kg && data.total_weight) {
        const total = Number(data.price_per_kg) * Number(data.total_weight);
        return { ...data, total_cost: total.toFixed(2) };
      } else if (data.pricing_mode === 'per_piece' && data.price_per_piece) {
        const total = Number(data.price_per_piece) * qty;
        return { ...data, total_cost: total.toFixed(2) };
      } else if (data.pricing_mode === 'total' && data.total_cost && qty > 0) {
        if (data.total_weight > 0) {
          const pricePerKg = Number(data.total_cost) / Number(data.total_weight);
          return { ...data, price_per_kg: pricePerKg.toFixed(2) };
        }
        const pricePerPiece = Number(data.total_cost) / qty;
        return { ...data, price_per_piece: pricePerPiece.toFixed(2) };
      }
    }

    return data;
  };

  const handleWeightModeChange = (e) => {
    const newMode = e.target.value;
    let updatedData = { ...formData, weight_input_mode: newMode };

    // Reset values when switching modes
    if (newMode === 'per_sheet') {
      updatedData.total_weight = '';
    } else {
      updatedData.weight_per_sheet = '';
    }

    const finalData = calculateDerivedValues('weight', updatedData);
    setFormData(finalData);
    if (onChange) {
      onChange('weight_mode', newMode);
    }
  };

  const handlePricingModeChange = (e) => {
    const newMode = e.target.value;
    let updatedData = { ...formData, pricing_mode: newMode };

    // Reset values when switching modes
    if (newMode === 'per_kg') {
      updatedData.price_per_piece = '';
      updatedData.total_cost = '';
    } else if (newMode === 'per_piece') {
      updatedData.price_per_kg = '';
      updatedData.total_cost = '';
    } else {
      updatedData.price_per_kg = '';
      updatedData.price_per_piece = '';
    }

    const finalData = calculateDerivedValues('price', updatedData);
    setFormData(finalData);
    if (onChange) {
      onChange('pricing_mode', newMode);
    }
  };

  const handleWeightChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    const finalData = calculateDerivedValues('weight', updatedData);
    setFormData(finalData);
    if (onChange) {
      onChange(field, value);
      // Also send the calculated value if it changed
      if (field === 'weight_per_sheet' && finalData.total_weight !== formData.total_weight) {
        onChange('total_weight', finalData.total_weight);
      } else if (field === 'total_weight' && finalData.weight_per_sheet !== formData.weight_per_sheet) {
        onChange('weight_per_sheet', finalData.weight_per_sheet);
      }
    }
  };

  const handlePriceChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    const finalData = calculateDerivedValues('price', updatedData);
    setFormData(finalData);
    if (onChange) {
      onChange(field, value);
      // Also send the calculated total cost if it changed
      if (finalData.total_cost !== formData.total_cost) {
        onChange('total_cost', finalData.total_cost);
      }
    }
  };

  // Calculate price summary
  const getPriceSummary = () => {
    const qty = Number(quantity) || 0;
    const weightPerSheet = Number(formData.weight_per_sheet) || 0;
    const totalWeight = Number(formData.total_weight) || qty * weightPerSheet;
    const pricePerKg = Number(formData.price_per_kg) || 0;
    const pricePerPiece = Number(formData.price_per_piece) || 0;
    const totalCost = Number(formData.total_cost) || 0;

    let summary = {
      totalWeight: totalWeight || 0,
      totalCost: 0,
      unitPrice: 0,
      priceType: ''
    };

    if (formData.pricing_mode === 'per_kg' && pricePerKg > 0) {
      summary.totalCost = pricePerKg * totalWeight;
      summary.unitPrice = pricePerKg;
      summary.priceType = 'per kg';
    } else if (formData.pricing_mode === 'per_piece' && pricePerPiece > 0) {
      summary.totalCost = pricePerPiece * qty;
      summary.unitPrice = pricePerPiece;
      summary.priceType = 'per piece';
    } else if (formData.pricing_mode === 'total' && totalCost > 0) {
      summary.totalCost = totalCost;
      if (totalWeight > 0) {
        summary.unitPrice = totalCost / totalWeight;
        summary.priceType = 'per kg (calculated)';
      } else if (qty > 0) {
        summary.unitPrice = totalCost / qty;
        summary.priceType = 'per piece (calculated)';
      }
    }

    return summary;
  };

  const summary = getPriceSummary();

  const showWeight = mode === 'weight' || mode === 'both';
  const showPricing = mode === 'price' || mode === 'both';

  return (
    <Box>
      {/* Weight Section */}
      {showWeight && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                إدخال الوزن
              </FormLabel>
              <RadioGroup
                row
                value={formData.weight_input_mode || 'per_sheet'}
                onChange={handleWeightModeChange}
                disabled={disabled}
              >
                <FormControlLabel
                  value="per_sheet"
                  control={<Radio size="small" />}
                  label="وزن القطعة الواحدة"
                />
                <FormControlLabel
                  value="total"
                  control={<Radio size="small" />}
                  label="الوزن الإجمالي"
                />
              </RadioGroup>
            </Grid>

            {formData.weight_input_mode === 'per_sheet' || !formData.weight_input_mode ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="وزن القطعة الواحدة (كغ) *"
                    value={formData.weight_per_sheet || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty, digits, and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleWeightChange('weight_per_sheet', value);
                      }
                    }}
                    error={!!errors.weight_per_sheet}
                    helperText={errors.weight_per_sheet}
                    InputLabelProps={{ shrink: true }}
                    disabled={disabled}
                    size="small"
                    placeholder="0.000"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="الوزن الإجمالي (كغ)"
                    value={formData.total_weight || ''}
                    disabled
                    helperText={`محسوب: ${quantity} × ${formData.weight_per_sheet || 0} كغ`}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="الوزن الإجمالي (كغ) *"
                    value={formData.total_weight || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleWeightChange('total_weight', value);
                      }
                    }}
                    error={!!errors.total_weight}
                    helperText={errors.total_weight}
                    InputLabelProps={{ shrink: true }}
                    disabled={disabled}
                    size="small"
                    placeholder="0.000"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="وزن القطعة الواحدة (كغ)"
                    value={formData.weight_per_sheet || ''}
                    disabled
                    helperText={`محسوب: ${formData.total_weight || 0} ÷ ${quantity} كغ`}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </>
      )}

      {/* Pricing Section */}
      {showPricing && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                طريقة التسعير
              </FormLabel>
              <RadioGroup
                row
                value={formData.pricing_mode || 'per_kg'}
                onChange={handlePricingModeChange}
                disabled={disabled}
              >
                <FormControlLabel
                  value="per_kg"
                  control={<Radio size="small" />}
                  label="بالكيلو"
                />
                <FormControlLabel
                  value="per_piece"
                  control={<Radio size="small" />}
                  label="بالقطعة"
                />
                <FormControlLabel
                  value="total"
                  control={<Radio size="small" />}
                  label="إجمالي"
                />
              </RadioGroup>
            </Grid>

            {formData.pricing_mode === 'per_kg' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="السعر لكل كيلو"
                  value={formData.price_per_kg || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handlePriceChange('price_per_kg', value);
                    }
                  }}
                  error={!!errors.price_per_kg}
                  helperText={errors.price_per_kg}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{currencySymbol}/كغ</InputAdornment>
                  }}
                  InputLabelProps={{ shrink: true }}
                  disabled={disabled}
                  size="small"
                  placeholder="0.00"
                />
              </Grid>
            ) : formData.pricing_mode === 'per_piece' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="السعر لكل قطعة"
                  value={formData.price_per_piece || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handlePriceChange('price_per_piece', value);
                    }
                  }}
                  error={!!errors.price_per_piece}
                  helperText={errors.price_per_piece}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>
                  }}
                  InputLabelProps={{ shrink: true }}
                  disabled={disabled}
                  size="small"
                  placeholder="0.00"
                />
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="التكلفة الإجمالية"
                  value={formData.total_cost || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handlePriceChange('total_cost', value);
                    }
                  }}
                  error={!!errors.total_cost}
                  helperText={errors.total_cost}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>
                  }}
                  InputLabelProps={{ shrink: true }}
                  disabled={disabled}
                  size="small"
                  placeholder="0.00"
                />
              </Grid>
            )}
          </Grid>

          {/* Price Summary */}
          {summary.totalCost > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>الوزن الإجمالي:</strong> {summary.totalWeight.toFixed(3)} كغ
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>السعر:</strong> {summary.unitPrice.toFixed(2)} {currencySymbol} {summary.priceType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>الإجمالي:</strong> {summary.totalCost.toFixed(2)} {currencySymbol}
                  </Typography>
                </Grid>
              </Grid>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

WeightPriceEntry.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currencySymbol: PropTypes.string,
  showWeight: PropTypes.bool,
  showPricing: PropTypes.bool,
  disabled: PropTypes.bool,
  errors: PropTypes.object
};