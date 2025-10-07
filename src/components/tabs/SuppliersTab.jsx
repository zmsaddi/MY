// src/components/tabs/SuppliersTab.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Paper, IconButton, Tooltip, InputAdornment
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SearchIcon from '@mui/icons-material/Search';

import {
  getSuppliers, addSupplier, updateSupplier
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

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [filter, setFilter] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // dialog state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    try {
      const list = getSuppliers();
      setSuppliers(list);
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إدارة الموردين
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إضافة وتعديل بيانات الموردين
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

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
              <TableCell><Typography fontWeight={700} fontSize="1rem">العنوان</Typography></TableCell>
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
                  <TableCell><Typography fontSize="0.9375rem">{s.address || '—'}</Typography></TableCell>
                  <TableCell align="center">
                    <Tooltip title="تعديل">
                      <IconButton size="small" color="primary" onClick={() => openEdit(s)}>
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

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onClose={closeDialog}
        maxWidth="sm"
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
            <Grid item xs={12}>
              <TextField
                label="اسم المورد *"
                fullWidth
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
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
    </Box>
  );
}