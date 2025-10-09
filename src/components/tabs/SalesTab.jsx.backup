// src/components/tabs/SalesTab.jsx
import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Chip, Paper, InputAdornment, MenuItem, Divider,
  Stepper, Step, StepLabel, Autocomplete, IconButton, Tooltip,
  Collapse, RadioGroup, Radio, FormControlLabel, FormLabel
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory2';

import {
  getAllSales, getSaleById, processSale, generateInvoiceNumber, deleteSale,
  getCustomers, getAllSheets, getServiceTypes, getPaymentMethodsForUI,
  getCompanyProfile, getBaseCurrencyInfo, getCurrencies, addSheetWithBatch
} from '../../utils/database';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const STEPS = ['معلومات الفاتورة', 'الأصناف', 'الإجماليات والدفع'];

// Price color coding helper
const getPriceColor = (sellingPrice, originalCost) => {
  if (!sellingPrice || !originalCost) return 'inherit';
  const ratio = sellingPrice / originalCost;
  if (ratio < 1) return 'error.main';     // Loss (red)
  if (ratio === 1) return 'text.primary'; // Break-even (black)
  return 'success.main';                  // Profit (green)
};

export default function SalesTab() {
  // Data
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [remnants, setRemnants] = useState([]);
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [profile, setProfile] = useState(null);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  // Dialogs
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Stepper
  const [activeStep, setActiveStep] = useState(0);

  // Form - basic info
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleCurrency, setSaleCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  // Form - items
  const [items, setItems] = useState([]);

  // Form - totals
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Add item form
  const [itemType, setItemType] = useState('material');
  const [saleType, setSaleType] = useState('full_sheet'); // 'full_sheet', 'remnant_from_stock', 'cut_from_sheet'
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

  // Remnant dialog state
  const [showRemnantDialog, setShowRemnantDialog] = useState(false);
  const [remnantPieces, setRemnantPieces] = useState([]);
  const [currentSaleData, setCurrentSaleData] = useState(null);

  // Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Expand detail
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSales(getAllSales());
    setCustomers(getCustomers());

    const allSheets = getAllSheets();
    setSheets(allSheets.filter(s => !s.is_remnant));
    setRemnants(allSheets.filter(s => s.is_remnant));

    setServices(getServiceTypes(true));
    setPaymentMethods(getPaymentMethodsForUI(true));
    setCurrencies(getCurrencies(true));

    const prof = getCompanyProfile();
    setProfile(prof);

    const currInfo = getBaseCurrencyInfo();
    setBaseCurrencyInfo(currInfo);
    setSaleCurrency(currInfo.code);
  };

  // ─────────────────────────────────────────────────────────────
  // Create Invoice Dialog
  const handleOpenCreateDialog = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setCustomerId(null);
    setSaleDate(new Date().toISOString().split('T')[0]);
    setSaleCurrency(baseCurrencyInfo.code);
    setNotes('');
    setItems([]);
    setDiscount(0);
    setAmountPaid(0);
    setPaymentMethod(profile?.default_payment_method || '');
    setActiveStep(0);
    setError('');
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setActiveStep(0);
  };

  const handleNext = () => {
    if (activeStep === 0 && !customerId) {
      setError('يجب اختيار زبون');
      return;
    }
    if (activeStep === 1 && items.length === 0) {
      setError('يجب إضافة صنف واحد على الأقل');
      return;
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  // ─────────────────────────────────────────────────────────────
  // Add Item
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
    setError('');

    if (itemType === 'material') {
      // Full Sheet Sale
      if (saleType === 'full_sheet') {
        if (!selectedSheet) return setError('يجب اختيار صفيحة');
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('الكمية يجب أن تكون أكبر من صفر');
        if (qty > selectedSheet.total_quantity) return setError(`الكمية المتاحة فقط ${selectedSheet.total_quantity}`);
        const price = parseFloat(itemPrice);
        if (!price || price <= 0) return setError('السعر يجب أن يكون أكبر من صفر');

        setItems((prev) => [
          ...prev,
          {
            item_type: 'material',
            sale_type: 'full_sheet',
            sheet_id: selectedSheet.id,
            code: selectedSheet.code,
            metal_name: selectedSheet.metal_name,
            dimensions: `${selectedSheet.length_mm}×${selectedSheet.width_mm}×${selectedSheet.thickness_mm}`,
            quantity: qty,
            unit_price: price,
            total: qty * price
          }
        ]);
      }
      // Remnant from Stock Sale
      else if (saleType === 'remnant_from_stock') {
        if (!selectedRemnant) return setError('يجب اختيار البقية');
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('الكمية يجب أن تكون أكبر من صفر');
        if (qty > selectedRemnant.total_quantity) return setError(`الكمية المتاحة فقط ${selectedRemnant.total_quantity}`);
        const price = parseFloat(itemPrice);
        if (!price || price <= 0) return setError('السعر يجب أن يكون أكبر من صفر');

        setItems((prev) => [
          ...prev,
          {
            item_type: 'material',
            sale_type: 'remnant_from_stock',
            sheet_id: selectedRemnant.id,
            code: selectedRemnant.code,
            metal_name: selectedRemnant.metal_name,
            dimensions: `${selectedRemnant.length_mm}×${selectedRemnant.width_mm}×${selectedRemnant.thickness_mm}`,
            quantity: qty,
            unit_price: price,
            total: qty * price
          }
        ]);
      }
      // Cut from Sheet Sale
      else if (saleType === 'cut_from_sheet') {
        if (!selectedSheet) return setError('يجب اختيار الصفيحة الأم');
        if (!soldDimensions.length || !soldDimensions.width || !soldDimensions.thickness) {
          return setError('يجب إدخال جميع الأبعاد');
        }
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('الكمية يجب أن تكون أكبر من صفر');
        if (qty > selectedSheet.total_quantity) return setError(`الكمية المتاحة فقط ${selectedSheet.total_quantity}`);

        const price = parseFloat(itemPrice);
        const pricePerKg = parseFloat(itemPricePerKg);

        if (!price && !pricePerKg) {
          return setError('يجب إدخال السعر (إما سعر القطعة أو سعر الكيلو)');
        }

        const weight = parseFloat(soldWeight) || 0;
        const dimString = `${soldDimensions.length}×${soldDimensions.width}×${soldDimensions.thickness}`;

        // Calculate final unit price
        let finalUnitPrice = price;
        if (!finalUnitPrice && pricePerKg && weight) {
          finalUnitPrice = pricePerKg * weight;
        }

        setItems((prev) => [
          ...prev,
          {
            item_type: 'material',
            sale_type: 'cut_from_sheet',
            sheet_id: selectedSheet.id,
            code: selectedSheet.code,
            metal_name: selectedSheet.metal_name,
            dimensions: dimString,
            sold_dimensions: dimString,
            sold_weight: weight,
            is_custom_size: true,
            quantity: qty,
            unit_price: finalUnitPrice,
            total: qty * finalUnitPrice
          }
        ]);

        // Store sale data for remnant dialog
        setCurrentSaleData({
          sheetId: selectedSheet.id,
          sheetCode: selectedSheet.code,
          thickness: soldDimensions.thickness,
          soldDimensions: dimString
        });
      }
    } else {
      // Service
      if (!selectedService) return setError('يجب اختيار خدمة');
      const qty = parseInt(itemQuantity, 10) || 1;
      const price = parseFloat(servicePrice);
      if (!price || price <= 0) return setError('سعر الخدمة يجب أن يكون أكبر من صفر');

      setItems((prev) => [
        ...prev,
        {
          item_type: 'service',
          service_type_id: selectedService.id,
          service_name: selectedService.name_ar,
          quantity: qty,
          service_price: price,
          total: qty * price,
          material_description: materialDescription || null,
          notes: itemNotes || null
        }
      ]);
    }

    resetItemForm();
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ─────────────────────────────────────────────────────────────
  // Calculations
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (it.total || 0), 0), [items]);
  const taxAmount = useMemo(() => {
    if (!profile?.vat_enabled) return 0;
    const taxable = subtotal - (discount || 0);
    return (taxable * ((profile.vat_rate || 0) / 100));
  }, [subtotal, discount, profile]);
  const totalAmount = useMemo(() => subtotal - (discount || 0) + taxAmount, [subtotal, discount, taxAmount]);
  const remaining = useMemo(() => totalAmount - (amountPaid || 0), [totalAmount, amountPaid]);

  // Get currency symbol for display
  const getCurrencySymbol = (code) => {
    if (code === baseCurrencyInfo.code) return baseCurrencyInfo.symbol;
    const curr = currencies.find(c => c.code === code);
    return curr?.symbol || code;
  };

  // ─────────────────────────────────────────────────────────────
  // Submit
  const handleSubmitSale = () => {
    setError('');
    if (items.length === 0) return setError('يجب إضافة صنف واحد على الأقل');

    const saleData = {
      invoice_number: invoiceNumber,
      customer_id: customerId,
      sale_date: saleDate,
      currency_code: saleCurrency,
      discount: discount || 0,
      amount_paid: amountPaid || 0,
      payment_method: paymentMethod || profile?.default_payment_method || 'Cash',
      notes: notes || null,
      items: items.map((it) =>
        it.item_type === 'service'
          ? {
              item_type: 'service',
              service_type_id: it.service_type_id,
              quantity: it.quantity,
              service_price: it.service_price,
              material_description: it.material_description || null,
              notes: it.notes || null
            }
          : {
              item_type: 'material',
              sheet_id: it.sheet_id,
              quantity: it.quantity,
              unit_price: it.unit_price,
              is_custom_size: it.is_custom_size || false,
              sold_dimensions: it.sold_dimensions || null,
              sold_weight: it.sold_weight || null
            }
      )
    };

    const result = processSale(saleData);
    if (result.success) {
      setSuccess(`✓ تم إنشاء الفاتورة ${result.invoice_number} بنجاح`);
      setTimeout(() => setSuccess(''), 3000);
      handleCloseCreateDialog();
      loadData();

      // Check if there were any cut_from_sheet items
      const hasCutFromSheet = items.some(it => it.sale_type === 'cut_from_sheet');
      if (hasCutFromSheet && currentSaleData) {
        // Show remnant dialog
        setRemnantPieces([{
          length: '',
          width: '',
          thickness: currentSaleData.thickness,
          quantity: '1'
        }]);
        setShowRemnantDialog(true);
      }
    } else {
      setError('فشل الحفظ: ' + result.error);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // View / Delete
  const handleViewSale = (saleId) => {
    const sale = getSaleById(saleId);
    setSelectedSale(sale);
    setOpenViewDialog(true);
  };
  
  const handleDeleteSale = (saleId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    const result = deleteSale(saleId);
    if (result.success) {
      setSuccess('✓ تم حذف الفاتورة');
      setTimeout(() => setSuccess(''), 2500);
      loadData();
    } else {
      setError('فشل الحذف: ' + result.error);
    }
  };

  const getPaymentStatusColor = (status) =>
    status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'error';
  const getPaymentStatusLabel = (status) =>
    status === 'paid' ? 'مدفوعة' : status === 'partial' ? 'جزئية' : 'غير مدفوعة';

  // ─────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة المبيعات
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إنشاء الفواتير وإدارة المبيعات (معادن + خدمات)
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ fontWeight: 700 }}
        >
          إنشاء فاتورة جديدة
        </Button>
      </Box>

      {/* Sales Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflowX: 'auto',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell width={56} />
              <TableCell><Typography fontWeight={700} fontSize="1rem">رقم الفاتورة</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">الزبون</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجمالي</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">المدفوع</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">المتبقي</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الحالة</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد فواتير</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <Fragment key={sale.id}>
                  <TableRow hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                      >
                        {expandedSale === sale.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} fontSize="1rem">{sale.invoice_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize="0.9375rem">{sale.customer_name || 'زبون غير محدد'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize="0.9375rem">{sale.sale_date}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontSize="0.9375rem">
                        {fmt(sale.total_amount)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontSize="0.9375rem">
                        {fmt(sale.total_paid)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={700} color={sale.remaining > 0 ? 'error.main' : 'success.main'} fontSize="0.9375rem">
                        {fmt(sale.remaining)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getPaymentStatusLabel(sale.payment_status)}
                        color={getPaymentStatusColor(sale.payment_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', gap: 1 }}>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton size="small" color="primary" onClick={() => handleViewSale(sale.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton size="small" color="error" onClick={() => handleDeleteSale(sale.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedSale === sale.id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom fontSize="1rem">
                            ملاحظات:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                            {sale.notes || 'لا توجد ملاحظات'}
                          </Typography>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Invoice Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700}>
              إنشاء فاتورة جديدة
            </Typography>
          </Box>
        </DialogTitle>

        <Stepper activeStep={activeStep} sx={{ px: 3, pt: 1 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel><Typography fontSize="1rem">{label}</Typography></StepLabel>
            </Step>
          ))}
        </Stepper>

        <DialogContent sx={{ mt: 2 }}>
          {/* Step 0: Basic Info */}
          {activeStep === 0 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="رقم الفاتورة" value={invoiceNumber} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ البيع"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(c) => c.name}
                  value={customers.find((c) => c.id === customerId) || null}
                  onChange={(_e, val) => setCustomerId(val?.id || null)}
                  renderInput={(params) => <TextField {...params} label="الزبون *" />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="عملة الفاتورة"
                  value={saleCurrency}
                  onChange={(e) => setSaleCurrency(e.target.value)}
                  SelectProps={{ native: true }}
                >
                  {currencies.map((curr) => (
                    <option key={curr.id} value={curr.code}>
                      {curr.name_ar} ({curr.code}) - {curr.symbol}
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="ملاحظات"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 1: Items */}
          {activeStep === 1 && (
            <Box>
              <Card variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="نوع الصنف"
                      value={itemType}
                      onChange={(e) => {
                        setItemType(e.target.value);
                        resetItemForm();
                      }}
                      SelectProps={{ native: true }}
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
                              label="السماكة (مم) *"
                              value={soldDimensions.thickness}
                              onChange={(e) => setSoldDimensions(prev => ({ ...prev, thickness: e.target.value }))}
                              inputProps={{ min: 0.1, step: 0.1 }}
                              InputLabelProps={{ shrink: true }}
                              disabled
                              helperText="من الصفيحة الأم"
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
                              label="الوزن (كغ)"
                              value={soldWeight}
                              onChange={(e) => setSoldWeight(e.target.value)}
                              inputProps={{ min: 0, step: 0.001 }}
                              helperText="اختياري - حساب تلقائي"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              type="number"
                              label="السعر/كغ"
                              value={itemPricePerKg}
                              onChange={(e) => setItemPricePerKg(e.target.value)}
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: { color: selectedSheet?.min_price ? getPriceColor(parseFloat(itemPricePerKg), selectedSheet.min_price) : 'inherit' }
                              }}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              type="number"
                              label="السعر/قطعة"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: { color: selectedSheet?.min_price && soldWeight ? getPriceColor(parseFloat(itemPrice), selectedSheet.min_price * parseFloat(soldWeight)) : 'inherit' }
                              }}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          options={services}
                          getOptionLabel={(s) => s.name_ar}
                          value={selectedService}
                          onChange={(_e, val) => setSelectedService(val)}
                          renderInput={(params) => <TextField {...params} label="اختر الخدمة *" />}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="وصف المادة (نوع، أبعاد، كمية)"
                          value={materialDescription}
                          onChange={(e) => setMaterialDescription(e.target.value)}
                          placeholder="مثال: ستانلس 1000×2000×1.5 - 10 قطع"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="الكمية"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                          inputProps={{ min: 1 }}
                          placeholder="1"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="سعر الخدمة *"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="ملاحظات الخدمة"
                          value={itemNotes}
                          onChange={(e) => setItemNotes(e.target.value)}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={handleAddItem}>
                      إضافة
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              {items.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">النوع</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الوصف</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">السعر</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجمالي</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">حذف</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Chip
                              label={item.item_type === 'material' ? 'معدن' : 'خدمة'}
                              color={item.item_type === 'material' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.item_type === 'material' ? (
                              <Typography fontSize="0.9375rem">
                                {item.code} - {item.metal_name}{' '}
                                <Typography component="span" variant="caption" color="text.secondary">
                                  ({item.dimensions})
                                </Typography>
                              </Typography>
                            ) : (
                              <Typography fontSize="0.9375rem">
                                {item.service_name}{' '}
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {item.material_description ? `– ${item.material_description}` : ''}
                                </Typography>
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center"><Typography fontSize="0.9375rem">{item.quantity}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography fontSize="0.9375rem">
                              {fmt(item.item_type === 'material' ? item.unit_price : item.service_price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center"><Typography fontSize="0.9375rem">{fmt(item.total)}</Typography></TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
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
          )}

          {/* Step 2: Totals */}
          {activeStep === 2 && (
            <Box>
              <Card variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography fontSize="1.0625rem">المجموع الفرعي:</Typography></Grid>
                  <Grid item xs={6} sx={{ textAlign: 'left' }}>
                    <Typography fontSize="1.0625rem" fontWeight={600}>
                      {fmt(subtotal)} {getCurrencySymbol(saleCurrency)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الخصم"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {profile?.vat_enabled && (
                    <>
                      <Grid item xs={6}><Typography fontSize="1.0625rem">الضريبة ({profile.vat_rate}%):</Typography></Grid>
                      <Grid item xs={6} sx={{ textAlign: 'left' }}>
                        <Typography fontSize="1.0625rem" fontWeight={600}>
                          {fmt(taxAmount)} {getCurrencySymbol(saleCurrency)}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={6}><Typography variant="h6" fontWeight={700}>الإجمالي النهائي:</Typography></Grid>
                  <Grid item xs={6} sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {fmt(totalAmount)} {getCurrencySymbol(saleCurrency)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="المبلغ المدفوع"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField 
                      select 
                      fullWidth 
                      label="طريقة الدفع" 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="">غير محدد</option>
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                      ))}
                    </TextField>
                  </Grid>

                  {amountPaid > 0 && (
                    <>
                      <Grid item xs={6}><Typography fontSize="1.0625rem" color="error">المتبقي:</Typography></Grid>
                      <Grid item xs={6} sx={{ textAlign: 'left' }}>
                        <Typography fontSize="1.0625rem" fontWeight={700} color="error.main">
                          {fmt(remaining)} {getCurrencySymbol(saleCurrency)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Card>

              <Alert severity="info" sx={{ fontSize: '0.9375rem' }}>
                تأكّد من صحة جميع البيانات قبل الحفظ. سيتم خصم الكميات من المخزون تلقائياً.
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseCreateDialog} size="large">إلغاء</Button>
          {activeStep > 0 && <Button onClick={handleBack} size="large">السابق</Button>}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext} size="large">التالي</Button>
            : <Button variant="contained" onClick={handleSubmitSale} size="large">حفظ الفاتورة</Button>}
        </DialogActions>
      </Dialog>

      {/* Remnant Dialog - After Cut from Sheet Sale */}
      <Dialog
        open={showRemnantDialog}
        onClose={() => setShowRemnantDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            إضافة البواقي من القطع
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
              تم قص الصفيحة. هل تريد إضافة القطع المتبقية كبواقي؟
            </Alert>

            {currentSaleData && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} fontSize="0.9375rem">
                الصفيحة الأم: {currentSaleData.sheetCode} |
                القطعة المباعة: {currentSaleData.soldDimensions}
              </Typography>
            )}

            {remnantPieces.map((piece, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      قطعة بقية #{index + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الطول (مم)"
                      value={piece.length}
                      onChange={(e) => {
                        const updated = [...remnantPieces];
                        updated[index].length = e.target.value;
                        setRemnantPieces(updated);
                      }}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="العرض (مم)"
                      value={piece.width}
                      onChange={(e) => {
                        const updated = [...remnantPieces];
                        updated[index].width = e.target.value;
                        setRemnantPieces(updated);
                      }}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية"
                      value={piece.quantity}
                      onChange={(e) => {
                        const updated = [...remnantPieces];
                        updated[index].quantity = e.target.value;
                        setRemnantPieces(updated);
                      }}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setRemnantPieces(remnantPieces.filter((_, i) => i !== index));
                      }}
                    >
                      حذف هذه القطعة
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setRemnantPieces([
                  ...remnantPieces,
                  {
                    length: '',
                    width: '',
                    thickness: currentSaleData?.thickness || '',
                    quantity: '1'
                  }
                ]);
              }}
              sx={{ mb: 2 }}
            >
              إضافة قطعة أخرى
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowRemnantDialog(false)} size="large">
            تخطي
          </Button>
          <Button
            onClick={async () => {
              try {
                // Validate remnant pieces
                const validPieces = remnantPieces.filter(p =>
                  p.length && p.width && p.thickness && p.quantity
                );

                if (validPieces.length === 0) {
                  setError('يجب إدخال بيانات صحيحة للبواقي');
                  return;
                }

                // Get parent sheet info
                const parentSheet = sheets.find(s => s.id === currentSaleData?.sheetId);
                if (!parentSheet) {
                  setError('لم يتم العثور على الصفيحة الأم');
                  return;
                }

                // Save each remnant piece
                let savedCount = 0;
                let errorCount = 0;

                for (const piece of validPieces) {
                  const sheetData = {
                    metal_type_id: parentSheet.metal_type_id,
                    grade_id: parentSheet.grade_id,
                    finish_id: parentSheet.finish_id,
                    length_mm: parseFloat(piece.length),
                    width_mm: parseFloat(piece.width),
                    thickness_mm: parseFloat(piece.thickness),
                    weight_per_sheet_kg: parentSheet.weight_per_sheet_kg,
                    is_remnant: true,
                    parent_sheet_id: currentSaleData.sheetId,
                    autoGenerateCode: true
                  };

                  const batchData = {
                    quantity: parseInt(piece.quantity, 10),
                    supplier_id: null,
                    price_per_kg: parentSheet.min_price || 0,
                    total_cost: 0,
                    storage_location: 'بواقي',
                    received_date: new Date().toISOString().split('T')[0],
                    notes: `بقية من ${currentSaleData.sheetCode} - القطعة المباعة: ${currentSaleData.soldDimensions}`
                  };

                  const result = addSheetWithBatch(sheetData, batchData);

                  if (result.success) {
                    savedCount++;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✓ Remnant saved:', result.code);
                    }
                  } else {
                    errorCount++;
                    console.error('Failed to save remnant:', result.error);
                  }
                }

                setShowRemnantDialog(false);

                if (savedCount > 0) {
                  setSuccess(`تم حفظ ${savedCount} قطعة بواقي بنجاح`);
                  loadData(); // Reload data to show new remnants
                  setTimeout(() => setSuccess(''), 3000);
                }

                if (errorCount > 0) {
                  setError(`فشل حفظ ${errorCount} قطعة`);
                }
              } catch (err) {
                setError('خطأ في حفظ البواقي: ' + err.message);
                console.error('Save remnants error:', err);
              }
            }}
            variant="contained"
            size="large"
          >
            حفظ البواقي
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedSale && (
          <>
            <DialogTitle>
              <Typography variant="h5" fontWeight={700}>
                تفاصيل الفاتورة {selectedSale.invoice_number}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">الزبون:</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                    {selectedSale.customer_name || 'غير محدد'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">التاريخ:</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                    {selectedSale.sale_date}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>الأصناف:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell><Typography fontWeight={700} fontSize="1rem">النوع</Typography></TableCell>
                          <TableCell><Typography fontWeight={700} fontSize="1rem">الوصف</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">السعر</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجمالي</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSale.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Chip
                                label={item.item_type === 'material' ? 'معدن' : 'خدمة'}
                                color={item.item_type === 'material' ? 'primary' : 'secondary'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {item.item_type === 'material' ? (
                                <Typography fontSize="0.9375rem">
                                  {item.code}{' '}
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    – {item.length_mm}×{item.width_mm}×{item.thickness_mm} مم
                                  </Typography>
                                </Typography>
                              ) : (
                                <Typography fontSize="0.9375rem">
                                  {item.service_name_ar}{' '}
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {item.material_description ? `– ${item.material_description}` : ''}
                                  </Typography>
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center"><Typography fontSize="0.9375rem">{item.quantity_sold}</Typography></TableCell>
                            <TableCell align="center">
                              <Typography fontSize="0.9375rem">
                                {fmt(item.item_type === 'material' ? item.unit_price : item.service_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center"><Typography fontSize="0.9375rem">{fmt(item.total_price)}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}><Typography fontSize="1.0625rem">المجموع الفرعي:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={600}>
                    {fmt(selectedSale.subtotal)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>

                {selectedSale.discount > 0 && (
                  <>
                    <Grid item xs={6}><Typography fontSize="1.0625rem">الخصم:</Typography></Grid>
                    <Grid item xs={6} sx={{ textAlign: 'left' }}>
                      <Typography fontSize="1.0625rem" fontWeight={600}>
                        -{fmt(selectedSale.discount)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </Grid>
                  </>
                )}

                {selectedSale.tax > 0 && (
                  <>
                    <Grid item xs={6}><Typography fontSize="1.0625rem">الضريبة:</Typography></Grid>
                    <Grid item xs={6} sx={{ textAlign: 'left' }}>
                      <Typography fontSize="1.0625rem" fontWeight={600}>
                        {fmt(selectedSale.tax)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}><Typography variant="h6" fontWeight={700}>الإجمالي:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {fmt(selectedSale.total_amount)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>

                <Grid item xs={6}><Typography fontSize="1.0625rem">المدفوع:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={600} color="success.main">
                    {fmt(selectedSale.total_paid)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>

                {selectedSale.remaining > 0 && (
                  <>
                    <Grid item xs={6}><Typography fontSize="1.0625rem" color="error">المتبقي:</Typography></Grid>
                    <Grid item xs={6} sx={{ textAlign: 'left' }}>
                      <Typography fontSize="1.0625rem" fontWeight={700} color="error.main">
                        {fmt(selectedSale.remaining)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </Grid>
                  </>
                )}

                {selectedSale.notes && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">ملاحظات:</Typography>
                      <Typography variant="body1" fontSize="1rem">{selectedSale.notes}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setOpenViewDialog(false)} size="large">إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}