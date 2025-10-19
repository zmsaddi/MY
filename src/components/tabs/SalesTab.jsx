// src/components/tabs/SalesTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, InputAdornment, Divider,
  Stepper, Step, StepLabel, Autocomplete,
  FormLabel, RadioGroup, Radio, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import CalculateIcon from '@mui/icons-material/Calculate';

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedConfirmDialog from '../common/dialogs/UnifiedConfirmDialog';
import PrintConfirmDialog from '../common/print/PrintConfirmDialog';
import PrintButtons from '../common/print/PrintButtons';
import { confirmationMessages } from '../../theme/designSystem';

import { usePrint } from '../../hooks/usePrint';
import { generateInvoicePDF } from '../../utils/pdf/templates/invoicePDF';

import {
  getAllSales, getSaleById, processSale, generateInvoiceNumber, deleteSale,
  getCustomers, getAllSheets, getServiceTypes, getPaymentMethodsForUI,
  getCompanyProfile, getBaseCurrencyInfo, getCurrencies, addSheetWithBatch,
  calculateWeightFromCm2
} from '../../utils/database';
import { safeText, safeNotes, safeDescription } from '../../utils/displayHelpers';

// Import new components
import { SalesTable, SaleItemsForm, RemnantCreationDialog } from '../sales';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const STEPS = ['معلومات الفاتورة', 'الأصناف', 'الإجماليات والدفع'];

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

  // Form - totals (store as strings to allow decimal point input)
  const [discount, setDiscount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
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
  const [lastPriceFieldModified, setLastPriceFieldModified] = useState(null); // Track which price field user last modified
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
  const [errors, setErrors] = useState({});
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

  // Expand detail
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate weight for cut_from_sheet sales based on weight_per_cm2
  useEffect(() => {
    if (
      saleType === 'cut_from_sheet' &&
      selectedSheet?.weight_per_cm2 &&
      soldDimensions.length &&
      soldDimensions.width
    ) {
      const calculatedWeight = calculateWeightFromCm2(
        selectedSheet.weight_per_cm2,
        Number(soldDimensions.length),
        Number(soldDimensions.width)
      );

      if (calculatedWeight > 0) {
        setSoldWeight(calculatedWeight.toFixed(3));
      }
    }
  }, [saleType, selectedSheet, soldDimensions.length, soldDimensions.width]);

  // Auto-calculate weight for remnant sales (both full and cut) based on weight_per_cm2
  useEffect(() => {
    if (
      saleType === 'remnant_from_stock' &&
      selectedRemnant?.weight_per_cm2 &&
      soldDimensions.length &&
      soldDimensions.width
    ) {
      const calculatedWeight = calculateWeightFromCm2(
        selectedRemnant.weight_per_cm2,
        Number(soldDimensions.length),
        Number(soldDimensions.width)
      );

      if (calculatedWeight > 0) {
        setSoldWeight(calculatedWeight.toFixed(3));
      }
    }
  }, [saleType, selectedRemnant, soldDimensions.length, soldDimensions.width]);

  // Auto-calculate price based on which field user last modified (for cut_from_sheet and remnant_from_stock)
  useEffect(() => {
    // Only apply to cut_from_sheet and remnant_from_stock
    if (saleType !== 'cut_from_sheet' && saleType !== 'remnant_from_stock') return;

    const pricePerKg = parseFloat(itemPricePerKg);
    const pricePerPiece = parseFloat(itemPrice);
    const weight = parseFloat(soldWeight);

    if (weight <= 0) return; // Need weight for calculation

    // If user last modified price per kg, calculate price per piece
    if (lastPriceFieldModified === 'pricePerKg' && pricePerKg > 0) {
      const calculatedPricePerPiece = pricePerKg * weight;
      setItemPrice(calculatedPricePerPiece.toFixed(2));
    }
    // If user last modified price per piece, calculate price per kg
    else if (lastPriceFieldModified === 'pricePerPiece' && pricePerPiece > 0) {
      const calculatedPricePerKg = pricePerPiece / weight;
      setItemPricePerKg(calculatedPricePerKg.toFixed(2));
    }
  }, [itemPricePerKg, itemPrice, soldWeight, saleType, lastPriceFieldModified]);

  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

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
  // Validation
  const validateSaleForm = () => {
    const newErrors = {};

    // Step 0: Basic info validation
    if (!customerId) {
      newErrors.customer_id = 'يجب اختيار زبون';
    }

    if (!saleDate) {
      newErrors.sale_date = 'تاريخ البيع مطلوب';
    }

    // Step 1: Items validation
    if (items.length === 0) {
      newErrors.items = 'يجب إضافة صنف واحد على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    setDiscount('');
    setAmountPaid('');
    setPaymentMethod(profile?.default_payment_method || '');
    setActiveStep(0);
    setError('');
    setErrors({});
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setActiveStep(0);
  };

  const handleNext = () => {
    const newErrors = {};

    if (activeStep === 0 && !customerId) {
      newErrors.customer_id = 'يجب اختيار زبون';
      setErrors(newErrors);
      return;
    }
    if (activeStep === 1 && items.length === 0) {
      newErrors.items = 'يجب إضافة صنف واحد على الأقل';
      setErrors(newErrors);
      setError('يجب إضافة صنف واحد على الأقل');
      return;
    }
    setError('');
    setErrors({});
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
    setLastPriceFieldModified(null); // Reset price field tracking
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

        // Calculate already added quantity for this sheet in current cart
        const alreadyInCart = items
          .filter(item => item.sheet_id === selectedSheet.id)
          .reduce((sum, item) => sum + (item.quantity || 0), 0);

        const availableQty = selectedSheet.total_quantity - alreadyInCart;
        if (qty > availableQty) {
          return setError(`الكمية المتاحة ${availableQty} (تم إضافة ${alreadyInCart} مسبقاً في السلة)`);
        }

        const price = parseFloat(itemPrice);
        if (!price || price <= 0) return setError('السعر يجب أن تكون أكبر من صفر');

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

        // Calculate already added quantity for this remnant in current cart
        const alreadyInCart = items
          .filter(item => item.sheet_id === selectedRemnant.id)
          .reduce((sum, item) => sum + (item.quantity || 0), 0);

        const availableQty = selectedRemnant.total_quantity - alreadyInCart;
        if (qty > availableQty) {
          return setError(`الكمية المتاحة ${availableQty} (تم إضافة ${alreadyInCart} مسبقاً في السلة)`);
        }

        const price = parseFloat(itemPrice);
        const pricePerKg = parseFloat(itemPricePerKg);

        if (!price && !pricePerKg) {
          return setError('يجب إدخال السعر (إما سعر القطعة أو سعر الكيلو)');
        }

        const weight = parseFloat(soldWeight) || 0;

        // If using price per kg, weight is required
        if (!price && pricePerKg && weight <= 0) {
          return setError('إذا أدخلت السعر بالكيلو، يجب إدخال الوزن أو سيتم حسابه تلقائياً');
        }

        // Determine dimensions string based on sale type (full or cut)
        let dimString;
        if (soldDimensions.isCutFromRemnant === 'cut' && soldDimensions.length && soldDimensions.width) {
          dimString = `${soldDimensions.length}×${soldDimensions.width}×${soldDimensions.thickness}`;
        } else {
          dimString = `${selectedRemnant.length_mm}×${selectedRemnant.width_mm}×${selectedRemnant.thickness_mm}`;
        }

        // Calculate final unit price
        let finalUnitPrice = price;
        if (!finalUnitPrice && pricePerKg && weight > 0) {
          finalUnitPrice = pricePerKg * weight;
        }

        // Final validation: ensure we have a valid price
        if (!finalUnitPrice || finalUnitPrice <= 0) {
          return setError('السعر المحسوب غير صحيح. يرجى التحقق من البيانات');
        }

        setItems((prev) => [
          ...prev,
          {
            item_type: 'material',
            sale_type: 'remnant_from_stock',
            sheet_id: selectedRemnant.id,
            code: selectedRemnant.code,
            metal_name: selectedRemnant.metal_name,
            dimensions: dimString,
            sold_dimensions: dimString,
            sold_weight: weight,
            is_custom_size: soldDimensions.isCutFromRemnant === 'cut', // True if cutting from remnant
            quantity: qty,
            unit_price: finalUnitPrice,
            total: qty * finalUnitPrice
          }
        ]);

        // If cutting from remnant (not selling full), ask user if they want to add leftover pieces
        if (soldDimensions.isCutFromRemnant === 'cut') {
          // Store sale data for remnant dialog (with all required metadata)
          setCurrentSaleData({
            sheetId: selectedRemnant.id,
            sheetCode: selectedRemnant.code,
            metalTypeId: selectedRemnant.metal_type_id,
            gradeId: selectedRemnant.grade_id,
            finishId: selectedRemnant.finish_id,
            thickness: soldDimensions.thickness,
            soldDimensions: dimString,
            weight_per_cm2: selectedRemnant.weight_per_cm2, // For remnant weight calculation
            originalPrice: selectedRemnant.min_price, // Inherit price for remnant costing
            isFromRemnant: true, // Flag to indicate parent is a remnant
            parentRemnantDimensions: `${selectedRemnant.length_mm}×${selectedRemnant.width_mm}×${selectedRemnant.thickness_mm}`
          });

          // Initialize remnant pieces array with default piece
          setRemnantPieces([{
            id: Date.now(),
            length: '',
            width: '',
            thickness: soldDimensions.thickness,
            quantity: '1'
          }]);

          // Show remnant dialog
          setShowRemnantDialog(true);
        }
      }
      // Cut from Sheet Sale
      else if (saleType === 'cut_from_sheet') {
        if (!selectedSheet) return setError('يجب اختيار الصفيحة الأم');
        if (!soldDimensions.length || !soldDimensions.width || !soldDimensions.thickness) {
          return setError('يجب إدخال جميع الأبعاد');
        }
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('الكمية يجب أن تكون أكبر من صفر');

        // Calculate already added quantity for this sheet in current cart
        const alreadyInCart = items
          .filter(item => item.sheet_id === selectedSheet.id)
          .reduce((sum, item) => sum + (item.quantity || 0), 0);

        const availableQty = selectedSheet.total_quantity - alreadyInCart;
        if (qty > availableQty) {
          return setError(`الكمية المتاحة ${availableQty} (تم إضافة ${alreadyInCart} مسبقاً في السلة)`);
        }

        const price = parseFloat(itemPrice);
        const pricePerKg = parseFloat(itemPricePerKg);

        if (!price && !pricePerKg) {
          return setError('يجب إدخال السعر (إما سعر القطعة أو سعر الكيلو)');
        }

        const weight = parseFloat(soldWeight) || 0;

        // If using price per kg, weight is required
        if (!price && pricePerKg && weight <= 0) {
          return setError('إذا أدخلت السعر بالكيلو، يجب إدخال الوزن أو سيتم حسابه تلقائياً');
        }

        const dimString = `${soldDimensions.length}×${soldDimensions.width}×${soldDimensions.thickness}`;

        // Calculate final unit price
        let finalUnitPrice = price;
        if (!finalUnitPrice && pricePerKg && weight > 0) {
          finalUnitPrice = pricePerKg * weight;
        }

        // Final validation: ensure we have a valid price
        if (!finalUnitPrice || finalUnitPrice <= 0) {
          return setError('السعر المحسوب غير صحيح. يرجى التحقق من البيانات');
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

        // Store sale data for remnant dialog (with all required metadata)
        setCurrentSaleData({
          sheetId: selectedSheet.id,
          sheetCode: selectedSheet.code,
          metalTypeId: selectedSheet.metal_type_id,
          gradeId: selectedSheet.grade_id,
          finishId: selectedSheet.finish_id,
          thickness: soldDimensions.thickness,
          soldDimensions: dimString,
          weight_per_cm2: selectedSheet.weight_per_cm2, // For remnant weight calculation
          originalPrice: selectedSheet.min_price // Inherit price for remnant costing
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
    const taxable = subtotal - (parseFloat(discount) || 0);
    return (taxable * ((profile.vat_rate || 0) / 100));
  }, [subtotal, discount, profile]);
  const totalAmount = useMemo(() => subtotal - (parseFloat(discount) || 0) + taxAmount, [subtotal, discount, taxAmount]);
  const remaining = useMemo(() => totalAmount - (parseFloat(amountPaid) || 0), [totalAmount, amountPaid]);

  // Get currency symbol for display
  const getCurrencySymbol = (code) => {
    if (code === baseCurrencyInfo.code) return baseCurrencyInfo.symbol;
    const curr = currencies.find(c => c.code === code);
    return curr?.symbol || code;
  };

  // ─────────────────────────────────────────────────────────────
  // Submit
  const handleActualSaveSale = async () => {
    if (!validateSaleForm()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        invoice_number: invoiceNumber,
        customer_id: customerId,
        sale_date: saleDate,
        currency_code: saleCurrency,
        discount: parseFloat(discount) || 0,
        amount_paid: parseFloat(amountPaid) || 0,
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
        setSuccess(`تم إنشاء الفاتورة ${result.invoice_number} بنجاح`);
        setTimeout(() => setSuccess(''), 3000);
        handleCloseCreateDialog();
        loadData();
        closeConfirm();

        // Check if there were any cut_from_sheet items
        const hasCutFromSheet = items.some(it => it.sale_type === 'cut_from_sheet');
        if (hasCutFromSheet && currentSaleData) {
          // Store sale ID for remnant creation
          setCurrentSaleData(prev => ({ ...prev, saleId: result.saleId }));

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
        closeConfirm();
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
      closeConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSale = () => {
    if (items.length === 0) {
      setError('يجب إضافة صنف واحد على الأقل');
      return;
    }
    openConfirm('save', null, handleActualSaveSale);
  };

  // ─────────────────────────────────────────────────────────────
  // View / Delete
  const handleViewSale = (saleId) => {
    const sale = getSaleById(saleId);
    setSelectedSale(sale);
    setOpenViewDialog(true);
  };

  const handleActualDeleteSale = async (saleId) => {
    setLoading(true);
    try {
      const result = deleteSale(saleId);
      if (result.success) {
        setSuccess('تم حذف الفاتورة بنجاح');
        setTimeout(() => setSuccess(''), 2500);
        loadData();
      } else {
        setError('فشل الحذف: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = (saleId) => {
    openConfirm('deleteSale', saleId, () => handleActualDeleteSale(saleId));
  };

  const getPaymentStatusColor = (status) =>
    status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'error';
  const getPaymentStatusLabel = (status) =>
    status === 'paid' ? 'مدفوعة' : status === 'partial' ? 'جزئية' : 'غير مدفوعة';

  const getPriceColor = (price, minPrice) => {
    if (!price || !minPrice) return 'inherit';
    if (price < minPrice) return 'error.main';
    return 'success.main';
  };

  // Print handlers
  const handlePrintInvoice = () => {
    if (!selectedSale) return;

    const docDefinition = generateInvoicePDF(
      {
        ...selectedSale,
        currency_symbol: baseCurrencyInfo.symbol
      },
      {
        orientation: 'portrait',
        includeLogo: true,
        margins: 'normal'
      }
    );

    requestPrint(docDefinition, {
      name: `فاتورة ${selectedSale.invoice_number}`,
      type: 'فاتورة بيع',
      estimatedPages: 1,
      defaultAction: 'print'
    });
  };

  const handleExportInvoicePDF = () => {
    if (!selectedSale) return;

    const docDefinition = generateInvoicePDF(
      {
        ...selectedSale,
        currency_symbol: baseCurrencyInfo.symbol
      },
      {
        orientation: 'portrait',
        includeLogo: true,
        margins: 'normal'
      }
    );

    requestPrint(docDefinition, {
      name: `فاتورة ${selectedSale.invoice_number}`,
      type: 'فاتورة بيع',
      estimatedPages: 1,
      defaultAction: 'pdf'
    });
  };

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
      <SalesTable
        sales={sales}
        baseCurrencyInfo={baseCurrencyInfo}
        expandedSale={expandedSale}
        onToggleExpand={(saleId) => setExpandedSale(expandedSale === saleId ? null : saleId)}
        onViewSale={handleViewSale}
        onDeleteSale={handleDeleteSale}
      />

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
            <Typography component="span" variant="h5" fontWeight={700}>
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
                <UnifiedFormField
                  label="رقم الفاتورة"
                  name="invoice_number"
                  value={invoiceNumber}
                  onChange={() => {}} // No-op for read-only field
                  InputProps={{ readOnly: true }}
                  helperText="يتم توليده تلقائياً"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="تاريخ البيع"
                  type="date"
                  value={saleDate}
                  onChange={(e) => {
                    setSaleDate(e.target.value);
                    if (errors.sale_date) {
                      setErrors({ ...errors, sale_date: null });
                    }
                  }}
                  name="sale_date"
                  required
                  error={errors.sale_date}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(c) => c.name}
                  value={customers.find((c) => c.id === customerId) || null}
                  onChange={(_e, val) => {
                    setCustomerId(val?.id || null);
                    if (errors.customer_id) {
                      setErrors({ ...errors, customer_id: null });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="الزبون"
                      required
                      error={!!errors.customer_id}
                      helperText={errors.customer_id || ''}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="عملة الفاتورة"
                  value={saleCurrency}
                  onChange={(e) => setSaleCurrency(e.target.value)}
                  name="currency"
                  select
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  required
                >
                  {currencies.map((curr) => (
                    <option key={curr.id} value={curr.code}>
                      {curr.name_ar} ({curr.code}) - {curr.symbol}
                    </option>
                  ))}
                </UnifiedFormField>
              </Grid>

              <Grid item xs={12}>
                <UnifiedFormField
                  label="ملاحظات"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  name="notes"
                  multiline
                  rows={2}
                  helperText="اختياري"
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
                    <UnifiedFormField
                      label="نوع الصنف"
                      value={itemType}
                      onChange={(e) => {
                        setItemType(e.target.value);
                        resetItemForm();
                      }}
                      name="item_type"
                      select
                      SelectProps={{ native: true }}
                      InputLabelProps={{ shrink: true }}
                    >
                      <option value="material">معدن من المخزون</option>
                      <option value="service">خدمة</option>
                    </UnifiedFormField>
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
                              renderInput={(params) => <TextField {...params} label="اختر الصفيحة" required />}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="الكمية"
                              type="number"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              name="quantity"
                              required
                              inputProps={{ min: 1 }}
                              helperText={selectedSheet ? `المتاح: ${selectedSheet.total_quantity}` : ' '}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="السعر/قطعة"
                              type="number"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              name="price"
                              required
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: { color: selectedSheet?.min_price ? getPriceColor(parseFloat(itemPrice), selectedSheet.min_price) : 'inherit' }
                              }}
                            />
                          </Grid>
                        </>
                      )}

                      {/* Remnant from Stock Sale */}
                      {saleType === 'remnant_from_stock' && (
                        <>
                          {selectedRemnant && !selectedRemnant.weight_per_cm2 && (
                            <Grid item xs={12}>
                              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                                ℹ️ لا يوجد حساب تلقائي للوزن لهذه البقية. يرجى إدخال الوزن يدوياً.
                              </Alert>
                            </Grid>
                          )}
                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              options={remnants}
                              getOptionLabel={(r) => `${r.code} - ${r.metal_name} - ${r.length_mm}×${r.width_mm}×${r.thickness_mm} (${r.total_quantity})`}
                              value={selectedRemnant}
                              onChange={(_e, val) => {
                                setSelectedRemnant(val);
                                // Auto-fill thickness from remnant (thickness cannot be changed)
                                if (val) {
                                  console.log('📏 Auto-filling thickness from remnant:', val.thickness_mm);
                                  setSoldDimensions({ length: '', width: '', thickness: val.thickness_mm });
                                } else {
                                  setSoldDimensions({ length: '', width: '', thickness: '' });
                                }
                                setSoldWeight('');
                              }}
                              renderInput={(params) => <TextField {...params} label="اختر البقية" required />}
                            />
                          </Grid>

                          {/* Remnant sale type selection */}
                          <Grid item xs={12} md={6}>
                            <FormLabel>نوع البيع</FormLabel>
                            <RadioGroup
                              row
                              value={soldDimensions.isCutFromRemnant || 'full'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'full' && selectedRemnant) {
                                  // Full remnant - use remnant dimensions
                                  setSoldDimensions({
                                    length: selectedRemnant.length_mm,
                                    width: selectedRemnant.width_mm,
                                    thickness: selectedRemnant.thickness_mm,
                                    isCutFromRemnant: 'full'
                                  });
                                  // Auto-calculate weight
                                  if (selectedRemnant.weight_per_cm2) {
                                    const calculatedWeight = calculateWeightFromCm2(
                                      selectedRemnant.weight_per_cm2,
                                      Number(selectedRemnant.length_mm),
                                      Number(selectedRemnant.width_mm)
                                    );
                                    if (calculatedWeight > 0) {
                                      setSoldWeight(calculatedWeight.toFixed(3));
                                    }
                                  }
                                } else if (selectedRemnant) {
                                  // Custom cut - clear dimensions but keep thickness from remnant
                                  setSoldDimensions({
                                    length: '',
                                    width: '',
                                    thickness: selectedRemnant.thickness_mm, // Keep thickness from parent
                                    isCutFromRemnant: 'cut'
                                  });
                                  setSoldWeight('');
                                }
                              }}
                            >
                              <FormControlLabel value="full" control={<Radio />} label="بيع البقية كاملة" />
                              <FormControlLabel value="cut" control={<Radio />} label="قص جزء من البقية" />
                            </RadioGroup>
                          </Grid>

                          {/* Show dimensions only if cutting */}
                          {soldDimensions.isCutFromRemnant === 'cut' && (
                            <>
                              <Grid item xs={12} md={2}>
                                <UnifiedFormField
                                  label="الطول (مم)"
                                  type="number"
                                  value={soldDimensions.length}
                                  onChange={(e) => setSoldDimensions({ ...soldDimensions, length: e.target.value })}
                                  name="sold_length"
                                  required
                                  inputProps={{ min: 0 }}
                                  helperText={selectedRemnant ? `الأم: ${selectedRemnant.length_mm}` : ' '}
                                />
                              </Grid>
                              <Grid item xs={12} md={2}>
                                <UnifiedFormField
                                  label="العرض (مم)"
                                  type="number"
                                  value={soldDimensions.width}
                                  onChange={(e) => setSoldDimensions({ ...soldDimensions, width: e.target.value })}
                                  name="sold_width"
                                  required
                                  inputProps={{ min: 0 }}
                                  helperText={selectedRemnant ? `الأم: ${selectedRemnant.width_mm}` : ' '}
                                />
                              </Grid>
                              <Grid item xs={12} md={2}>
                                <UnifiedFormField
                                  label="السمك (مم)"
                                  type="number"
                                  value={soldDimensions.thickness}
                                  onChange={() => {}} // Disabled field - no-op handler
                                  name="sold_thickness"
                                  required
                                  inputProps={{ min: 0.1, step: 0.1 }}
                                  disabled
                                  helperText="من البقية الأم"
                                />
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12} md={1.5}>
                            <UnifiedFormField
                              label="الكمية"
                              type="number"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              name="quantity"
                              required
                              inputProps={{ min: 1 }}
                              helperText={selectedRemnant ? `المتاح: ${selectedRemnant.total_quantity}` : ' '}
                            />
                          </Grid>
                          <Grid item xs={12} md={2.5}>
                            <UnifiedFormField
                              label="الوزن (كغ)"
                              type="number"
                              value={soldWeight}
                              onChange={(e) => setSoldWeight(e.target.value)}
                              name="weight"
                              inputProps={{ min: 0, step: 0.001 }}
                              helperText={
                                selectedRemnant?.weight_per_cm2 && soldDimensions.length && soldDimensions.width
                                  ? "✓ محسوب تلقائياً"
                                  : "اختياري - يدوي"
                              }
                              InputProps={{
                                sx: {
                                  bgcolor: selectedRemnant?.weight_per_cm2 && soldDimensions.length && soldDimensions.width
                                    ? 'success.lighter'
                                    : 'inherit'
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="السعر/كغ"
                              type="number"
                              value={itemPricePerKg}
                              onChange={(e) => {
                                setItemPricePerKg(e.target.value);
                                setLastPriceFieldModified('pricePerKg');
                              }}
                              name="price_per_kg"
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                startAdornment: lastPriceFieldModified === 'pricePerPiece' && itemPricePerKg ? (
                                  <InputAdornment position="start">
                                    <CalculateIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                  </InputAdornment>
                                ) : null,
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}/كغ</InputAdornment>,
                                sx: {
                                  color: selectedRemnant?.min_price ? getPriceColor(parseFloat(itemPricePerKg), selectedRemnant.min_price) : 'inherit',
                                  bgcolor: lastPriceFieldModified === 'pricePerPiece' && itemPricePerKg ? 'rgba(46, 125, 50, 0.08)' : 'transparent'
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="السعر/قطعة"
                              type="number"
                              value={itemPrice}
                              onChange={(e) => {
                                setItemPrice(e.target.value);
                                setLastPriceFieldModified('pricePerPiece');
                              }}
                              name="price"
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                startAdornment: lastPriceFieldModified === 'pricePerKg' && itemPrice ? (
                                  <InputAdornment position="start">
                                    <CalculateIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                  </InputAdornment>
                                ) : null,
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: {
                                  color: selectedRemnant?.min_price && soldWeight ? getPriceColor(parseFloat(itemPrice), selectedRemnant.min_price * parseFloat(soldWeight)) : 'inherit',
                                  bgcolor: lastPriceFieldModified === 'pricePerKg' && itemPrice ? 'rgba(46, 125, 50, 0.08)' : 'transparent'
                                }
                              }}
                            />
                          </Grid>
                        </>
                      )}

                      {/* Cut from Sheet Sale */}
                      {saleType === 'cut_from_sheet' && (
                        <>
                          {selectedSheet && !selectedSheet.weight_per_cm2 && (
                            <Grid item xs={12}>
                              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                                ℹ️ لا يوجد حساب تلقائي للوزن لهذه الصفيحة. يرجى إدخال الوزن يدوياً.
                              </Alert>
                            </Grid>
                          )}
                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              options={sheets}
                              getOptionLabel={(s) => `${s.code} - ${s.metal_name} (${s.total_quantity})`}
                              value={selectedSheet}
                              onChange={(_e, val) => {
                                setSelectedSheet(val);
                                if (val) {
                                  console.log('📏 Auto-filling thickness from sheet:', val.thickness_mm);
                                  setSoldDimensions(prev => ({ ...prev, thickness: val.thickness_mm }));
                                }
                              }}
                              renderInput={(params) => <TextField {...params} label="اختر الصفيحة الأم" required />}
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <UnifiedFormField
                              label="الطول (مم)"
                              type="number"
                              value={soldDimensions.length}
                              onChange={(e) => setSoldDimensions(prev => ({ ...prev, length: e.target.value }))}
                              name="length"
                              required
                              inputProps={{ min: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <UnifiedFormField
                              label="العرض (مم)"
                              type="number"
                              value={soldDimensions.width}
                              onChange={(e) => setSoldDimensions(prev => ({ ...prev, width: e.target.value }))}
                              name="width"
                              required
                              inputProps={{ min: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <UnifiedFormField
                              label="السمك (مم)"
                              type="number"
                              value={soldDimensions.thickness}
                              onChange={() => {}} // Disabled field - no-op handler
                              name="sold_thickness"
                              required
                              inputProps={{ min: 0.1, step: 0.1 }}
                              disabled
                              helperText="من الصفيحة الأم"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="الكمية"
                              type="number"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              name="quantity"
                              required
                              inputProps={{ min: 1 }}
                              helperText={selectedSheet ? `المتاح: ${selectedSheet.total_quantity}` : ' '}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="الوزن (كغ)"
                              type="number"
                              value={soldWeight}
                              onChange={(e) => setSoldWeight(e.target.value)}
                              name="weight"
                              inputProps={{ min: 0, step: 0.001 }}
                              helperText={
                                selectedSheet?.weight_per_cm2 && soldDimensions.length && soldDimensions.width
                                  ? "✓ محسوب تلقائياً"
                                  : "اختياري - يدوي"
                              }
                              InputProps={{
                                sx: {
                                  bgcolor: selectedSheet?.weight_per_cm2 && soldDimensions.length && soldDimensions.width
                                    ? 'success.lighter'
                                    : 'inherit'
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="السعر/كغ"
                              type="number"
                              value={itemPricePerKg}
                              onChange={(e) => {
                                setItemPricePerKg(e.target.value);
                                setLastPriceFieldModified('pricePerKg');
                              }}
                              name="price_per_kg"
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                startAdornment: lastPriceFieldModified === 'pricePerPiece' && itemPricePerKg ? (
                                  <InputAdornment position="start">
                                    <CalculateIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                  </InputAdornment>
                                ) : null,
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}/كغ</InputAdornment>,
                                sx: {
                                  color: selectedSheet?.min_price ? getPriceColor(parseFloat(itemPricePerKg), selectedSheet.min_price) : 'inherit',
                                  bgcolor: lastPriceFieldModified === 'pricePerPiece' && itemPricePerKg ? 'rgba(46, 125, 50, 0.08)' : 'transparent'
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="السعر/قطعة"
                              type="number"
                              value={itemPrice}
                              onChange={(e) => {
                                setItemPrice(e.target.value);
                                setLastPriceFieldModified('pricePerPiece');
                              }}
                              name="price"
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                startAdornment: lastPriceFieldModified === 'pricePerKg' && itemPrice ? (
                                  <InputAdornment position="start">
                                    <CalculateIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                  </InputAdornment>
                                ) : null,
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: {
                                  color: selectedSheet?.min_price && soldWeight ? getPriceColor(parseFloat(itemPrice), selectedSheet.min_price * parseFloat(soldWeight)) : 'inherit',
                                  bgcolor: lastPriceFieldModified === 'pricePerKg' && itemPrice ? 'rgba(46, 125, 50, 0.08)' : 'transparent'
                                }
                              }}
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
                          renderInput={(params) => <TextField {...params} label="اختر الخدمة" required />}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <UnifiedFormField
                          label="وصف المادة (نوع، أبعاد، كمية)"
                          value={materialDescription}
                          onChange={(e) => setMaterialDescription(e.target.value)}
                          name="material_description"
                          helperText="اختياري - مثال: ستانلس 1000×2000×1.5"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <UnifiedFormField
                          label="الكمية"
                          type="number"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                          name="quantity"
                          inputProps={{ min: 1 }}
                          helperText="افتراضي: 1"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <UnifiedFormField
                          label="سعر الخدمة"
                          type="number"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          name="service_price"
                          required
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <UnifiedFormField
                          label="ملاحظات الخدمة"
                          value={itemNotes}
                          onChange={(e) => setItemNotes(e.target.value)}
                          name="item_notes"
                          multiline
                          rows={2}
                          helperText="اختياري"
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
                    <UnifiedFormField
                      label="الخصم"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      name="discount"
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                      }}
                      helperText="اختياري"
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
                    <UnifiedFormField
                      label="المبلغ المدفوع"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      name="amount_paid"
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                      }}
                      helperText="اختياري - صفر = آجل"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="طريقة الدفع"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      name="payment_method"
                      select
                      SelectProps={{ native: true }}
                      InputLabelProps={{ shrink: true }}
                      helperText="اختياري"
                    >
                      <option value="">غير محدد</option>
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                      ))}
                    </UnifiedFormField>
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
          <Typography component="span" variant="h5" fontWeight={700}>
            إضافة البواقي من القطع
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
              {currentSaleData?.isFromRemnant
                ? 'تم قص البقية. هل تريد إضافة القطع المتبقية كبواقي؟'
                : 'تم قص الصفيحة. هل تريد إضافة القطع المتبقية كبواقي؟'
              }
            </Alert>

            {currentSaleData && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} fontSize="0.9375rem">
                {currentSaleData.isFromRemnant ? 'البقية الأم' : 'الصفيحة الأم'}: {currentSaleData.sheetCode}
                {currentSaleData.isFromRemnant && ` (${currentSaleData.parentRemnantDimensions})`} |
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
                    <UnifiedFormField
                      label="الطول (مم)"
                      type="number"
                      value={piece.length}
                      onChange={(e) => {
                        const updated = [...remnantPieces];
                        updated[index].length = e.target.value;
                        setRemnantPieces(updated);
                      }}
                      name={`remnant_length_${index}`}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <UnifiedFormField
                      label="العرض (مم)"
                      type="number"
                      value={piece.width}
                      onChange={(e) => {
                        const updated = [...remnantPieces];
                        updated[index].width = e.target.value;
                        setRemnantPieces(updated);
                      }}
                      name={`remnant_width_${index}`}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <UnifiedFormField
                      label="الكمية"
                      type="number"
                      value={piece.quantity}
                      onChange={(e) => {
                        const updated = [...remnantPieces];
                        updated[index].quantity = e.target.value;
                        setRemnantPieces(updated);
                      }}
                      name={`remnant_quantity_${index}`}
                      inputProps={{ min: 1 }}
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
          <Button onClick={() => {
            setShowRemnantDialog(false);
            setRemnantPieces([]);
            setCurrentSaleData(null);
          }} size="large">
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
                  // Don't pass weight_per_sheet_kg - let backend calculate it from weight_per_cm2
                  // Remnant has different dimensions than parent, so weight will be different
                  const sheetData = {
                    metal_type_id: parentSheet.metal_type_id,
                    grade_id: parentSheet.grade_id,
                    finish_id: parentSheet.finish_id,
                    length_mm: parseFloat(piece.length),
                    width_mm: parseFloat(piece.width),
                    thickness_mm: parseFloat(piece.thickness),
                    // Pass weight_per_cm2 from parent to calculate correct weight for remnant dimensions
                    weight_per_cm2: parentSheet.weight_per_cm2,
                    is_remnant: true,
                    parent_sheet_id: currentSaleData.sheetId,
                    created_from_sale_id: currentSaleData.saleId, // Link remnant to the sale that created it
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

                // Close dialog and clear state
                setShowRemnantDialog(false);
                setRemnantPieces([]);
                setCurrentSaleData(null);

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
              <Typography component="span" variant="h5" fontWeight={700}>
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
                      <Typography variant="body1" fontSize="1rem">{safeNotes(selectedSale.notes)}</Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>

                {selectedSale.created_by && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">أضيفت بواسطة:</Typography>
                    <Typography variant="body1" fontWeight={600} fontSize="0.9375rem">
                      {selectedSale.created_by}
                    </Typography>
                  </Grid>
                )}

                {selectedSale.updated_by && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">آخر تعديل بواسطة:</Typography>
                    <Typography variant="body1" fontWeight={600} fontSize="0.9375rem">
                      {selectedSale.updated_by}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
              <PrintButtons
                onPrint={handlePrintInvoice}
                onPDF={handleExportInvoicePDF}
                isPrinting={isPrinting}
                variant="outlined"
                size="large"
              />
              <Button onClick={() => setOpenViewDialog(false)} size="large">إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Print Confirmation Dialog */}
      <PrintConfirmDialog
        open={showPrintDialog}
        onClose={cancelPrint}
        onConfirm={executePrint}
        title="تأكيد طباعة الفاتورة"
        documentName={pendingDocument?.metadata?.name || 'الفاتورة'}
        documentType={pendingDocument?.metadata?.type || 'فاتورة'}
        estimatedPages={pendingDocument?.metadata?.estimatedPages || 1}
        defaultAction={pendingDocument?.metadata?.defaultAction || 'print'}
      />

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