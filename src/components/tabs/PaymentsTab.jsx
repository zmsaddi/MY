// src/components/tabs/PaymentsTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Chip, Paper, InputAdornment, MenuItem, Tabs, Tab,
  FormControl, InputLabel, Select, IconButton, Tooltip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedDialog from '../common/dialogs/UnifiedDialog';
import getConfirmationConfig from '../../utils/dialogs/getConfirmationConfig';

import {
  getCustomers, getSuppliers,
  settleCustomerPayment, settleSupplierPayment,
  getCustomerStatement, getSupplierStatement,
  getPaymentMethodsForUI, getBaseCurrencyInfo, currencyHelpers
} from '../../utils/database';
import { safeNotes } from '../../utils/displayHelpers';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const { round2 } = currencyHelpers;

export default function PaymentsTab() {
  const [tabValue, setTabValue] = useState(0); // 0: customers, 1: suppliers
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  // Data
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);

  // Filters
  const [filterPerson, setFilterPerson] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Add Payment Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('SYP');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  // Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const currInfo = getBaseCurrencyInfo();
    setBaseCurrencyInfo(currInfo);
    setPaymentCurrency(currInfo.code);

    setCustomers(getCustomers());
    setSuppliers(getSuppliers());

    const methods = getPaymentMethodsForUI(true);
    setPaymentMethods(methods);

    loadPayments();
  };

  const loadPayments = () => {
    // Load all customer payments from statement
    const allCustomers = getCustomers();
    const custPay = [];
    allCustomers.forEach(c => {
      const stmt = getCustomerStatement(c.id);
      stmt.forEach(t => {
        if (t.transaction_type === 'payment') {
          custPay.push({
            ...t,
            person_id: c.id,
            person_name: c.name,
            person_type: 'customer'
          });
        }
      });
    });
    setCustomerPayments(custPay);

    // Load all supplier payments from statement
    const allSuppliers = getSuppliers();
    const suppPay = [];
    allSuppliers.forEach(s => {
      const stmt = getSupplierStatement(s.id);
      stmt.forEach(t => {
        if (t.transaction_type === 'payment') {
          suppPay.push({
            ...t,
            person_id: s.id,
            person_name: s.name,
            person_type: 'supplier'
          });
        }
      });
    });
    setSupplierPayments(suppPay);
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const payments = tabValue === 0 ? customerPayments : supplierPayments;
    return payments
      .filter(p => {
        if (filterPerson && p.person_id !== parseInt(filterPerson)) return false;
        if (filterDateFrom && p.transaction_date < filterDateFrom) return false;
        if (filterDateTo && p.transaction_date > filterDateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCompare = b.transaction_date.localeCompare(a.transaction_date);
        if (dateCompare !== 0) return dateCompare;
        return b.id - a.id;
      });
  }, [tabValue, customerPayments, supplierPayments, filterPerson, filterDateFrom, filterDateTo]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + Math.abs(p.amount), 0);
    const count = filteredPayments.length;
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = filteredPayments.filter(p => p.transaction_date === today);
    const todayTotal = todayPayments.reduce((sum, p) => sum + Math.abs(p.amount), 0);
    return { total, count, todayTotal, todayCount: todayPayments.length };
  }, [filteredPayments]);

  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const confirmationDialogConfig = useMemo(() => {
    const overrides = {};
    if (confirmDialog.type === 'payment') {
      overrides.description = `سيتم تسجيل دفعة بمبلغ ${fmt(parseFloat(paymentAmount) || 0)} ${baseCurrencyInfo.symbol}.`;
    }
    return getConfirmationConfig(confirmDialog.type, overrides);
  }, [confirmDialog.type, paymentAmount, baseCurrencyInfo.symbol]);

  // Handle Add Payment
  const handleOpenDialog = () => {
    setSelectedPersonId(null);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(paymentMethods[0]?.name || '');
    setPaymentCurrency(baseCurrencyInfo.code);
    setPaymentNotes('');
    setError('');
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setErrors({});
  };

  const validatePayment = () => {
    const newErrors = {};

    if (!selectedPersonId) {
      newErrors.person = tabValue === 0 ? 'ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø²Ø¨ÙˆÙ†' : 'ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ù…ÙˆØ±Ø¯';
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      newErrors.amount = 'Ø§Ù„Ù…Ø¨Ù„Øº ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!paymentDate) {
      newErrors.payment_date = 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¯ÙØ¹ Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!paymentMethod) {
      newErrors.payment_method = 'ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualSubmitPayment = async () => {
    if (!validatePayment()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(paymentAmount);
      let result;

      if (tabValue === 0) {
        result = settleCustomerPayment(
          selectedPersonId,
          amount,
          paymentDate,
          paymentMethod,
          paymentNotes || null,
          paymentCurrency
        );
      } else {
        result = settleSupplierPayment(
          selectedPersonId,
          amount,
          paymentDate,
          paymentMethod,
          paymentNotes || null,
          paymentCurrency
        );
      }

      if (result.success) {
        setSuccess('âœ“ ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹Ø© Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseDialog();
        loadData();
      } else {
        setError('ÙØ´Ù„ Ø§Ù„ØªØ³Ø¬ÙŠÙ„: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = () => {
    openConfirm('payment', null, handleActualSubmitPayment);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'person':
        setSelectedPersonId(value);
        break;
      case 'amount':
        setPaymentAmount(value);
        break;
      case 'payment_date':
        setPaymentDate(value);
        break;
      case 'payment_method':
        setPaymentMethod(value);
        break;
      case 'currency':
        setPaymentCurrency(value);
        break;
      case 'notes':
        setPaymentNotes(value);
        break;
      default:
        break;
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleClearFilters = () => {
    setFilterPerson('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const personList = tabValue === 0 ? customers : suppliers;
  const personLabel = tabValue === 0 ? 'Ø§Ù„Ø²Ø¨ÙˆÙ†' : 'Ø§Ù„Ù…ÙˆØ±Ø¯';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¯ÙØ¹Ø§Øª
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          ØªØ³Ø¬ÙŠÙ„ ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø¯ÙØ¹Ø§Øª Ø§Ù„Ø²Ø¨Ø§Ø¦Ù† ÙˆØ§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="body2" color="white" gutterBottom fontSize="0.9375rem">
                Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¯ÙØ¹Ø§Øª
              </Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.total)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" gutterBottom fontSize="0.9375rem">
                Ø¹Ø¯Ø¯ Ø§Ù„Ø¯ÙØ¹Ø§Øª
              </Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {stats.count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'info.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" gutterBottom fontSize="0.9375rem">
                Ø¯ÙØ¹Ø§Øª Ø§Ù„ÙŠÙˆÙ…
              </Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.todayTotal)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" gutterBottom fontSize="0.9375rem">
                Ø¹Ø¯Ø¯ Ø¯ÙØ¹Ø§Øª Ø§Ù„ÙŠÙˆÙ…
              </Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {stats.todayCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => {
            setTabValue(newValue);
            handleClearFilters();
          }}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label={<Typography fontSize="1rem" fontWeight={600}>Ø¯ÙØ¹Ø§Øª Ø§Ù„Ø²Ø¨Ø§Ø¦Ù†</Typography>}
          />
          <Tab
            icon={<BusinessIcon />}
            iconPosition="start"
            label={<Typography fontSize="1rem" fontWeight={600}>Ø¯ÙØ¹Ø§Øª Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†</Typography>}
          />
        </Tabs>
      </Card>

      {/* Filters & Actions */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{personLabel}</InputLabel>
                <Select
                  value={filterPerson}
                  onChange={(e) => setFilterPerson(e.target.value)}
                  label={personLabel}
                >
                  <MenuItem value="">Ø§Ù„ÙƒÙ„</MenuItem>
                  {personList.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Ù…Ù† ØªØ§Ø±ÙŠØ®"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Ø¥Ù„Ù‰ ØªØ§Ø±ÙŠØ®"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Ù…Ø³Ø­ Ø§Ù„ÙÙ„Ø§ØªØ±">
                  <IconButton onClick={handleClearFilters} color="error">
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  fullWidth
                  sx={{ fontWeight: 700 }}
                >
                  ØªØ³Ø¬ÙŠÙ„ Ø¯ÙØ¹Ø©
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ØªØ§Ø±ÙŠØ®</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">{personLabel}</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù…Ø¨Ù„Øº</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ø±ØµÙŠØ¯ Ø¨Ø¹Ø¯ Ø§Ù„Ø¯ÙØ¹Ø©</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" py={3} fontSize="1rem">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¯ÙØ¹Ø§Øª</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} fontSize="0.9375rem">
                      {payment.transaction_date}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.8125rem">
                      {new Date(payment.created_at).toLocaleString('ar-SY')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontSize="0.9375rem">{payment.person_name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${fmt(Math.abs(payment.amount))} ${baseCurrencyInfo.symbol}`}
                      color="success"
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                      {safeNotes(payment.notes) || 'â€”'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.9375rem"
                      color={payment.balance_after > 0 ? 'error' : 'success.main'}
                    >
                      {fmt(payment.balance_after)} {baseCurrencyInfo.symbol}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Payment Dialog */}
      <UnifiedFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitPayment}
        title={`ØªØ³Ø¬ÙŠÙ„ Ø¯ÙØ¹Ø© ${tabValue === 0 ? 'Ø²Ø¨ÙˆÙ†' : 'Ù…ÙˆØ±Ø¯'}`}
        subtitle="Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯ÙØ¹Ø©"
        submitText="ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹Ø©"
        loading={loading}
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <UnifiedFormField
              label={personLabel}
              value={selectedPersonId || ''}
              onChange={handleInputChange}
              name="person"
              select
              required
              error={errors.person}
            >
              {personList.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </UnifiedFormField>
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø¯ÙÙˆØ¹"
              value={paymentAmount}
              onChange={handleInputChange}
              name="amount"
              type="number"
              required
              error={errors.amount}
              inputProps={{ step: 0.01, min: 0.01 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {baseCurrencyInfo.symbol}
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="Ø§Ù„Ø¹Ù…Ù„Ø©"
              value={paymentCurrency}
              onChange={handleInputChange}
              name="currency"
              select
              required
            >
              <MenuItem value="SYP">Ù„ÙŠØ±Ø© Ø³ÙˆØ±ÙŠØ©</MenuItem>
              <MenuItem value="USD">Ø¯ÙˆÙ„Ø§Ø± Ø£Ù…Ø±ÙŠÙƒÙŠ</MenuItem>
            </UnifiedFormField>
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¯ÙØ¹Ø©"
              value={paymentDate}
              onChange={handleInputChange}
              name="payment_date"
              type="date"
              required
              error={errors.payment_date}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹"
              value={paymentMethod}
              onChange={handleInputChange}
              name="payment_method"
              select
              required
              error={errors.payment_method}
            >
              {paymentMethods.map(pm => (
                <MenuItem key={pm.id} value={pm.name}>{pm.name}</MenuItem>
              ))}
            </UnifiedFormField>
          </Grid>

          <Grid item xs={12}>
            <UnifiedFormField
              label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª"
              value={paymentNotes}
              onChange={handleInputChange}
              name="notes"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </UnifiedFormDialog>

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
