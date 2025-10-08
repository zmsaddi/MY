// src/components/tabs/SuppliersTab.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Paper, IconButton, Tooltip, InputAdornment, Chip, Divider, Tabs, Tab
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

import {
  getSuppliers, addSupplier, updateSupplier,
  getSupplierBalance, getSupplierStatement,
  settleSupplierPayment, getPaymentMethodsForUI,
  getBaseCurrencyInfo, getBatchById
} from '../../utils/database';

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
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
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setError('');
    if (!form.name.trim()) {
      setError('اسم المورد مطلوب');
      return;
    }

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
    setOpenPaymentDialog(true);
  };

  const handleSavePayment = () => {
    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

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
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
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
                    <TableCell><Typography fontSize="0.9375rem">{s.company_name || '—'}</Typography></TableCell>
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
                      {supplier.company_name}
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
      <Dialog
        open={open}
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingId ? <BusinessIcon color="primary" /> : <AddIcon color="primary" />}
            <Typography variant="h6" fontWeight={700}>
              {editingId ? 'تعديل مورد' : 'إضافة مورد'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                label="اسم المورد *"
                fullWidth
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="اسم الشركة"
                fullWidth
                value={form.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="الهاتف 1"
                fullWidth
                value={form.phone1}
                onChange={(e) => handleChange('phone1', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIphoneIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="الهاتف 2"
                fullWidth
                value={form.phone2}
                onChange={(e) => handleChange('phone2', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="العنوان"
                fullWidth
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="البريد الإلكتروني"
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="الرقم الضريبي"
                fullWidth
                value={form.tax_number}
                onChange={(e) => handleChange('tax_number', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="ملاحظات"
                fullWidth
                multiline
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog} size="large">إلغاء</Button>
          <Button variant="contained" onClick={handleSubmit} size="large">
            {editingId ? 'حفظ التعديلات' : 'إضافة المورد'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Payment */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={() => setOpenPaymentDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            تسديد دفعة - {selectedSupplier?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
              الرصيد الحالي: <strong>{fmt(selectedSupplier?.balance)} {baseCurrencyInfo.symbol}</strong>
            </Alert>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="المبلغ المدفوع"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  inputProps={{ step: 0.01, min: 0.01 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePayment()}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ الدفع"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="طريقة الدفع"
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.name}>{method.name}</option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="ملاحظات"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenPaymentDialog(false)} size="large">إلغاء</Button>
          <Button onClick={handleSavePayment} variant="contained" color="success" size="large">تسديد</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Statement */}
      <Dialog 
        open={openStatementDialog} 
        onClose={() => setOpenStatementDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              كشف حساب - {selectedSupplier?.name}
            </Typography>
            <Chip
              label={`الرصيد: ${fmt(selectedSupplier?.balance)} ${baseCurrencyInfo.symbol}`}
              color={getBalanceColor(selectedSupplier?.balance || 0)}
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
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
                      <TableCell><Typography fontSize="0.9375rem">{trans.notes || '---'}</Typography></TableCell>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenStatementDialog(false)} size="large">إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Batch Details */}
      <Dialog 
        open={openBatchDialog} 
        onClose={() => setOpenBatchDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedBatch && (
          <>
            <DialogTitle>
              <Typography variant="h5" fontWeight={700}>
                تفاصيل الدفعة #{selectedBatch.id}
              </Typography>
            </DialogTitle>
            <DialogContent>
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
                      <Typography variant="body1" fontSize="1rem">{selectedBatch.notes}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setOpenBatchDialog(false)} size="large">إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
