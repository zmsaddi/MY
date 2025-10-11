// src/components/tabs/ExpensesTab.jsx
import { useState, useEffect, useMemo } from 'react';
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
import UnifiedDialog from '../common/dialogs/UnifiedDialog';
import getConfirmationConfig from '../../utils/dialogs/getConfirmationConfig';

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

  const confirmationDialogConfig = useMemo(
    () => getConfirmationConfig(confirmDialog.type),
    [confirmDialog.type]
  );

  // ===== Expense Validation =====
  const validateExpenseForm = () => {
    const newErrors = {};

    if (!expenseForm.category_id) {
      newErrors.category_id = 'Ø§Ù„ÙØ¦Ø© Ù…Ø·Ù„ÙˆØ¨Ø©';
    }

    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.amount || amount <= 0) {
      newErrors.amount = 'Ø§Ù„Ù…Ø¨Ù„Øº ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±';
    }

    if (!expenseForm.description.trim()) {
      newErrors.description = 'Ø§Ù„ÙˆØµÙ Ù…Ø·Ù„ÙˆØ¨';
    }

    if (!expenseForm.expense_date) {
      newErrors.expense_date = 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ØµØ±ÙˆÙ Ù…Ø·Ù„ÙˆØ¨';
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
        setSuccess(selectedExpense ? 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…ØµØ±ÙˆÙ Ø¨Ù†Ø¬Ø§Ø­' : 'ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…ØµØ±ÙˆÙ Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseExpenseDialog();
        loadExpenses(fromDate, toDate);
      } else {
        setError('ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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
        setSuccess('ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…ØµØ±ÙˆÙ Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 2500);
        loadExpenses(fromDate, toDate);
      } else {
        setError('ÙØ´Ù„ Ø§Ù„Ø­Ø°Ù: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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
      newErrors.name_ar = 'Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø© Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠ Ù…Ø·Ù„ÙˆØ¨';
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
        setSuccess(selectedCategory ? 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙØ¦Ø© Ø¨Ù†Ø¬Ø§Ø­' : 'ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„ÙØ¦Ø© Ø¨Ù†Ø¬Ø§Ø­');
        setTimeout(() => setSuccess(''), 3000);
        handleCloseCategoryDialog();
        loadData();
      } else {
        setError('ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸: ' + result.error);
      }
    } catch (err) {
      setError('Ø­Ø¯Ø« Ø®Ø·Ø£: ' + err.message);
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
          Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          ØªØ³Ø¬ÙŠÙ„ ÙˆØ¥Ø¯Ø§Ø±Ø© Ù…ØµØ±ÙˆÙØ§Øª Ø§Ù„Ø´Ø±ÙƒØ©
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<ReceiptLongIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª</Typography>}
        />
        <Tab
          icon={<CategoryIcon />}
          iconPosition="start"
          label={<Typography fontSize="1rem" fontWeight={600}>Ø§Ù„ÙØ¦Ø§Øª</Typography>}
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
                  Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>
                  {fmt(totalExpenses)} {baseCurrencyInfo.symbol}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Ù…Ù† {fromDate} Ø¥Ù„Ù‰ {toDate}
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
                  label="Ù…Ù† ØªØ§Ø±ÙŠØ®"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Ø¥Ù„Ù‰ ØªØ§Ø±ÙŠØ®"
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
                  ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ÙÙ„ØªØ±
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
                  Ø¥Ø¶Ø§ÙØ© Ù…ØµØ±ÙˆÙ
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
                <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ØªØ§Ø±ÙŠØ®</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙØ¦Ø©</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">Ø§Ù„ÙˆØµÙ</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight={700} fontSize="1rem">Ø§Ù„Ù…Ø¨Ù„Øº</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">Ù…Ù„Ø§Ø­Ø¸Ø§Øª</Typography></TableCell>
                <TableCell><Typography fontWeight={700} fontSize="1rem">Ø£Ø¶ÙŠÙØª Ø¨ÙˆØ§Ø³Ø·Ø©</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3} fontSize="1rem">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØµØ±ÙˆÙØ§Øª</Typography>
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
                      <Tooltip title="ØªØ¹Ø¯ÙŠÙ„">
                        <IconButton size="small" color="primary" onClick={() => handleOpenExpenseDialog(expense)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ø­Ø°Ù">
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
            Ø¥Ø¶Ø§ÙØ© ÙØ¦Ø© Ø¬Ø¯ÙŠØ¯Ø©
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
                      label={category.is_active ? 'Ù…ÙØ¹Ù‘Ù„' : 'Ù…ÙˆÙ‚ÙˆÙ'}
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
                      ØªØ¹Ø¯ÙŠÙ„
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
        title={selectedExpense ? 'ØªØ¹Ø¯ÙŠÙ„ Ù…ØµØ±ÙˆÙ' : 'Ø¥Ø¶Ø§ÙØ© Ù…ØµØ±ÙˆÙ Ø¬Ø¯ÙŠØ¯'}
        subtitle="Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ø£Ø¯Ù†Ø§Ù‡"
        submitText={selectedExpense ? 'ØªØ­Ø¯ÙŠØ«' : 'Ø­ÙØ¸'}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="Ø§Ù„ÙØ¦Ø©"
              value={expenseForm.category_id}
              onChange={handleExpenseInputChange}
              name="category_id"
              select
              required
              error={errors.category_id}
            >
              <MenuItem value="">-- Ø§Ø®ØªØ± Ø§Ù„ÙØ¦Ø© --</MenuItem>
              {categories.filter(c => c.is_active).map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name_ar}</MenuItem>
              ))}
            </UnifiedFormField>
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="Ø§Ù„Ù…Ø¨Ù„Øº"
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
              label="Ø§Ù„ÙˆØµÙ"
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
              label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ØµØ±ÙˆÙ"
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
              label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª"
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
        title={selectedCategory ? 'ØªØ¹Ø¯ÙŠÙ„ ÙØ¦Ø©' : 'Ø¥Ø¶Ø§ÙØ© ÙØ¦Ø© Ø¬Ø¯ÙŠØ¯Ø©'}
        subtitle="Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ø£Ø¯Ù†Ø§Ù‡"
        submitText={selectedCategory ? 'ØªØ­Ø¯ÙŠØ«' : 'Ø­ÙØ¸'}
        loading={loading}
        maxWidth="sm"
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <UnifiedFormField
              label="Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø© (Ø¹Ø±Ø¨ÙŠ)"
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
              label="Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø© (Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ)"
              value={categoryForm.name_en}
              onChange={handleCategoryInputChange}
              name="name_en"
              helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography fontSize="1rem">Ø§Ù„Ø­Ø§Ù„Ø©:</Typography>
              <Chip
                label={categoryForm.is_active ? 'Ù…ÙØ¹Ù‘Ù„' : 'Ù…ÙˆÙ‚ÙˆÙ'}
                color={categoryForm.is_active ? 'success' : 'default'}
                onClick={() => setCategoryForm({ ...categoryForm, is_active: !categoryForm.is_active })}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
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
