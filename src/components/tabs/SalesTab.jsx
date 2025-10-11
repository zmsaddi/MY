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

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedDialog from '../common/dialogs/UnifiedDialog';
import PrintConfirmDialog from '../common/print/PrintConfirmDialog';
import PrintButtons from '../common/print/PrintButtons';

import { usePrint } from '../../hooks/usePrint';
import { generateInvoicePDF } from '../../utils/pdf/templates/invoicePDF';

import {
  getAllSales, getSaleById, processSale, generateInvoiceNumber, deleteSale,
  getCustomers, getAllSheets, getServiceTypes, getPaymentMethodsForUI,
  getCompanyProfile, getBaseCurrencyInfo, getCurrencies, addSheetWithBatch
} from '../../utils/database';
import { safeText, safeNotes, safeDescription } from '../../utils/displayHelpers';

// Import new components
import { SalesTable, SaleItemsForm, RemnantCreationDialog } from '../sales';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const STEPS = ['Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ÙØ§ØªÙˆØ±Ø©', 'Ø§Ù„Ø£ØµÙ†Ø§Ù', 'Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠØ§Øª ÙˆØ§Ù„Ø¯ÙØ¹'];

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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Validation
  const validateSaleForm = () => {
    const newErrors = {};

    // Step 0: Basic info validation
    if (!customerId) {
      newErrors.customer_id = 'ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø²Ø¨ÙˆÙ†';
    }

    if (!saleDate) {
      newErrors.sale_date = 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨ÙŠØ¹ Ù…Ø·Ù„ÙˆØ¨';
    }

    // Step 1: Items validation
    if (items.length === 0) {
      newErrors.items = 'ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© ØµÙ†Ù ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      newErrors.customer_id = 'ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø²Ø¨ÙˆÙ†';
      setErrors(newErrors);
      return;
    }
    if (activeStep === 1 && items.length === 0) {
      newErrors.items = 'ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© ØµÙ†Ù ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„';
      setErrors(newErrors);
      setError('ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© ØµÙ†Ù ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„');
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        if (!selectedSheet) return setError('ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± ØµÙÙŠØ­Ø©');
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('Ø§Ù„ÙƒÙ…ÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±');
        if (qty > selectedSheet.total_quantity) return setError(`Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙ‚Ø· ${selectedSheet.total_quantity}`);
        const price = parseFloat(itemPrice);
        if (!price || price <= 0) return setError('Ø§Ù„Ø³Ø¹Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±');

        setItems((prev) => [
          ...prev,
          {
            item_type: 'material',
            sale_type: 'full_sheet',
            sheet_id: selectedSheet.id,
            code: selectedSheet.code,
            metal_name: selectedSheet.metal_name,
            dimensions: `${selectedSheet.length_mm}Ã—${selectedSheet.width_mm}Ã—${selectedSheet.thickness_mm}`,
            quantity: qty,
            unit_price: price,
            total: qty * price
          }
        ]);
      }
      // Remnant from Stock Sale
      else if (saleType === 'remnant_from_stock') {
        if (!selectedRemnant) return setError('ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø¨Ù‚ÙŠØ©');
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('Ø§Ù„ÙƒÙ…ÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±');
        if (qty > selectedRemnant.total_quantity) return setError(`Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙ‚Ø· ${selectedRemnant.total_quantity}`);
        const price = parseFloat(itemPrice);
        if (!price || price <= 0) return setError('Ø§Ù„Ø³Ø¹Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±');

        setItems((prev) => [
          ...prev,
          {
            item_type: 'material',
            sale_type: 'remnant_from_stock',
            sheet_id: selectedRemnant.id,
            code: selectedRemnant.code,
            metal_name: selectedRemnant.metal_name,
            dimensions: `${selectedRemnant.length_mm}Ã—${selectedRemnant.width_mm}Ã—${selectedRemnant.thickness_mm}`,
            quantity: qty,
            unit_price: price,
            total: qty * price
          }
        ]);
      }
      // Cut from Sheet Sale
      else if (saleType === 'cut_from_sheet') {
        if (!selectedSheet) return setError('ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…');
        if (!soldDimensions.length || !soldDimensions.width || !soldDimensions.thickness) {
          return setError('ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯');
        }
        const qty = parseInt(itemQuantity, 10);
        if (!qty || qty <= 0) return setError('Ø§Ù„ÙƒÙ…ÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±');
        if (qty > selectedSheet.total_quantity) return setError(`Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙ‚Ø· ${selectedSheet.total_quantity}`);

        const price = parseFloat(itemPrice);
        const pricePerKg = parseFloat(itemPricePerKg);

        if (!price && !pricePerKg) {
          return setError('ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø³Ø¹Ø± (Ø¥Ù…Ø§ Ø³Ø¹Ø± Ø§Ù„Ù‚Ø·Ø¹Ø© Ø£Ùˆ Ø³Ø¹Ø± Ø§Ù„ÙƒÙŠÙ„Ùˆ)');
        }

        const weight = parseFloat(soldWeight) || 0;
        const dimString = `${soldDimensions.length}Ã—${soldDimensions.width}Ã—${soldDimensions.thickness}`;

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
      if (!selectedService) return setError('ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø®Ø¯Ù…Ø©');
      const qty = parseInt(itemQuantity, 10) || 1;
      const price = parseFloat(servicePrice);
      if (!price || price <= 0) return setError('Ø³Ø¹Ø± Ø§Ù„Ø®Ø¯Ù…Ø© ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±');

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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        setSuccess(`ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© ${result.invoice_number} Ø¨Ù†Ø¬Ø§Ø­`);
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
        setError('ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSale = () => {
    if (items.length === 0) {
      setError('ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© ØµÙ†Ù ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„');
      return;
    }
    openConfirm('save', null, handleActualSaveSale);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        setSuccess('ØªÙ… Ø­Ø°Ù Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 2500);
        loadData();
      } else {
        setError('ÙØ´Ù„ Ø§Ù„Ø­Ø°Ù: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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
    status === 'paid' ? 'Ù…Ø¯ÙÙˆØ¹Ø©' : status === 'partial' ? 'Ø¬Ø²Ø¦ÙŠØ©' : 'ØºÙŠØ± Ù…Ø¯ÙÙˆØ¹Ø©';

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
      name: `ÙØ§ØªÙˆØ±Ø© ${selectedSale.invoice_number}`,
      type: 'ÙØ§ØªÙˆØ±Ø© Ø¨ÙŠØ¹',
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
      name: `ÙØ§ØªÙˆØ±Ø© ${selectedSale.invoice_number}`,
      type: 'ÙØ§ØªÙˆØ±Ø© Ø¨ÙŠØ¹',
      estimatedPages: 1,
      defaultAction: 'pdf'
    });
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙÙˆØ§ØªÙŠØ± ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª (Ù…Ø¹Ø§Ø¯Ù† + Ø®Ø¯Ù…Ø§Øª)
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
          Ø¥Ù†Ø´Ø§Ø¡ ÙØ§ØªÙˆØ±Ø© Ø¬Ø¯ÙŠØ¯Ø©
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
            <Typography variant="h5" fontWeight={700}>
              Ø¥Ù†Ø´Ø§Ø¡ ÙØ§ØªÙˆØ±Ø© Ø¬Ø¯ÙŠØ¯Ø©
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
                  label="Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©"
                  value={invoiceNumber}
                  InputProps={{ readOnly: true }}
                  helperText="ÙŠØªÙ… ØªÙˆÙ„ÙŠØ¯Ù‡ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨ÙŠØ¹"
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
                      label="Ø§Ù„Ø²Ø¨ÙˆÙ†"
                      required
                      error={!!errors.customer_id}
                      helperText={errors.customer_id || ''}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <UnifiedFormField
                  label="Ø¹Ù…Ù„Ø© Ø§Ù„ÙØ§ØªÙˆØ±Ø©"
                  value={saleCurrency}
                  onChange={(e) => setSaleCurrency(e.target.value)}
                  name="currency"
                  select
                  SelectProps={{ native: true }}
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
                  label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  name="notes"
                  multiline
                  rows={2}
                  helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
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
                      label="Ù†ÙˆØ¹ Ø§Ù„ØµÙ†Ù"
                      value={itemType}
                      onChange={(e) => {
                        setItemType(e.target.value);
                        resetItemForm();
                      }}
                      name="item_type"
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="material">Ù…Ø¹Ø¯Ù† Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ†</option>
                      <option value="service">Ø®Ø¯Ù…Ø©</option>
                    </UnifiedFormField>
                  </Grid>

                  {/* Sale Type Radio Buttons - Only for material */}
                  {itemType === 'material' && (
                    <Grid item xs={12}>
                      <FormLabel component="legend">
                        <Typography fontWeight={600} fontSize="1rem">Ù†ÙˆØ¹ Ø§Ù„Ø¨ÙŠØ¹</Typography>
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
                          label="ØµÙÙŠØ­Ø© ÙƒØ§Ù…Ù„Ø©"
                        />
                        <FormControlLabel
                          value="remnant_from_stock"
                          control={<Radio />}
                          label="Ù‚Ø·Ø¹Ø© Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ† (Ø¨ÙˆØ§Ù‚ÙŠ)"
                        />
                        <FormControlLabel
                          value="cut_from_sheet"
                          control={<Radio />}
                          label="Ù‚Øµ Ù…Ù† ØµÙÙŠØ­Ø©"
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
                              renderInput={(params) => <TextField {...params} label="Ø§Ø®ØªØ± Ø§Ù„ØµÙÙŠØ­Ø©" required />}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„ÙƒÙ…ÙŠØ©"
                              type="number"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              name="quantity"
                              required
                              inputProps={{ min: 1 }}
                              helperText={selectedSheet ? `Ø§Ù„Ù…ØªØ§Ø­: ${selectedSheet.total_quantity}` : ' '}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„Ø³Ø¹Ø±/Ù‚Ø·Ø¹Ø©"
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
                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              options={remnants}
                              getOptionLabel={(r) => `${r.code} - ${r.metal_name} - ${r.length_mm}Ã—${r.width_mm}Ã—${r.thickness_mm} (${r.total_quantity})`}
                              value={selectedRemnant}
                              onChange={(_e, val) => setSelectedRemnant(val)}
                              renderInput={(params) => <TextField {...params} label="Ø§Ø®ØªØ± Ø§Ù„Ø¨Ù‚ÙŠØ©" required />}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„ÙƒÙ…ÙŠØ©"
                              type="number"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              name="quantity"
                              required
                              inputProps={{ min: 1 }}
                              helperText={selectedRemnant ? `Ø§Ù„Ù…ØªØ§Ø­: ${selectedRemnant.total_quantity}` : ' '}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„Ø³Ø¹Ø±/Ù‚Ø·Ø¹Ø©"
                              type="number"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              name="price"
                              required
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: { color: selectedRemnant?.min_price ? getPriceColor(parseFloat(itemPrice), selectedRemnant.min_price) : 'inherit' }
                              }}
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
                              renderInput={(params) => <TextField {...params} label="Ø§Ø®ØªØ± Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…" required />}
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <UnifiedFormField
                              label="Ø§Ù„Ø·ÙˆÙ„ (Ù…Ù…)"
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
                              label="Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ù…)"
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
                              label="Ø§Ù„Ø³Ù…Ø§ÙƒØ© (Ù…Ù…)"
                              type="number"
                              value={soldDimensions.thickness}
                              onChange={(e) => setSoldDimensions(prev => ({ ...prev, thickness: e.target.value }))}
                              name="thickness"
                              required
                              inputProps={{ min: 0.1, step: 0.1 }}
                              disabled
                              helperText="Ù…Ù† Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„ÙƒÙ…ÙŠØ©"
                              type="number"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              name="quantity"
                              required
                              inputProps={{ min: 1 }}
                              helperText={selectedSheet ? `Ø§Ù„Ù…ØªØ§Ø­: ${selectedSheet.total_quantity}` : ' '}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„ÙˆØ²Ù† (ÙƒØº)"
                              type="number"
                              value={soldWeight}
                              onChange={(e) => setSoldWeight(e.target.value)}
                              name="weight"
                              inputProps={{ min: 0, step: 0.001 }}
                              helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ - Ø­Ø³Ø§Ø¨ ØªÙ„Ù‚Ø§Ø¦ÙŠ"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„Ø³Ø¹Ø±/ÙƒØº"
                              type="number"
                              value={itemPricePerKg}
                              onChange={(e) => setItemPricePerKg(e.target.value)}
                              name="price_per_kg"
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: { color: selectedSheet?.min_price ? getPriceColor(parseFloat(itemPricePerKg), selectedSheet.min_price) : 'inherit' }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <UnifiedFormField
                              label="Ø§Ù„Ø³Ø¹Ø±/Ù‚Ø·Ø¹Ø©"
                              type="number"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              name="price"
                              inputProps={{ step: 0.01, min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>,
                                sx: { color: selectedSheet?.min_price && soldWeight ? getPriceColor(parseFloat(itemPrice), selectedSheet.min_price * parseFloat(soldWeight)) : 'inherit' }
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
                          renderInput={(params) => <TextField {...params} label="Ø§Ø®ØªØ± Ø§Ù„Ø®Ø¯Ù…Ø©" required />}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <UnifiedFormField
                          label="ÙˆØµÙ Ø§Ù„Ù…Ø§Ø¯Ø© (Ù†ÙˆØ¹ØŒ Ø£Ø¨Ø¹Ø§Ø¯ØŒ ÙƒÙ…ÙŠØ©)"
                          value={materialDescription}
                          onChange={(e) => setMaterialDescription(e.target.value)}
                          name="material_description"
                          helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ - Ù…Ø«Ø§Ù„: Ø³ØªØ§Ù†Ù„Ø³ 1000Ã—2000Ã—1.5"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <UnifiedFormField
                          label="Ø§Ù„ÙƒÙ…ÙŠØ©"
                          type="number"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                          name="quantity"
                          inputProps={{ min: 1 }}
                          helperText="Ø§ÙØªØ±Ø§Ø¶ÙŠ: 1"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <UnifiedFormField
                          label="Ø³Ø¹Ø± Ø§Ù„Ø®Ø¯Ù…Ø©"
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
                          label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ø®Ø¯Ù…Ø©"
                          value={itemNotes}
                          onChange={(e) => setItemNotes(e.target.value)}
                          name="item_notes"
                          multiline
                          rows={2}
                          helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={handleAddItem}>
                      Ø¥Ø¶Ø§ÙØ©
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              {items.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù†ÙˆØ¹</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙˆØµÙ</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙ…ÙŠØ©</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ø¹Ø±</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø­Ø°Ù</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Chip
                              label={item.item_type === 'material' ? 'Ù…Ø¹Ø¯Ù†' : 'Ø®Ø¯Ù…Ø©'}
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
                                  {item.material_description ? `â€“ ${item.material_description}` : ''}
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
                  <Grid item xs={6}><Typography fontSize="1.0625rem">Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ:</Typography></Grid>
                  <Grid item xs={6} sx={{ textAlign: 'left' }}>
                    <Typography fontSize="1.0625rem" fontWeight={600}>
                      {fmt(subtotal)} {getCurrencySymbol(saleCurrency)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <UnifiedFormField
                      label="Ø§Ù„Ø®ØµÙ…"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      name="discount"
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                      }}
                      helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                    />
                  </Grid>

                  {profile?.vat_enabled && (
                    <>
                      <Grid item xs={6}><Typography fontSize="1.0625rem">Ø§Ù„Ø¶Ø±ÙŠØ¨Ø© ({profile.vat_rate}%):</Typography></Grid>
                      <Grid item xs={6} sx={{ textAlign: 'left' }}>
                        <Typography fontSize="1.0625rem" fontWeight={600}>
                          {fmt(taxAmount)} {getCurrencySymbol(saleCurrency)}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={6}><Typography variant="h6" fontWeight={700}>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ:</Typography></Grid>
                  <Grid item xs={6} sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {fmt(totalAmount)} {getCurrencySymbol(saleCurrency)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø¯ÙÙˆØ¹"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      name="amount_paid"
                      inputProps={{ step: 0.01, min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{getCurrencySymbol(saleCurrency)}</InputAdornment>
                      }}
                      helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ - ØµÙØ± = Ø¢Ø¬Ù„"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <UnifiedFormField
                      label="Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      name="payment_method"
                      select
                      SelectProps={{ native: true }}
                      helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                    >
                      <option value="">ØºÙŠØ± Ù…Ø­Ø¯Ø¯</option>
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                      ))}
                    </UnifiedFormField>
                  </Grid>

                  {amountPaid > 0 && (
                    <>
                      <Grid item xs={6}><Typography fontSize="1.0625rem" color="error">Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ:</Typography></Grid>
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
                ØªØ£ÙƒÙ‘Ø¯ Ù…Ù† ØµØ­Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø¨Ù„ Ø§Ù„Ø­ÙØ¸. Ø³ÙŠØªÙ… Ø®ØµÙ… Ø§Ù„ÙƒÙ…ÙŠØ§Øª Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseCreateDialog} size="large">Ø¥Ù„ØºØ§Ø¡</Button>
          {activeStep > 0 && <Button onClick={handleBack} size="large">Ø§Ù„Ø³Ø§Ø¨Ù‚</Button>}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext} size="large">Ø§Ù„ØªØ§Ù„ÙŠ</Button>
            : <Button variant="contained" onClick={handleSubmitSale} size="large">Ø­ÙØ¸ Ø§Ù„ÙØ§ØªÙˆØ±Ø©</Button>}
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
            Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¨ÙˆØ§Ù‚ÙŠ Ù…Ù† Ø§Ù„Ù‚Ø·Ø¹
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
              ØªÙ… Ù‚Øµ Ø§Ù„ØµÙÙŠØ­Ø©. Ù‡Ù„ ØªØ±ÙŠØ¯ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù‚Ø·Ø¹ Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ© ÙƒØ¨ÙˆØ§Ù‚ÙŠØŸ
            </Alert>

            {currentSaleData && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} fontSize="0.9375rem">
                Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…: {currentSaleData.sheetCode} |
                Ø§Ù„Ù‚Ø·Ø¹Ø© Ø§Ù„Ù…Ø¨Ø§Ø¹Ø©: {currentSaleData.soldDimensions}
              </Typography>
            )}

            {remnantPieces.map((piece, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Ù‚Ø·Ø¹Ø© Ø¨Ù‚ÙŠØ© #{index + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <UnifiedFormField
                      label="Ø§Ù„Ø·ÙˆÙ„ (Ù…Ù…)"
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
                      label="Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ù…)"
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
                      label="Ø§Ù„ÙƒÙ…ÙŠØ©"
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
                      Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ù‚Ø·Ø¹Ø©
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
              Ø¥Ø¶Ø§ÙØ© Ù‚Ø·Ø¹Ø© Ø£Ø®Ø±Ù‰
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowRemnantDialog(false)} size="large">
            ØªØ®Ø·ÙŠ
          </Button>
          <Button
            onClick={async () => {
              try {
                // Validate remnant pieces
                const validPieces = remnantPieces.filter(p =>
                  p.length && p.width && p.thickness && p.quantity
                );

                if (validPieces.length === 0) {
                  setError('ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ Ø¨ÙŠØ§Ù†Ø§Øª ØµØ­ÙŠØ­Ø© Ù„Ù„Ø¨ÙˆØ§Ù‚ÙŠ');
                  return;
                }

                // Get parent sheet info
                const parentSheet = sheets.find(s => s.id === currentSaleData?.sheetId);
                if (!parentSheet) {
                  setError('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„ØµÙÙŠØ­Ø© Ø§Ù„Ø£Ù…');
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
                    storage_location: 'Ø¨ÙˆØ§Ù‚ÙŠ',
                    received_date: new Date().toISOString().split('T')[0],
                    notes: `Ø¨Ù‚ÙŠØ© Ù…Ù† ${currentSaleData.sheetCode} - Ø§Ù„Ù‚Ø·Ø¹Ø© Ø§Ù„Ù…Ø¨Ø§Ø¹Ø©: ${currentSaleData.soldDimensions}`
                  };

                  const result = addSheetWithBatch(sheetData, batchData);

                  if (result.success) {
                    savedCount++;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('âœ“ Remnant saved:', result.code);
                    }
                  } else {
                    errorCount++;
                    console.error('Failed to save remnant:', result.error);
                  }
                }

                setShowRemnantDialog(false);

                if (savedCount > 0) {
                  setSuccess(`ØªÙ… Ø­ÙØ¸ ${savedCount} Ù‚Ø·Ø¹Ø© Ø¨ÙˆØ§Ù‚ÙŠ Ø¨Ù†Ø¬Ø§Ø­`);
                  loadData(); // Reload data to show new remnants
                  setTimeout(() => setSuccess(''), 3000);
                }

                if (errorCount > 0) {
                  setError(`ÙØ´Ù„ Ø­ÙØ¸ ${errorCount} Ù‚Ø·Ø¹Ø©`);
                }
              } catch (err) {
                setError('Ø®Ø·Ø£ ÙÙŠ Ø­ÙØ¸ Ø§Ù„Ø¨ÙˆØ§Ù‚ÙŠ: ' + err.message);
                console.error('Save remnants error:', err);
              }
            }}
            variant="contained"
            size="large"
          >
            Ø­ÙØ¸ Ø§Ù„Ø¨ÙˆØ§Ù‚ÙŠ
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
                ØªÙØ§ØµÙŠÙ„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© {selectedSale.invoice_number}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">Ø§Ù„Ø²Ø¨ÙˆÙ†:</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                    {selectedSale.customer_name || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">Ø§Ù„ØªØ§Ø±ÙŠØ®:</Typography>
                  <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                    {selectedSale.sale_date}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Ø§Ù„Ø£ØµÙ†Ø§Ù:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù†ÙˆØ¹</Typography></TableCell>
                          <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙˆØµÙ</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙƒÙ…ÙŠØ©</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø³Ø¹Ø±</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSale.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Chip
                                label={item.item_type === 'material' ? 'Ù…Ø¹Ø¯Ù†' : 'Ø®Ø¯Ù…Ø©'}
                                color={item.item_type === 'material' ? 'primary' : 'secondary'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {item.item_type === 'material' ? (
                                <Typography fontSize="0.9375rem">
                                  {item.code}{' '}
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    â€“ {item.length_mm}Ã—{item.width_mm}Ã—{item.thickness_mm} Ù…Ù…
                                  </Typography>
                                </Typography>
                              ) : (
                                <Typography fontSize="0.9375rem">
                                  {item.service_name_ar}{' '}
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {item.material_description ? `â€“ ${item.material_description}` : ''}
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

                <Grid item xs={6}><Typography fontSize="1.0625rem">Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={600}>
                    {fmt(selectedSale.subtotal)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>

                {selectedSale.discount > 0 && (
                  <>
                    <Grid item xs={6}><Typography fontSize="1.0625rem">Ø§Ù„Ø®ØµÙ…:</Typography></Grid>
                    <Grid item xs={6} sx={{ textAlign: 'left' }}>
                      <Typography fontSize="1.0625rem" fontWeight={600}>
                        -{fmt(selectedSale.discount)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </Grid>
                  </>
                )}

                {selectedSale.tax > 0 && (
                  <>
                    <Grid item xs={6}><Typography fontSize="1.0625rem">Ø§Ù„Ø¶Ø±ÙŠØ¨Ø©:</Typography></Grid>
                    <Grid item xs={6} sx={{ textAlign: 'left' }}>
                      <Typography fontSize="1.0625rem" fontWeight={600}>
                        {fmt(selectedSale.tax)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}><Typography variant="h6" fontWeight={700}>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {fmt(selectedSale.total_amount)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>

                <Grid item xs={6}><Typography fontSize="1.0625rem">Ø§Ù„Ù…Ø¯ÙÙˆØ¹:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={600} color="success.main">
                    {fmt(selectedSale.total_paid)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>

                {selectedSale.remaining > 0 && (
                  <>
                    <Grid item xs={6}><Typography fontSize="1.0625rem" color="error">Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ:</Typography></Grid>
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
                      <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">Ù…Ù„Ø§Ø­Ø¸Ø§Øª:</Typography>
                      <Typography variant="body1" fontSize="1rem">{safeNotes(selectedSale.notes)}</Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>

                {selectedSale.created_by && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø£Ø¶ÙŠÙØª Ø¨ÙˆØ§Ø³Ø·Ø©:</Typography>
                    <Typography variant="body1" fontWeight={600} fontSize="0.9375rem">
                      {selectedSale.created_by}
                    </Typography>
                  </Grid>
                )}

                {selectedSale.updated_by && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">Ø¢Ø®Ø± ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙˆØ§Ø³Ø·Ø©:</Typography>
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
              <Button onClick={() => setOpenViewDialog(false)} size="large">Ø¥ØºÙ„Ø§Ù‚</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Print Confirmation Dialog */}
      <PrintConfirmDialog
        open={showPrintDialog}
        onClose={cancelPrint}
        onConfirm={executePrint}
        title="ØªØ£ÙƒÙŠØ¯ Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„ÙØ§ØªÙˆØ±Ø©"
        documentName={pendingDocument?.metadata?.name || 'Ø§Ù„ÙØ§ØªÙˆØ±Ø©'}
        documentType={pendingDocument?.metadata?.type || 'ÙØ§ØªÙˆØ±Ø©'}
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
