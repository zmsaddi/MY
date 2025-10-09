// src/components/tabs/InventoryTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Alert, Chip, Paper, InputAdornment, Divider, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Collapse, FormControlLabel, Switch,
  Radio, RadioGroup, FormLabel, Tabs, Tab, MenuItem
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
import DeleteIcon from '@mui/icons-material/Delete';

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
  updateBatch,
  pruneEmptyBatches,
  generateSheetCode,
  getMetalTypes,
  getGrades,
  getFinishes,
  getPaymentMethodsForUI,
  addSupplierPayment
} from '../../utils/database';

import { safeText, safeNotes } from '../../utils/displayHelpers';

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
    weight_input_mode: 'per_sheet',
    weight_per_sheet: '',
    total_weight: '',
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

  // Alerts and State
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [sheetErrors, setSheetErrors] = useState({});
  const [batchErrors, setBatchErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  // ──────────────────────────────────────────────────────────────
  // Helper Functions
  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

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
  }, [sheets, searchTerm, filterMetalType, filterThkMin, filterThkMax, filterQtyMin, filterQtyMax]);

  const filteredRemnants = useMemo(() => {
    let rows = remnants;
    const term = remnantSearchTerm.trim().toLowerCase();
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
  }, [remnants, sheets, remnantSearchTerm, remnantFilterMetalType, remnantFilterThkMin, remnantFilterThkMax, remnantFilterQtyMin, remnantFilterQtyMax, remnantFilterParentSheet]);

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
  // Validation Functions
  const validateSheetForm = () => {
    const newErrors = {};

    if (!sheetForm.code.trim()) {
      newErrors.code = 'الكود مطلوب';
    }

    if (!sheetForm.metal_type_id) {
      newErrors.metal_type_id = 'نوع المعدن مطلوب';
    }

    if (!sheetForm.length_mm || Number(sheetForm.length_mm) <= 0) {
      newErrors.length_mm = 'الطول مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!sheetForm.width_mm || Number(sheetForm.width_mm) <= 0) {
      newErrors.width_mm = 'العرض مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!sheetForm.thickness_mm || Number(sheetForm.thickness_mm) <= 0) {
      newErrors.thickness_mm = 'السماكة مطلوبة ويجب أن تكون أكبر من صفر';
    }

    setSheetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBatchForm = () => {
    const newErrors = {};

    if (!batchForm.supplier_id) {
      newErrors.supplier_id = 'المورد مطلوب';
    }

    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) {
      newErrors.quantity = 'الكمية مطلوبة ويجب أن تكون أكبر من صفر';
    }

    const weightPerSheet = Number(batchForm.weight_per_sheet) || 0;
    const totalWeight = Number(batchForm.total_weight) || 0;

    if (weightPerSheet <= 0 && totalWeight <= 0) {
      newErrors.weight = 'يجب إدخال الوزن (لكل قطعة أو الإجمالي)';
    }

    setBatchErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      weight_input_mode: 'per_sheet',
      weight_per_sheet: '',
      total_weight: '',
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
    setSheetErrors({});
    setBatchErrors({});
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setError('');
    setSheetErrors({});
    setBatchErrors({});
  };

  const handleActualSaveSheet = async () => {
    if (!validateSheetForm() || !validateBatchForm()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const qty = Number(batchForm.quantity);
      const weightPerSheet = Number(batchForm.weight_per_sheet) || 0;
      const totalWeight = Number(batchForm.total_weight) || 0;
      const finalWeightPerSheet = weightPerSheet || (totalWeight / qty);
      const finalTotalWeight = totalWeight || (weightPerSheet * qty);

      let finalPricePerKg = 0;
      let finalTotalCost = 0;

      if (batchForm.pricing_mode === 'per_kg') {
        finalPricePerKg = Number(batchForm.price_per_kg) || 0;
        finalTotalCost = finalTotalWeight * finalPricePerKg;
      } else {
        finalTotalCost = Number(batchForm.total_cost) || 0;
        finalPricePerKg = finalTotalWeight > 0 ? finalTotalCost / finalTotalWeight : 0;
      }

      const sheetData = {
        code: sheetForm.code.trim(),
        metal_type_id: Number(sheetForm.metal_type_id),
        grade_id: sheetForm.grade_id ? Number(sheetForm.grade_id) : null,
        finish_id: sheetForm.finish_id ? Number(sheetForm.finish_id) : null,
        length_mm: Number(sheetForm.length_mm),
        width_mm: Number(sheetForm.width_mm),
        thickness_mm: Number(sheetForm.thickness_mm),
        weight_per_sheet_kg: finalWeightPerSheet,
        is_remnant: false
      };

      const batchData = {
        supplier_id: batchForm.supplier_id || null,
        quantity: Number(batchForm.quantity),
        price_per_kg: finalPricePerKg,
        total_cost: finalTotalCost,
        storage_location: batchForm.storage_location || null,
        received_date: batchForm.received_date,
        notes: batchForm.notes || null
      };

      const result = addSheetWithBatch(sheetData, batchData);
      if (result.success) {
        if (batchForm.supplier_id && batchForm.payment_type !== 'later' && finalTotalCost) {
          const paymentAmount = batchForm.payment_type === 'full'
            ? finalTotalCost
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

        setSuccess(`تم ${result.linked ? 'إضافة الدفعة للصفيحة الموجودة' : 'إضافة الصفيحة والدفعة'} بنجاح`);
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

  const handleSheetFormSubmit = () => {
    openConfirm('save', sheetForm, handleActualSaveSheet);
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
    setError('');
    setBatchErrors({});
    setOpenBatchesDialog(true);
  };

  const handleActualSaveBatch = async () => {
    const newErrors = {};

    if (!existingBatchForm.quantity || Number(existingBatchForm.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
    }

    if (!existingBatchForm.batch_weight_kg || Number(existingBatchForm.batch_weight_kg) <= 0) {
      newErrors.batch_weight_kg = 'الوزن لكل قطعة مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (Object.keys(newErrors).length > 0) {
      setBatchErrors(newErrors);
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

        setSuccess('تمت إضافة الدفعة بنجاح');
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
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchFormSubmit = () => {
    openConfirm('save', existingBatchForm, handleActualSaveBatch);
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
    setError('');
    setBatchErrors({});
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
    setBatchErrors({});
  };

  const handleActualSaveEditBatch = async () => {
    const newErrors = {};

    if (!editBatchForm.quantity_original || Number(editBatchForm.quantity_original) <= 0) {
      newErrors.quantity_original = 'الكمية الأصلية مطلوبة ويجب أن تكون أكبر من صفر';
    }

    if (Object.keys(newErrors).length > 0) {
      setBatchErrors(newErrors);
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
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
        setSuccess('تم تحديث الدفعة بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        setIsEditingBatch(false);
        setOpenBatchViewDialog(false);

        const list = getBatchesBySheetId(selectedSheet.id);
        setBatches(list);
        refreshAll();
      } else {
        setError('فشل تحديث الدفعة: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBatchFormSubmit = () => {
    openConfirm('update', editBatchForm, handleActualSaveEditBatch);
  };

  const handleActualDeleteBatch = async () => {
    if (!selectedBatch) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const result = deleteBatch(selectedBatch.id);
      if (result.success) {
        setSuccess('تم حذف الدفعة بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        setOpenBatchViewDialog(false);
        const list = getBatchesBySheetId(selectedSheet.id);
        setBatches(list);
        refreshAll();
      } else {
        setError('فشل حذف الدفعة: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = () => {
    openConfirm('delete', selectedBatch, handleActualDeleteBatch);
  };

  const handleActualDeleteSheet = async () => {
    if (!selectedSheet) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const result = deleteSheet(selectedSheet.id);
      if (result.success) {
        setSuccess('تم حذف الصفيحة بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        setOpenBatchesDialog(false);
        refreshAll();
      } else {
        setError('فشل حذف الصفيحة: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSheet = () => {
    openConfirm('delete', selectedSheet, handleActualDeleteSheet);
  };

  const handleCloseBatchView = () => {
    setOpenBatchViewDialog(false);
    setIsEditingBatch(false);
    setSelectedBatch(null);
    setBatchErrors({});
  };

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
      <UnifiedFormDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onSubmit={handleSheetFormSubmit}
        title="إضافة صفيحة جديدة"
        subtitle="أدخل معلومات الصفيحة والدفعة الأولى"
        submitText="حفظ"
        loading={loading}
        maxWidth="md"
      >
        <Box sx={{ mb: 2 }}>
          {/* Sheet Info Accordion */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={700}>
                <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                معلومات الصفيحة
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
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
                  <UnifiedFormField
                    label="الكود"
                    value={sheetForm.code}
                    onChange={(e) => setSheetForm({ ...sheetForm, code: e.target.value })}
                    name="code"
                    required
                    disabled={autoGenerateCode}
                    error={sheetErrors.code}
                    helperText={autoGenerateCode ? "سيتم توليد الكود تلقائياً بناءً على المواصفات" : ""}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="نوع المعدن"
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
                    name="metal_type_id"
                    select
                    required
                    error={sheetErrors.metal_type_id}
                  >
                    <MenuItem value="">-- اختر النوع --</MenuItem>
                    {metalTypes.filter(m => m.is_active).map(metal => (
                      <MenuItem key={metal.id} value={metal.id}>{metal.name_ar}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="الدرجة"
                    value={sheetForm.grade_id}
                    onChange={(e) => setSheetForm({ ...sheetForm, grade_id: e.target.value })}
                    name="grade_id"
                    select
                    disabled={!sheetForm.metal_type_id || grades.length === 0}
                    helperText={!sheetForm.metal_type_id ? "اختر نوع المعدن أولاً" : (grades.length === 0 ? "لا توجد درجات متاحة - اختياري" : "اختياري")}
                  >
                    <MenuItem value="">-- بدون درجة (xx) --</MenuItem>
                    {grades.map(grade => (
                      <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="التشطيب"
                    value={sheetForm.finish_id}
                    onChange={(e) => setSheetForm({ ...sheetForm, finish_id: e.target.value })}
                    name="finish_id"
                    select
                    disabled={!sheetForm.metal_type_id || finishes.length === 0}
                    helperText={!sheetForm.metal_type_id ? "اختر نوع المعدن أولاً" : (finishes.length === 0 ? "لا توجد تشطيبات متاحة - اختياري" : "اختياري")}
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
                    value={sheetForm.length_mm}
                    onChange={(e) => setSheetForm({ ...sheetForm, length_mm: e.target.value })}
                    name="length_mm"
                    type="number"
                    required
                    error={sheetErrors.length_mm}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="العرض (مم)"
                    value={sheetForm.width_mm}
                    onChange={(e) => setSheetForm({ ...sheetForm, width_mm: e.target.value })}
                    name="width_mm"
                    type="number"
                    required
                    error={sheetErrors.width_mm}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="السماكة (مم)"
                    value={sheetForm.thickness_mm}
                    onChange={(e) => setSheetForm({ ...sheetForm, thickness_mm: e.target.value })}
                    name="thickness_mm"
                    type="number"
                    required
                    error={sheetErrors.thickness_mm}
                    inputProps={{ step: 0.1, min: 0.1 }}
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
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="المورد"
                    value={batchForm.supplier_id}
                    onChange={(e) => setBatchForm({ ...batchForm, supplier_id: e.target.value })}
                    name="supplier_id"
                    select
                    required
                    error={batchErrors.supplier_id}
                  >
                    <MenuItem value="">-- اختر المورد --</MenuItem>
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="الكمية"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                    name="quantity"
                    type="number"
                    required
                    error={batchErrors.quantity}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {/* Weight Entry */}
                <Grid item xs={12}>
                  <WeightPriceEntry
                    mode="weight"
                    weightMode={batchForm.weight_input_mode || 'per_sheet'}
                    label="الوزن"
                    value={batchForm.weight_per_sheet || ''}
                    totalWeight={batchForm.total_weight || ''}
                    quantity={batchForm.quantity || ''}
                    onChange={(field, value) => {
                      if (field === 'weight_mode') {
                        setBatchForm({ ...batchForm, weight_input_mode: value });
                      } else if (field === 'weight_per_sheet') {
                        setBatchForm({ ...batchForm, weight_per_sheet: value });
                        if (value && batchForm.quantity) {
                          const total = Number(value) * Number(batchForm.quantity);
                          setBatchForm(prev => ({ ...prev, total_weight: total.toFixed(3) }));
                        }
                      } else if (field === 'total_weight') {
                        setBatchForm({ ...batchForm, total_weight: value });
                        if (value && batchForm.quantity) {
                          const perSheet = Number(value) / Number(batchForm.quantity);
                          setBatchForm(prev => ({ ...prev, weight_per_sheet: perSheet.toFixed(3) }));
                        }
                      }
                    }}
                    currencySymbol={baseCurrencyInfo.symbol}
                  />
                  {batchErrors.weight && (
                    <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      {batchErrors.weight}
                    </Typography>
                  )}
                </Grid>

                {/* Pricing Entry */}
                <Grid item xs={12}>
                  <WeightPriceEntry
                    mode="price"
                    pricingMode={batchForm.pricing_mode || 'per_kg'}
                    label="التسعير"
                    pricePerKg={batchForm.price_per_kg || ''}
                    pricePerPiece=""
                    totalCost={batchForm.total_cost || ''}
                    quantity={batchForm.quantity || ''}
                    weight={batchForm.total_weight || (Number(batchForm.weight_per_sheet || 0) * Number(batchForm.quantity || 0))}
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
                    label="تاريخ الاستلام"
                    value={batchForm.received_date}
                    onChange={(e) => setBatchForm({ ...batchForm, received_date: e.target.value })}
                    name="received_date"
                    type="date"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="موقع التخزين"
                    value={batchForm.storage_location}
                    onChange={(e) => setBatchForm({ ...batchForm, storage_location: e.target.value })}
                    name="storage_location"
                    helperText="اختياري"
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
                    helperText="اختياري"
                  />
                </Grid>

                {/* Pricing Preview */}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                      {(() => {
                        const qty = Number(batchForm.quantity) || 0;
                        const weightPerSheet = Number(batchForm.weight_per_sheet) || 0;
                        const totalWeight = Number(batchForm.total_weight) || (qty * weightPerSheet);
                        const pricePerKg = Number(batchForm.price_per_kg) || 0;
                        const totalCost = Number(batchForm.total_cost) || 0;

                        let pricePerSheet = 0;
                        let calculatedTotalCost = 0;
                        let calculatedPricePerKg = 0;

                        if (batchForm.pricing_mode === 'per_kg') {
                          calculatedTotalCost = totalWeight * pricePerKg;
                          pricePerSheet = weightPerSheet * pricePerKg;
                          calculatedPricePerKg = pricePerKg;
                        } else {
                          calculatedPricePerKg = totalWeight > 0 ? totalCost / totalWeight : 0;
                          pricePerSheet = qty > 0 ? totalCost / qty : 0;
                          calculatedTotalCost = totalCost;
                        }

                        return (
                          <>
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">
                                <strong>السعر لكل قطعة:</strong> {fmt(pricePerSheet)} {baseCurrencyInfo.symbol}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">
                                <strong>السعر لكل كيلو:</strong> {fmt(calculatedPricePerKg)} {baseCurrencyInfo.symbol}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">
                                <strong>التكلفة الإجمالية:</strong> {fmt(calculatedTotalCost)} {baseCurrencyInfo.symbol}
                              </Typography>
                            </Grid>
                          </>
                        );
                      })()}
                    </Grid>
                  </Alert>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Payment Accordion */}
          {batchForm.supplier_id && (
            <Accordion defaultExpanded sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={700}>
                  <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  الدفع للمورد
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
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
                      <UnifiedFormField
                        label="المبلغ المدفوع"
                        value={batchForm.payment_amount}
                        onChange={(e) => setBatchForm({ ...batchForm, payment_amount: e.target.value })}
                        name="payment_amount"
                        type="number"
                        inputProps={{ step: 0.01, min: 0 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{baseCurrencyInfo.symbol}</InputAdornment>
                        }}
                      />
                    </Grid>
                  )}

                  {batchForm.payment_type !== 'later' && (
                    <Grid item xs={12} md={batchForm.payment_type === 'partial' ? 6 : 12}>
                      <UnifiedFormField
                        label="طريقة الدفع"
                        value={batchForm.payment_method}
                        onChange={(e) => setBatchForm({ ...batchForm, payment_method: e.target.value })}
                        name="payment_method"
                        select
                      >
                        {paymentMethods.map(pm => (
                          <MenuItem key={pm.id} value={pm.name}>{pm.name}</MenuItem>
                        ))}
                      </UnifiedFormField>
                    </Grid>
                  )}

                  {batchForm.payment_type !== 'later' && (
                    <Grid item xs={12}>
                      <UnifiedFormField
                        label="ملاحظات الدفع"
                        value={batchForm.payment_notes}
                        onChange={(e) => setBatchForm({ ...batchForm, payment_notes: e.target.value })}
                        name="payment_notes"
                        helperText="اختياري"
                      />
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </UnifiedFormDialog>

      {/* Dialog: Batches (view + add) */}
      <UnifiedFormDialog
        open={openBatchesDialog}
        onClose={() => setOpenBatchesDialog(false)}
        onSubmit={() => setOpenBatchesDialog(false)}
        title={`الدفعات - ${selectedSheet?.code}`}
        subtitle={`${selectedSheet?.metal_name} | ${selectedSheet?.length_mm}×${selectedSheet?.width_mm} | ${selectedSheet?.thickness_mm} مم`}
        submitText="إغلاق"
        cancelText=""
        maxWidth="lg"
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddBoxIcon fontSize="small" /> إضافة دفعة للصفيحة
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <UnifiedFormField
                label="المورد"
                value={existingBatchForm.supplier_id}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, supplier_id: e.target.value })}
                name="supplier_id"
                select
                helperText="اختياري"
              >
                <MenuItem value="">بدون مورد</MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                ))}
              </UnifiedFormField>
            </Grid>
            <Grid item xs={12} md={4}>
              <UnifiedFormField
                label="الكمية"
                value={existingBatchForm.quantity}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, quantity: e.target.value })}
                name="quantity"
                type="number"
                required
                error={batchErrors.quantity}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <UnifiedFormField
                label="طريقة التسعير"
                value={existingBatchForm.pricing_mode}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, pricing_mode: e.target.value })}
                name="pricing_mode"
                select
              >
                <MenuItem value="per_kg">بالكيلو (price/kg)</MenuItem>
                <MenuItem value="per_batch">بالدفعة (total cost)</MenuItem>
              </UnifiedFormField>
            </Grid>

            <Grid item xs={12} md={6}>
              <UnifiedFormField
                label="الوزن لكل قطعة (كغ)"
                value={existingBatchForm.batch_weight_kg}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, batch_weight_kg: e.target.value })}
                name="batch_weight_kg"
                type="number"
                required
                error={batchErrors.batch_weight_kg}
                helperText="الوزن لكل قطعة واحدة"
                inputProps={{ step: 0.001, min: 0 }}
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
                <UnifiedFormField
                  label="السعر لكل كيلو"
                  value={existingBatchForm.price_per_kg}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, price_per_kg: e.target.value })}
                  name="price_per_kg"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                  }}
                />
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="التكلفة الإجمالية"
                  value={existingBatchForm.total_cost}
                  onChange={(e) => setExistingBatchForm({ ...existingBatchForm, total_cost: e.target.value })}
                  name="total_cost"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <UnifiedFormField
                label="تاريخ الاستلام"
                value={existingBatchForm.received_date}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, received_date: e.target.value })}
                name="received_date"
                type="date"
              />
            </Grid>

            {/* Payment Section */}
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
                  <UnifiedFormField
                    label="نوع الدفع"
                    value={existingBatchForm.payment_type}
                    onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_type: e.target.value })}
                    name="payment_type"
                    select
                  >
                    <MenuItem value="later">الدفع لاحقاً</MenuItem>
                    <MenuItem value="full">دفع كامل</MenuItem>
                    <MenuItem value="partial">دفع جزئي</MenuItem>
                  </UnifiedFormField>
                </Grid>

                {existingBatchForm.payment_type === 'partial' && (
                  <Grid item xs={12} md={4}>
                    <UnifiedFormField
                      label="المبلغ المدفوع"
                      value={existingBatchForm.payment_amount}
                      onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_amount: e.target.value })}
                      name="payment_amount"
                      type="number"
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">{baseCurrencyInfo.symbol}</InputAdornment>
                      }}
                    />
                  </Grid>
                )}

                {existingBatchForm.payment_type !== 'later' && (
                  <Grid item xs={12} md={4}>
                    <UnifiedFormField
                      label="طريقة الدفع"
                      value={existingBatchForm.payment_method}
                      onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_method: e.target.value })}
                      name="payment_method"
                      select
                    >
                      {paymentMethods.map(pm => (
                        <MenuItem key={pm.id} value={pm.name}>{pm.name}</MenuItem>
                      ))}
                    </UnifiedFormField>
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
              <Button variant="contained" size="large" startIcon={<AddBoxIcon />} onClick={handleBatchFormSubmit}>
                إضافة الدفعة
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            الدفعات المتاحة
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteSheet}
          >
            حذف الصفيحة
          </Button>
        </Box>

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
      </UnifiedFormDialog>

      {/* Dialog: Batch View/Edit */}
      <UnifiedFormDialog
        open={openBatchViewDialog}
        onClose={handleCloseBatchView}
        onSubmit={isEditingBatch ? handleEditBatchFormSubmit : handleCloseBatchView}
        title={isEditingBatch ? 'تعديل الدفعة' : 'تفاصيل الدفعة'}
        submitText={isEditingBatch ? 'حفظ التعديلات' : 'إغلاق'}
        cancelText={isEditingBatch ? 'إلغاء' : ''}
        loading={loading}
        maxWidth="sm"
      >
        <Box sx={{ mb: 2 }}>
          {!isEditingBatch ? (
            // View Mode
            <Grid container spacing={2}>
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
                    {safeNotes(selectedBatch.notes)}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<EditIcon />}
                    onClick={handleEditBatch}
                    fullWidth
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="medium"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteBatch}
                    fullWidth
                  >
                    حذف
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            // Edit Mode
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ fontSize: '0.9375rem' }}>
                  تحديث الكمية الأصلية لن يؤثر على الكمية المتبقية. الكمية المتبقية تتغير فقط من خلال المبيعات.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="الكمية الأصلية"
                  value={editBatchForm.quantity_original}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, quantity_original: e.target.value })}
                  name="quantity_original"
                  type="number"
                  required
                  error={batchErrors.quantity_original}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="السعر لكل كيلو"
                  value={editBatchForm.price_per_kg}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, price_per_kg: e.target.value })}
                  name="price_per_kg"
                  type="number"
                  helperText="اختياري"
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="تاريخ الاستلام"
                  value={editBatchForm.received_date}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, received_date: e.target.value })}
                  name="received_date"
                  type="date"
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="موقع التخزين"
                  value={editBatchForm.storage_location}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, storage_location: e.target.value })}
                  name="storage_location"
                  helperText="اختياري"
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="ملاحظات"
                  value={editBatchForm.notes}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, notes: e.target.value })}
                  name="notes"
                  multiline
                  rows={3}
                  helperText="اختياري"
                />
              </Grid>
            </Grid>
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
