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
import UnifiedDialog from '../common/dialogs/UnifiedDialog';
import PrintConfirmDialog from '../common/print/PrintConfirmDialog';
import PrintButtons from '../common/print/PrintButtons';

import { usePrint } from '../../hooks/usePrint';
import { generateBatchPDF } from '../../utils/pdf/templates/batchPDF';

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
const createdByFallback = '\u0627\u0644\u0646\u0638\u0627\u0645 (\u0628\u064a\u0627\u0646\u0627\u062a \u0642\u062f\u064a\u0645\u0629)';
const notUpdatedFallback = '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0628\u0639\u062f';

const displayCreatedBy = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length ? trimmed : createdByFallback;
};

const displayUpdatedBy = (value, createdValue) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length) return trimmed;
  const creator = typeof createdValue === 'string' ? createdValue.trim() : '';
  if (creator.length) return creator;
  return notUpdatedFallback;
};

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
  const [openAddRemnantDialog, setOpenAddRemnantDialog] = useState(false);
  const [openBatchesDialog, setOpenBatchesDialog] = useState(false);
  const [openBatchViewDialog, setOpenBatchViewDialog] = useState(false);

  // Selected
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isEditingBatch, setIsEditingBatch] = useState(false);

  // Auto-code generation
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  // Forms â€” Sheet info
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

  // Forms â€” Initial batch for new sheet
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

  // Forms â€” Add batch for existing sheet
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

  // Forms â€” Remnant sheet info
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

  // Forms â€” Initial batch for new remnant
  const [remnantBatchForm, setRemnantBatchForm] = useState({
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

  // Form â€” Edit batch
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
  const [remnantErrors, setRemnantErrors] = useState({});
  const [remnantBatchErrors, setRemnantBatchErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Print functionality
  const {
    isPrinting,
    showConfirmDialog: showPrintDialog,
    pendingDocument,
    requestPrint,
    executePrint,
    cancelPrint
  } = usePrint();

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Helper Functions
  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const confirmationDialogConfig = useMemo(
    () => getConfirmationConfig(confirmDialog.type),
    [confirmDialog.type]
  );

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        return parentSheet && parentSheet.code && parentSheet.code.toLowerCase().includes(remnantFilterParentSheet.toLowerCase());
      });
    }
    return rows;
  }, [remnants, sheets, remnantSearchTerm, remnantFilterMetalType, remnantFilterThkMin, remnantFilterThkMax, remnantFilterQtyMin, remnantFilterQtyMax, remnantFilterParentSheet]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Validation Functions
  const validateSheetForm = () => {
    const newErrors = {};

    if (!sheetForm.code.trim()) {
      newErrors.code = 'Ø§Ù„ÙƒÙˆØ¯ Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!sheetForm.metal_type_id) {
      newErrors.metal_type_id = 'Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù† Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!sheetForm.length_mm || Number(sheetForm.length_mm) <= 0) {
      newErrors.length_mm = 'Ø§Ù„Ø·ÙˆÙ„ Ù…Ø·Ù„ÙˆØ¨ ÙˆÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!sheetForm.width_mm || Number(sheetForm.width_mm) <= 0) {
      newErrors.width_mm = 'Ø§Ù„Ø¹Ø±Ø¶ Ù…Ø·Ù„ÙˆØ¨ ÙˆÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!sheetForm.thickness_mm || Number(sheetForm.thickness_mm) <= 0) {
      newErrors.thickness_mm = 'Ø§Ù„Ø³Ù…Ø§ÙƒØ© Ù…Ø·Ù„ÙˆØ¨Ø© ÙˆÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    setSheetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBatchForm = () => {
    const newErrors = {};

    if (!batchForm.supplier_id) {
      newErrors.supplier_id = 'Ø§Ù„Ù…ÙˆØ±Ø¯ Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) {
      newErrors.quantity = 'Ø§Ù„ÙƒÙ…ÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø© ÙˆÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    const weightPerSheet = Number(batchForm.weight_per_sheet) || 0;
    const totalWeight = Number(batchForm.total_weight) || 0;

    if (weightPerSheet <= 0 && totalWeight <= 0) {
      newErrors.weight = 'ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„ÙˆØ²Ù† (Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø© Ø£Ùˆ Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ)';
    }

    setBatchErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Add Remnant Handlers
  const handleOpenAddRemnantDialog = () => {
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

    if (defaultMetalType) {
      setGrades(getGrades(defaultMetalType, true));
      setFinishes(getFinishes(defaultMetalType, true));
    }

    setRemnantBatchForm({
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
    setRemnantErrors({});
    setRemnantBatchErrors({});
    setOpenAddRemnantDialog(true);
  };

  const handleCloseAddRemnantDialog = () => {
    setOpenAddRemnantDialog(false);
    setError('');
    setRemnantErrors({});
    setRemnantBatchErrors({});
  };

  const validateRemnantForm = () => {
    const newErrors = {};
    const newBatchErrors = {};

    if (!remnantForm.code.trim()) {
      newErrors.code = 'Ø§Ù„ÙƒÙˆØ¯ Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!remnantForm.metal_type_id) {
      newErrors.metal_type_id = 'Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù† Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!remnantForm.length_mm || Number(remnantForm.length_mm) <= 0) {
      newErrors.length_mm = 'Ø§Ù„Ø·ÙˆÙ„ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!remnantForm.width_mm || Number(remnantForm.width_mm) <= 0) {
      newErrors.width_mm = 'Ø§Ù„Ø¹Ø±Ø¶ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!remnantForm.thickness_mm || Number(remnantForm.thickness_mm) <= 0) {
      newErrors.thickness_mm = 'Ø§Ù„Ø³Ù…Ø§ÙƒØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (remnantForm.piece_source === 'from_sheet_cutting' && !remnantForm.parent_sheet_id) {
      newErrors.parent_sheet_id = 'ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù… Ø¹Ù†Ø¯ Ø§Ø®ØªÙŠØ§Ø± "Ù…Ù† Ù‚Øµ ØµÙÙŠØ­Ø©"';
    }

    if (!remnantBatchForm.quantity || Number(remnantBatchForm.quantity) <= 0) {
      newBatchErrors.quantity = 'Ø§Ù„ÙƒÙ…ÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    setRemnantErrors(newErrors);
    setRemnantBatchErrors(newBatchErrors);
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
        remnantBatchForm.pricing_mode,
        remnantBatchForm.price_per_kg,
        remnantBatchForm.total_cost,
        remnantBatchForm.quantity,
        remnantForm.weight_per_sheet_kg,
        remnantBatchForm.batch_weight_kg
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
        supplier_id: remnantBatchForm.supplier_id || null,
        quantity: Number(remnantBatchForm.quantity),
        price_per_kg: preview.price_per_kg != null ? Number(preview.price_per_kg) : null,
        total_cost: preview.total_cost != null ? Number(preview.total_cost.toFixed(2)) : null,
        storage_location: remnantBatchForm.storage_location || null,
        received_date: remnantBatchForm.received_date,
        notes: remnantBatchForm.notes || null
      };

      const result = addSheetWithBatch(sheetData, batchData);
      if (result.success) {
        setSuccess(`âœ“ ØªÙ… Ø¥Ø¶Ø§ÙØ© ${result.linked ? 'Ø§Ù„Ø¯ÙØ¹Ø© Ù„Ù„Ø¨Ù‚ÙŠØ© Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯Ø©' : 'Ø§Ù„Ø¨Ù‚ÙŠØ© ÙˆØ§Ù„Ø¯ÙØ¹Ø©'} Ø¨Ù†Ø¬Ø§Ø­`);
        setTimeout(() => setSuccess(''), 3000);
        handleCloseAddRemnantDialog();
        refreshAll();
        closeConfirm();
      } else {
        setError('ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸: ' + result.error);
        closeConfirm();
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
      closeConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewRemnant = () => {
    openConfirm('save', remnantForm, handleActualSaveRemnant);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              notes: batchForm.payment_notes || `Ø¯ÙØ¹Ø© ${batchForm.payment_type === 'full' ? 'ÙƒØ§Ù…Ù„Ø©' : 'Ø¬Ø²Ø¦ÙŠØ©'} Ù„Ù„Ø¯ÙØ¹Ø©`
            });
          }
        }

        setSuccess(`ØªÙ… ${result.linked ? 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¯ÙØ¹Ø© Ù„Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯Ø©' : 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„ØµÙÙŠØ­Ø© ÙˆØ§Ù„Ø¯ÙØ¹Ø©'} Ø¨Ù†Ø¬Ø§Ø­`);
        setTimeout(() => setSuccess(''), 3000);
        handleCloseAddDialog();
        refreshAll();
      } else {
        setError('ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetFormSubmit = () => {
    openConfirm('save', sheetForm, handleActualSaveSheet);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      newErrors.quantity = 'Ø§Ù„ÙƒÙ…ÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!existingBatchForm.batch_weight_kg || Number(existingBatchForm.batch_weight_kg) <= 0) {
      newErrors.batch_weight_kg = 'Ø§Ù„ÙˆØ²Ù† Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø© Ù…Ø·Ù„ÙˆØ¨ ÙˆÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
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
              notes: existingBatchForm.payment_notes || `Ø¯ÙØ¹Ø© ${existingBatchForm.payment_type === 'full' ? 'ÙƒØ§Ù…Ù„Ø©' : 'Ø¬Ø²Ø¦ÙŠØ©'}`
            });
          }
        }

        setSuccess('ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¯ÙØ¹Ø© Ø¨Ù†Ø¬Ø§Ø­');
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
        setError('ÙØ´Ù„ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¯ÙØ¹Ø©: ' + (res?.error || ''));
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Print handlers
  const handlePrintBatch = () => {
    if (!selectedBatch || !selectedSheet) return;

    const docDefinition = generateBatchPDF(
      selectedBatch,
      selectedSheet,
      {
        orientation: 'portrait',
        includeLogo: true,
        margins: 'normal'
      }
    );

    requestPrint(docDefinition, {
      name: `Ø¯ÙØ¹Ø© ${selectedSheet.code}`,
      type: 'ØªÙØ§ØµÙŠÙ„ Ø¯ÙØ¹Ø©',
      estimatedPages: 1,
      defaultAction: 'print'
    });
  };

  const handleExportBatchPDF = () => {
    if (!selectedBatch || !selectedSheet) return;

    const docDefinition = generateBatchPDF(
      selectedBatch,
      selectedSheet,
      {
        orientation: 'portrait',
        includeLogo: true,
        margins: 'normal'
      }
    );

    requestPrint(docDefinition, {
      name: `Ø¯ÙØ¹Ø© ${selectedSheet.code}`,
      type: 'ØªÙØ§ØµÙŠÙ„ Ø¯ÙØ¹Ø©',
      estimatedPages: 1,
      defaultAction: 'pdf'
    });
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      newErrors.quantity_original = 'Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ø£ØµÙ„ÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø© ÙˆÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
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
        setSuccess('ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¯ÙØ¹Ø© Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 3000);
        setIsEditingBatch(false);
        setOpenBatchViewDialog(false);

        const list = getBatchesBySheetId(selectedSheet.id);
        setBatches(list);
        refreshAll();
      } else {
        setError('ÙØ´Ù„ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¯ÙØ¹Ø©: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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
        setSuccess('ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¯ÙØ¹Ø© Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 3000);
        setOpenBatchViewDialog(false);
        const list = getBatchesBySheetId(selectedSheet.id);
        setBatches(list);
        refreshAll();
      } else {
        setError('ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„Ø¯ÙØ¹Ø©: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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
        setSuccess('ØªÙ… Ø­Ø°Ù Ø§Ù„ØµÙÙŠØ­Ø© Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 3000);
        setOpenBatchesDialog(false);
        refreshAll();
      } else {
        setError('ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„ØµÙÙŠØ­Ø©: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØµÙØ§Ø¦Ø­ Ø§Ù„Ù…Ø¹Ø¯Ù†ÙŠØ© ÙˆØ§Ù„Ø¯ÙØ¹Ø§Øª
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
            label={`Ø§Ù„ØµÙØ§Ø¦Ø­ Ø§Ù„ÙƒØ§Ù…Ù„Ø© (${sheets.length})`}
            icon={<InventoryIcon />}
            iconPosition="start"
          />
          <Tab
            label={`Ø§Ù„Ø¨ÙˆØ§Ù‚ÙŠ (${remnants.length})`}
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
                    placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„ÙƒÙˆØ¯ Ø£Ùˆ Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù†..."
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
                    label="Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù†"
                    value={filterMetalType}
                    onChange={(e) => setFilterMetalType(e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="">Ø§Ù„ÙƒÙ„</option>
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
                    ÙÙ„Ø§ØªØ± Ù…ØªÙ‚Ø¯Ù…Ø©
                  </Button>
                  <Button
                    startIcon={<RestartAltIcon />}
                    onClick={resetFilters}
                    size="large"
                  >
                    Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø·
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{ fontWeight: 700 }}
                  >
                    Ø¥Ø¶Ø§ÙØ© ØµÙÙŠØ­Ø© Ø¬Ø¯ÙŠØ¯Ø©
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
                      label="Ø£Ø¯Ù†Ù‰ Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
                      value={filterThkMin}
                      onChange={(e) => setFilterThkMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ø£Ù‚ØµÙ‰ Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
                      value={filterThkMax}
                      onChange={(e) => setFilterThkMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ø£Ø¯Ù†Ù‰ ÙƒÙ…ÙŠØ©"
                      value={filterQtyMin}
                      onChange={(e) => setFilterQtyMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ø£Ù‚ØµÙ‰ ÙƒÙ…ÙŠØ©"
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
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙˆØ¯</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù†ÙˆØ¹</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯ (Ù…Ù…)</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ù…Ø§ÙƒØ©</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙˆØ²Ù†/ÙˆØ±Ù‚Ø©</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙ…ÙŠØ©</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ø¹Ø±/ÙƒØº</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3} fontSize="1rem">Ù„Ø§ ØªÙˆØ¬Ø¯ ØµÙØ§Ø¦Ø­ ÙƒØ§Ù…Ù„Ø©</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSheets.map((sheet) => (
                    <TableRow key={sheet.id} hover>
                      <TableCell>
                        <Typography fontWeight={600} fontSize="0.9375rem">{sheet.code}</Typography>
                      </TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{sheet.metal_name}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{sheet.length_mm} Ã— {sheet.width_mm}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{sheet.thickness_mm} Ù…Ù…</Typography></TableCell>
                      <TableCell>
                        <Typography fontSize="0.9375rem">
                          {sheet.weight_per_sheet_kg ? `${fmt(sheet.weight_per_sheet_kg)} ÙƒØº` : '---'}
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
                        <Tooltip title="Ø¹Ø±Ø¶ Ø§Ù„Ø¯ÙØ¹Ø§Øª / Ø¥Ø¶Ø§ÙØ© Ø¯ÙØ¹Ø©">
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
                    placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„ÙƒÙˆØ¯ Ø£Ùˆ Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù†..."
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
                    label="Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù†"
                    value={remnantFilterMetalType}
                    onChange={(e) => setRemnantFilterMetalType(e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="">Ø§Ù„ÙƒÙ„</option>
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
                    ÙÙ„Ø§ØªØ± Ù…ØªÙ‚Ø¯Ù…Ø©
                  </Button>
                  <Button
                    startIcon={<RestartAltIcon />}
                    onClick={resetRemnantFilters}
                    size="large"
                  >
                    Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø·
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddRemnantDialog}
                    sx={{ fontWeight: 700 }}
                  >
                    Ø¥Ø¶Ø§ÙØ© Ø¨Ù‚ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©
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
                      label="Ø£Ø¯Ù†Ù‰ Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
                      value={remnantFilterThkMin}
                      onChange={(e) => setRemnantFilterThkMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ø£Ù‚ØµÙ‰ Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
                      value={remnantFilterThkMax}
                      onChange={(e) => setRemnantFilterThkMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ø£Ø¯Ù†Ù‰ ÙƒÙ…ÙŠØ©"
                      value={remnantFilterQtyMin}
                      onChange={(e) => setRemnantFilterQtyMin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ø£Ù‚ØµÙ‰ ÙƒÙ…ÙŠØ©"
                      value={remnantFilterQtyMax}
                      onChange={(e) => setRemnantFilterQtyMax(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…"
                      placeholder="Ø§Ø¨Ø­Ø« Ø¨ÙƒÙˆØ¯ Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…..."
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
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙˆØ¯</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù†ÙˆØ¹</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯ (Ù…Ù…)</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ù…Ø§ÙƒØ©</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙ…ÙŠØ©</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ø¹Ø±/ÙƒØº</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRemnants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3} fontSize="1rem">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙˆØ§Ù‚ÙŠ</Typography>
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
                        <TableCell><Typography fontSize="0.9375rem">{sheet.length_mm} Ã— {sheet.width_mm}</Typography></TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{sheet.thickness_mm} Ù…Ù…</Typography></TableCell>
                        <TableCell>
                          {parentCode ? (
                            <Tooltip title="Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…" arrow>
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
                          <Tooltip title="Ø¹Ø±Ø¶ Ø§Ù„Ø¯ÙØ¹Ø§Øª / Ø¥Ø¶Ø§ÙØ© Ø¯ÙØ¹Ø©">
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
        title="Ø¥Ø¶Ø§ÙØ© ØµÙÙŠØ­Ø© Ø¬Ø¯ÙŠØ¯Ø©"
        subtitle="Ø£Ø¯Ø®Ù„ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ØµÙÙŠØ­Ø© ÙˆØ§Ù„Ø¯ÙØ¹Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰"
        submitText="Ø­ÙØ¸"
        loading={loading}
        maxWidth="md"
      >
        <Box sx={{ mb: 2 }}>
          {/* Sheet Info Accordion */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={700}>
                <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ØµÙÙŠØ­Ø©
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
                        <Typography fontSize="1rem">ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ÙƒÙˆØ¯ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹</Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ÙƒÙˆØ¯"
                    value={sheetForm.code}
                    onChange={(e) => setSheetForm({ ...sheetForm, code: e.target.value })}
                    name="code"
                    required
                    disabled={autoGenerateCode}
                    error={sheetErrors.code}
                    helperText={autoGenerateCode ? "Ø³ÙŠØªÙ… ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ÙƒÙˆØ¯ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ§ØµÙØ§Øª" : ""}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù†"
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
                    <MenuItem value="">-- Ø§Ø®ØªØ± Ø§Ù„Ù†ÙˆØ¹ --</MenuItem>
                    {metalTypes.filter(m => m.is_active).map(metal => (
                      <MenuItem key={metal.id} value={metal.id}>{metal.name_ar}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„Ø¯Ø±Ø¬Ø©"
                    value={sheetForm.grade_id}
                    onChange={(e) => setSheetForm({ ...sheetForm, grade_id: e.target.value })}
                    name="grade_id"
                    select
                    disabled={!sheetForm.metal_type_id || grades.length === 0}
                    helperText={!sheetForm.metal_type_id ? "Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù† Ø£ÙˆÙ„Ø§Ù‹" : (grades.length === 0 ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¯Ø±Ø¬Ø§Øª Ù…ØªØ§Ø­Ø© - Ø§Ø®ØªÙŠØ§Ø±ÙŠ" : "Ø§Ø®ØªÙŠØ§Ø±ÙŠ")}
                  >
                    <MenuItem value="">-- Ø¨Ø¯ÙˆÙ† Ø¯Ø±Ø¬Ø© (xx) --</MenuItem>
                    {grades.map(grade => (
                      <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ØªØ´Ø·ÙŠØ¨"
                    value={sheetForm.finish_id}
                    onChange={(e) => setSheetForm({ ...sheetForm, finish_id: e.target.value })}
                    name="finish_id"
                    select
                    disabled={!sheetForm.metal_type_id || finishes.length === 0}
                    helperText={!sheetForm.metal_type_id ? "Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù† Ø£ÙˆÙ„Ø§Ù‹" : (finishes.length === 0 ? "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªØ´Ø·ÙŠØ¨Ø§Øª Ù…ØªØ§Ø­Ø© - Ø§Ø®ØªÙŠØ§Ø±ÙŠ" : "Ø§Ø®ØªÙŠØ§Ø±ÙŠ")}
                  >
                    <MenuItem value="">-- Ø¨Ø¯ÙˆÙ† ØªØ´Ø·ÙŠØ¨ (xx) --</MenuItem>
                    {finishes.map(finish => (
                      <MenuItem key={finish.id} value={finish.id}>
                        {finish.name_ar} ({finish.name_en})
                      </MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="Ø§Ù„Ø·ÙˆÙ„ (Ù…Ù…)"
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
                    label="Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ù…)"
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
                    label="Ø§Ù„Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
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
                Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¯ÙØ¹Ø©
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„Ù…ÙˆØ±Ø¯"
                    value={batchForm.supplier_id}
                    onChange={(e) => setBatchForm({ ...batchForm, supplier_id: e.target.value })}
                    name="supplier_id"
                    select
                    required
                    error={batchErrors.supplier_id}
                  >
                    <MenuItem value="">-- Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ±Ø¯ --</MenuItem>
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ÙƒÙ…ÙŠØ©"
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
                    label="Ø§Ù„ÙˆØ²Ù†"
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
                    label="Ø§Ù„ØªØ³Ø¹ÙŠØ±"
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
                    label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
                    value={batchForm.received_date}
                    onChange={(e) => setBatchForm({ ...batchForm, received_date: e.target.value })}
                    name="received_date"
                    type="date"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ù…ÙˆÙ‚Ø¹ Ø§Ù„ØªØ®Ø²ÙŠÙ†"
                    value={batchForm.storage_location}
                    onChange={(e) => setBatchForm({ ...batchForm, storage_location: e.target.value })}
                    name="storage_location"
                    helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                  />
                </Grid>
                <Grid item xs={12}>
                  <UnifiedFormField
                    label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª"
                    value={batchForm.notes}
                    onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                    name="notes"
                    multiline
                    rows={2}
                    helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
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
                                <strong>Ø§Ù„Ø³Ø¹Ø± Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø©:</strong> {fmt(pricePerSheet)} {baseCurrencyInfo.symbol}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">
                                <strong>Ø§Ù„Ø³Ø¹Ø± Ù„ÙƒÙ„ ÙƒÙŠÙ„Ùˆ:</strong> {fmt(calculatedPricePerKg)} {baseCurrencyInfo.symbol}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">
                                <strong>Ø§Ù„ØªÙƒÙ„ÙØ© Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠØ©:</strong> {fmt(calculatedTotalCost)} {baseCurrencyInfo.symbol}
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
                  Ø§Ù„Ø¯ÙØ¹ Ù„Ù„Ù…ÙˆØ±Ø¯
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormLabel component="legend">Ù†ÙˆØ¹ Ø§Ù„Ø¯ÙØ¹</FormLabel>
                    <RadioGroup
                      row
                      value={batchForm.payment_type}
                      onChange={(e) => setBatchForm({ ...batchForm, payment_type: e.target.value })}
                    >
                      <FormControlLabel value="full" control={<Radio />} label="Ø¯ÙØ¹ ÙƒØ§Ù…Ù„" />
                      <FormControlLabel value="partial" control={<Radio />} label="Ø¯ÙØ¹ Ø¬Ø²Ø¦ÙŠ" />
                      <FormControlLabel value="later" control={<Radio />} label="Ø§Ù„Ø¯ÙØ¹ Ù„Ø§Ø­Ù‚Ø§Ù‹" />
                    </RadioGroup>
                  </Grid>

                  {batchForm.payment_type === 'partial' && (
                    <Grid item xs={12} md={6}>
                      <UnifiedFormField
                        label="Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø¯ÙÙˆØ¹"
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
                        label="Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹"
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
                        label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ø¯ÙØ¹"
                        value={batchForm.payment_notes}
                        onChange={(e) => setBatchForm({ ...batchForm, payment_notes: e.target.value })}
                        name="payment_notes"
                        helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                      />
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </UnifiedFormDialog>

      {/* Dialog: Add Remnant + Initial Batch */}
      <UnifiedFormDialog
        open={openAddRemnantDialog}
        onClose={handleCloseAddRemnantDialog}
        onSubmit={handleSaveNewRemnant}
        title="Ø¥Ø¶Ø§ÙØ© Ø¨Ù‚ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©"
        subtitle="Ø£Ø¯Ø®Ù„ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¨Ù‚ÙŠØ© ÙˆØ§Ù„Ø¯ÙØ¹Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰"
        submitText="Ø­ÙØ¸"
        loading={loading}
        maxWidth="md"
      >
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Box sx={{ mb: 2 }}>
          {/* Remnant Info Accordion */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={700}>
                <AddBoxIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¨Ù‚ÙŠØ©
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* Piece Source Selection */}
                <Grid item xs={12}>
                  <FormLabel component="legend">
                    <Typography fontWeight={600} fontSize="1rem">Ù…ØµØ¯Ø± Ø§Ù„Ù‚Ø·Ø¹Ø© *</Typography>
                  </FormLabel>
                  <RadioGroup
                    row
                    value={remnantForm.piece_source}
                    onChange={(e) => {
                      const newSource = e.target.value;
                      setRemnantForm(prev => ({ ...prev, piece_source: newSource }));
                      if (newSource === 'company_stock') {
                        const companySupplier = suppliers.find(s => s.name === 'Ø§Ù„Ø´Ø±ÙƒØ©' || s.name.includes('Ø§Ù„Ø´Ø±ÙƒØ©'));
                        if (companySupplier) {
                          setRemnantBatchForm(prev => ({ ...prev, supplier_id: companySupplier.id }));
                        }
                      } else {
                        setRemnantBatchForm(prev => ({ ...prev, supplier_id: '' }));
                      }
                    }}
                  >
                    <FormControlLabel
                      value="company_stock"
                      control={<Radio />}
                      label={<Typography fontSize="1rem">Ù…Ø®Ø²ÙˆÙ† Ø§Ù„Ø´Ø±ÙƒØ©</Typography>}
                    />
                    <FormControlLabel
                      value="from_sheet_cutting"
                      control={<Radio />}
                      label={<Typography fontSize="1rem">Ù…Ù† Ù‚Øµ ØµÙÙŠØ­Ø©</Typography>}
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
                        <Typography fontSize="1rem">ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ÙƒÙˆØ¯ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹</Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ÙƒÙˆØ¯"
                    value={remnantForm.code}
                    onChange={(e) => {
                      setRemnantForm({ ...remnantForm, code: e.target.value });
                      if (remnantErrors.code) {
                        setRemnantErrors({ ...remnantErrors, code: null });
                      }
                    }}
                    name="code"
                    required
                    error={remnantErrors.code}
                    disabled={autoGenerateCode}
                    helperText={autoGenerateCode ? "Ø³ÙŠØªÙ… ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ÙƒÙˆØ¯ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ (R...)" : ""}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ù†ÙˆØ¹ Ø§Ù„Ù…Ø¹Ø¯Ù†"
                    value={remnantForm.metal_type_id}
                    onChange={(e) => {
                      const newMetalId = e.target.value;
                      setRemnantForm({
                        ...remnantForm,
                        metal_type_id: newMetalId,
                        grade_id: '',
                        finish_id: ''
                      });
                      if (newMetalId) {
                        setGrades(getGrades(newMetalId, true));
                        setFinishes(getFinishes(newMetalId, true));
                      }
                      if (remnantErrors.metal_type_id) {
                        setRemnantErrors({ ...remnantErrors, metal_type_id: null });
                      }
                    }}
                    name="metal_type_id"
                    select
                    required
                    error={remnantErrors.metal_type_id}
                  >
                    <MenuItem value="">-- Ø§Ø®ØªØ± Ø§Ù„Ù†ÙˆØ¹ --</MenuItem>
                    {metalTypes.filter(m => m.is_active).map(metal => (
                      <MenuItem key={metal.id} value={metal.id}>{metal.name_ar}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„Ø¯Ø±Ø¬Ø©"
                    value={remnantForm.grade_id}
                    onChange={(e) => setRemnantForm({ ...remnantForm, grade_id: e.target.value })}
                    name="grade_id"
                    select
                    disabled={!remnantForm.metal_type_id || grades.length === 0}
                  >
                    <MenuItem value="">-- Ø¨Ø¯ÙˆÙ† Ø¯Ø±Ø¬Ø© --</MenuItem>
                    {grades.map(grade => (
                      <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ØªØ´Ø·ÙŠØ¨"
                    value={remnantForm.finish_id}
                    onChange={(e) => setRemnantForm({ ...remnantForm, finish_id: e.target.value })}
                    name="finish_id"
                    select
                    disabled={!remnantForm.metal_type_id || finishes.length === 0}
                  >
                    <MenuItem value="">-- Ø¨Ø¯ÙˆÙ† ØªØ´Ø·ÙŠØ¨ --</MenuItem>
                    {finishes.map(finish => (
                      <MenuItem key={finish.id} value={finish.id}>
                        {finish.name_ar} ({finish.name_en})
                      </MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="Ø§Ù„Ø·ÙˆÙ„ (Ù…Ù…)"
                    value={remnantForm.length_mm}
                    onChange={(e) => {
                      setRemnantForm({ ...remnantForm, length_mm: e.target.value });
                      if (remnantErrors.length_mm) {
                        setRemnantErrors({ ...remnantErrors, length_mm: null });
                      }
                    }}
                    name="length_mm"
                    type="number"
                    required
                    error={remnantErrors.length_mm}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ù…)"
                    value={remnantForm.width_mm}
                    onChange={(e) => {
                      setRemnantForm({ ...remnantForm, width_mm: e.target.value });
                      if (remnantErrors.width_mm) {
                        setRemnantErrors({ ...remnantErrors, width_mm: null });
                      }
                    }}
                    name="width_mm"
                    type="number"
                    required
                    error={remnantErrors.width_mm}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="Ø§Ù„Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
                    value={remnantForm.thickness_mm}
                    onChange={(e) => {
                      setRemnantForm({ ...remnantForm, thickness_mm: e.target.value });
                      if (remnantErrors.thickness_mm) {
                        setRemnantErrors({ ...remnantErrors, thickness_mm: null });
                      }
                    }}
                    name="thickness_mm"
                    type="number"
                    required
                    error={remnantErrors.thickness_mm}
                    inputProps={{ step: 0.1, min: 0.1 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <UnifiedFormField
                    label="Ø§Ù„ÙˆØ²Ù† Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø© (ÙƒØº)"
                    value={remnantForm.weight_per_sheet_kg}
                    onChange={(e) => setRemnantForm({ ...remnantForm, weight_per_sheet_kg: e.target.value })}
                    name="weight_per_sheet_kg"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                  />
                </Grid>

                {remnantForm.piece_source === 'from_sheet_cutting' && (
                  <Grid item xs={12}>
                    <UnifiedFormField
                      label="Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…"
                      value={remnantForm.parent_sheet_id || ''}
                      onChange={(e) => setRemnantForm({ ...remnantForm, parent_sheet_id: e.target.value || null })}
                      name="parent_sheet_id"
                      select
                      required
                      error={remnantErrors.parent_sheet_id}
                      helperText="Ø§Ø®ØªØ± Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„ØªÙŠ ØªÙ… Ù‚ØµÙ‡Ø§"
                    >
                      <MenuItem value="">-- Ø§Ø®ØªØ± Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù… --</MenuItem>
                      {sheets.map(sheet => (
                        <MenuItem key={sheet.id} value={sheet.id}>
                          {sheet.code} - {sheet.metal_name}
                        </MenuItem>
                      ))}
                    </UnifiedFormField>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Batch Info Accordion */}
          <Accordion defaultExpanded sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={700}>
                <LocalShippingIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¯ÙØ¹Ø©
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„Ù…ÙˆØ±Ø¯"
                    value={remnantBatchForm.supplier_id}
                    onChange={(e) => setRemnantBatchForm({ ...remnantBatchForm, supplier_id: e.target.value })}
                    name="supplier_id"
                    select
                    disabled={remnantForm.piece_source === 'company_stock'}
                  >
                    <MenuItem value="">Ø¨Ø¯ÙˆÙ† Ù…ÙˆØ±Ø¯</MenuItem>
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ÙƒÙ…ÙŠØ©"
                    value={remnantBatchForm.quantity}
                    onChange={(e) => {
                      setRemnantBatchForm({ ...remnantBatchForm, quantity: e.target.value });
                      if (remnantBatchErrors.quantity) {
                        setRemnantBatchErrors({ ...remnantBatchErrors, quantity: null });
                      }
                    }}
                    name="quantity"
                    type="number"
                    required
                    error={remnantBatchErrors.quantity}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <WeightPriceEntry
                    mode="price"
                    pricingMode={remnantBatchForm.pricing_mode}
                    label="Ø§Ù„ØªØ³Ø¹ÙŠØ±"
                    pricePerKg={remnantBatchForm.price_per_kg || ''}
                    pricePerPiece=""
                    totalCost={remnantBatchForm.total_cost || ''}
                    quantity={remnantBatchForm.quantity || ''}
                    weight={effBatchWeight(
                      remnantBatchForm.quantity,
                      remnantForm.weight_per_sheet_kg,
                      remnantBatchForm.batch_weight_kg
                    )}
                    onChange={(field, value) => {
                      if (field === 'pricing_mode') {
                        setRemnantBatchForm({ ...remnantBatchForm, pricing_mode: value });
                      } else if (field === 'price_per_kg') {
                        setRemnantBatchForm({ ...remnantBatchForm, price_per_kg: value });
                      } else if (field === 'total_cost') {
                        setRemnantBatchForm({ ...remnantBatchForm, total_cost: value });
                      }
                    }}
                    currencySymbol={baseCurrencyInfo.symbol}
                    showBatchPrice={true}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù„Ù„Ø¯ÙØ¹Ø© (ÙƒØº)"
                    value={remnantBatchForm.batch_weight_kg}
                    onChange={(e) => setRemnantBatchForm({ ...remnantBatchForm, batch_weight_kg: e.target.value })}
                    name="batch_weight_kg"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
                    value={remnantBatchForm.received_date}
                    onChange={(e) => setRemnantBatchForm({ ...remnantBatchForm, received_date: e.target.value })}
                    name="received_date"
                    type="date"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="Ù…ÙˆÙ‚Ø¹ Ø§Ù„ØªØ®Ø²ÙŠÙ†"
                    value={remnantBatchForm.storage_location}
                    onChange={(e) => setRemnantBatchForm({ ...remnantBatchForm, storage_location: e.target.value })}
                    name="storage_location"
                  />
                </Grid>

                <Grid item xs={12}>
                  <UnifiedFormField
                    label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª"
                    value={remnantBatchForm.notes}
                    onChange={(e) => setRemnantBatchForm({ ...remnantBatchForm, notes: e.target.value })}
                    name="notes"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </UnifiedFormDialog>

      {/* Dialog: Batches (view + add) */}
      <UnifiedFormDialog
        open={openBatchesDialog}
        onClose={() => setOpenBatchesDialog(false)}
        onSubmit={() => setOpenBatchesDialog(false)}
        title={`Ø§Ù„Ø¯ÙØ¹Ø§Øª - ${selectedSheet?.code}`}
        subtitle={`${selectedSheet?.metal_name} | ${selectedSheet?.length_mm}Ã—${selectedSheet?.width_mm} | ${selectedSheet?.thickness_mm} Ù…Ù…`}
        submitText="Ø¥ØºÙ„Ø§Ù‚"
        cancelText=""
        maxWidth="lg"
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddBoxIcon fontSize="small" /> Ø¥Ø¶Ø§ÙØ© Ø¯ÙØ¹Ø© Ù„Ù„ØµÙÙŠØ­Ø©
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <UnifiedFormField
                label="Ø§Ù„Ù…ÙˆØ±Ø¯"
                value={existingBatchForm.supplier_id}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, supplier_id: e.target.value })}
                name="supplier_id"
                select
                helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
              >
                <MenuItem value="">Ø¨Ø¯ÙˆÙ† Ù…ÙˆØ±Ø¯</MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                ))}
              </UnifiedFormField>
            </Grid>
            <Grid item xs={12} md={4}>
              <UnifiedFormField
                label="Ø§Ù„ÙƒÙ…ÙŠØ©"
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
                label="Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„ØªØ³Ø¹ÙŠØ±"
                value={existingBatchForm.pricing_mode}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, pricing_mode: e.target.value })}
                name="pricing_mode"
                select
              >
                <MenuItem value="per_kg">Ø¨Ø§Ù„ÙƒÙŠÙ„Ùˆ (price/kg)</MenuItem>
                <MenuItem value="per_batch">Ø¨Ø§Ù„Ø¯ÙØ¹Ø© (total cost)</MenuItem>
              </UnifiedFormField>
            </Grid>

            <Grid item xs={12} md={6}>
              <UnifiedFormField
                label="Ø§Ù„ÙˆØ²Ù† Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø© (ÙƒØº)"
                value={existingBatchForm.batch_weight_kg}
                onChange={(e) => setExistingBatchForm({ ...existingBatchForm, batch_weight_kg: e.target.value })}
                name="batch_weight_kg"
                type="number"
                required
                error={batchErrors.batch_weight_kg}
                helperText="Ø§Ù„ÙˆØ²Ù† Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø© ÙˆØ§Ø­Ø¯Ø©"
                inputProps={{ step: 0.001, min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ (ÙƒØº)"
                value={
                  existingBatchForm.quantity && existingBatchForm.batch_weight_kg
                    ? (Number(existingBatchForm.quantity) * Number(existingBatchForm.batch_weight_kg)).toFixed(3)
                    : ''
                }
                disabled
                helperText="ÙŠÙØ­Ø³Ø¨ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹: Ø§Ù„ÙƒÙ…ÙŠØ© Ã— Ø§Ù„ÙˆØ²Ù† Ù„ÙƒÙ„ Ù‚Ø·Ø¹Ø©"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {existingBatchForm.pricing_mode === 'per_kg' ? (
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="Ø§Ù„Ø³Ø¹Ø± Ù„ÙƒÙ„ ÙƒÙŠÙ„Ùˆ"
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
                  label="Ø§Ù„ØªÙƒÙ„ÙØ© Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠØ©"
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
                label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
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
                    Ø§Ù„Ø¯ÙØ¹ Ù„Ù„Ù…ÙˆØ±Ø¯
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <UnifiedFormField
                    label="Ù†ÙˆØ¹ Ø§Ù„Ø¯ÙØ¹"
                    value={existingBatchForm.payment_type}
                    onChange={(e) => setExistingBatchForm({ ...existingBatchForm, payment_type: e.target.value })}
                    name="payment_type"
                    select
                  >
                    <MenuItem value="later">Ø§Ù„Ø¯ÙØ¹ Ù„Ø§Ø­Ù‚Ø§Ù‹</MenuItem>
                    <MenuItem value="full">Ø¯ÙØ¹ ÙƒØ§Ù…Ù„</MenuItem>
                    <MenuItem value="partial">Ø¯ÙØ¹ Ø¬Ø²Ø¦ÙŠ</MenuItem>
                  </UnifiedFormField>
                </Grid>

                {existingBatchForm.payment_type === 'partial' && (
                  <Grid item xs={12} md={4}>
                    <UnifiedFormField
                      label="Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø¯ÙÙˆØ¹"
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
                      label="Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹"
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
                    Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ù…ÙØ³ØªØ®Ø¯Ù… Ù„Ù„Ø­Ø³Ø§Ø¨: <b>{p.weight_used ? fmt(p.weight_used) : 'ØºÙŠØ± Ù…ÙØ­Ø¯Ø¯'} ÙƒØº</b> â€”{' '}
                    {existingBatchForm.pricing_mode === 'per_kg' ? (
                      <>
                        Ø§Ù„ØªÙƒÙ„ÙØ© Ø§Ù„Ù…ØªÙˆÙ‚Ø¹Ø©: <b>{p.total_cost != null ? fmt(p.total_cost) : 'â€”'} {baseCurrencyInfo.symbol}</b>
                      </>
                    ) : (
                      <>
                        Ø§Ù„Ø³Ø¹Ø±/ÙƒØº Ø§Ù„Ù…ØªÙˆÙ‚Ø¹: <b>{p.price_per_kg != null ? fmt(p.price_per_kg) : 'â€”'} {baseCurrencyInfo.symbol}</b>
                      </>
                    )}
                  </Typography>
                );
              })()}
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" size="large" startIcon={<AddBoxIcon />} onClick={handleBatchFormSubmit}>
                Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¯ÙØ¹Ø©
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Ø§Ù„Ø¯ÙØ¹Ø§Øª Ø§Ù„Ù…ØªØ§Ø­Ø©
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteSheet}
          >
            Ø­Ø°Ù Ø§Ù„ØµÙÙŠØ­Ø©
          </Button>
        </Box>

        {batches.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '1rem' }}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¯ÙØ¹Ø§Øª Ù…ØªØ§Ø­Ø©</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù…ÙˆØ±Ø¯</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ø£ØµÙ„ÙŠØ©</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ø¹Ø±/ÙƒØº</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ØªØ§Ø±ÙŠØ®</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell onClick={() => handleViewBatch(batch)}>
                      <Typography fontSize="0.9375rem">{batch.supplier_name || 'Ø¨Ø¯ÙˆÙ† Ù…ÙˆØ±Ø¯'}</Typography>
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
                        {batch.price_per_kg ? `${fmt(batch.price_per_kg)} ${baseCurrencyInfo.symbol}` : 'â€”'}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => handleViewBatch(batch)}>
                      <Typography fontSize="0.9375rem">{batch.received_date}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ø¹Ø±Ø¶ Ø§Ù„ØªÙØ§ØµÙŠÙ„">
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
        title={isEditingBatch ? 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹Ø©' : 'ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¯ÙØ¹Ø©'}
        submitText={isEditingBatch ? 'Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª' : 'Ø¥ØºÙ„Ø§Ù‚'}
        cancelText={isEditingBatch ? 'Ø¥Ù„ØºØ§Ø¡' : ''}
        loading={loading}
        maxWidth="sm"
        allowBackdropClose={false}
        allowEscapeClose={false}
      >
        <Box sx={{ mb: 2 }}>
          {!isEditingBatch ? (
            // View Mode
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø§Ù„Ù…ÙˆØ±Ø¯</Typography>
                <Typography variant="body1" fontWeight={600} fontSize="1rem">
                  {selectedBatch?.supplier_name || 'Ø¨Ø¯ÙˆÙ† Ù…ÙˆØ±Ø¯'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ø£ØµÙ„ÙŠØ©</Typography>
                <Typography variant="body1" fontWeight={600} fontSize="1rem">
                  {selectedBatch?.quantity_original || 0}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ©</Typography>
                <Chip
                  label={selectedBatch?.quantity_remaining || 0}
                  color={getStockColor(selectedBatch?.quantity_remaining || 0)}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø§Ù„Ø³Ø¹Ø± Ù„ÙƒÙ„ ÙƒÙŠÙ„Ùˆ</Typography>
                <Typography variant="body1" fontWeight={600} fontSize="1rem">
                  {selectedBatch?.price_per_kg
                    ? `${fmt(selectedBatch.price_per_kg)} ${baseCurrencyInfo.symbol}`
                    : 'â€”'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø§Ù„ØªÙƒÙ„ÙØ© Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠØ©</Typography>
                <Typography variant="body1" fontWeight={600} fontSize="1rem">
                  {selectedBatch?.total_cost
                    ? `${fmt(selectedBatch.total_cost)} ${baseCurrencyInfo.symbol}`
                    : 'â€”'}
                </Typography>
              </Grid>

              {selectedSheet?.weight_per_sheet_kg && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1rem">
                    {fmt(selectedBatch?.quantity_original * selectedSheet.weight_per_sheet_kg)} ÙƒØº
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…</Typography>
                <Typography variant="body1" fontWeight={600} fontSize="1rem">
                  {selectedBatch?.received_date || 'â€”'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ù…ÙˆÙ‚Ø¹ Ø§Ù„ØªØ®Ø²ÙŠÙ†</Typography>
                <Typography variant="body1" fontWeight={600} fontSize="1rem">
                  {selectedBatch?.storage_location || 'â€”'}
                </Typography>
              </Grid>

              {selectedBatch?.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ù…Ù„Ø§Ø­Ø¸Ø§Øª</Typography>
                  <Typography variant="body1" fontSize="1rem">
                    {safeNotes(selectedBatch.notes)}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {selectedBatch && (

                <>

                  <Grid item xs={6}>

                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø£Ø¶ÙŠÙ Ø¨ÙˆØ§Ø³Ø·Ø©</Typography>

                    <Typography variant="body1" fontWeight={600} fontSize="0.9375rem">

                      {displayCreatedBy(selectedBatch.created_by)}

                    </Typography>

                  </Grid>

                  <Grid item xs={6}>

                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ« Ø¨ÙˆØ§Ø³Ø·Ø©</Typography>

                    <Typography variant="body1" fontWeight={600} fontSize="0.9375rem">

                      {displayUpdatedBy(selectedBatch.updated_by, selectedBatch.created_by)}

                    </Typography>

                  </Grid>

                </>

              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />

                {/* Print Buttons */}
                <Box sx={{ mb: 2 }}>
                  <PrintButtons
                    onPrint={handlePrintBatch}
                    onPDF={handleExportBatchPDF}
                    isPrinting={isPrinting}
                    variant="outlined"
                    size="medium"
                  />
                </Box>

                {/* Edit/Delete Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<EditIcon />}
                    onClick={handleEditBatch}
                    fullWidth
                  >
                    ØªØ¹Ø¯ÙŠÙ„
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="medium"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteBatch}
                    fullWidth
                  >
                    Ø­Ø°Ù
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            // Edit Mode
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ fontSize: '0.9375rem' }}>
                  ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ø£ØµÙ„ÙŠØ© Ù„Ù† ÙŠØ¤Ø«Ø± Ø¹Ù„Ù‰ Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ©. Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ© ØªØªØºÙŠØ± ÙÙ‚Ø· Ù…Ù† Ø®Ù„Ø§Ù„ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ø£ØµÙ„ÙŠØ©"
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
                  label="Ø§Ù„Ø³Ø¹Ø± Ù„ÙƒÙ„ ÙƒÙŠÙ„Ùˆ"
                  value={editBatchForm.price_per_kg}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, price_per_kg: e.target.value })}
                  name="price_per_kg"
                  type="number"
                  helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
                  value={editBatchForm.received_date}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, received_date: e.target.value })}
                  name="received_date"
                  type="date"
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="Ù…ÙˆÙ‚Ø¹ Ø§Ù„ØªØ®Ø²ÙŠÙ†"
                  value={editBatchForm.storage_location}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, storage_location: e.target.value })}
                  name="storage_location"
                  helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                />
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª"
                  value={editBatchForm.notes}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, notes: e.target.value })}
                  name="notes"
                  multiline
                  rows={3}
                  helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </UnifiedFormDialog>

      {/* Print Confirmation Dialog */}
      <PrintConfirmDialog
        open={showPrintDialog}
        onClose={cancelPrint}
        onConfirm={executePrint}
        title="ØªØ£ÙƒÙŠØ¯ Ø·Ø¨Ø§Ø¹Ø© ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¯ÙØ¹Ø©"
        documentName={pendingDocument?.metadata?.name || 'Ø§Ù„Ø¯ÙØ¹Ø©'}
        documentType={pendingDocument?.metadata?.type || 'ØªÙØ§ØµÙŠÙ„ Ø¯ÙØ¹Ø©'}
        estimatedPages={pendingDocument?.metadata?.estimatedPages || 1}
        defaultAction={pendingDocument?.metadata?.defaultAction || 'print'}
      />

      {/* Confirmation Dialog */}
      <UnifiedDialog
        open={confirmDialog.open}
        onClose={closeConfirm}
        variant={confirmationDialogConfig.variant}
        title={confirmationDialogConfig.title}
        description={confirmationDialogConfig.description}
        primaryAction={{
          label: confirmationDialogConfig.primaryLabel,
          color: confirmationDialogConfig.primaryColor,
          loading,
          onClick: async () => {
            if (confirmDialog.action) {
              await confirmDialog.action();
            }
            closeConfirm();
          }
        }}
        secondaryAction={{
          label: confirmationDialogConfig.secondaryLabel,
          onClick: closeConfirm
        }}
        allowBackdropClose={confirmationDialogConfig.allowBackdropClose}
        allowEscapeClose={confirmationDialogConfig.allowEscapeClose}
        requireAcknowledgement={confirmationDialogConfig.requireAcknowledgement}
        acknowledgementLabel={confirmationDialogConfig.acknowledgementLabel}
      />
    </Box>
  );
}
