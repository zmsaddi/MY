// src/components/tabs/CustomersTab.jsx
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Alert, Chip, Paper, Tabs, Tab, InputAdornment, Divider, Tooltip, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedConfirmDialog from '../common/dialogs/UnifiedConfirmDialog';
import { confirmationMessages } from '../../theme/designSystem';

import {
  getCustomers, addCustomer, updateCustomer,
  getCustomerBalance, getCustomerStatement,
  settleCustomerPayment, getPaymentMethodsForUI,
  getBaseCurrencyInfo, getSaleById
} from '../../utils/database';
import { safeText, safeNotes, safeAddress, safeCompanyName } from '../../utils/displayHelpers';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openStatementDialog, setOpenStatementDialog] = useState(false);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statement, setStatement] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone1: '',
    phone2: '',
    address: '',
    email: '',
    tax_number: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: ''
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const loadData = () => {
    const data = getCustomers();
    const enriched = data.map((c) => ({
      ...c,
      balance: getCustomerBalance(c.id),
    }));
    setCustomers(enriched);
    setFilteredCustomers(enriched);

    const methods = getPaymentMethodsForUI(true);
    setPaymentMethods(methods);

    const currInfo = getBaseCurrencyInfo();
    setBaseCurrencyInfo(currInfo);
  };

  const filterCustomers = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredCustomers(customers);
      return;
    }
    const filtered = customers.filter((c) =>
      (c.name || '').toLowerCase().includes(term) ||
      (c.company_name || '').toLowerCase().includes(term) ||
      (c.phone1 || '').toLowerCase().includes(term)
    );
    setFilteredCustomers(filtered);
  };

  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleOpenDialog = (customer = null) => {
    setError('');
    setErrors({});
    if (customer) {
      setFormData({
        name: customer.name || '',
        company_name: customer.company_name || '',
        phone1: customer.phone1 || '',
        phone2: customer.phone2 || '',
        address: customer.address || '',
        email: customer.email || '',
        tax_number: customer.tax_number || '',
        notes: customer.notes || ''
      });
      setSelectedCustomer(customer);
    } else {
      setFormData({
        name: '',
        company_name: '',
        phone1: '',
        phone2: '',
        address: '',
        email: '',
        tax_number: '',
        notes: ''
      });
      setSelectedCustomer(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    setError('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الزبون مطلوب';
    }

    if (!formData.phone1.trim()) {
      newErrors.phone1 = 'رقم الهاتف الأول مطلوب';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualSave = async () => {
    if (!validateForm()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedCustomer) {
        result = updateCustomer(selectedCustomer.id, formData);
      } else {
        result = addCustomer(formData);
      }

      if (result.success) {
        setSuccess(selectedCustomer ? '✓ تم تحديث بيانات الزبون' : '✓ تم حفظ الزبون بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseDialog();
        loadData();
      } else {
        setError('فشل الحفظ: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    openConfirm(selectedCustomer ? 'update' : 'save', formData, handleActualSave);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleOpenPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethods[0]?.name || '',
      notes: ''
    });
    setError('');
    setPaymentErrors({});
    setOpenPaymentDialog(true);
  };

  const validatePayment = () => {
    const newErrors = {};
    const amount = parseFloat(paymentData.amount);

    if (!amount || amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    }

    if (!paymentData.payment_date) {
      newErrors.payment_date = 'تاريخ الدفع مطلوب';
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualSavePayment = async () => {
    if (!validatePayment()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(paymentData.amount);
      const result = settleCustomerPayment(
        selectedCustomer.id,
        amount,
        paymentData.payment_date,
        paymentData.payment_method || paymentMethods[0]?.name || 'Cash',
        paymentData.notes
      );

      if (result.success) {
        setSuccess(`✓ تم تسجيل الدفعة بنجاح. الرصيد الجديد: ${fmt(result.balance)} ${baseCurrencyInfo.symbol}`);
        setTimeout(() => setSuccess(''), 4000);
        setOpenPaymentDialog(false);
        loadData();
      } else {
        setError('فشل تسجيل الدفعة: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = () => {
    openConfirm('payment', paymentData, handleActualSavePayment);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
    if (paymentErrors[name]) {
      setPaymentErrors({ ...paymentErrors, [name]: null });
    }
  };

  const handleOpenStatement = (customer) => {
    setSelectedCustomer(customer);
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    setFromDate(firstDayOfMonth);
    setToDate(today);
    loadStatement(customer.id, firstDayOfMonth, today);
    setOpenStatementDialog(true);
  };

  const loadStatement = (customerId, from, to) => {
    const data = getCustomerStatement(customerId, from || null, to || null);
    setStatement(data);
  };

  const handleFilterStatement = () => {
    if (selectedCustomer) {
      loadStatement(selectedCustomer.id, fromDate, toDate);
    }
  };

  const handleViewInvoice = (saleId) => {
    const sale = getSaleById(saleId);
    if (sale) {
      setSelectedInvoice(sale);
      setOpenInvoiceDialog(true);
    } else {
      setError('لم يتم العثور على الفاتورة');
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'error';
    if (balance < 0) return 'success';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة الزبائن
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إدارة بيانات الزبائن والحسابات الجارية
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<PersonIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>قائمة الزبائن</Typography>}
        />
        <Tab
          icon={<AccountBalanceIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>ملخص الحسابات</Typography>}
        />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="بحث بالاسم، الشركة، أو الهاتف..."
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
              <Grid item xs={12} md={6} sx={{ textAlign: 'left' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ fontWeight: 700 }}
                >
                  إضافة زبون جديد
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الشركة</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الهاتف</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الرصيد</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">أضيف بواسطة</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={3} fontSize="1rem">لا يوجد زبائن</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell><Typography fontSize="0.9375rem">{customer.name}</Typography></TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{safeCompanyName(customer.company_name) || '---'}</Typography></TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{customer.phone1 || '---'}</Typography></TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${fmt(customer.balance)} ${baseCurrencyInfo.symbol}`}
                        color={getBalanceColor(customer.balance)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.875rem">
                        {customer.created_by || '---'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="كشف حساب">
                        <IconButton size="small" color="primary" onClick={() => handleOpenStatement(customer)}>
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تسديد دفعة">
                        <IconButton size="small" color="success" onClick={() => handleOpenPayment(customer)}>
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton size="small" onClick={() => handleOpenDialog(customer)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          {filteredCustomers.map((customer) => (
            <Grid item xs={12} md={6} lg={4} key={customer.id}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {customer.name}
                  </Typography>
                  {customer.company_name && (
                    <Typography variant="body2" color="text.secondary" gutterBottom fontSize="0.9375rem">
                      {safeCompanyName(customer.company_name)}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">الرصيد الحالي:</Typography>
                    <Chip
                      label={`${fmt(customer.balance)} ${baseCurrencyInfo.symbol}`}
                      color={getBalanceColor(customer.balance)}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="medium"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handleOpenStatement(customer)}
                      >
                        كشف حساب
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="medium"
                        variant="contained"
                        color="success"
                        startIcon={<PaymentIcon />}
                        onClick={() => handleOpenPayment(customer)}
                      >
                        تسديد
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Dialog: Add/Edit Customer */}
      <UnifiedFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleFormSubmit}
        title={selectedCustomer ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
        subtitle="أدخل البيانات المطلوبة أدناه"
        submitText={selectedCustomer ? 'تحديث' : 'حفظ'}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="اسم الزبون"
              value={formData.name}
              onChange={handleInputChange}
              name="name"
              required
              error={errors.name}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="اسم الشركة"
              value={formData.company_name}
              onChange={handleInputChange}
              name="company_name"
              helperText="اختياري - للشركات فقط"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="رقم الهاتف الأول"
              value={formData.phone1}
              onChange={handleInputChange}
              name="phone1"
              type="tel"
              required
              error={errors.phone1}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="رقم الهاتف الثاني"
              value={formData.phone2}
              onChange={handleInputChange}
              name="phone2"
              type="tel"
              helperText="اختياري"
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="العنوان"
              value={formData.address}
              onChange={handleInputChange}
              name="address"
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="البريد الإلكتروني"
              value={formData.email}
              onChange={handleInputChange}
              name="email"
              type="email"
              error={errors.email}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الرقم الضريبي"
              value={formData.tax_number}
              onChange={handleInputChange}
              name="tax_number"
              helperText="اختياري - للشركات المسجلة"
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="ملاحظات"
              value={formData.notes}
              onChange={handleInputChange}
              name="notes"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </UnifiedFormDialog>

      {/* Dialog: Payment */}
      <UnifiedFormDialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        onSubmit={handlePaymentSubmit}
        title="تسجيل دفعة جديدة"
        subtitle={`للزبون: ${selectedCustomer?.name}`}
        submitText="تسجيل الدفعة"
        loading={loading}
      >
        <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
          الرصيد الحالي: <strong>{fmt(selectedCustomer?.balance)} {baseCurrencyInfo.symbol}</strong>
        </Alert>

        <UnifiedFormField
          label="المبلغ المدفوع"
          value={paymentData.amount}
          onChange={handlePaymentChange}
          name="amount"
          type="number"
          required
          error={paymentErrors.amount}
          helperText={`الرصيد الحالي: ${fmt(selectedCustomer?.balance)} ${baseCurrencyInfo.symbol}`}
          inputProps={{ step: 0.01, min: 0.01 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
          }}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="تاريخ الدفع"
              value={paymentData.payment_date}
              onChange={handlePaymentChange}
              name="payment_date"
              type="date"
              required
              error={paymentErrors.payment_date}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="طريقة الدفع"
              value={paymentData.payment_method}
              onChange={handlePaymentChange}
              name="payment_method"
              select
              required
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.name}>
                  {method.name}
                </MenuItem>
              ))}
            </UnifiedFormField>
          </Grid>
        </Grid>

        <UnifiedFormField
          label="ملاحظات"
          value={paymentData.notes}
          onChange={handlePaymentChange}
          name="notes"
          multiline
          rows={2}
        />
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
        message={
          confirmDialog.type === 'payment'
            ? `تسجيل دفعة بمبلغ ${fmt(paymentData.amount)} ${baseCurrencyInfo.symbol}؟`
            : confirmationMessages[confirmDialog.type]?.message
        }
        loading={loading}
      />

      {/* Dialog: Statement */}
      <UnifiedFormDialog
        open={openStatementDialog}
        onClose={() => setOpenStatementDialog(false)}
        onSubmit={() => setOpenStatementDialog(false)}
        title={`كشف حساب - ${selectedCustomer?.name}`}
        submitText="إغلاق"
        cancelText=""
        maxWidth="lg"
      >
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`الرصيد: ${fmt(selectedCustomer?.balance)} ${baseCurrencyInfo.symbol}`}
            color={getBalanceColor(selectedCustomer?.balance || 0)}
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="من تاريخ"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="إلى تاريخ"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleFilterStatement}
            >
              تطبيق الفلتر
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">النوع</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الملاحظات</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight={700} fontSize="1rem">المبلغ</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight={700} fontSize="1rem">الرصيد</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statement.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد حركات</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                statement.map((trans) => (
                  <TableRow key={trans.id} hover>
                    <TableCell><Typography fontSize="0.9375rem">{trans.transaction_date}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={trans.transaction_type === 'sale' ? 'مبيعات' : 'دفعة'}
                        color={trans.transaction_type === 'sale' ? 'primary' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize="0.9375rem">
                        {trans.transaction_type === 'sale' && trans.invoice_number ? (
                          <>فاتورة {trans.invoice_number}</>
                        ) : (
                          safeNotes(trans.notes) || '---'
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={trans.amount > 0 ? 'error.main' : 'success.main'}
                        fontWeight={600}
                        fontSize="0.9375rem"
                      >
                        {trans.amount > 0 ? '+' : ''}{fmt(trans.amount)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} fontSize="0.9375rem">
                        {fmt(trans.balance_after)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {trans.transaction_type === 'sale' && trans.sale_id && (
                        <Tooltip title="عرض تفاصيل الفاتورة">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewInvoice(trans.sale_id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </UnifiedFormDialog>

      {/* Dialog: Invoice Details */}
      <UnifiedFormDialog
        open={openInvoiceDialog}
        onClose={() => setOpenInvoiceDialog(false)}
        onSubmit={() => setOpenInvoiceDialog(false)}
        title={`تفاصيل الفاتورة ${selectedInvoice?.invoice_number}`}
        submitText="إغلاق"
        cancelText=""
        maxWidth="md"
      >
        {selectedInvoice && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Chip
                label={selectedInvoice.payment_status === 'paid' ? 'مدفوعة' : selectedInvoice.payment_status === 'partial' ? 'جزئية' : 'غير مدفوعة'}
                color={selectedInvoice.payment_status === 'paid' ? 'success' : selectedInvoice.payment_status === 'partial' ? 'warning' : 'error'}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">الزبون:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedInvoice.customer_name || 'غير محدد'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">التاريخ:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedInvoice.sale_date}
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
                    {selectedInvoice.items?.map((item, idx) => (
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
                {fmt(selectedInvoice.subtotal)} {baseCurrencyInfo.symbol}
              </Typography>
            </Grid>

            {selectedInvoice.discount > 0 && (
              <>
                <Grid item xs={6}><Typography fontSize="1.0625rem">الخصم:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={600}>
                    -{fmt(selectedInvoice.discount)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>
              </>
            )}

            {selectedInvoice.tax > 0 && (
              <>
                <Grid item xs={6}><Typography fontSize="1.0625rem">الضريبة:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={600}>
                    {fmt(selectedInvoice.tax)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>
              </>
            )}

            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={6}><Typography variant="h6" fontWeight={700}>الإجمالي:</Typography></Grid>
            <Grid item xs={6} sx={{ textAlign: 'left' }}>
              <Typography variant="h6" fontWeight={700} color="primary">
                {fmt(selectedInvoice.total_amount)} {baseCurrencyInfo.symbol}
              </Typography>
            </Grid>

            <Grid item xs={6}><Typography fontSize="1.0625rem">المدفوع:</Typography></Grid>
            <Grid item xs={6} sx={{ textAlign: 'left' }}>
              <Typography fontSize="1.0625rem" fontWeight={600} color="success.main">
                {fmt(selectedInvoice.total_paid)} {baseCurrencyInfo.symbol}
              </Typography>
            </Grid>

            {selectedInvoice.remaining > 0 && (
              <>
                <Grid item xs={6}><Typography fontSize="1.0625rem" color="error">المتبقي:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <Typography fontSize="1.0625rem" fontWeight={700} color="error.main">
                    {fmt(selectedInvoice.remaining)} {baseCurrencyInfo.symbol}
                  </Typography>
                </Grid>
              </>
            )}

            {selectedInvoice.notes && (
              <>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">ملاحظات:</Typography>
                  <Typography variant="body1" fontSize="1rem">{safeNotes(selectedInvoice.notes)}</Typography>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </UnifiedFormDialog>
    </Box>
  );
}
