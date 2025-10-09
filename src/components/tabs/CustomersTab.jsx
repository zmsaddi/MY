// src/components/tabs/CustomersTab.jsx
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Alert, Chip, Paper, Tabs, Tab, InputAdornment, Divider, Tooltip, Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import {
  getCustomers, addCustomer, updateCustomer,
  getCustomerBalance, getCustomerStatement,
  settleCustomerPayment, getPaymentMethodsForUI,
  getBaseCurrencyInfo, getSaleById
} from '../../utils/database';

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

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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

  const handleOpenDialog = (customer = null) => {
    setError('');
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
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setError('الاسم مطلوب');
      return;
    }

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
    setOpenPaymentDialog(true);
  };

  const handleSavePayment = () => {
    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

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
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={3} fontSize="1rem">لا يوجد زبائن</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell><Typography fontSize="0.9375rem">{customer.name}</Typography></TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{customer.company_name || '---'}</Typography></TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{customer.phone1 || '---'}</Typography></TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${fmt(customer.balance)} ${baseCurrencyInfo.symbol}`}
                        color={getBalanceColor(customer.balance)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      />
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
                      {customer.company_name}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            {selectedCustomer ? 'تعديل زبون' : 'إضافة زبون جديد'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الاسم *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم الشركة"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الهاتف 1"
                value={formData.phone1}
                onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الهاتف 2"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الرقم الضريبي"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} size="large">إلغاء</Button>
          <Button onClick={handleSave} variant="contained" size="large">حفظ</Button>
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
            تسديد دفعة - {selectedCustomer?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
              الرصيد الحالي: <strong>{fmt(selectedCustomer?.balance)} {baseCurrencyInfo.symbol}</strong>
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
                  InputLabelProps={{ shrink: true }}
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
              كشف حساب - {selectedCustomer?.name}
            </Typography>
            <Chip
              label={`الرصيد: ${fmt(selectedCustomer?.balance)} ${baseCurrencyInfo.symbol}`}
              color={getBalanceColor(selectedCustomer?.balance || 0)}
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
                            trans.notes || '---'
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenStatementDialog(false)} size="large">إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Invoice Details */}
      <Dialog 
        open={openInvoiceDialog} 
        onClose={() => setOpenInvoiceDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" fontWeight={700}>
                  تفاصيل الفاتورة {selectedInvoice.invoice_number}
                </Typography>
                <Chip 
                  label={selectedInvoice.payment_status === 'paid' ? 'مدفوعة' : selectedInvoice.payment_status === 'partial' ? 'جزئية' : 'غير مدفوعة'}
                  color={selectedInvoice.payment_status === 'paid' ? 'success' : selectedInvoice.payment_status === 'partial' ? 'warning' : 'error'}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
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
                      <Typography variant="body1" fontSize="1rem">{selectedInvoice.notes}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setOpenInvoiceDialog(false)} size="large">إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}