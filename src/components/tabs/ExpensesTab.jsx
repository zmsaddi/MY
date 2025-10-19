// src/components/tabs/ExpensesTab.jsx
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Chip, Paper, IconButton, Tooltip, Tabs, Tab, MenuItem, InputAdornment
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedConfirmDialog from '../common/dialogs/UnifiedConfirmDialog';
import { confirmationMessages } from '../../theme/designSystem';

import {
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  getBaseCurrencyInfo
} from '../../utils/database';
import { safeNotes, safeDescription } from '../../utils/displayHelpers';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

export default function ExpensesTab() {
  const [currentTab, setCurrentTab] = useState(0);

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dialogs
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);

  // Selected items
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form data
  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name_ar: '',
    name_en: '',
    is_active: true
  });

  // UI state
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [categoryErrors, setCategoryErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cats = getExpenseCategories(false);
    setCategories(cats);

    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    setFromDate(firstDay);
    setToDate(today);

    loadExpenses(firstDay, today);

    const currInfo = getBaseCurrencyInfo();
    setBaseCurrencyInfo(currInfo);
  };

  const loadExpenses = (from, to) => {
    const data = getAllExpenses(from || null, to || null);
    setExpenses(data);
  };

  const handleFilterExpenses = () => {
    loadExpenses(fromDate, toDate);
  };

  // Helper functions for confirmation dialogs
  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // ===== Expense Validation =====
  const validateExpenseForm = () => {
    const newErrors = {};

    if (!expenseForm.category_id) {
      newErrors.category_id = 'الفئة مطلوبة';
    }

    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.amount || amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    }

    if (!expenseForm.description.trim()) {
      newErrors.description = 'الوصف مطلوب';
    }

    if (!expenseForm.expense_date) {
      newErrors.expense_date = 'تاريخ المصروف مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== Expense Dialog =====
  const handleOpenExpenseDialog = (expense = null) => {
    setError('');
    setErrors({});
    if (expense) {
      setExpenseForm({
        category_id: expense.category_id,
        amount: expense.amount,
        description: expense.description,
        expense_date: expense.expense_date,
        notes: expense.notes || ''
      });
      setSelectedExpense(expense);
    } else {
      setExpenseForm({
        category_id: categories.find(c => c.is_active)?.id || '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setSelectedExpense(null);
    }
    setOpenExpenseDialog(true);
  };

  const handleCloseExpenseDialog = () => {
    setOpenExpenseDialog(false);
    setSelectedExpense(null);
    setError('');
    setErrors({});
  };

  const handleActualSaveExpense = async () => {
    if (!validateExpenseForm()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedExpense) {
        result = updateExpense(selectedExpense.id, {
          category_id: expenseForm.category_id,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description.trim(),
          expense_date: expenseForm.expense_date,
          notes: expenseForm.notes.trim() || null
        });
      } else {
        result = addExpense({
          category_id: expenseForm.category_id,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description.trim(),
          expense_date: expenseForm.expense_date,
          notes: expenseForm.notes.trim() || null
        });
      }

      if (result.success) {
        setSuccess(selectedExpense ? 'تم تحديث المصروف بنجاح' : 'تم إضافة المصروف بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseExpenseDialog();
        loadExpenses(fromDate, toDate);
      } else {
        setError('فشل الحفظ: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseFormSubmit = () => {
    openConfirm(selectedExpense ? 'update' : 'save', expenseForm, handleActualSaveExpense);
  };

  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm({ ...expenseForm, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleActualDeleteExpense = async (expenseId) => {
    setLoading(true);
    try {
      const result = deleteExpense(expenseId);
      if (result.success) {
        setSuccess('تم حذف المصروف بنجاح');
        setTimeout(() => setSuccess(''), 2500);
        loadExpenses(fromDate, toDate);
      } else {
        setError('فشل الحذف: ' + result.error);
      }
    } catch (err) {
      setError('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expenseId) => {
    openConfirm('delete', { id: expenseId }, () => handleActualDeleteExpense(expenseId));
  };

  // ===== Category Validation =====
  const validateCategoryForm = () => {
    const newErrors = {};

    if (!categoryForm.name_ar.trim()) {
      newErrors.name_ar = 'اسم الفئة بالعربي مطلوب';
    }

    setCategoryErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== Category Dialog =====
  const handleOpenCategoryDialog = (category = null) => {
    setError('');
    setCategoryErrors({});
    if (category) {
      setCategoryForm({
        name_ar: category.name_ar,
        name_en: category.name_en || '',
        is_active: !!category.is_active
      });
      setSelectedCategory(category);
    } else {
      setCategoryForm({
        name_ar: '',
        name_en: '',
        is_active: true
      });
      setSelectedCategory(null);
    }
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setSelectedCategory(null);
    setError('');
    setCategoryErrors({});
  };

  const handleActualSaveCategory = async () => {
    if (!validateCategoryForm()) {
      closeConfirm();
      return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedCategory) {
        result = updateExpenseCategory(selectedCategory.id, {
          name_ar: categoryForm.name_ar.trim(),
          name_en: categoryForm.name_en.trim() || null,
          is_active: categoryForm.is_active ? 1 : 0
        });
      } else {
        result = addExpenseCategory({
          name_ar: categoryForm.name_ar.trim(),
          name_en: categoryForm.name_en.trim() || null,
          is_active: categoryForm.is_active ? 1 : 0
        });
      }

      if (result.success) {
        setSuccess(selectedCategory ? 'تم تحديث الفئة بنجاح' : 'تم إضافة الفئة بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseCategoryDialog();
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

  const handleCategoryFormSubmit = () => {
    openConfirm(selectedCategory ? 'update' : 'save', categoryForm, handleActualSaveCategory);
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm({ ...categoryForm, [name]: value });
    if (categoryErrors[name]) {
      setCategoryErrors({ ...categoryErrors, [name]: null });
    }
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة المصروفات
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          تسجيل وإدارة مصروفات الشركة
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<ReceiptLongIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>المصروفات</Typography>}
        />
        <Tab
          icon={<CategoryIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>الفئات</Typography>}
        />
      </Tabs>

      {/* Tab 0: Expenses */}
      <TabPanel value={currentTab} index={0}>
        {/* Summary Card */}
        <Card sx={{ borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <MoneyOffIcon sx={{ fontSize: 48, color: 'white' }} />
              </Grid>
              <Grid item xs>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }} fontSize="1rem">
                  إجمالي المصروفات
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>
                  {fmt(totalExpenses)} {baseCurrencyInfo.symbol}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  من {fromDate} إلى {toDate}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filter Card */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="من تاريخ"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleFilterExpenses}
                >
                  تطبيق الفلتر
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenExpenseDialog()}
                  sx={{ fontWeight: 700 }}
                >
                  إضافة مصروف
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الفئة</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">الوصف</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight={700} fontSize="1rem">المبلغ</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">ملاحظات</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">أضيفت بواسطة</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3} fontSize="1rem">لا توجد مصروفات</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell><Typography fontSize="0.9375rem">{expense.expense_date}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={expense.category_name}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{safeDescription(expense.description)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="error.main" fontSize="1rem">
                        {fmt(expense.amount)} {baseCurrencyInfo.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                        {safeNotes(expense.notes) || '---'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.875rem">
                        {expense.created_by || '---'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="تعديل">
                        <IconButton size="small" color="primary" onClick={() => handleOpenExpenseDialog(expense)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton size="small" color="error" onClick={() => handleDeleteExpense(expense.id)}>
                          <DeleteIcon fontSize="small" />
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

      {/* Tab 1: Categories */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCategoryDialog()}
            sx={{ fontWeight: 700 }}
          >
            إضافة فئة جديدة
          </Button>
        </Box>

        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} md={6} lg={4} key={category.id}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {category.name_ar}
                      </Typography>
                      {category.name_en && (
                        <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                          {category.name_en}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={category.is_active ? 'مفعّل' : 'موقوف'}
                      color={category.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenCategoryDialog(category)}
                    >
                      تعديل
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Dialog: Add/Edit Expense */}
      <UnifiedFormDialog
        open={openExpenseDialog}
        onClose={handleCloseExpenseDialog}
        onSubmit={handleExpenseFormSubmit}
        title={selectedExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
        subtitle="أدخل البيانات المطلوبة أدناه"
        submitText={selectedExpense ? 'تحديث' : 'حفظ'}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الفئة"
              value={expenseForm.category_id}
              onChange={handleExpenseInputChange}
              name="category_id"
              select
              required
              error={errors.category_id}
            >
              <MenuItem value="">-- اختر الفئة --</MenuItem>
              {categories.filter(c => c.is_active).map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name_ar}</MenuItem>
              ))}
            </UnifiedFormField>
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="المبلغ"
              value={expenseForm.amount}
              onChange={handleExpenseInputChange}
              name="amount"
              type="number"
              required
              error={errors.amount}
              inputProps={{ step: 0.01, min: 0.01 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">{baseCurrencyInfo.symbol}</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="الوصف"
              value={expenseForm.description}
              onChange={handleExpenseInputChange}
              name="description"
              required
              error={errors.description}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="تاريخ المصروف"
              value={expenseForm.expense_date}
              onChange={handleExpenseInputChange}
              name="expense_date"
              type="date"
              required
              error={errors.expense_date}
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="ملاحظات"
              value={expenseForm.notes}
              onChange={handleExpenseInputChange}
              name="notes"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </UnifiedFormDialog>

      {/* Dialog: Add/Edit Category */}
      <UnifiedFormDialog
        open={openCategoryDialog}
        onClose={handleCloseCategoryDialog}
        onSubmit={handleCategoryFormSubmit}
        title={selectedCategory ? 'تعديل فئة' : 'إضافة فئة جديدة'}
        subtitle="أدخل البيانات المطلوبة أدناه"
        submitText={selectedCategory ? 'تحديث' : 'حفظ'}
        loading={loading}
        maxWidth="sm"
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <UnifiedFormField
              label="اسم الفئة (عربي)"
              value={categoryForm.name_ar}
              onChange={handleCategoryInputChange}
              name="name_ar"
              required
              error={categoryErrors.name_ar}
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="اسم الفئة (إنجليزي)"
              value={categoryForm.name_en}
              onChange={handleCategoryInputChange}
              name="name_en"
              helperText="اختياري"
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography fontSize="1rem">الحالة:</Typography>
              <Chip
                label={categoryForm.is_active ? 'مفعّل' : 'موقوف'}
                color={categoryForm.is_active ? 'success' : 'default'}
                onClick={() => setCategoryForm({ ...categoryForm, is_active: !categoryForm.is_active })}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Grid>
        </Grid>
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
