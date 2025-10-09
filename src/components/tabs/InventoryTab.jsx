// src/components/tabs/InventoryTab.jsx
import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../utils/useDebounce';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Alert, Chip, Paper, InputAdornment, Divider, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Collapse, FormControlLabel, Switch,
  Radio, RadioGroup, FormLabel, Tabs, Tab
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PaymentIcon from '@mui/icons-material/Payment';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

import {
  getAllSheets,
  addSheetWithBatch,
  getBatchesBySheetId,
  getSuppliers,
  getBaseCurrencyInfo,
  addBatchToSheet,
  updateBatch,
  pruneEmptyBatches,
  generateSheetCode,
  getMetalTypes,
  getGrades,
  getFinishes,
  getPaymentMethodsForUI,
  addSupplierPayment
} from '../../utils/database';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function InventoryTab() {
  // Data
  const [sheets, setSheets] = useState([]);
  const [remnants, setRemnants] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [grades, setGrades] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  // Tab State
  const [currentTab, setCurrentTab] = useState(0);

  // Filters for Full Sheets
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetalType, setFilterMetalType] = useState('');
  const [filterThkMin, setFilterThkMin] = useState('');
  const [filterThkMax, setFilterThkMax] = useState('');
  const [filterQtyMin, setFilterQtyMin] = useState('');
  const [filterQtyMax, setFilterQtyMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filters for Remnants
  const [remnantSearchTerm, setRemnantSearchTerm] = useState('');
  const [remnantFilterMetalType, setRemnantFilterMetalType] = useState('');
  const [remnantFilterThkMin, setRemnantFilterThkMin] = useState('');
  const [remnantFilterThkMax, setRemnantFilterThkMax] = useState('');
  const [remnantFilterQtyMin, setRemnantFilterQtyMin] = useState('');
  const [remnantFilterQtyMax, setRemnantFilterQtyMax] = useState('');
  const [remnantFilterParentSheet, setRemnantFilterParentSheet] = useState('');
  const [showRemnantAdvanced, setShowRemnantAdvanced] = useState(false);

  // Debounced search values
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedRemnantSearchTerm = useDebounce(remnantSearchTerm, 300);

  // Dialogs
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openBatchesDialog, setOpenBatchesDialog] = useState(false);
  const [openBatchViewDialog, setOpenBatchViewDialog] = useState(false);

  // Selected
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isEditingBatch, setIsEditingBatch] = useState(false);

  // Auto-code generation
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  // Forms — Sheet info
  const [sheetForm, setSheetForm] = useState({
    code: '',
    metal_type_id: '',
    grade_id: '',
    finish_id: '',
    length_mm: '',
    width_mm: '',
    thickness_mm: '',
    weight_per_sheet_kg: '',
  });

  // Forms — Initial batch for new sheet
  const [batchForm, setBatchForm] = useState({
    supplier_id: '',
    quantity: '',
    pricing_mode: 'per_kg',
    price_per_kg: '',
    total_cost: '',
    batch_weight_kg: '',
    storage_location: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_type: 'later',
    payment_amount: '',
    payment_method: '',
    payment_notes: ''
  });

  // Forms — Add batch for existing sheet
  const [existingBatchForm, setExistingBatchForm] = useState({
    supplier_id: '',
    quantity: '',
    pricing_mode: 'per_kg',
    price_per_kg: '',
    total_cost: '',
    batch_weight_kg: '',
    storage_location: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_type: 'later',
    payment_amount: '',
    payment_method: '',
    payment_notes: ''
  });

  // Form — Edit batch
  const [editBatchForm, setEditBatchForm] = useState({
    quantity_original: '',
    price_per_kg: '',
    received_date: '',
    storage_location: '',
    notes: ''
  });

  // Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = () => {
    try { pruneEmptyBatches(); } catch {}
    const all = getAllSheets();
    const fullSheets = all.filter(s => !s.is_remnant);
    const remnantSheets = all.filter(s => s.is_remnant);
    setSheets(fullSheets);
    setRemnants(remnantSheets);
    setSuppliers(getSuppliers());

    const types = getMetalTypes(false);
    setMetalTypes(types);

    const currInfo = getBaseCurrencyInfo();
    setBaseCurrencyInfo(currInfo);

    setPaymentMethods(getPaymentMethodsForUI(true));
  };

  // Load grades and finishes when metal type changes
  useEffect(() => {
    if (sheetForm.metal_type_id) {
      setGrades(getGrades(sheetForm.metal_type_id, true));
      setFinishes(getFinishes(sheetForm.metal_type_id, true));
    } else {
      setGrades([]);
      setFinishes([]);
    }
  }, [sheetForm.metal_type_id]);

  // Auto-generate code when dimensions/grade/finish change
  useEffect(() => {
    if (autoGenerateCode && sheetForm.metal_type_id && sheetForm.length_mm && sheetForm.width_mm && sheetForm.thickness_mm) {
      const generated = generateSheetCode(
        Number(sheetForm.metal_type_id),
        Number(sheetForm.length_mm),
        Number(sheetForm.width_mm),
        Number(sheetForm.thickness_mm),
        sheetForm.grade_id ? Number(sheetForm.grade_id) : null,
        sheetForm.finish_id ? Number(sheetForm.finish_id) : null,
        false // isRemnant
      );
      setSheetForm(prev => ({ ...prev, code: generated }));
    }
  }, [autoGenerateCode, sheetForm.metal_type_id, sheetForm.length_mm, sheetForm.width_mm, sheetForm.thickness_mm, sheetForm.grade_id, sheetForm.finish_id]);

  // Note: Auto-calculation of total weight happens in the effBatchWeight helper function
  // The UI displays the calculated total weight in real-time based on quantity and batch_weight_kg

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMetalType('');
    setFilterThkMin('');
    setFilterThkMax('');
    setFilterQtyMin('');
    setFilterQtyMax('');
  };

  const resetRemnantFilters = () => {
    setRemnantSearchTerm('');
    setRemnantFilterMetalType('');
    setRemnantFilterThkMin('');
    setRemnantFilterThkMax('');
    setRemnantFilterQtyMin('');
    setRemnantFilterQtyMax('');
    setRemnantFilterParentSheet('');
  };

  const filteredSheets = useMemo(() => {
    let rows = sheets;
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter(s =>
        (s.code || '').toLowerCase().includes(term) ||
        (s.metal_name || '').toLowerCase().includes(term)
      );
    }
    if (filterMetalType) {
      rows = rows.filter(s => Number(s.metal_type_id) === Number(filterMetalType));
    }
    if (filterThkMin) rows = rows.filter(s => Number(s.thickness_mm) >= Number(filterThkMin));
    if (filterThkMax) rows = rows.filter(s => Number(s.thickness_mm) <= Number(filterThkMax));
    if (filterQtyMin) rows = rows.filter(s => Number(s.total_quantity) >= Number(filterQtyMin));
    if (filterQtyMax) rows = rows.filter(s => Number(s.total_quantity) <= Number(filterQtyMax));
    return rows;
  }, [sheets, debouncedSearchTerm, filterMetalType, filterThkMin, filterThkMax, filterQtyMin, filterQtyMax]);

  const filteredRemnants = useMemo(() => {
    let rows = remnants;
    const term = debouncedRemnantSearchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter(s =>
        (s.code || '').toLowerCase().includes(term) ||
        (s.metal_name || '').toLowerCase().includes(term)
      );
    }
    if (remnantFilterMetalType) {
      rows = rows.filter(s => Number(s.metal_type_id) === Number(remnantFilterMetalType));
    }
    if (remnantFilterThkMin) rows = rows.filter(s => Number(s.thickness_mm) >= Number(remnantFilterThkMin));
    if (remnantFilterThkMax) rows = rows.filter(s => Number(s.thickness_mm) <= Number(remnantFilterThkMax));
    if (remnantFilterQtyMin) rows = rows.filter(s => Number(s.total_quantity) >= Number(remnantFilterQtyMin));
    if (remnantFilterQtyMax) rows = rows.filter(s => Number(s.total_quantity) <= Number(remnantFilterQtyMax));
    if (remnantFilterParentSheet) {
      rows = rows.filter(s => {
        if (!s.parent_sheet_id) return false;
        const parentSheet = sheets.find(sh => sh.id === s.parent_sheet_id);
        return parentSheet && parentSheet.code.toLowerCase().includes(remnantFilterParentSheet.toLowerCase());
      });
    }
    return rows;
  }, [remnants, sheets, debouncedRemnantSearchTerm, remnantFilterMetalType, remnantFilterThkMin, remnantFilterThkMax, remnantFilterQtyMin, remnantFilterQtyMax, remnantFilterParentSheet]);

  // ──────────────────────────────────────────────────────────────
  // Helpers for pricing/weights
  const effBatchWeight = (qty, sheetWeight, batchWeight) => {
    const q = Number(qty) || 0;
    const sw = Number(sheetWeight) || 0;
    const bw = Number(batchWeight) || 0;
    if (bw > 0) return bw;
    if (sw > 0 && q > 0) return q * sw;
    return 0;
  };

  const computeTotalsPreview = (mode, pricePerKg, totalCost, qty, sheetWeight, batchWeight) => {
    const w = effBatchWeight(qty, sheetWeight, batchWeight);
    const pkg = Number(pricePerKg) || 0;
    const tc = Number(totalCost) || 0;

    if (mode === 'per_kg') {
      if (w > 0 && pkg > 0) {
        return { total_cost: w * pkg, price_per_kg: pkg, weight_used: w };
      }
      return { total_cost: null, price_per_kg: pkg, weight_used: w };
    } else {
      if (tc > 0 && w > 0) {
        return { total_cost: tc, price_per_kg: tc / w, weight_used: w };
      }
      return { total_cost: tc > 0 ? tc : null, price_per_kg: null, weight_used: w };
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Add new sheet + initial batch
  const handleOpenAddDialog = () => {
    const defaultMetalType = metalTypes.find(m => m.is_active)?.id || '';
    
    setSheetForm({
      code: '',
      metal_type_id: defaultMetalType,
      grade_id: '',
      finish_id: '',
      length_mm: '',
      width_mm: '',
      thickness_mm: '',
      weight_per_sheet_kg: '',
    });
    
    // Load grades/finishes for default metal type
    if (defaultMetalType) {
      setGrades(getGrades(defaultMetalType, true));
      setFinishes(getFinishes(defaultMetalType, true));
    }
    
    setBatchForm({
      supplier_id: '',
      quantity: '',
      pricing_mode: 'per_kg',
      price_per_kg: '',
      total_cost: '',
      batch_weight_kg: '',
      storage_location: '',
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_type: 'later',
      payment_amount: '',
      payment_method: paymentMethods[0]?.name || '',
      payment_notes: ''
    });
    setAutoGenerateCode(true);
    setError('');
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setError('');
  };

  const handleSaveNewSheet = () => {
    if (!sheetForm.code.trim()) return setError('الكود مطلوب');
    if (!sheetForm.length_mm || !sheetForm.width_mm || !sheetForm.thickness_mm)
      return setError('الأبعاد مطلوبة');
    if (!batchForm.quantity || Number(batchForm.quantity) <= 0)
      return setError('الكمية يجب أن تكون أكبر من صفر');
    if (!batchForm.batch_weight_kg || Number(batchForm.batch_weight_kg) <= 0)
      return setError('الوزن لكل قطعة مطلوب ويجب أن يكون أكبر من صفر');

    const preview = computeTotalsPreview(
      batchForm.pricing_mode,
      batchForm.price_per_kg,
      batchForm.total_cost,
      batchForm.quantity,
      sheetForm.weight_per_sheet_kg,
      batchForm.batch_weight_kg
    );

    const sheetData = {
      code: sheetForm.code.trim(),
      metal_type_id: Number(sheetForm.metal_type_id),
      grade_id: sheetForm.grade_id ? Number(sheetForm.grade_id) : null,
      finish_id: sheetForm.finish_id ? Number(sheetForm.finish_id) : null,
      length_mm: Number(sheetForm.length_mm),
      width_mm: Number(sheetForm.width_mm),
      thickness_mm: Number(sheetForm.thickness_mm),
      weight_per_sheet_kg: sheetForm.weight_per_sheet_kg ? Number(sheetForm.weight_per_sheet_kg) : null,
      is_remnant: false
    };

    const batchData = {
      supplier_id: batchForm.supplier_id || null,
      quantity: Number(batchForm.quantity),
      price_per_kg: preview.price_per_kg != null ? Number(preview.price_per_kg) : null,
      total_cost: preview.total_cost != null ? Number(preview.total_cost.toFixed(2)) : null,
      storage_location: batchForm.storage_location || null,
      received_date: batchForm.received_date,
      notes: batchForm.notes || null
    };

    const result = addSheetWithBatch(sheetData, batchData);
    if (result.success) {
      // Handle payment if needed
      if (batchForm.supplier_id && batchForm.payment_type !== 'later' && preview.total_cost) {
        const paymentAmount = batchForm.payment_type === 'full' 
          ? preview.total_cost 
          : parseFloat(batchForm.payment_amount) || 0;

        if (paymentAmount > 0) {
          addSupplierPayment({
            supplier_id: batchForm.supplier_id,
            batch_id: result.batchId,
            amount: paymentAmount,
            currency: baseCurrencyInfo.code,
            payment_method: batchForm.payment_method,
            payment_date: batchForm.received_date,
            notes: batchForm.payment_notes || `دفعة ${batchForm.payment_type === 'full' ? 'كاملة' : 'جزئية'} للدفعة`
          });
        }
      }
      
      setSuccess(`✓ تم إضافة ${result.linked ? 'الدفعة للصفيحة الموجودة' : 'الصفيحة والدفعة'} بنجاح`);
      setTimeout(() => setSuccess(''), 3000);
      handleCloseAddDialog();
      refreshAll();
    } else {
      setError('فشل الحفظ: ' + result.error);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Show batches & add new batch to existing sheet
  const handleShowBatches = (sheet) => {
    setSelectedSheet(sheet);
    setExistingBatchForm({
      supplier_id: '',
      quantity: '',
      pricing_mode: 'per_kg',
      price_per_kg: '',
      total_cost: '',
      batch_weight_kg: '',
      storage_location: '',
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_type: 'later',
      payment_amount: '',
      payment_method: paymentMethods[0]?.name || '',
      payment_notes: ''
    });
    const list = getBatchesBySheetId(sheet.id);
    setBatches(list);
    setOpenBatchesDialog(true);
  };

  const handleAddBatchToExisting = () => {
    if (!selectedSheet) return;
    if (!existingBatchForm.quantity || Number(existingBatchForm.quantity) <= 0)
      return setError('الكمية يجب أن تكون أكبر من صفر');
    if (!existingBatchForm.batch_weight_kg || Number(existingBatchForm.batch_weight_kg) <= 0)
      return setError('الوزن لكل قطعة مطلوب ويجب أن يكون أكبر من صفر');

    const preview = computeTotalsPreview(
      existingBatchForm.pricing_mode,
      existingBatchForm.price_per_kg,
      existingBatchForm.total_cost,
      existingBatchForm.quantity,
      selectedSheet.weight_per_sheet_kg,
      existingBatchForm.batch_weight_kg
    );

    const payload = {
      sheet_id: selectedSheet.id,
      supplier_id: existingBatchForm.supplier_id || null,
      quantity: Number(existingBatchForm.quantity),
      price_per_kg: preview.price_per_kg != null ? Number(preview.price_per_kg) : null,
      total_cost: preview.total_cost != null ? Number(preview.total_cost.toFixed(2)) : null,
      storage_location: existingBatchForm.storage_location || null,
      received_date: existingBatchForm.received_date,
      notes: existingBatchForm.notes || null
    };

    const res = addBatchToSheet(payload);
    if (res?.success) {
      // Handle payment
      if (existingBatchForm.supplier_id && existingBatchForm.payment_type !== 'later' && preview.total_cost) {
        const paymentAmount = existingBatchForm.payment_type === 'full' 
          ? preview.total_cost 
          : parseFloat(existingBatchForm.payment_amount) || 0;

        if (paymentAmount > 0) {
          addSupplierPayment({
            supplier_id: existingBatchForm.supplier_id,
            batch_id: res.id,
            amount: paymentAmount,
            currency: baseCurrencyInfo.code,
            payment_method: existingBatchForm.payment_method,
            payment_date: existingBatchForm.received_date,
            notes: existingBatchForm.payment_notes || `دفعة ${existingBatchForm.payment_type === 'full' ? 'كاملة' : 'جزئية'}`
          });
        }
      }
      
      setSuccess('✓ تمت إضافة الدفعة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      const list = getBatchesBySheetId(selectedSheet.id);
      setBatches(list);
      refreshAll();
      setExistingBatchForm((f) => ({
        ...f,
        supplier_id: '',
        quantity: '',
        price_per_kg: f.pricing_mode === 'per_kg' ? '' : f.price_per_kg,
        total_cost: f.pricing_mode === 'per_batch' ? '' : f.total_cost,
        batch_weight_kg: '',
        storage_location: '',
        notes: '',
        payment_type: 'later',
        payment_amount: '',
        payment_notes: ''
      }));
    } else {
      setError('فشل إضافة الدفعة: ' + (res?.error || ''));
    }
  };

  const getStockColor = (quantity) => {
    if (quantity === 0) return 'error';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  // ──────────────────────────────────────────────────────────────
  // Batch view and edit handlers
  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setEditBatchForm({
      quantity_original: batch.quantity_original || '',
      price_per_kg: batch.price_per_kg || '',
      received_date: batch.received_date || '',
      storage_location: batch.storage_location || '',
      notes: batch.notes || ''
    });
    setIsEditingBatch(false);
    setOpenBatchViewDialog(true);
  };

  const handleEditBatch = () => {
    setIsEditingBatch(true);
  };

  const handleCancelEditBatch = () => {
    setIsEditingBatch(false);
    setEditBatchForm({
      quantity_original: selectedBatch.quantity_original || '',
      price_per_kg: selectedBatch.price_per_kg || '',
      received_date: selectedBatch.received_date || '',
      storage_location: selectedBatch.storage_location || '',
      notes: selectedBatch.notes || ''
    });
  };

  const handleSaveEditBatch = () => {
    if (!selectedBatch) return;

    // Calculate total_cost from price_per_kg and weight
    const weight = selectedSheet?.weight_per_sheet_kg
      ? Number(editBatchForm.quantity_original) * Number(selectedSheet.weight_per_sheet_kg)
      : null;

    const total_cost = weight && editBatchForm.price_per_kg
      ? Number(editBatchForm.price_per_kg) * weight
      : null;

    const updates = {
      quantity_original: Number(editBatchForm.quantity_original),
      price_per_kg: editBatchForm.price_per_kg ? Number(editBatchForm.price_per_kg) : null,
      total_cost: total_cost,
      storage_location: editBatchForm.storage_location || null,
      notes: editBatchForm.notes || null
    };

    const result = updateBatch(selectedBatch.id, updates);
    if (result.success) {
      setSuccess('✓ تم تحديث الدفعة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditingBatch(false);
      setOpenBatchViewDialog(false);

      // Refresh batches list
      const list = getBatchesBySheetId(selectedSheet.id);
      setBatches(list);
      refreshAll();
    } else {
      setError('فشل تحديث الدفعة: ' + result.error);
    }
  };

  const handleCloseBatchView = () => {
    setOpenBatchViewDialog(false);
    setIsEditingBatch(false);
    setSelectedBatch(null);
  };

  // Get parent sheet code
  const getParentSheetCode = (parentSheetId) => {
    if (!parentSheetId) return null;
    const parentSheet = sheets.find(s => s.id === parentSheetId);
    return parentSheet ? parentSheet.code : null;
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة المخزون
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إدارة الصفائح المعدنية والدفعات
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '1.0625rem',
              fontWeight: 600,
              minHeight: 60
            }
          }}
        >
          <Tab
            label={`الصفائح الكاملة (${sheets.length})`}
            icon={<InventoryIcon />}
            iconPosition="start"
          />
          <Tab
            label={`البواقي (${remnants.length})`}
            icon={<AddBoxIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Tab Content - Full Sheets */}
      {currentTab === 0 && (
        <>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="بحث بالكود أو نوع المعدن..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="نوع المعدن"
                    value={filterMetalType}
                    onChange={(e) => setFilterMetalType(e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="">الكل</option>
                    {metalTypes.filter(m => m.is_active).map(metal => (
                      <option key={metal.id} value={metal.id}>{metal.name_ar}</option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    startIcon={<FilterAltIcon />}
                    onClick={() => setShowAdvanced(v => !v)}
                    size="large"
                  >
                    فلاتر متقدمة
                  </Button>
                  <Button
                    startIcon={<RestartAltIcon />}
                    onClick={resetFilters}
                    size="large"
                  >
                    إعادة ضبط
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{ fontWeight: 700 }}
                  >
                    إضافة صفيحة جديدة
                  </Button>
                </Grid>
              </Grid>

              <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أدنى سماكة (مم)"
                      value={filterThkMin}
                      onChange={(e) => setFilterThkMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أقصى سماكة (مم)"
                      value={filterThkMax}
                      onChange={(e) => setFilterThkMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أدنى كمية"
                      value={filterQtyMin}
                      onChange={(e) => setFilterQtyMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أقصى كمية"
                      value={filterQtyMax}
                      onChange={(e) => setFilterQtyMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الكود</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">النوع</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الأبعاد (مم)</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">السماكة</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الوزن/ورقة</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">السعر/كغ</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد صفائح كاملة</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSheets.map((sheet) => (
                    <TableRow key={sheet.id} hover>
                      <TableCell>
                        <Typography fontWeight={600} fontSize="0.9375rem">{sheet.code}</Typography>
                      </TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{sheet.metal_name}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{sheet.length_mm} × {sheet.width_mm}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{sheet.thickness_mm} مم</Typography></TableCell>
                      <TableCell>
                        <Typography fontSize="0.9375rem">
                          {sheet.weight_per_sheet_kg ? `${fmt(sheet.weight_per_sheet_kg)} كغ` : '---'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={sheet.total_quantity}
                          color={getStockColor(sheet.total_quantity)}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {sheet.min_price ? (
                          sheet.min_price === sheet.max_price ? (
                            <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                              {fmt(sheet.min_price)} {baseCurrencyInfo.symbol}
                            </Typography>
                          ) : (
                            <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                              {fmt(sheet.min_price)} - {fmt(sheet.max_price)} {baseCurrencyInfo.symbol}
                            </Typography>
                          )
                        ) : <Typography fontSize="0.9375rem">---</Typography>}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="عرض الدفعات / إضافة دفعة">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleShowBatches(sheet)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab Content - Remnants */}
      {currentTab === 1 && (
        <>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="بحث بالكود أو نوع المعدن..."
                    value={remnantSearchTerm}
                    onChange={(e) => setRemnantSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="نوع المعدن"
                    value={remnantFilterMetalType}
                    onChange={(e) => setRemnantFilterMetalType(e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="">الكل</option>
                    {metalTypes.filter(m => m.is_active).map(metal => (
                      <option key={metal.id} value={metal.id}>{metal.name_ar}</option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    startIcon={<FilterAltIcon />}
                    onClick={() => setShowRemnantAdvanced(v => !v)}
                    size="large"
                  >
                    فلاتر متقدمة
                  </Button>
                  <Button
                    startIcon={<RestartAltIcon />}
                    onClick={resetRemnantFilters}
                    size="large"
                  >
                    إعادة ضبط
                  </Button>
                </Grid>
              </Grid>

              <Collapse in={showRemnantAdvanced} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أدنى سماكة (مم)"
                      value={remnantFilterThkMin}
                      onChange={(e) => setRemnantFilterThkMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أقصى سماكة (مم)"
                      value={remnantFilterThkMax}
                      onChange={(e) => setRemnantFilterThkMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أدنى كمية"
                      value={remnantFilterQtyMin}
                      onChange={(e) => setRemnantFilterQtyMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="أقصى كمية"
                      value={remnantFilterQtyMax}
                      onChange={(e) => setRemnantFilterQtyMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="الصفيحة الأم"
                      placeholder="ابحث بكود الصفيحة الأم..."
                      value={remnantFilterParentSheet}
                      onChange={(e) => setRemnantFilterParentSheet(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الكود</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">النوع</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الأبعاد (مم)</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">السماكة</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الصفيحة الأم</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">السعر/كغ</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRemnants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد بواقي</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRemnants.map((sheet) => {
                    const parentCode = getParentSheetCode(sheet.parent_sheet_id);
                    return (
                      <TableRow key={sheet.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} fontSize="0.9375rem">{sheet.code}</Typography>
                        </TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{sheet.metal_name}</Typography></TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{sheet.length_mm} × {sheet.width_mm}</Typography></TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{sheet.thickness_mm} مم</Typography></TableCell>
                        <TableCell>
                          {parentCode ? (
                            <Tooltip title="الصفيحة الأم" arrow>
                              <Chip
                                label={parentCode}
                                size="small"
                                color="info"
                                sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                              />
                            </Tooltip>
                          ) : (
                            <Typography fontSize="0.9375rem" color="text.secondary">---</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sheet.total_quantity}
                            color={getStockColor(sheet.total_quantity)}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {sheet.min_price ? (
                            sheet.min_price === sheet.max_price ? (
                              <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                                {fmt(sheet.min_price)} {baseCurrencyInfo.symbol}
                              </Typography>
                            ) : (
                              <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                                {fmt(sheet.min_price)} - {fmt(sheet.max_price)} {baseCurrencyInfo.symbol}
                              </Typography>
                            )
                          ) : <Typography fontSize="0.9375rem">---</Typography>}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="عرض الدفعات / إضافة دفعة">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleShowBatches(sheet)}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialog: Add Sheet + Initial Batch */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          إضافة صفيحة جديدة
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Sheet Info Accordion */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={700}>
                  <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  معلومات الصفيحة
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoGenerateCode}
                          onChange={(e) => {
                            setAutoGenerateCode(e.target.checked);
                            if (!e.target.checked) {
                              setSheetForm(prev => ({ ...prev, code: '' }));
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AutoFixHighIcon fontSize="small" />
                          <Typography fontSize="1rem">توليد الكود تلقائياً</Typography>
                        </Box>
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="الكود *"
                      value={sheetForm.code}
                      onChange={(e) => setSheetForm({ ...sheetForm, code: e.target.value })}
                      disabled={autoGenerateCode}
                      helperText={autoGenerateCode ? "سيتم توليد الكود تلقائياً بناءً على المواصفات" : ""}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="نوع المعدن *"
                      value={sheetForm.metal_type_id}
                      onChange={(e) => {
                        const newMetalId = e.target.value;
                        setSheetForm({ 
                          ...sheetForm, 
                          metal_type_id: newMetalId, 
                          grade_id: '', 
                          finish_id: '' 
                        });
                      }}
                      SelectProps={{ native: true }}
                    >
                      <option value="">-- اختر النوع --</option>
                      {metalTypes.filter(m => m.is_active).map(metal => (
                        <option key={metal.id} value={metal.id}>{metal.name_ar}</option>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="الدرجة"
                      value={sheetForm.grade_id}
                      onChange={(e) => setSheetForm({ ...sheetForm, grade_id: e.target.value })}
                      SelectProps={{ native: true }}
                      disabled={!sheetForm.metal_type_id || grades.length === 0}
                      helperText={!sheetForm.metal_type_id ? "اختر نوع المعدن أولاً" : (grades.length === 0 ? "لا توجد درجات متاحة" : "")}
                    >
                      <option value="">-- بدون درجة (xx) --</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="التشطيب"
                      value={sheetForm.finish_id}
                      onChange={(e) => setSheetForm({ ...sheetForm, finish_id: e.target.value })}
                      SelectProps={{ native: true }}
                      disabled={!sheetForm.metal_type_id || finishes.length === 0}
                      helperText={!sheetForm.metal_type_id ? "اختر نوع المعدن أولاً" : (finishes.length === 0 ? "لا توجد تشطيبات متاحة" : "")}
                    >
                      <option value="">-- بدون تشطيب (xx) --</option>
                      {finishes.map(finish => (
                        <option key={finish.id} value={finish.id}>
                          {finish.name_ar} ({finish.name_en})
                        </option>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الطول (مم) *"
                      value={sheetForm.length_mm}
                      onChange={(e) => setSheetForm({ ...sheetForm, length_mm: e.target.value })}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="العرض (مم) *"
                      value={sheetForm.width_mm}
                      onChange={(e) => setSheetForm({ ...sheetForm, width_mm: e.target.value })}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السماكة (مم) *"
                      value={sheetForm.thickness_mm}
                      onChange={(e) => setSheetForm({ ...sheetForm, thickness_mm: e.target.value })}
                      inputProps={{ step: 0.1, min: 0.1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الوزن لكل ورقة (كغ) — إدخال يدوي"
                      value={sheetForm.weight_per_sheet_kg}
                      onChange={(e) => setSheetForm({ ...sheetForm, weight_per_sheet_kg: e.target.value })}
                      inputProps={{ step: 0.001, min: 0 }}
                      helperText="أدخل الوزن يدويًا (بدون حساب تلقائي)"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Batch Info Accordion */}
            <Accordion defaultExpanded sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={700}>
                  <LocalShippingIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  معلومات الدفعة
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="المورد"
                      value={batchForm.supplier_id}
                      onChange={(e) => setBatchForm({ ...batchForm, supplier_id: e.target.value })}
                      SelectProps={{ native: true }}
                    >
                      <option value="">بدون مورد</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية *"
                      value={batchForm.quantity}
                      onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="طريقة التسعير"
                      value={batchForm.pricing_mode}
                      onChange={(e) => setBatchForm({ ...batchForm, pricing_mode: e.target.value })}
                      SelectProps={{ native: true }}
                    >
                      <option value="per_kg">بالكيلو (price/kg)</option>
                      <option value="per_batch">بالدفعة (total cost)</option>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الوزن لكل قطعة (كغ) *"
                      value={batchForm.batch_weight_kg}
                      onChange={(e) => setBatchForm({ ...batchForm, batch_weight_kg: e.target.value })}
                      inputProps={{ step: 0.001, min: 0 }}
                      helperText="الوزن لكل قطعة واحدة"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الوزن الإجمالي (كغ)"
                      value={
                        batchForm.quantity && batchForm.batch_weight_kg
                          ? (Number(batchForm.quantity) * Number(batchForm.batch_weight_kg)).toFixed(3)
                          : ''
                      }
                      disabled
                      helperText="يُحسب تلقائياً: الكمية × الوزن لكل قطعة"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {batchForm.pricing_mode === 'per_kg' ? (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="السعر لكل كيلو"
                        value={batchForm.price_per_kg}
                        onChange={(e) => setBatchForm({ ...batchForm, price_per_kg: e.target.value })}
                        inputProps={{ step: 0.01, min: 0 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  ) : (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="التكلفة الإجمالية"
                        value={batchForm.total_cost}
                        onChange={(e) => setBatchForm({ ...batchForm, total_cost: e.target.value })}
                        inputProps={{ step: 0.01, min: 0 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="تاريخ الاستلام"
                      value={batchForm.received_date}
                      onChange={(e) => setBatchForm({ ...batchForm, received_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="موقع التخزين"
                      value={batchForm.storage_location}
                      onChange={(e) => setBatchForm({ ...batchForm, storage_location: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="ملاحظات"
                      value={batchForm.notes}
                      onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    {(() => {
                      const p = computeTotalsPreview(
                        batchForm.pricing_mode,
                        batchForm.price_per_kg,
                        batchForm.total_cost,
                        batchForm.quantity,
                        sheetForm.weight_per_sheet_kg,
                        batchForm.batch_weight_kg
                      );
                      return (
                        <Typography variant="caption" color="text.secondary" fontSize="0.9375rem">
                          الوزن المُستخدم للحساب: <b>{p.weight_used ? fmt(p.weight_used) : 'غير مُحدد'} كغ</b> —{' '}
                          {batchForm.pricing_mode === 'per_kg' ? (
                            <>
                              التكلفة المتوقعة: <b>{p.total_cost != null ? fmt(p.total_cost) : '—'} {baseCurrencyInfo.symbol}</b>
                            </>
                          ) : (
                            <>
                              السعر/كغ المتوقع: <b>{p.price_per_kg != null ? fmt(p.price_per_kg) : '—'} {baseCurrencyInfo.symbol}</b>
                            </>
                          )}
                        </Typography>
                      );
                    })()}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Payment Accordion - NEW */}
            {batchForm.supplier_id && (
              <Accordion defaultExpanded sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" fontWeight={700}>
                    <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    الدفع للمورد
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <FormLabel component="legend">نوع الدفع</FormLabel>
                      <RadioGroup
                        row
                        value={batchForm.payment_type}
                        onChange={(e) => setBatchForm({ ...batchForm, payment_type: e.target.value })}
                      >
                        <FormControlLabel value="full" control={<Radio />} label="دفع كامل" />
                        <FormControlLabel value="partial" control={<Radio />} label="دفع جزئي" />
                        <FormControlLabel value="later" control={<Radio />} label="الدفع لاحقاً" />
                      </RadioGroup>
                    </Grid>

                    {batchForm.payment_type === 'partial' && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="المبلغ المدفوع"
                          value={batchForm.payment_amount}
                          onChange={(e) => setBatchForm({ ...batchForm, payment_amount: e.target.value })}
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">{baseCurrencyInfo.symbol}</InputAdornment>
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    )}

                    {batchForm.payment_type !== 'later' && (
                      <Grid item xs={12} md={batchForm.payment_type === 'partial' ? 6 : 12}>
                        <TextField
                          select
                          fullWidth
                          label="طريقة الدفع"
                          value={batchForm.payment_method}
                          onChange={(e) => setBatchForm({ ...batchForm, payment_method: e.target.value })}
                          SelectProps={{ native: true }}
                        >
                          {paymentMethods.map(pm => (
                            <option key={pm.id} value={pm.name}>{pm.name}</option>
                          ))}
                        </TextField>
                      </Grid>
                    )}

                    {batchForm.payment_type !== 'later' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="ملاحظات الدفع"
                          value={batchForm.payment_notes}
                          onChange={(e) => setBatchForm({ ...batchForm, payment_notes: e.target.value })}
                        />
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseAddDialog} size="large">إلغاء</Button>
          <Button onClick={handleSaveNewSheet} variant="contained" size="large">حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Batches (view + add) */}
      <Dialog open={openBatchesDialog} onClose={() => setOpenBatchesDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              الدفعات - {selectedSheet?.code}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
              {selectedSheet?.metal_name} | {selectedSheet?.length_mm}×{selectedSheet?.width_mm} | {selectedSheet?.thickness_mm} مم
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddBoxIcon fontSize="small" /> إضافة دفعة للصفيحة
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="المورد"
                  value={existingBatchForm.supplier_id}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, supplier_id: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="">بدون مورد</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="الكمية *"
                  value={existingBatchForm.quantity}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, quantity: e.target.value })}
                  inputProps={{ min: 1 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="طريقة التسعير"
                  value={existingBatchForm.pricing_mode}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, pricing_mode: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="per_kg">بالكيلو (price/kg)</option>
                  <option value="per_batch">بالدفعة (total cost)</option>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="الوزن لكل قطعة (كغ) *"
                  value={existingBatchForm.batch_weight_kg}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, batch_weight_kg: e.target.value })}
                  inputProps={{ step: 0.001, min: 0 }}
                  helperText="الوزن لكل قطعة واحدة"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="الوزن الإجمالي (كغ)"
                  value={
                    existingBatchForm.quantity && existingBatchForm.batch_weight_kg
                      ? (Number(existingBatchForm.quantity) * Number(existingBatchForm.batch_weight_kg)).toFixed(3)
                      : ''
                  }
                  disabled
                  helperText="يُحسب تلقائياً: الكمية × الوزن لكل قطعة"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {existingBatchForm.pricing_mode === 'per_kg' ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="السعر لكل كيلو"
                    value={existingBatchForm.price_per_kg}
                    onChange={(e) => setExistingBatchForm({ ...existingBatchForm, price_per_kg: e.target.value })}
                    inputProps={{ step: 0.01, min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="التكلفة الإجمالية"
                    value={existingBatchForm.total_cost}
                    onChange={(e) => setExistingBatchForm({ ...existingBatchForm, total_cost: e.target.value })}
                    inputProps={{ step: 0.01, min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ الاستلام"
                  value={existingBatchForm.received_date}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, received_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Payment Section - NEW */}
              {existingBatchForm.supplier_id && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                      <PaymentIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      الدفع للمورد
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="نوع الدفع"
                      value={existingBatchForm.payment_type}
                      onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_type: e.target.value })}
                      SelectProps={{ native: true }}
                    >
                      <option value="later">الدفع لاحقاً</option>
                      <option value="full">دفع كامل</option>
                      <option value="partial">دفع جزئي</option>
                    </TextField>
                  </Grid>

                  {existingBatchForm.payment_type === 'partial' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="المبلغ المدفوع"
                        value={existingBatchForm.payment_amount}
                        onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_amount: e.target.value })}
                        inputProps={{ step: 0.01, min: 0 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{baseCurrencyInfo.symbol}</InputAdornment>
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  )}

                  {existingBatchForm.payment_type !== 'later' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        label="طريقة الدفع"
                        value={existingBatchForm.payment_method}
                        onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_method: e.target.value })}
                        SelectProps={{ native: true }}
                      >
                        {paymentMethods.map(pm => (
                          <option key={pm.id} value={pm.name}>{pm.name}</option>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                </>
              )}

              <Grid item xs={12}>
                {selectedSheet && (() => {
                  const p = computeTotalsPreview(
                    existingBatchForm.pricing_mode,
                    existingBatchForm.price_per_kg,
                    existingBatchForm.total_cost,
                    existingBatchForm.quantity,
                    selectedSheet.weight_per_sheet_kg,
                    existingBatchForm.batch_weight_kg
                  );
                  return (
                    <Typography variant="caption" color="text.secondary" fontSize="0.9375rem">
                      الوزن المُستخدم للحساب: <b>{p.weight_used ? fmt(p.weight_used) : 'غير مُحدد'} كغ</b> —{' '}
                      {existingBatchForm.pricing_mode === 'per_kg' ? (
                        <>
                          التكلفة المتوقعة: <b>{p.total_cost != null ? fmt(p.total_cost) : '—'} {baseCurrencyInfo.symbol}</b>
                        </>
                      ) : (
                        <>
                          السعر/كغ المتوقع: <b>{p.price_per_kg != null ? fmt(p.price_per_kg) : '—'} {baseCurrencyInfo.symbol}</b>
                        </>
                      )}
                    </Typography>
                  );
                })()}
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="large" startIcon={<AddBoxIcon />} onClick={handleAddBatchToExisting}>
                  إضافة الدفعة
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            الدفعات المتاحة
          </Typography>

          {batches.length === 0 ? (
            <Alert severity="info" sx={{ fontSize: '1rem' }}>لا توجد دفعات متاحة</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell><Typography fontWeight={700} fontSize="1rem">المورد</Typography></TableCell>
                    <TableCell><Typography fontWeight={700} fontSize="1rem">الكمية الأصلية</Typography></TableCell>
                    <TableCell><Typography fontWeight={700} fontSize="1rem">المتبقي</Typography></TableCell>
                    <TableCell><Typography fontWeight={700} fontSize="1rem">السعر/كغ</Typography></TableCell>
                    <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
                    <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell onClick={() => handleViewBatch(batch)}>
                        <Typography fontSize="0.9375rem">{batch.supplier_name || 'بدون مورد'}</Typography>
                      </TableCell>
                      <TableCell onClick={() => handleViewBatch(batch)}>
                        <Typography fontSize="0.9375rem">{batch.quantity_original}</Typography>
                      </TableCell>
                      <TableCell onClick={() => handleViewBatch(batch)}>
                        <Chip
                          label={batch.quantity_remaining}
                          color={getStockColor(batch.quantity_remaining)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell onClick={() => handleViewBatch(batch)}>
                        <Typography fontSize="0.9375rem">
                          {batch.price_per_kg ? `${fmt(batch.price_per_kg)} ${baseCurrencyInfo.symbol}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={() => handleViewBatch(batch)}>
                        <Typography fontSize="0.9375rem">{batch.received_date}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewBatch(batch)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenBatchesDialog(false)} size="large">إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Batch View/Edit */}
      <Dialog
        open={openBatchViewDialog}
        onClose={handleCloseBatchView}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEditingBatch ? 'تعديل الدفعة' : 'تفاصيل الدفعة'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {!isEditingBatch ? (
              // View Mode
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">المورد</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {selectedBatch?.supplier_name || 'بدون مورد'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">الكمية الأصلية</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {selectedBatch?.quantity_original || 0}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">الكمية المتبقية</Typography>
                  <Chip
                    label={selectedBatch?.quantity_remaining || 0}
                    color={getStockColor(selectedBatch?.quantity_remaining || 0)}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">السعر لكل كيلو</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {selectedBatch?.price_per_kg
                      ? `${fmt(selectedBatch.price_per_kg)} ${baseCurrencyInfo.symbol}`
                      : '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">التكلفة الإجمالية</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {selectedBatch?.total_cost
                      ? `${fmt(selectedBatch.total_cost)} ${baseCurrencyInfo.symbol}`
                      : '—'}
                  </Typography>
                </Grid>

                {selectedSheet?.weight_per_sheet_kg && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">الوزن الإجمالي</Typography>
                    <Typography variant="body1" fontWeight={600} fontSize="1rem">
                      {fmt(selectedBatch?.quantity_original * selectedSheet.weight_per_sheet_kg)} كغ
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">تاريخ الاستلام</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {selectedBatch?.received_date || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">موقع التخزين</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {selectedBatch?.storage_location || '—'}
                  </Typography>
                </Grid>

                {selectedBatch?.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">ملاحظات</Typography>
                    <Typography variant="body1" fontSize="1rem">
                      {selectedBatch.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              // Edit Mode
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ fontSize: '0.9375rem' }}>
                    تحديث الكمية الأصلية لن يؤثر على الكمية المتبقية. الكمية المتبقية تتغير فقط من خلال المبيعات.
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="الكمية الأصلية *"
                    value={editBatchForm.quantity_original}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, quantity_original: e.target.value })}
                    inputProps={{ min: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="السعر لكل كيلو"
                    value={editBatchForm.price_per_kg}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, price_per_kg: e.target.value })}
                    inputProps={{ step: 0.01, min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="تاريخ الاستلام"
                    value={editBatchForm.received_date}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, received_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="موقع التخزين"
                    value={editBatchForm.storage_location}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, storage_location: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="ملاحظات"
                    value={editBatchForm.notes}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {!isEditingBatch ? (
            <>
              <Button onClick={handleCloseBatchView} size="large">إغلاق</Button>
              <Button
                onClick={handleEditBatch}
                variant="contained"
                size="large"
                startIcon={<EditIcon />}
              >
                تعديل
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancelEditBatch} size="large" startIcon={<CloseIcon />}>
                إلغاء
              </Button>
              <Button
                onClick={handleSaveEditBatch}
                variant="contained"
                size="large"
              >
                حفظ
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
