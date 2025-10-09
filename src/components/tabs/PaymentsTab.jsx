// src/components/tabs/PaymentsTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Chip, Paper, InputAdornment, MenuItem, Tabs, Tab,
  FormControl, InputLabel, Select, IconButton, Tooltip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

import {
  getCustomers, getSuppliers,
  settleCustomerPayment, settleSupplierPayment,
  getCustomerStatement, getSupplierStatement,
  getPaymentMethodsForUI, getBaseCurrencyInfo, currencyHelpers
} from '../../utils/database';

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

  // Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  // Handle Add Payment
  const handleOpenDialog = () => {
    setSelectedPersonId(null);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(paymentMethods[0]?.name || '');
    setPaymentCurrency(baseCurrencyInfo.code);
    setPaymentNotes('');
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmitPayment = () => {
    setError('');

    if (!selectedPersonId) {
      setError(tabValue === 0 ? 'يجب اختيار زبون' : 'يجب اختيار مورد');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

    if (!paymentMethod) {
      setError('يجب اختيار طريقة الدفع');
      return;
    }

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
      setSuccess('✓ تم تسجيل الدفعة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      handleCloseDialog();
      loadData();
    } else {
      setError('فشل التسجيل: ' + result.error);
    }
  };

  const handleClearFilters = () => {
    setFilterPerson('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const personList = tabValue === 0 ? customers : suppliers;
  const personLabel = tabValue === 0 ? 'الزبون' : 'المورد';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة الدفعات
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          تسجيل ومتابعة دفعات الزبائن والموردين
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
                إجمالي الدفعات
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
                عدد الدفعات
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
                دفعات اليوم
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
                عدد دفعات اليوم
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
            label={<Typography fontSize="1rem" fontWeight={600}>دفعات الزبائن</Typography>}
          />
          <Tab 
            icon={<BusinessIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>دفعات الموردين</Typography>}
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
                  <MenuItem value="">الكل</MenuItem>
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
                label="من تاريخ"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="إلى تاريخ"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="مسح الفلاتر">
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
                  تسجيل دفعة
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
              <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">{personLabel}</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">المبلغ</Typography></TableCell>
              <TableCell><Typography fontWeight={700} fontSize="1rem">الملاحظات</Typography></TableCell>
              <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الرصيد بعد الدفعة</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد دفعات</Typography>
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
                      {payment.notes || '—'}
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
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              تسجيل دفعة {tabValue === 0 ? 'زبون' : 'مورد'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{personLabel} *</InputLabel>
                <Select
                  value={selectedPersonId || ''}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  label={`${personLabel} *`}
                >
                  {personList.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="المبلغ المدفوع *"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{ step: 0.01, min: 0 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {baseCurrencyInfo.symbol}
                    </InputAdornment>
                  )
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="العملة"
                value={paymentCurrency}
                onChange={(e) => setPaymentCurrency(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="SYP">ليرة سورية</option>
                <option value="USD">دولار أمريكي</option>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="تاريخ الدفعة *"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>طريقة الدفع *</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="طريقة الدفع *"
                >
                  {paymentMethods.map(pm => (
                    <MenuItem key={pm.id} value={pm.name}>{pm.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="ملاحظات"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} size="large">إلغاء</Button>
          <Button variant="contained" onClick={handleSubmitPayment} size="large">
            تسجيل الدفعة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}