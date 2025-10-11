// src/components/tabs/SuppliersTab.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Paper, IconButton, Tooltip, InputAdornment, Chip, Divider, Tabs, Tab, MenuItem
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VisibilityIcon from '@mui/icons-material/Visibility';

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedDialog from '../common/dialogs/UnifiedDialog';
import getConfirmationConfig from '../../utils/dialogs/getConfirmationConfig';

import {
  getSuppliers, addSupplier, updateSupplier,
  getSupplierBalance, getSupplierStatement,
  settleSupplierPayment, getPaymentMethodsForUI,
  getBaseCurrencyInfo, getBatchById
} from '../../utils/database';
import { safeText, safeNotes, safeAddress, safeCompanyName } from '../../utils/displayHelpers';

const emptyForm = {
  name: '',
  company_name: '',
  phone1: '',
  phone2: '',
  address: '',
  email: '',
  tax_number: '',
  notes: ''
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [filter, setFilter] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // dialog states
  const [open, setOpen] = useState(false);
  const [openStatementDialog, setOpenStatementDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openBatchDialog, setOpenBatchDialog] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [statement, setStatement] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
  const [errors, setErrors] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    try {
      const list = getSuppliers();
      const enriched = list.map((s) => ({
        ...s,
        balance: Number(getSupplierBalance(s.id)) || 0,
      }));
      setSuppliers(enriched);

      const methods = getPaymentMethodsForUI(true);
      setPaymentMethods(methods);

      const currInfo = getBaseCurrencyInfo();
      setBaseCurrencyInfo(currInfo);
    } catch (e) {
      setError('فشل تحميل الموردين: ' + (e?.message || String(e)));
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      [s.name, s.company_name, s.phone1, s.phone2, s.address, s.email]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [suppliers, filter]);

  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const confirmationDialogConfig = useMemo(() => {
    const overrides = {};
    if (confirmDialog.type === 'payment') {
      overrides.description = `سيتم تسجيل دفعة بمبلغ ${fmt(paymentData.amount || 0)} ${baseCurrencyInfo.symbol}.`;
    }
    return getConfirmationConfig(confirmDialog.type, overrides);
  }, [confirmDialog.type, paymentData.amount, baseCurrencyInfo.symbol]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      company_name: s.company_name || '',
      phone1: s.phone1 || '',
      phone2: s.phone2 || '',
      address: s.address || '',
      email: s.email || '',
      tax_number: s.tax_number || '',
      notes: s.notes || ''
    });
    setError('');
    setErrors({});
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setErrors({});
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'اسم المورد مطلوب';
    }

    if (!form.phone1.trim()) {
      newErrors.phone1 = 'رقم الهاتف الأول مطلوب';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
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
      const payload = {
        name: form.name.trim(),
        company_name: form.company_name || null,
        phone1: form.phone1 || null,
        phone2: form.phone2 || null,
        address: form.address || null,
        email: form.email || null,
        tax_number: form.tax_number || null,
        notes: form.notes || null
      };

      const res = editingId
        ? updateSupplier(editingId, payload)
        : addSupplier(payload);

      if (res.success) {
        setSuccess(editingId ? '✓ تم تحديث المورد بنجاح' : '✓ تم إضافة المورد بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        setOpen(false);
        load();
      } else {
        setError('فشل الحفظ: ' + res.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    openConfirm(editingId ? 'update' : 'save', form, handleActualSave);
  };

  const handleOpenStatement = (supplier) => {
    setSelectedSupplier(supplier);
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    setFromDate(firstDayOfMonth);
    setToDate(today);
    loadStatement(supplier.id, firstDayOfMonth, today);
    setOpenStatementDialog(true);
  };

  const loadStatement = (supplierId, from, to) => {
    const data = getSupplierStatement(supplierId, from || null, to || null);
    setStatement(data);
  };

  const handleFilterStatement = () => {
    if (selectedSupplier) {
      loadStatement(selectedSupplier.id, fromDate, toDate);
    }
  };

  const handleOpenPayment = (supplier) => {
    setSelectedSupplier(supplier);
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
      const result = settleSupplierPayment(
        selectedSupplier.id,
        amount,
        paymentData.payment_date,
        paymentData.payment_method || paymentMethods[0]?.name || 'Cash',
        paymentData.notes
      );

      if (result.success) {
        setSuccess(`✓ تم تسجيل الدفعة بنجاح. الرصيد الجديد: ${fmt(result.balance)} ${baseCurrencyInfo.symbol}`);
        setTimeout(() => setSuccess(''), 4000);
        setOpenPaymentDialog(false);
        load();
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

  const handleViewBatch = (batchId) => {
    const batch = getBatchById(batchId);
    if (batch) {
      setSelectedBatch(batch);
      setOpenBatchDialog(true);
    } else {
      setError('لم يتم العثور على الدفعة');
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'error';  // We owe supplier
    if (balance < 0) return 'success'; // Supplier owes us
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة الموردين
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إدارة بيانات الموردين والحسابات الجارية
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<BusinessIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>قائمة الموردين</Typography>}
        />
        <Tab
          icon={<AccountBalanceIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>ملخص الحسابات</Typography>}
        />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        {/* Actions & Search */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="ابحث بالاسم، الهاتف، الشركة..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'left' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={openCreate}
                  sx={{ fontWeight: 700 }}
                >
                  مورد جديد
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الشركة</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الهاتف</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الرصيد</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">أضيف بواسطة</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد بيانات</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography fontWeight={600} fontSize="0.9375rem">{s.name}</Typography>
                      {s.email && (
                        <Typography variant="caption" color="text.secondary" fontSize="0.8125rem">{s.email}</Typography>
                      )}
                    </TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{safeCompanyName(s.company_name) || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.9375rem">
                        {s.phone1 || '—'}{s.phone2 ? ` / ${s.phone2}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${fmt(s.balance)} ${baseCurrencyInfo.symbol}`}
                        color={getBalanceColor(s.balance)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.875rem">
                        {s.created_by || '---'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="كشف حساب">
                        <IconButton size="small" color="primary" onClick={() => handleOpenStatement(s)}>
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تسديد دفعة">
                        <IconButton size="small" color="success" onClick={() => handleOpenPayment(s)}>
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton size="small" onClick={() => openEdit(s)}>
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
          {filtered.map((supplier) => (
            <Grid item xs={12} md={6} lg={4} key={supplier.id}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {supplier.name}
                  </Typography>
                  {supplier.company_name && (
                    <Typography variant="body2" color="text.secondary" gutterBottom fontSize="0.9375rem">
                      {safeCompanyName(supplier.company_name)}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">الرصيد الحالي:</Typography>
                    <Chip
                      label={`${fmt(supplier.balance)} ${baseCurrencyInfo.symbol}`}
                      color={getBalanceColor(supplier.balance)}
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
                        onClick={() => handleOpenStatement(supplier)}
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
                        onClick={() => handleOpenPayment(supplier)}
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

      {/* Dialog: Create / Edit */}
      <UnifiedFormDialog
        open={open}
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
        title={editingId ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
        subtitle="أدخل البيانات المطلوبة أدناه"
        submitText={editingId ? 'تحديث' : 'حفظ'}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="اسم المورد"
              value={form.name}
              onChange={handleChange}
              name="name"
              required
              error={errors.name}
              autoFocus
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="اسم الشركة"
              value={form.company_name}
              onChange={handleChange}
              name="company_name"
              helperText="اختياري - للشركات فقط"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="رقم الهاتف الأول"
              value={form.phone1}
              onChange={handleChange}
              name="phone1"
              type="tel"
              required
              error={errors.phone1}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="رقم الهاتف الثاني"
              value={form.phone2}
              onChange={handleChange}
              name="phone2"
              type="tel"
              helperText="اختياري"
            />
          </Grid>

          <Grid item xs={12}>
            <UnifiedFormField
              label="العنوان"
              value={form.address}
              onChange={handleChange}
              name="address"
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="البريد الإلكتروني"
              value={form.email}
              onChange={handleChange}
              name="email"
              type="email"
              error={errors.email}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الرقم الضريبي"
              value={form.tax_number}
              onChange={handleChange}
              name="tax_number"
              helperText="اختياري - للشركات المسجلة"
            />
          </Grid>

          <Grid item xs={12}>
            <UnifiedFormField
              label="ملاحظات"
              value={form.notes}
              onChange={handleChange}
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
        subtitle={`للمورد: ${selectedSupplier?.name}`}
        submitText="تسجيل الدفعة"
        loading={loading}
      >
        <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
          الرصيد الحالي: <strong>{fmt(selectedSupplier?.balance)} {baseCurrencyInfo.symbol}</strong>
        </Alert>

        <UnifiedFormField
          label="المبلغ المدفوع"
          value={paymentData.amount}
          onChange={handlePaymentChange}
          name="amount"
          type="number"
          required
          error={paymentErrors.amount}
          helperText={`الرصيد الحالي: ${fmt(selectedSupplier?.balance)} ${baseCurrencyInfo.symbol}`}
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

      {/* Dialog: Statement */}
      <UnifiedFormDialog
        open={openStatementDialog}
        onClose={() => setOpenStatementDialog(false)}
        onSubmit={() => setOpenStatementDialog(false)}
        title={`كشف حساب - ${selectedSupplier?.name}`}
        submitText="إغلاق"
        cancelText=""
        maxWidth="lg"
      >
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`الرصيد: ${fmt(selectedSupplier?.balance)} ${baseCurrencyInfo.symbol}`}
            color={getBalanceColor(selectedSupplier?.balance || 0)}
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
                        label={trans.transaction_type === 'purchase' ? 'مشتريات' : 'دفعة'}
                        color={trans.transaction_type === 'purchase' ? 'primary' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize="0.9375rem">
                        {safeNotes(trans.notes) || '---'}
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
                      {trans.transaction_type === 'purchase' && trans.reference_id && (
                        <Tooltip title="عرض تفاصيل الدفعة">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewBatch(trans.reference_id)}
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

      {/* Dialog: Batch Details */}
      <UnifiedFormDialog
        open={openBatchDialog}
        onClose={() => setOpenBatchDialog(false)}
        onSubmit={() => setOpenBatchDialog(false)}
        title={`تفاصيل الدفعة ${selectedBatch ? `#${selectedBatch.id}` : ''}`}
        submitText="إغلاق"
        cancelText=""
        maxWidth="md"
      >
        {selectedBatch && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">الصفيحة:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedBatch.sheet_code || 'غير محدد'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">التاريخ:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedBatch.received_date}
              </Typography>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">الكمية الأصلية:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedBatch.quantity_original}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">المتبقي:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedBatch.quantity_remaining}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">السعر/كغ:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedBatch.price_per_kg ? `${fmt(selectedBatch.price_per_kg)} ${baseCurrencyInfo.symbol}` : '---'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">التكلفة الكلية:</Typography>
              <Typography variant="body1" fontWeight={600} fontSize="1.0625rem">
                {selectedBatch.total_cost ? `${fmt(selectedBatch.total_cost)} ${baseCurrencyInfo.symbol}` : '---'}
              </Typography>
            </Grid>

            {selectedBatch.storage_location && (
              <>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">موقع التخزين:</Typography>
                  <Typography variant="body1" fontSize="1rem">{selectedBatch.storage_location}</Typography>
                </Grid>
              </>
            )}

            {selectedBatch.notes && (
              <>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">ملاحظات:</Typography>
                  <Typography variant="body1" fontSize="1rem">{safeNotes(selectedBatch.notes)}</Typography>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </UnifiedFormDialog>
    </Box>
  );
}
