// src/components/sales/SaleItemsForm.jsx
import { useState } from 'react';
import {
  Box, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, InputAdornment, IconButton, Card,
  Autocomplete, RadioGroup, Radio, FormControlLabel, FormLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory2';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

// Price color coding helper
const getPriceColor = (sellingPrice, originalCost) => {
  if (!sellingPrice || !originalCost) return 'inherit';
  const ratio = sellingPrice / originalCost;
  if (ratio < 1) return 'error.main';     // Loss (red)
  if (ratio === 1) return 'text.primary'; // Break-even (black)
  return 'success.main';                  // Profit (green)
};

export default function SaleItemsForm({
  sheets,
  remnants,
  services,
  items,
  saleCurrency,
  getCurrencySymbol,
  onAddItem,
  onRemoveItem,
  onError
}) {
  // Item form state
  const [itemType, setItemType] = useState('material');
  const [saleType, setSaleType] = useState('full_sheet');
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [selectedRemnant, setSelectedRemnant] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPricePerKg, setItemPricePerKg] = useState('');
  const [soldDimensions, setSoldDimensions] = useState({ length: '', width: '', thickness: '' });
  const [soldWeight, setSoldWeight] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const resetItemForm = () => {
    setSelectedSheet(null);
    setSelectedRemnant(null);
    setSelectedService(null);
    setItemQuantity('');
    setItemPrice('');
    setItemPricePerKg('');
    setSoldDimensions({ length: '', width: '', thickness: '' });
    setSoldWeight('');
    setServicePrice('');
    setMaterialDescription('');
    setItemNotes('');
  };

  const handleAddItem = () => {
    if (itemType === 'material') {
      if (saleType === 'full_sheet') {
        if (!selectedSheet) return onError('يجب اختيار الصفيحة');
        if (!itemQuantity || parseInt(itemQuantity) <= 0) return onError('الكمية غير صحيحة');
        if (parseInt(itemQuantity) > selectedSheet.total_quantity) return onError('الكمية المطلوبة أكبر من المتاح');
        if (!itemPrice || parseFloat(itemPrice) <= 0) return onError('السعر غير صحيح');

        const item = {
          type: 'material',
          sale_type: 'full_sheet',
          sheet_id: selectedSheet.id,
          description: `${selectedSheet.code} - ${selectedSheet.metal_name}`,
          dimensions: `${selectedSheet.length_mm}×${selectedSheet.width_mm}×${selectedSheet.thickness_mm}`,
          weight_per_piece: selectedSheet.weight_per_sheet_kg || 0,
          quantity: parseInt(itemQuantity),
          unit_price: parseFloat(itemPrice),
          total: parseInt(itemQuantity) * parseFloat(itemPrice),
          notes: itemNotes || null,
          original_cost: selectedSheet.min_price || 0
        };
        onAddItem(item);
        resetItemForm();
      } else if (saleType === 'remnant_from_stock') {
        if (!selectedRemnant) return onError('يجب اختيار البقية');
        if (!itemQuantity || parseInt(itemQuantity) <= 0) return onError('الكمية غير صحيحة');
        if (parseInt(itemQuantity) > selectedRemnant.total_quantity) return onError('الكمية المطلوبة أكبر من المتاح');
        if (!itemPrice || parseFloat(itemPrice) <= 0) return onError('السعر غير صحيح');

        const item = {
          type: 'material',
          sale_type: 'remnant_from_stock',
          sheet_id: selectedRemnant.id,
          description: `${selectedRemnant.code} - ${selectedRemnant.metal_name} (بقية)`,
          dimensions: `${selectedRemnant.length_mm}×${selectedRemnant.width_mm}×${selectedRemnant.thickness_mm}`,
          weight_per_piece: selectedRemnant.weight_per_sheet_kg || 0,
          quantity: parseInt(itemQuantity),
          unit_price: parseFloat(itemPrice),
          total: parseInt(itemQuantity) * parseFloat(itemPrice),
          notes: itemNotes || null,
          original_cost: selectedRemnant.min_price || 0
        };
        onAddItem(item);
        resetItemForm();
      } else if (saleType === 'cut_from_sheet') {
        if (!selectedSheet) return onError('يجب اختيار الصفيحة الأم');
        if (!soldDimensions.length || !soldDimensions.width || !soldDimensions.thickness) {
          return onError('يجب إدخال أبعاد القطعة المباعة');
        }
        if (!itemQuantity || parseInt(itemQuantity) <= 0) return onError('الكمية غير صحيحة');
        if (!itemPricePerKg || parseFloat(itemPricePerKg) <= 0) return onError('السعر لكل كيلو غير صحيح');

        const totalPrice = soldWeight && parseFloat(soldWeight) > 0
          ? parseFloat(soldWeight) * parseFloat(itemPricePerKg)
          : parseFloat(itemPricePerKg); // If no weight specified, price is total

        const item = {
          type: 'material',
          sale_type: 'cut_from_sheet',
          sheet_id: selectedSheet.id,
          parent_sheet_code: selectedSheet.code,
          description: `قطعة من ${selectedSheet.code} - ${selectedSheet.metal_name}`,
          dimensions: `${soldDimensions.length}×${soldDimensions.width}×${soldDimensions.thickness}`,
          weight_per_piece: soldWeight ? parseFloat(soldWeight) : 0,
          quantity: parseInt(itemQuantity),
          unit_price: totalPrice,
          price_per_kg: parseFloat(itemPricePerKg),
          total: totalPrice * parseInt(itemQuantity),
          notes: itemNotes || null,
          original_cost: selectedSheet.min_price || 0,
          sold_length: parseFloat(soldDimensions.length),
          sold_width: parseFloat(soldDimensions.width),
          sold_thickness: parseFloat(soldDimensions.thickness)
        };
        onAddItem(item);
        resetItemForm();
      }
    } else {
      // Service
      if (!selectedService) return onError('يجب اختيار الخدمة');
      if (!servicePrice || parseFloat(servicePrice) <= 0) return onError('السعر غير صحيح');

      const item = {
        type: 'service',
        service_id: selectedService.id,
        description: selectedService.name,
        quantity: 1,
        unit_price: parseFloat(servicePrice),
        total: parseFloat(servicePrice),
        notes: itemNotes || null
      };
      onAddItem(item);
      resetItemForm();
    }
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {itemType === 'material' ? <InventoryIcon /> : <BuildIcon />}
          إضافة عنصر جديد
        </Typography>

        <Grid container spacing={2}>
          {/* Item Type Selection */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="نوع العنصر"
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                resetItemForm();
              }}
              SelectProps={{ native: true }}
              sx={{
                '& .MuiNativeSelect-select': {
                  paddingRight: '16px !important',
                  paddingLeft: '40px !important'
                },
                '& .MuiNativeSelect-icon': {
                  left: '12px',
                  right: 'auto'
                }
              }}
            >
              <option value="material">معدن من المخزون</option>
              <option value="service">خدمة</option>
            </TextField>
          </Grid>

          {/* Sale Type Radio Buttons - Only for material */}
          {itemType === 'material' && (
            <Grid item xs={12}>
              <FormLabel component="legend">
                <Typography fontWeight={600} fontSize="1rem">نوع البيع</Typography>
              </FormLabel>
              <RadioGroup
                row
                value={saleType}
                onChange={(e) => {
                  setSaleType(e.target.value);
                  resetItemForm();
                }}
              >
                <FormControlLabel
                  value="full_sheet"
                  control={<Radio />}
                  label="صفيحة كاملة"
                />
                <FormControlLabel
                  value="remnant_from_stock"
                  control={<Radio />}
                  label="قطعة من المخزون (بواقي)"
                />
                <FormControlLabel
                  value="cut_from_sheet"
                  control={<Radio />}
                  label="قص من صفيحة"
                />
              </RadioGroup>
            </Grid>
          )}

          {itemType === 'material' ? (
            <>
              {/* Full Sheet Sale */}
              {saleType === 'full_sheet' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={sheets}
                      getOptionLabel={(s) => `${s.code} - ${s.metal_name} (${s.total_quantity})`}
                      value={selectedSheet}
                      onChange={(_e, val) => setSelectedSheet(val)}
                      renderInput={(params) => <TextField {...params} label="اختر الصفيحة *" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية *"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      inputProps={{ min: 1 }}
                      helperText={selectedSheet ? `المتاح: ${selectedSheet.total_quantity}` : ' '}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السعر/قطعة *"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                        sx: { color: selectedSheet?.min_price ? getPriceColor(parseFloat(itemPrice), selectedSheet.min_price) : 'inherit' }
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Remnant from Stock Sale */}
              {saleType === 'remnant_from_stock' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={remnants}
                      getOptionLabel={(r) => `${r.code} - ${r.metal_name} - ${r.length_mm}×${r.width_mm}×${r.thickness_mm} (${r.total_quantity})`}
                      value={selectedRemnant}
                      onChange={(_e, val) => setSelectedRemnant(val)}
                      renderInput={(params) => <TextField {...params} label="اختر البقية *" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية *"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      inputProps={{ min: 1 }}
                      helperText={selectedRemnant ? `المتاح: ${selectedRemnant.total_quantity}` : ' '}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السعر/قطعة *"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                        sx: { color: selectedRemnant?.min_price ? getPriceColor(parseFloat(itemPrice), selectedRemnant.min_price) : 'inherit' }
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Cut from Sheet Sale */}
              {saleType === 'cut_from_sheet' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={sheets}
                      getOptionLabel={(s) => `${s.code} - ${s.metal_name} (${s.total_quantity})`}
                      value={selectedSheet}
                      onChange={(_e, val) => {
                        setSelectedSheet(val);
                        if (val) {
                          setSoldDimensions(prev => ({ ...prev, thickness: val.thickness_mm }));
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="اختر الصفيحة الأم *" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الطول (مم) *"
                      value={soldDimensions.length}
                      onChange={(e) => setSoldDimensions(prev => ({ ...prev, length: e.target.value }))}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="العرض (مم) *"
                      value={soldDimensions.width}
                      onChange={(e) => setSoldDimensions(prev => ({ ...prev, width: e.target.value }))}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السماكة (مم)"
                      value={soldDimensions.thickness}
                      onChange={(e) => setSoldDimensions(prev => ({ ...prev, thickness: e.target.value }))}
                      inputProps={{ step: 0.1, min: 0.1 }}
                      helperText={selectedSheet ? `سماكة الصفيحة: ${selectedSheet.thickness_mm} مم` : ' '}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الوزن (كغ) - اختياري"
                      value={soldWeight}
                      onChange={(e) => setSoldWeight(e.target.value)}
                      inputProps={{ step: 0.001, min: 0 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية *"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السعر/كيلو *"
                      value={itemPricePerKg}
                      onChange={(e) => setItemPricePerKg(e.target.value)}
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}/كغ</InputAdornment>,
                        sx: { color: selectedSheet?.min_price ? getPriceColor(parseFloat(itemPricePerKg), selectedSheet.min_price) : 'inherit' }
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
            </>
          ) : (
            // Service fields
            <>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={services}
                  getOptionLabel={(s) => s.name}
                  value={selectedService}
                  onChange={(_e, val) => {
                    setSelectedService(val);
                    if (val && val.price) setServicePrice(val.price.toString());
                  }}
                  renderInput={(params) => <TextField {...params} label="اختر الخدمة *" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="السعر *"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {/* Notes field */}
          <Grid item xs={12} md={itemType === 'material' && saleType !== 'cut_from_sheet' ? 9 : 6}>
            <TextField
              fullWidth
              label="ملاحظات"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
            />
          </Grid>

          {/* Add button */}
          <Grid item xs={12} md={itemType === 'material' && saleType !== 'cut_from_sheet' ? 3 : 6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ height: '100%' }}
            >
              إضافة
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Items Table */}
      {items.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography fontWeight={700} fontSize="0.9375rem">الوصف</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="0.9375rem">الأبعاد</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="0.9375rem">الكمية</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="0.9375rem">سعر الوحدة</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="0.9375rem">الإجمالي</Typography></TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography fontSize="0.9375rem">{item.description}</Typography>
                    {item.notes && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontSize="0.9375rem">
                      {item.dimensions || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize="0.9375rem">{item.quantity}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      fontSize="0.9375rem"
                      sx={{ color: item.original_cost ? getPriceColor(item.unit_price, item.original_cost) : 'inherit' }}
                    >
                      {fmt(item.unit_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize="0.9375rem">{fmt(item.total)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => onRemoveItem(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}