// src/components/tabs/RemnantsTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Alert, Chip, Paper, InputAdornment, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Collapse, Autocomplete,
  FormControlLabel, Switch, RadioGroup, Radio, FormLabel, MenuItem
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CategoryIcon from '@mui/icons-material/Category';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

// Import unified components
import ResponsiveTable from '../common/ResponsiveTable';
import WeightPriceEntry from '../common/WeightPriceEntry';
import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedConfirmDialog from '../common/dialogs/UnifiedConfirmDialog';
import { confirmationMessages } from '../../theme/designSystem';

import {
  getAllSheets,
  addSheetWithBatch,
  getBatchesBySheetId,
  getSuppliers,
  getBaseCurrencyInfo,
  addBatchToSheet,
  pruneEmptyBatches,
  getMetalTypes,
  getGrades,
  getFinishes,
  generateSheetCode
} from '../../utils/database';
import { safeText, safeNotes } from '../../utils/displayHelpers';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function RemnantsTab() {
  // Data
  const [remnants, setRemnants] = useState([]);
  const [parentSheets, setParentSheets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [grades, setGrades] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetalType, setFilterMetalType] = useState('');
  const [filterThkMin, setFilterThkMin] = useState('');
  const [filterThkMax, setFilterThkMax] = useState('');
  const [filterQtyMin, setFilterQtyMin] = useState('');
  const [filterQtyMax, setFilterQtyMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dialogs
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openBatchesDialog, setOpenBatchesDialog] = useState(false);

  // Selected
  const [selectedRemnant, setSelectedRemnant] = useState(null);
  const [batches, setBatches] = useState([]);

  // Auto-code generation
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  // Forms — Remnant sheet
  const [remnantForm, setRemnantForm] = useState({
    code: '',
    metal_type_id: '',
    grade_id: '',
    finish_id: '',
    length_mm: '',
    width_mm: '',
    thickness_mm: '',
    weight_per_sheet_kg: '',
    parent_sheet_id: null,
    piece_source: 'company_stock', // 'company_stock' or 'from_sheet_cutting'
  });

  // Forms — Initial batch for remnant
  const [batchForm, setBatchForm] = useState({
    supplier_id: '',
    quantity: '',
    pricing_mode: 'per_kg',
    price_per_kg: '',
    total_cost: '',
    batch_weight_kg: '',
    storage_location: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Forms — Add batch to existing remnant
  const [existingBatchForm, setExistingBatchForm] = useState({
    supplier_id: '',
    quantity: '',
    pricing_mode: 'per_kg',
    price_per_kg: '',
    total_cost: '',
    batch_weight_kg: '',
    storage_location: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [batchErrors, setBatchErrors] = useState({});
  const [existingBatchErrors, setExistingBatchErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = () => {
    try { pruneEmptyBatches(); } catch {}
    const all = getAllSheets();
    const remnantSheets = all.filter(s => s.is_remnant);
    const parents = all.filter(s => !s.is_remnant);
    setRemnants(remnantSheets);
    setParentSheets(parents);
    setSuppliers(getSuppliers());
    
    const types = getMetalTypes(false);
    setMetalTypes(types);
    
    const currInfo = getBaseCurrencyInfo();
    setBaseCurrencyInfo(currInfo);
  };

  // Load grades and finishes when metal type changes
  useEffect(() => {
    if (remnantForm.metal_type_id) {
      setGrades(getGrades(remnantForm.metal_type_id, true));
      setFinishes(getFinishes(remnantForm.metal_type_id, true));
    } else {
      setGrades([]);
      setFinishes([]);
    }
  }, [remnantForm.metal_type_id]);

  // Auto-generate code when dimensions/grade/finish change
  useEffect(() => {
    if (autoGenerateCode && remnantForm.metal_type_id && remnantForm.length_mm && remnantForm.width_mm && remnantForm.thickness_mm) {
      const generated = generateSheetCode(
        Number(remnantForm.metal_type_id),
        Number(remnantForm.length_mm),
        Number(remnantForm.width_mm),
        Number(remnantForm.thickness_mm),
        remnantForm.grade_id ? Number(remnantForm.grade_id) : null,
        remnantForm.finish_id ? Number(remnantForm.finish_id) : null,
        true // isRemnant = true
      );
      setRemnantForm(prev => ({ ...prev, code: generated }));
    }
  }, [autoGenerateCode, remnantForm.metal_type_id, remnantForm.length_mm, remnantForm.width_mm, remnantForm.thickness_mm, remnantForm.grade_id, remnantForm.finish_id]);

  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMetalType('');
    setFilterThkMin('');
    setFilterThkMax('');
    setFilterQtyMin('');
    setFilterQtyMax('');
  };

  const filteredRemnants = useMemo(() => {
    let rows = remnants;
    const term = searchTerm.trim().toLowerCase();
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
  }, [remnants, searchTerm, filterMetalType, filterThkMin, filterThkMax, filterQtyMin, filterQtyMax]);

  // ──────────────────────────────────────────────────────────────
  // Pricing helpers
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
  // Add new remnant
  const handleOpenAddDialog = () => {
    const defaultMetalType = metalTypes.find(m => m.is_active)?.id || '';

    setRemnantForm({
      code: '',
      metal_type_id: defaultMetalType,
      grade_id: '',
      finish_id: '',
      length_mm: '',
      width_mm: '',
      thickness_mm: '',
      weight_per_sheet_kg: '',
      parent_sheet_id: null,
      piece_source: 'company_stock',
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
      notes: ''
    });
    setAutoGenerateCode(true);
    setError('');
    setErrors({});
    setBatchErrors({});
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setError('');
    setErrors({});
    setBatchErrors({});
  };

  const validateRemnantForm = () => {
    const newErrors = {};
    const newBatchErrors = {};

    if (!remnantForm.code.trim()) {
      newErrors.code = 'الكود مطلوب';
    }

    if (!remnantForm.metal_type_id) {
      newErrors.metal_type_id = 'نوع المعدن مطلوب';
    }

    if (!remnantForm.length_mm || Number(remnantForm.length_mm) <= 0) {
      newErrors.length_mm = 'الطول يجب أن يكون أكبر من صفر';
    }

    if (!remnantForm.width_mm || Number(remnantForm.width_mm) <= 0) {
      newErrors.width_mm = 'العرض يجب أن يكون أكبر من صفر';
    }

    if (!remnantForm.thickness_mm || Number(remnantForm.thickness_mm) <= 0) {
      newErrors.thickness_mm = 'السماكة يجب أن تكون أكبر من صفر';
    }

    if (remnantForm.piece_source === 'from_sheet_cutting' && !remnantForm.parent_sheet_id) {
      newErrors.parent_sheet_id = 'يجب اختيار الصفيحة الأم عند اختيار "من قص صفيحة"';
    }

    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) {
      newBatchErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
    }

    setErrors(newErrors);
    setBatchErrors(newBatchErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newBatchErrors).length === 0;
  };

  const handleActualSaveRemnant = async () => {
    if (!validateRemnantForm()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const preview = computeTotalsPreview(
        batchForm.pricing_mode,
        batchForm.price_per_kg,
        batchForm.total_cost,
        batchForm.quantity,
        remnantForm.weight_per_sheet_kg,
        batchForm.batch_weight_kg
      );

      const sheetData = {
        code: remnantForm.code.trim(),
        metal_type_id: Number(remnantForm.metal_type_id),
        grade_id: remnantForm.grade_id ? Number(remnantForm.grade_id) : null,
        finish_id: remnantForm.finish_id ? Number(remnantForm.finish_id) : null,
        length_mm: Number(remnantForm.length_mm),
        width_mm: Number(remnantForm.width_mm),
        thickness_mm: Number(remnantForm.thickness_mm),
        weight_per_sheet_kg: remnantForm.weight_per_sheet_kg ? Number(remnantForm.weight_per_sheet_kg) : null,
        is_remnant: true,
        parent_sheet_id: remnantForm.parent_sheet_id || null
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
        setSuccess(`✓ تم إضافة ${result.linked ? 'الدفعة للبقية الموجودة' : 'البقية والدفعة'} بنجاح`);
        setTimeout(() => setSuccess(''), 3000);
        handleCloseAddDialog();
        refreshAll();
      } else {
        setError('فشل الحفظ: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewRemnant = () => {
    openConfirm('save', remnantForm, handleActualSaveRemnant);
  };

  // ──────────────────────────────────────────────────────────────
  // Show batches & add batch to existing remnant
  const handleShowBatches = (remnant) => {
    setSelectedRemnant(remnant);
    setExistingBatchForm({
      supplier_id: '',
      quantity: '',
      pricing_mode: 'per_kg',
      price_per_kg: '',
      total_cost: '',
      batch_weight_kg: '',
      storage_location: '',
      received_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setError('');
    setExistingBatchErrors({});
    const list = getBatchesBySheetId(remnant.id);
    setBatches(list);
    setOpenBatchesDialog(true);
  };

  const validateExistingBatch = () => {
    const newErrors = {};

    if (!existingBatchForm.quantity || Number(existingBatchForm.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
    }

    setExistingBatchErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualAddBatch = async () => {
    if (!selectedRemnant || !validateExistingBatch()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const preview = computeTotalsPreview(
        existingBatchForm.pricing_mode,
        existingBatchForm.price_per_kg,
        existingBatchForm.total_cost,
        existingBatchForm.quantity,
        selectedRemnant.weight_per_sheet_kg,
        existingBatchForm.batch_weight_kg
      );

      const payload = {
        sheet_id: selectedRemnant.id,
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
        setSuccess('✓ تمت إضافة الدفعة بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        const list = getBatchesBySheetId(selectedRemnant.id);
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
          notes: ''
        }));
        setExistingBatchErrors({});
      } else {
        setError('فشل إضافة الدفعة: ' + (res?.error || ''));
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatchToExisting = () => {
    openConfirm('save', existingBatchForm, handleActualAddBatch);
  };

  const getStockColor = (quantity) => {
    if (quantity === 0) return 'error';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  const getParentName = (parentId) => {
    if (!parentId) return null;
    const parent = parentSheets.find(p => p.id === parentId);
    return parent ? parent.code : null;
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة البقايا
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إدارة البقايا المعدنية والدفعات (يمكن ربطها بصفيحة أم)
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}

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
                إضافة بقية جديدة
              </Button>
            </Grid>
          </Grid>

          <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
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
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      <ResponsiveTable
        columns={[
          {
            field: 'code',
            label: 'الكود',
            priority: 'primary',
            bold: true,
            mobileWidth: 6
          },
          {
            field: 'metal_name',
            label: 'النوع',
            priority: 'primary',
            mobileWidth: 6
          },
          {
            field: 'dimensions',
            label: 'الأبعاد (مم)',
            priority: 'secondary',
            type: 'custom',
            render: (value, row) => `${row.length_mm} × ${row.width_mm}`,
            mobileWidth: 6
          },
          {
            field: 'thickness_mm',
            label: 'السماكة',
            priority: 'secondary',
            type: 'custom',
            render: (value) => `${value} مم`,
            mobileWidth: 6
          },
          {
            field: 'weight_per_sheet_kg',
            label: 'الوزن/قطعة',
            priority: 'secondary',
            type: 'custom',
            render: (value) => value ? `${fmt(value)} كغ` : '---'
          },
          {
            field: 'parent_sheet_id',
            label: 'الصفيحة الأم',
            priority: 'secondary',
            type: 'custom',
            render: (value) => value ? (
              <Chip
                label={getParentName(value) || `#${value}`}
                size="small"
                color="info"
                icon={<CategoryIcon fontSize="small" />}
              />
            ) : '---'
          },
          {
            field: 'total_quantity',
            label: 'الكمية',
            align: 'center',
            priority: 'primary',
            type: 'custom',
            render: (value) => (
              <Chip
                label={value}
                color={getStockColor(value)}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            ),
            mobileWidth: 6
          },
          {
            field: 'price_range',
            label: 'السعر/كغ',
            align: 'center',
            priority: 'primary',
            type: 'custom',
            render: (value, row) => {
              if (!row.min_price) return '---';
              if (row.min_price === row.max_price) {
                return `${fmt(row.min_price)} ${baseCurrencyInfo.symbol}`;
              }
              return `${fmt(row.min_price)} - ${fmt(row.max_price)} ${baseCurrencyInfo.symbol}`;
            },
            mobileWidth: 6
          }
        ]}
        data={filteredRemnants}
        actions={(row) => (
          <Tooltip title="عرض الدفعات / إضافة دفعة">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleShowBatches(row)}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        )}
        keyField="id"
        emptyMessage="لا توجد بقايا"
        mobileBreakpoint="md"
      />

      {/* Dialog: Add Remnant + Initial Batch */}
      <UnifiedFormDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onSubmit={handleSaveNewRemnant}
        title="إضافة بقية جديدة"
        subtitle="أدخل البيانات المطلوبة أدناه"
        submitText="حفظ"
        loading={loading}
        maxWidth="md"
      >
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Box>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={700}>
                  <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  معلومات البقية
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2.5}>
                  {/* NEW: Piece Source Selection */}
                  <Grid item xs={12}>
                    <FormLabel component="legend">
                      <Typography fontWeight={600} fontSize="1rem">مصدر القطعة *</Typography>
                    </FormLabel>
                    <RadioGroup
                      row
                      value={remnantForm.piece_source}
                      onChange={(e) => {
                        const newSource = e.target.value;
                        setRemnantForm(prev => ({ ...prev, piece_source: newSource }));

                        // If switching to company_stock, set supplier to "الشركة"
                        if (newSource === 'company_stock') {
                          const companySupplier = suppliers.find(s => s.name === 'الشركة' || s.name.includes('الشركة'));
                          if (companySupplier) {
                            setBatchForm(prev => ({ ...prev, supplier_id: companySupplier.id }));
                          }
                        } else {
                          setBatchForm(prev => ({ ...prev, supplier_id: '' }));
                        }
                      }}
                    >
                      <FormControlLabel
                        value="company_stock"
                        control={<Radio />}
                        label={
                          <Typography fontSize="1rem">مخزون الشركة (سعر مرجعي فقط)</Typography>
                        }
                      />
                      <FormControlLabel
                        value="from_sheet_cutting"
                        control={<Radio />}
                        label={
                          <Typography fontSize="1rem">من قص صفيحة (وراثة السعر)</Typography>
                        }
                      />
                    </RadioGroup>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoGenerateCode}
                          onChange={(e) => {
                            setAutoGenerateCode(e.target.checked);
                            if (!e.target.checked) {
                              setRemnantForm(prev => ({ ...prev, code: '' }));
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
                    <UnifiedFormField
                      label="الكود"
                      value={remnantForm.code}
                      onChange={(e) => {
                        setRemnantForm({ ...remnantForm, code: e.target.value });
                        if (errors.code) {
                          setErrors({ ...errors, code: null });
                        }
                      }}
                      name="code"
                      required
                      error={errors.code}
                      disabled={autoGenerateCode}
                      helperText={autoGenerateCode ? "سيتم توليد الكود تلقائياً بناءً على المواصفات (R...)" : ""}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="نوع المعدن"
                      value={remnantForm.metal_type_id}
                      onChange={(e) => {
                        const newMetalId = e.target.value;
                        setRemnantForm({
                          ...remnantForm,
                          metal_type_id: newMetalId,
                          grade_id: '',
                          finish_id: ''
                        });
                        if (errors.metal_type_id) {
                          setErrors({ ...errors, metal_type_id: null });
                        }
                      }}
                      name="metal_type_id"
                      select
                      required
                      error={errors.metal_type_id}
                    >
                      <MenuItem value="">-- اختر النوع --</MenuItem>
                      {metalTypes.filter(m => m.is_active).map(metal => (
                        <MenuItem key={metal.id} value={metal.id}>{metal.name_ar}</MenuItem>
                      ))}
                    </UnifiedFormField>
                  </Grid>

                  {/* NEW: Grade Selection */}
                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="الدرجة"
                      value={remnantForm.grade_id}
                      onChange={(e) => setRemnantForm({ ...remnantForm, grade_id: e.target.value })}
                      name="grade_id"
                      select
                      disabled={!remnantForm.metal_type_id || grades.length === 0}
                      helperText={!remnantForm.metal_type_id ? "اختر نوع المعدن أولاً" : (grades.length === 0 ? "لا توجد درجات متاحة" : "")}
                    >
                      <MenuItem value="">-- بدون درجة (xx) --</MenuItem>
                      {grades.map(grade => (
                        <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>
                      ))}
                    </UnifiedFormField>
                  </Grid>

                  {/* NEW: Finish Selection */}
                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="التشطيب"
                      value={remnantForm.finish_id}
                      onChange={(e) => setRemnantForm({ ...remnantForm, finish_id: e.target.value })}
                      name="finish_id"
                      select
                      disabled={!remnantForm.metal_type_id || finishes.length === 0}
                      helperText={!remnantForm.metal_type_id ? "اختر نوع المعدن أولاً" : (finishes.length === 0 ? "لا توجد تشطيبات متاحة" : "")}
                    >
                      <MenuItem value="">-- بدون تشطيب (xx) --</MenuItem>
                      {finishes.map(finish => (
                        <MenuItem key={finish.id} value={finish.id}>
                          {finish.name_ar} ({finish.name_en})
                        </MenuItem>
                      ))}
                    </UnifiedFormField>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <UnifiedFormField
                      label="الطول (مم)"
                      value={remnantForm.length_mm}
                      onChange={(e) => {
                        setRemnantForm({ ...remnantForm, length_mm: e.target.value });
                        if (errors.length_mm) {
                          setErrors({ ...errors, length_mm: null });
                        }
                      }}
                      name="length_mm"
                      type="number"
                      required
                      error={errors.length_mm}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <UnifiedFormField
                      label="العرض (مم)"
                      value={remnantForm.width_mm}
                      onChange={(e) => {
                        setRemnantForm({ ...remnantForm, width_mm: e.target.value });
                        if (errors.width_mm) {
                          setErrors({ ...errors, width_mm: null });
                        }
                      }}
                      name="width_mm"
                      type="number"
                      required
                      error={errors.width_mm}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <UnifiedFormField
                      label="السماكة (مم)"
                      value={remnantForm.thickness_mm}
                      onChange={(e) => {
                        setRemnantForm({ ...remnantForm, thickness_mm: e.target.value });
                        if (errors.thickness_mm) {
                          setErrors({ ...errors, thickness_mm: null });
                        }
                      }}
                      name="thickness_mm"
                      type="number"
                      required
                      error={errors.thickness_mm}
                      inputProps={{ step: 0.1, min: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <WeightPriceEntry
                      mode="weight"
                      weightMode="per_sheet"
                      label="الوزن"
                      value={remnantForm.weight_per_sheet_kg || ''}
                      totalWeight=""
                      quantity=""
                      onChange={(field, value) => {
                        if (field === 'weight_per_sheet') {
                          setRemnantForm({ ...remnantForm, weight_per_sheet_kg: value });
                        }
                      }}
                      currencySymbol={baseCurrencyInfo.symbol}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={parentSheets}
                      getOptionLabel={(option) => `${option.code} - ${option.metal_name}`}
                      value={parentSheets.find(p => p.id === remnantForm.parent_sheet_id) || null}
                      onChange={(e, newValue) => {
                        setRemnantForm(prev => ({ ...prev, parent_sheet_id: newValue?.id || null }));

                        // Auto-populate weight and dimensions from parent sheet for cutting option
                        if (remnantForm.piece_source === 'from_sheet_cutting' && newValue) {
                          if (!remnantForm.thickness_mm) {
                            setRemnantForm(prev => ({ ...prev, thickness_mm: newValue.thickness_mm }));
                          }
                        }
                      }}
                      disabled={remnantForm.piece_source === 'company_stock'}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={remnantForm.piece_source === 'from_sheet_cutting' ? 'الصفيحة الأم *' : 'الصفيحة الأم (اختياري)'}
                          helperText={
                            remnantForm.piece_source === 'from_sheet_cutting'
                              ? 'اختر الصفيحة التي تم قصها'
                              : 'يمكن ربط البقية بصفيحة أساسية'
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

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
                    <UnifiedFormField
                      label="المورد"
                      value={batchForm.supplier_id}
                      onChange={(e) => setBatchForm({ ...batchForm, supplier_id: e.target.value })}
                      name="supplier_id"
                      select
                      disabled={remnantForm.piece_source === 'company_stock'}
                      helperText={
                        remnantForm.piece_source === 'company_stock'
                          ? 'المورد: الشركة (سعر مرجعي فقط - لا يؤثر على المحاسبة)'
                          : ''
                      }
                    >
                      <MenuItem value="">بدون مورد</MenuItem>
                      {suppliers.map(supplier => (
                        <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                      ))}
                    </UnifiedFormField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="الكمية"
                      value={batchForm.quantity}
                      onChange={(e) => {
                        setBatchForm({ ...batchForm, quantity: e.target.value });
                        if (batchErrors.quantity) {
                          setBatchErrors({ ...batchErrors, quantity: null });
                        }
                      }}
                      name="quantity"
                      type="number"
                      required
                      error={batchErrors.quantity}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <WeightPriceEntry
                      mode="price"
                      pricingMode={batchForm.pricing_mode}
                      label="التسعير"
                      pricePerKg={batchForm.price_per_kg || ''}
                      pricePerPiece=""
                      totalCost={batchForm.total_cost || ''}
                      quantity={batchForm.quantity || ''}
                      weight={effBatchWeight(
                        batchForm.quantity,
                        remnantForm.weight_per_sheet_kg,
                        batchForm.batch_weight_kg
                      )}
                      onChange={(field, value) => {
                        if (field === 'pricing_mode') {
                          setBatchForm({ ...batchForm, pricing_mode: value });
                        } else if (field === 'price_per_kg') {
                          setBatchForm({ ...batchForm, price_per_kg: value });
                        } else if (field === 'total_cost') {
                          setBatchForm({ ...batchForm, total_cost: value });
                        }
                      }}
                      currencySymbol={baseCurrencyInfo.symbol}
                      showBatchPrice={true}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="الوزن الإجمالي للدفعة (كغ)"
                      value={batchForm.batch_weight_kg}
                      onChange={(e) => setBatchForm({ ...batchForm, batch_weight_kg: e.target.value })}
                      name="batch_weight_kg"
                      type="number"
                      inputProps={{ step: 0.001, min: 0 }}
                      helperText="اختياري - اتركه فارغاً لحساب الوزن تلقائياً من الكمية"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="تاريخ الاستلام"
                      value={batchForm.received_date}
                      onChange={(e) => setBatchForm({ ...batchForm, received_date: e.target.value })}
                      name="received_date"
                      type="date"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="موقع التخزين"
                      value={batchForm.storage_location}
                      onChange={(e) => setBatchForm({ ...batchForm, storage_location: e.target.value })}
                      name="storage_location"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <UnifiedFormField
                      label="ملاحظات"
                      value={batchForm.notes}
                      onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                      name="notes"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    {(() => {
                      const p = computeTotalsPreview(
                        batchForm.pricing_mode,
                        batchForm.price_per_kg,
                        batchForm.total_cost,
                        batchForm.quantity,
                        remnantForm.weight_per_sheet_kg,
                        batchForm.batch_weight_kg
                      );
                      return (
                        <Typography variant="caption" color="text.secondary" fontSize="0.9375rem">
                          الوزن المُستخدم: <b>{p.weight_used ? fmt(p.weight_used) : 'غير مُحدد'} كغ</b> —{' '}
                          {batchForm.pricing_mode === 'per_kg' ? (
                            <>التكلفة المتوقعة: <b>{p.total_cost != null ? fmt(p.total_cost) : '—'} {baseCurrencyInfo.symbol}</b></>
                          ) : (
                            <>السعر/كغ المتوقع: <b>{p.price_per_kg != null ? fmt(p.price_per_kg) : '—'} {baseCurrencyInfo.symbol}</b></>
                          )}
                        </Typography>
                      );
                    })()}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
      </UnifiedFormDialog>

      {/* Dialog: Batches */}
      <UnifiedFormDialog
        open={openBatchesDialog}
        onClose={() => setOpenBatchesDialog(false)}
        onSubmit={() => setOpenBatchesDialog(false)}
        title={`الدفعات - ${selectedRemnant?.code || ''}`}
        subtitle={selectedRemnant ? `${selectedRemnant.metal_name} | ${selectedRemnant.length_mm}×${selectedRemnant.width_mm} | ${selectedRemnant.thickness_mm} مم${selectedRemnant.parent_sheet_id ? ` | الأم: ${getParentName(selectedRemnant.parent_sheet_id)}` : ''}` : ''}
        submitText="إغلاق"
        cancelText=""
        maxWidth="md"
      >
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddBoxIcon fontSize="small" /> إضافة دفعة للبقية
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="المورد"
                  value={existingBatchForm.supplier_id}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, supplier_id: e.target.value })}
                  name="supplier_id"
                  select
                >
                  <MenuItem value="">بدون مورد</MenuItem>
                  {suppliers.map(supplier => (
                    <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                  ))}
                </UnifiedFormField>
              </Grid>
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="الكمية"
                  value={existingBatchForm.quantity}
                  onChange={(e) => {
                    setExistingBatchForm({ ...existingBatchForm, quantity: e.target.value });
                    if (existingBatchErrors.quantity) {
                      setExistingBatchErrors({ ...existingBatchErrors, quantity: null });
                    }
                  }}
                  name="quantity"
                  type="number"
                  required
                  error={existingBatchErrors.quantity}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <WeightPriceEntry
                  mode="price"
                  pricingMode={existingBatchForm.pricing_mode}
                  label="التسعير"
                  pricePerKg={existingBatchForm.price_per_kg || ''}
                  pricePerPiece=""
                  totalCost={existingBatchForm.total_cost || ''}
                  quantity={existingBatchForm.quantity || ''}
                  weight={selectedRemnant ? effBatchWeight(
                    existingBatchForm.quantity,
                    selectedRemnant.weight_per_sheet_kg,
                    existingBatchForm.batch_weight_kg
                  ) : 0}
                  onChange={(field, value) => {
                    if (field === 'pricing_mode') {
                      setExistingBatchForm({ ...existingBatchForm, pricing_mode: value });
                    } else if (field === 'price_per_kg') {
                      setExistingBatchForm({ ...existingBatchForm, price_per_kg: value });
                    } else if (field === 'total_cost') {
                      setExistingBatchForm({ ...existingBatchForm, total_cost: value });
                    }
                  }}
                  currencySymbol={baseCurrencyInfo.symbol}
                  showBatchPrice={true}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="الوزن الإجمالي للدفعة (كغ)"
                  value={existingBatchForm.batch_weight_kg}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, batch_weight_kg: e.target.value })}
                  name="batch_weight_kg"
                  type="number"
                  inputProps={{ step: 0.001, min: 0 }}
                  helperText="اختياري - اتركه فارغاً لحساب الوزن تلقائياً من الكمية"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="تاريخ الاستلام"
                  value={existingBatchForm.received_date}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, received_date: e.target.value })}
                  name="received_date"
                  type="date"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="موقع التخزين"
                  value={existingBatchForm.storage_location}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, storage_location: e.target.value })}
                  name="storage_location"
                />
              </Grid>
              <Grid item xs={12}>
                <UnifiedFormField
                  label="ملاحظات"
                  value={existingBatchForm.notes}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, notes: e.target.value })}
                  name="notes"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                {selectedRemnant && (() => {
                  const p = computeTotalsPreview(
                    existingBatchForm.pricing_mode,
                    existingBatchForm.price_per_kg,
                    existingBatchForm.total_cost,
                    existingBatchForm.quantity,
                    selectedRemnant.weight_per_sheet_kg,
                    existingBatchForm.batch_weight_kg
                  );
                  return (
                    <Typography variant="caption" color="text.secondary" fontSize="0.9375rem">
                      الوزن المُستخدم: <b>{p.weight_used ? fmt(p.weight_used) : 'غير مُحدد'} كغ</b> —{' '}
                      {existingBatchForm.pricing_mode === 'per_kg' ? (
                        <>التكلفة المتوقعة: <b>{p.total_cost != null ? fmt(p.total_cost) : '—'} {baseCurrencyInfo.symbol}</b></>
                      ) : (
                        <>السعر/كغ المتوقع: <b>{p.price_per_kg != null ? fmt(p.price_per_kg) : '—'} {baseCurrencyInfo.symbol}</b></>
                      )}
                    </Typography>
                  );
                })()}
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="large" onClick={handleAddBatchToExisting}>
                  إضافة الدفعة
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
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
                      <TableCell><Typography fontWeight={700} fontSize="1rem">الأصلية</Typography></TableCell>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">المتبقي</Typography></TableCell>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">السعر/كغ</Typography></TableCell>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell><Typography fontSize="0.9375rem">{safeText(batch.supplier_name) || 'بدون مورد'}</Typography></TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{batch.quantity_original}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={batch.quantity_remaining}
                            color={getStockColor(batch.quantity_remaining)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontSize="0.9375rem">
                            {batch.price_per_kg ? `${fmt(batch.price_per_kg)} ${baseCurrencyInfo.symbol}` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{batch.received_date}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
      </UnifiedFormDialog>

      {/* Confirmation Dialog */}
      <UnifiedConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirm}
        onConfirm={async () => {
          await confirmDialog.action();
          closeConfirm();
        }}
        {...confirmationMessages[confirmDialog.type]}
        loading={loading}
      />
    </Box>
  );
}