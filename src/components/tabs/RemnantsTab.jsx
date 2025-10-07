// src/components/tabs/RemnantsTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Alert, Chip, Paper, InputAdornment, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Collapse, Autocomplete,
  FormControlLabel, Switch
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
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setError('');
  };

  const handleSaveNewRemnant = () => {
    if (!remnantForm.code.trim()) return setError('الكود مطلوب');
    if (!remnantForm.length_mm || !remnantForm.width_mm || !remnantForm.thickness_mm)
      return setError('الأبعاد مطلوبة');
    if (!batchForm.quantity || Number(batchForm.quantity) <= 0)
      return setError('الكمية يجب أن تكون أكبر من صفر');

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
    const list = getBatchesBySheetId(remnant.id);
    setBatches(list);
    setOpenBatchesDialog(true);
  };

  const handleAddBatchToExisting = () => {
    if (!selectedRemnant) return;
    if (!existingBatchForm.quantity || Number(existingBatchForm.quantity) <= 0)
      return setError('الكمية يجب أن تكون أكبر من صفر');

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
    } else {
      setError('فشل إضافة الدفعة: ' + (res?.error || ''));
    }
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
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

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
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="أقصى سماكة (مم)"
                    value={filterThkMax}
                    onChange={(e) => setFilterThkMax(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="أدنى كمية"
                    value={filterQtyMin}
                    onChange={(e) => setFilterQtyMin(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="أقصى كمية"
                    value={filterQtyMax}
                    onChange={(e) => setFilterQtyMax(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
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
              <TableCell><Typography fontWeight={700} fontSize="1rem">الوزن/قطعة</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">الصفيحة الأم</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">السعر/كغ</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRemnants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد بقايا</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRemnants.map((remnant) => (
                <TableRow key={remnant.id} hover>
                  <TableCell>
                    <Typography fontWeight={600} fontSize="0.9375rem">{remnant.code}</Typography>
                  </TableCell>
                  <TableCell><Typography fontSize="0.9375rem">{remnant.metal_name}</Typography></TableCell>
                  <TableCell><Typography fontSize="0.9375rem">{remnant.length_mm} × {remnant.width_mm}</Typography></TableCell>
                  <TableCell><Typography fontSize="0.9375rem">{remnant.thickness_mm} مم</Typography></TableCell>
                  <TableCell>
                    <Typography fontSize="0.9375rem">
                      {remnant.weight_per_sheet_kg ? `${fmt(remnant.weight_per_sheet_kg)} كغ` : '---'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {remnant.parent_sheet_id ? (
                      <Chip
                        label={getParentName(remnant.parent_sheet_id) || `#${remnant.parent_sheet_id}`}
                        size="small"
                        color="info"
                        icon={<CategoryIcon fontSize="small" />}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary" fontSize="0.875rem">---</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={remnant.total_quantity}
                      color={getStockColor(remnant.total_quantity)}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {remnant.min_price ? (
                      remnant.min_price === remnant.max_price ? (
                        <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                          {fmt(remnant.min_price)} {baseCurrencyInfo.symbol}
                        </Typography>
                      ) : (
                        <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                          {fmt(remnant.min_price)} - {fmt(remnant.max_price)} {baseCurrencyInfo.symbol}
                        </Typography>
                      )
                    ) : <Typography fontSize="0.9375rem">---</Typography>}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="عرض الدفعات / إضافة دفعة">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleShowBatches(remnant)}
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

      {/* Dialog: Add Remnant + Initial Batch */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>إضافة بقية جديدة</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={700}>
                  <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  معلومات البقية
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
                    <TextField
                      fullWidth
                      label="الكود *"
                      value={remnantForm.code}
                      onChange={(e) => setRemnantForm({ ...remnantForm, code: e.target.value })}
                      disabled={autoGenerateCode}
                      helperText={autoGenerateCode ? "سيتم توليد الكود تلقائياً بناءً على المواصفات (R...)" : ""}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="نوع المعدن *"
                      value={remnantForm.metal_type_id}
                      onChange={(e) => {
                        const newMetalId = e.target.value;
                        setRemnantForm({ 
                          ...remnantForm, 
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

                  {/* NEW: Grade Selection */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="الدرجة"
                      value={remnantForm.grade_id}
                      onChange={(e) => setRemnantForm({ ...remnantForm, grade_id: e.target.value })}
                      SelectProps={{ native: true }}
                      disabled={!remnantForm.metal_type_id || grades.length === 0}
                      helperText={!remnantForm.metal_type_id ? "اختر نوع المعدن أولاً" : (grades.length === 0 ? "لا توجد درجات متاحة" : "")}
                    >
                      <option value="">-- بدون درجة (xx) --</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </TextField>
                  </Grid>

                  {/* NEW: Finish Selection */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="التشطيب"
                      value={remnantForm.finish_id}
                      onChange={(e) => setRemnantForm({ ...remnantForm, finish_id: e.target.value })}
                      SelectProps={{ native: true }}
                      disabled={!remnantForm.metal_type_id || finishes.length === 0}
                      helperText={!remnantForm.metal_type_id ? "اختر نوع المعدن أولاً" : (finishes.length === 0 ? "لا توجد تشطيبات متاحة" : "")}
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
                      value={remnantForm.length_mm}
                      onChange={(e) => setRemnantForm({ ...remnantForm, length_mm: e.target.value })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="العرض (مم) *"
                      value={remnantForm.width_mm}
                      onChange={(e) => setRemnantForm({ ...remnantForm, width_mm: e.target.value })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="السماكة (مم) *"
                      value={remnantForm.thickness_mm}
                      onChange={(e) => setRemnantForm({ ...remnantForm, thickness_mm: e.target.value })}
                      inputProps={{ step: 0.1, min: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الوزن لكل قطعة (كغ) — إدخال يدوي"
                      value={remnantForm.weight_per_sheet_kg}
                      onChange={(e) => setRemnantForm({ ...remnantForm, weight_per_sheet_kg: e.target.value })}
                      inputProps={{ step: 0.001, min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={parentSheets}
                      getOptionLabel={(option) => `${option.code} - ${option.metal_name}`}
                      value={parentSheets.find(p => p.id === remnantForm.parent_sheet_id) || null}
                      onChange={(e, newValue) => {
                        setRemnantForm({ ...remnantForm, parent_sheet_id: newValue?.id || null });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="الصفيحة الأم (اختياري)"
                          helperText="يمكن ربط البقية بصفيحة أساسية"
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
                      <option value="per_kg">بالكيلو</option>
                      <option value="per_batch">بالدفعة</option>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الوزن الإجمالي للدفعة (كغ) — اختياري"
                      value={batchForm.batch_weight_kg}
                      onChange={(e) => setBatchForm({ ...batchForm, batch_weight_kg: e.target.value })}
                      inputProps={{ step: 0.001, min: 0 }}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseAddDialog} size="large">إلغاء</Button>
          <Button onClick={handleSaveNewRemnant} variant="contained" size="large">حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Batches */}
      <Dialog open={openBatchesDialog} onClose={() => setOpenBatchesDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            الدفعات - {selectedRemnant?.code}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
            {selectedRemnant?.metal_name} | {selectedRemnant?.length_mm}×{selectedRemnant?.width_mm} | {selectedRemnant?.thickness_mm} مم
            {selectedRemnant?.parent_sheet_id && ` | الأم: ${getParentName(selectedRemnant.parent_sheet_id)}`}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddBoxIcon fontSize="small" /> إضافة دفعة للبقية
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="الكمية *"
                  value={existingBatchForm.quantity}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, quantity: e.target.value })}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="طريقة التسعير"
                  value={existingBatchForm.pricing_mode}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, pricing_mode: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="per_kg">بالكيلو</option>
                  <option value="per_batch">بالدفعة</option>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="الوزن الإجمالي للدفعة (كغ) — اختياري"
                  value={existingBatchForm.batch_weight_kg}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, batch_weight_kg: e.target.value })}
                  inputProps={{ step: 0.001, min: 0 }}
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="موقع التخزين"
                  value={existingBatchForm.storage_location}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, storage_location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="ملاحظات"
                  value={existingBatchForm.notes}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, notes: e.target.value })}
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
                        <TableCell><Typography fontSize="0.9375rem">{batch.supplier_name || 'بدون مورد'}</Typography></TableCell>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenBatchesDialog(false)} size="large">إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}