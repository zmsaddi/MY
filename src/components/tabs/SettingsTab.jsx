// src/components/tabs/SettingsTab.jsx
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Alert, Divider, InputAdornment, Switch, FormControlLabel,
  Avatar, IconButton, Tooltip,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Tabs, Tab, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions  // Add these
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import {
  getCompanyProfile,
  updateCompanyProfile,
  getServiceTypes,
  updateServiceType,
  addServiceType,
  getCurrencies,
  addCurrency,
  updateCurrency,
  getPaymentMethodsForUI,
  addPaymentMethod,
  updatePaymentMethod,
  getBaseCurrencyInfo,
  getMetalTypes,
  addMetalType,
  updateMetalType,
  getGrades,
  addGrade,
  updateGrade,
  getFinishes,
  addFinish,
  updateFinish,
  getAllUsers,
  addUser,
  updateUser,
  changeUserPassword,
  deleteUser,
} from '../../utils/database';

import { getCurrentUser } from '../../utils/auth';
import DatabaseResetSection from '../features/settings/DatabaseResetSection';

/* ---------------- Service Row ---------------- */
function ServiceRow({ service, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [row, setRow] = useState({
    name_ar: service.name_ar || '',
    name_en: service.name_en || '',
    is_active: !!service.is_active,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRow({
      name_ar: service.name_ar || '',
      name_en: service.name_en || '',
      is_active: !!service.is_active,
    });
    setEditing(false);
  }, [service.id]);

  const handleToggleActive = async (checked) => {
    setRow((r) => ({ ...r, is_active: checked }));
    setSaving(true);
    try {
      await updateServiceType(service.id, {
        name_ar: row.name_ar,
        name_en: row.name_en,
        is_active: checked,
      });
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!row.name_ar.trim()) return;
    setSaving(true);
    try {
      await updateServiceType(service.id, {
        name_ar: row.name_ar.trim(),
        name_en: row.name_en?.trim() || null,
        is_active: row.is_active ? 1 : 0,
      });
      setEditing(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRow({
      name_ar: service.name_ar || '',
      name_en: service.name_en || '',
      is_active: !!service.is_active,
    });
    setEditing(false);
  };

  return (
    <TableRow hover>
      <TableCell>
        {editing ? (
          <TextField
            fullWidth
            size="small"
            value={row.name_ar}
            onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
          />
        ) : (
          <Typography fontSize="1rem">{service.name_ar}</Typography>
        )}
      </TableCell>

      <TableCell>
        {editing ? (
          <TextField
            fullWidth
            size="small"
            value={row.name_en}
            onChange={(e) => setRow((r) => ({ ...r, name_en: e.target.value }))}
          />
        ) : (
          <Typography color="text.secondary" fontSize="0.95rem">{service.name_en || '—'}</Typography>
        )}
      </TableCell>

      <TableCell>
        <FormControlLabel
          control={
            <Switch
              checked={row.is_active}
              onChange={(e) => handleToggleActive(e.target.checked)}
              color="primary"
              disabled={saving || editing}
            />
          }
          label={<Typography fontSize="0.95rem">{row.is_active ? 'مفعّل' : 'موقوف'}</Typography>}
        />
      </TableCell>

      <TableCell align="left">
        {editing ? (
          <>
            <Tooltip title="حفظ">
              <span>
                <IconButton 
                  onClick={handleSaveEdit} 
                  disabled={saving || !row.name_ar.trim()} 
                  color="primary"
                  size="small"
                >
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="إلغاء">
              <IconButton onClick={handleCancel} color="inherit" size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="تعديل">
            <IconButton onClick={() => setEditing(true)} color="primary" size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ---------------- Material Row ---------------- */
function MaterialRow({ material, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [row, setRow] = useState({
    name_ar: material.name_ar || '',
    name_en: material.name_en || '',
    abbreviation: material.abbreviation || '',
    density: material.density || '',
    is_active: !!material.is_active,
  });
  const [saving, setSaving] = useState(false);

  // Grade/Finish management states
  const [addingGrade, setAddingGrade] = useState(false);
  const [addingFinish, setAddingFinish] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [editingFinish, setEditingFinish] = useState(null);
  const [newGrade, setNewGrade] = useState('');
  const [newFinish, setNewFinish] = useState({ name_ar: '', name_en: '' });
  const [editGradeValue, setEditGradeValue] = useState('');
  const [editFinishValue, setEditFinishValue] = useState({ name_ar: '', name_en: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: '' });

  useEffect(() => {
    setRow({
      name_ar: material.name_ar || '',
      name_en: material.name_en || '',
      abbreviation: material.abbreviation || '',
      density: material.density || '',
      is_active: !!material.is_active,
    });
    setEditing(false);
  }, [material.id]);

  const handleToggleActive = async (checked) => {
    setRow((r) => ({ ...r, is_active: checked }));
    setSaving(true);
    try {
      await updateMetalType(material.id, { ...row, is_active: checked });
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!row.name_ar.trim() || !row.abbreviation.trim()) return;
    setSaving(true);
    try {
      await updateMetalType(material.id, {
        name_ar: row.name_ar.trim(),
        name_en: row.name_en?.trim() || null,
        abbreviation: row.abbreviation.toUpperCase().trim(),
        density: row.density ? parseFloat(row.density) : null,
        is_active: row.is_active ? 1 : 0,
      });
      setEditing(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRow({
      name_ar: material.name_ar || '',
      name_en: material.name_en || '',
      abbreviation: material.abbreviation || '',
      density: material.density || '',
      is_active: !!material.is_active,
    });
    setEditing(false);
  };

  const handleAddGrade = async () => {
    if (!newGrade.trim()) return;
    try {
      const res = await addGrade({
        metal_type_id: material.id,
        name: newGrade.trim(),
        is_active: true,
      });
      if (res?.success) {
        setNewGrade('');
        setAddingGrade(false);
        onUpdated?.();
      }
    } catch (e) {
      console.error('Error adding grade:', e);
    }
  };

  const handleStartEditGrade = (grade) => {
    setEditingGrade(grade.id);
    setEditGradeValue(grade.name);
  };

  const handleSaveGrade = async (gradeId) => {
    if (!editGradeValue.trim()) return;
    try {
      const res = await updateGrade(gradeId, {
        name: editGradeValue.trim(),
        is_active: true,
      });
      if (res?.success) {
        setEditingGrade(null);
        setEditGradeValue('');
        onUpdated?.();
      }
    } catch (e) {
      console.error('Error updating grade:', e);
    }
  };

  const handleCancelEditGrade = () => {
    setEditingGrade(null);
    setEditGradeValue('');
  };

  const handleDeleteGrade = (grade) => {
    setDeleteConfirm({ 
      open: true, 
      type: 'grade', 
      id: grade.id, 
      name: grade.name 
    });
  };

  const handleAddFinish = async () => {
    if (!newFinish.name_ar.trim()) return;
    try {
      const res = await addFinish({
        metal_type_id: material.id,
        name_ar: newFinish.name_ar.trim(),
        name_en: newFinish.name_en?.trim() || null,
        is_active: true,
      });
      if (res?.success) {
        setNewFinish({ name_ar: '', name_en: '' });
        setAddingFinish(false);
        onUpdated?.();
      }
    } catch (e) {
      console.error('Error adding finish:', e);
    }
  };

  const handleStartEditFinish = (finish) => {
    setEditingFinish(finish.id);
    setEditFinishValue({
      name_ar: finish.name_ar,
      name_en: finish.name_en || '',
    });
  };

  const handleSaveFinish = async (finishId) => {
    if (!editFinishValue.name_ar.trim()) return;
    try {
      const res = await updateFinish(finishId, {
        name_ar: editFinishValue.name_ar.trim(),
        name_en: editFinishValue.name_en?.trim() || null,
        is_active: true,
      });
      if (res?.success) {
        setEditingFinish(null);
        setEditFinishValue({ name_ar: '', name_en: '' });
        onUpdated?.();
      }
    } catch (e) {
      console.error('Error updating finish:', e);
    }
  };

  const handleCancelEditFinish = () => {
    setEditingFinish(null);
    setEditFinishValue({ name_ar: '', name_en: '' });
  };

  const handleDeleteFinish = (finish) => {
    setDeleteConfirm({ 
      open: true, 
      type: 'finish', 
      id: finish.id, 
      name: `${finish.name_ar} (${finish.name_en || '-'})` 
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'grade') {
        const res = await updateGrade(id, { 
          name: editGradeValue || 'DELETED', 
          is_active: false 
        });
        if (res?.success) {
          onUpdated?.();
        }
      } else if (type === 'finish') {
        const res = await updateFinish(id, { 
          name_ar: 'DELETED', 
          name_en: 'DELETED', 
          is_active: false 
        });
        if (res?.success) {
          onUpdated?.();
        }
      }
    } catch (e) {
      console.error('Error deleting:', e);
    } finally {
      setDeleteConfirm({ open: false, type: null, id: null, name: '' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, type: null, id: null, name: '' });
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandMoreIcon /> : <EditIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          {editing ? (
            <TextField
              size="small"
              value={row.name_ar}
              onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
            />
          ) : (
            <Typography fontSize="1rem">{material.name_ar}</Typography>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <TextField
              size="small"
              value={row.abbreviation}
              onChange={(e) => setRow((r) => ({ ...r, abbreviation: e.target.value.toUpperCase() }))}
              inputProps={{ maxLength: 3 }}
            />
          ) : (
            <Chip label={material.abbreviation} size="small" color="primary" />
          )}
        </TableCell>
        <TableCell align="center">
          <Chip label={material.grades?.length || 0} size="small" />
        </TableCell>
        <TableCell align="center">
          <Chip label={material.finishes?.length || 0} size="small" />
        </TableCell>
        <TableCell>
          <FormControlLabel
            control={
              <Switch
                checked={row.is_active}
                onChange={(e) => handleToggleActive(e.target.checked)}
                disabled={saving || editing}
              />
            }
            label={<Typography fontSize="0.95rem">{row.is_active ? 'مفعّل' : 'موقوف'}</Typography>}
          />
        </TableCell>
        <TableCell align="left">
          {editing ? (
            <>
              <IconButton onClick={handleSaveEdit} disabled={saving} color="primary" size="small">
                <SaveIcon />
              </IconButton>
              <IconButton onClick={handleCancel} size="small">
                <ClearIcon />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={() => setEditing(true)} color="primary" size="small">
              <EditIcon />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={7} sx={{ bgcolor: 'grey.50', p: 3 }}>
            <Grid container spacing={3}>
              {/* Grades Section */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700}>
                    الدرجات ({material.grades?.length || 0})
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setAddingGrade(!addingGrade)}>
                    إضافة درجة
                  </Button>
                </Box>

                {addingGrade && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="اسم الدرجة (مثل: 304)"
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                    />
                    <IconButton color="primary" onClick={handleAddGrade} disabled={!newGrade.trim()}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => { setAddingGrade(false); setNewGrade(''); }}>
                      <ClearIcon />
                    </IconButton>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {material.grades?.map((grade) => (
                    <Box key={grade.id}>
                      {editingGrade === grade.id ? (
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            value={editGradeValue}
                            onChange={(e) => setEditGradeValue(e.target.value)}
                            sx={{ width: 100 }}
                          />
                          <IconButton size="small" color="primary" onClick={() => handleSaveGrade(grade.id)}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEditGrade}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                          <Chip
                            label={grade.name}
                            color={grade.is_active ? 'primary' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                          <IconButton size="small" onClick={() => handleStartEditGrade(grade)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteGrade(grade)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  ))}
                  {(!material.grades || material.grades.length === 0) && (
                    <Typography variant="body2" color="text.secondary">لا توجد درجات</Typography>
                  )}
                </Box>
              </Grid>

              {/* Finishes Section */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700}>
                    التشطيبات ({material.finishes?.length || 0})
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setAddingFinish(!addingFinish)}>
                    إضافة تشطيب
                  </Button>
                </Box>

                {addingFinish && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: 'column' }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="الاسم بالعربي"
                      value={newFinish.name_ar}
                      onChange={(e) => setNewFinish((f) => ({ ...f, name_ar: e.target.value }))}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="الاسم بالإنجليزي"
                        value={newFinish.name_en}
                        onChange={(e) => setNewFinish((f) => ({ ...f, name_en: e.target.value }))}
                      />
                      <IconButton color="primary" onClick={handleAddFinish} disabled={!newFinish.name_ar.trim()}>
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => { setAddingFinish(false); setNewFinish({ name_ar: '', name_en: '' }); }}>
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {material.finishes?.map((finish) => (
                    <Box key={finish.id}>
                      {editingFinish === finish.id ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <TextField
                            size="small"
                            label="عربي"
                            value={editFinishValue.name_ar}
                            onChange={(e) => setEditFinishValue((f) => ({ ...f, name_ar: e.target.value }))}
                            sx={{ width: 140 }}
                          />
                          <TextField
                            size="small"
                            label="English"
                            value={editFinishValue.name_en}
                            onChange={(e) => setEditFinishValue((f) => ({ ...f, name_en: e.target.value }))}
                            sx={{ width: 140 }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" color="primary" onClick={() => handleSaveFinish(finish.id)}>
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={handleCancelEditFinish}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                          <Chip
                            label={`${finish.name_ar} (${finish.name_en || '-'})`}
                            color={finish.is_active ? 'secondary' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                          <IconButton size="small" onClick={() => handleStartEditFinish(finish)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteFinish(finish)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  ))}
                  {(!material.finishes || material.finishes.length === 0) && (
                    <Typography variant="body2" color="text.secondary">لا توجد تشطيبات</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </TableCell>
        </TableRow>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={handleCancelDelete}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف {deleteConfirm.type === 'grade' ? 'الدرجة' : 'التشطيب'} "{deleteConfirm.name}"؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ملاحظة: سيتم تعطيل العنصر فقط للحفاظ على سلامة البيانات التاريخية
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>إلغاء</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ---------------- Currency Row ---------------- */
function CurrencyRow({ currency, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [row, setRow] = useState({
    name_ar: currency.name_ar || '',
    name_en: currency.name_en || '',
    symbol: currency.symbol || '',
    exchange_rate: currency.exchange_rate || 1,
    is_active: !!currency.is_active,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRow({
      name_ar: currency.name_ar || '',
      name_en: currency.name_en || '',
      symbol: currency.symbol || '',
      exchange_rate: currency.exchange_rate || 1,
      is_active: !!currency.is_active,
    });
    setEditing(false);
  }, [currency.id]);

  const handleToggleActive = async (checked) => {
    setRow((r) => ({ ...r, is_active: checked }));
    setSaving(true);
    try {
      await updateCurrency(currency.id, { ...row, is_active: checked });
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!row.exchange_rate || row.exchange_rate <= 0) return;
    setSaving(true);
    try {
      await updateCurrency(currency.id, {
        name_ar: row.name_ar.trim(),
        name_en: row.name_en?.trim() || null,
        symbol: row.symbol.trim(),
        exchange_rate: parseFloat(row.exchange_rate),
        is_active: row.is_active ? 1 : 0,
      });
      setEditing(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRow({
      name_ar: currency.name_ar || '',
      name_en: currency.name_en || '',
      symbol: currency.symbol || '',
      exchange_rate: currency.exchange_rate || 1,
      is_active: !!currency.is_active,
    });
    setEditing(false);
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography fontSize="1rem" fontWeight={600}>{currency.code}</Typography>
      </TableCell>
      <TableCell>
        {editing ? (
          <TextField size="small" value={row.name_ar} onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))} />
        ) : (
          <Typography fontSize="1rem">{currency.name_ar}</Typography>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <TextField size="small" value={row.symbol} onChange={(e) => setRow((r) => ({ ...r, symbol: e.target.value }))} />
        ) : (
          <Typography fontSize="1rem">{currency.symbol}</Typography>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <TextField 
            size="small" 
            type="number" 
            value={row.exchange_rate} 
            onChange={(e) => setRow((r) => ({ ...r, exchange_rate: e.target.value }))}
            inputProps={{ step: 0.01, min: 0.01 }}
          />
        ) : (
          <Typography fontSize="0.95rem">{currency.exchange_rate}</Typography>
        )}
      </TableCell>
      <TableCell>
        <FormControlLabel
          control={
            <Switch
              checked={row.is_active}
              onChange={(e) => handleToggleActive(e.target.checked)}
              disabled={saving || editing}
            />
          }
          label={<Typography fontSize="0.95rem">{row.is_active ? 'مفعّل' : 'موقوف'}</Typography>}
        />
      </TableCell>
      <TableCell align="left">
        {editing ? (
          <>
            <IconButton onClick={handleSaveEdit} disabled={saving} color="primary" size="small">
              <SaveIcon />
            </IconButton>
            <IconButton onClick={handleCancel} size="small">
              <ClearIcon />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={() => setEditing(true)} color="primary" size="small">
            <EditIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ---------------- Payment Method Row ---------------- */
function PaymentMethodRow({ method, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [row, setRow] = useState({
    name_ar: method.name_ar || '',
    name_en: method.name_en || '',
    is_active: !!method.is_active,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRow({
      name_ar: method.name_ar || '',
      name_en: method.name_en || '',
      is_active: !!method.is_active,
    });
    setEditing(false);
  }, [method.id]);

  const handleToggleActive = async (checked) => {
    setRow((r) => ({ ...r, is_active: checked }));
    setSaving(true);
    try {
      await updatePaymentMethod(method.id, { ...row, is_active: checked });
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!row.name_ar.trim()) return;
    setSaving(true);
    try {
      await updatePaymentMethod(method.id, {
        name_ar: row.name_ar.trim(),
        name_en: row.name_en?.trim() || null,
        is_active: row.is_active ? 1 : 0,
      });
      setEditing(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRow({
      name_ar: method.name_ar || '',
      name_en: method.name_en || '',
      is_active: !!method.is_active,
    });
    setEditing(false);
  };

  return (
    <TableRow hover>
      <TableCell>
        {editing ? (
          <TextField
            fullWidth
            size="small"
            value={row.name_ar}
            onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
          />
        ) : (
          <Typography fontSize="1rem">{method.name_ar}</Typography>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <TextField
            fullWidth
            size="small"
            value={row.name_en}
            onChange={(e) => setRow((r) => ({ ...r, name_en: e.target.value }))}
          />
        ) : (
          <Typography color="text.secondary" fontSize="0.95rem">{method.name_en || '—'}</Typography>
        )}
      </TableCell>
      <TableCell>
        <FormControlLabel
          control={
            <Switch
              checked={row.is_active}
              onChange={(e) => handleToggleActive(e.target.checked)}
              disabled={saving || editing}
            />
          }
          label={<Typography fontSize="0.95rem">{row.is_active ? 'مفعّل' : 'موقوف'}</Typography>}
        />
      </TableCell>
      <TableCell align="left">
        {editing ? (
          <>
            <IconButton onClick={handleSaveEdit} disabled={saving} color="primary" size="small">
              <SaveIcon />
            </IconButton>
            <IconButton onClick={handleCancel} size="small">
              <ClearIcon />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={() => setEditing(true)} color="primary" size="small">
            <EditIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ---------------- Main SettingsTab ---------------- */
export default function SettingsTab() {
  const [tabValue, setTabValue] = useState(0);
  
  const [profile, setProfile] = useState({
    company_name: '',
    company_name_en: '',
    address: '',
    phone1: '',
    phone2: '',
    email: '',
    tax_number: '',
    base_currency: 'USD',
    default_payment_method: 'Cash',
    logo_base64: '',
    vat_rate: 0,
    vat_enabled: true,
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Services
  const [services, setServices] = useState([]);
  const [svcError, setSvcError] = useState('');
  const [svcSuccess, setSvcSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [newService, setNewService] = useState({ name_ar: '', name_en: '', is_active: true });

  // Materials
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({ 
    name_ar: '', 
    name_en: '', 
    abbreviation: '', 
    density: '', 
    is_active: true 
  });
  const [matError, setMatError] = useState('');
  const [matSuccess, setMatSuccess] = useState('');

  // Currencies
  const [currencies, setCurrencies] = useState([]);
  const [newCurrency, setNewCurrency] = useState({ code: '', name_ar: '', name_en: '', symbol: '', exchange_rate: 1, is_active: true });
  const [currError, setCurrError] = useState('');
  const [currSuccess, setCurrSuccess] = useState('');

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPayment, setNewPayment] = useState({ name_ar: '', name_en: '', is_active: true });
  const [pmError, setPmError] = useState('');
  const [pmSuccess, setPmSuccess] = useState('');

  // Users
  const [users, setUsers] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', display_name: '' });
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getCompanyProfile();
    if (data) {
      setProfile({
        company_name: data.company_name || '',
        company_name_en: data.company_name_en || '',
        address: data.address || '',
        phone1: data.phone1 || '',
        phone2: data.phone2 || '',
        email: data.email || '',
        tax_number: data.tax_number || '',
        base_currency: data.base_currency || 'USD',
        default_payment_method: data.default_payment_method || 'Cash',
        logo_base64: data.logo_base64 || '',
        vat_rate: Number(data.vat_rate) || 0,
        vat_enabled: data.vat_enabled !== 0,
      });
    }
    loadServices();
    loadMaterials();
    loadCurrencies();
    loadPaymentMethods();
    loadUsers();
  };

  const loadUsers = () => {
    try {
      const list = getAllUsers();
      setUsers(list);
    } catch (e) {
      setUserError('تعذّر تحميل المستخدمين');
    }
  };

  const loadServices = () => {
    try {
      const list = getServiceTypes(false);
      setServices(list);
    } catch (e) {
      setSvcError('تعذّر تحميل الخدمات');
    }
  };

  const loadMaterials = () => {
    try {
      const metalTypes = getMetalTypes(false);
      const materialsWithDetails = metalTypes.map(metal => ({
        ...metal,
        grades: getGrades(metal.id, false),
        finishes: getFinishes(metal.id, false)
      }));
      setMaterials(materialsWithDetails);
    } catch (e) {
      setMatError('تعذّر تحميل المواد');
    }
  };

  const loadCurrencies = () => {
    try {
      const list = getCurrencies(false);
      setCurrencies(list);
    } catch (e) {
      setCurrError('تعذّر تحميل العملات');
    }
  };

  const loadPaymentMethods = () => {
    try {
      const list = getPaymentMethodsForUI(false);
      setPaymentMethods(list);
    } catch (e) {
      setPmError('تعذّر تحميل طرق الدفع');
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة فقط');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً (الحد الأقصى 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfile(prev => ({ ...prev, logo_base64: reader.result }));
      setError('');
      setSuccess('تم رفع الشعار. احفظ التغييرات لتطبيقها.');
    };
    reader.onerror = () => setError('فشل تحميل الصورة');
    reader.readAsDataURL(file);
  };

  const handleDeleteLogo = () => {
    setProfile(prev => ({ ...prev, logo_base64: '' }));
    setSuccess('سيتم حذف الشعار عند الحفظ');
  };

  const handleSave = async () => {
    if (!profile.company_name?.trim()) {
      setError('اسم الشركة مطلوب');
      return;
    }
    if (profile.vat_enabled && (isNaN(profile.vat_rate) || profile.vat_rate < 0 || profile.vat_rate > 100)) {
      setError('نسبة الضريبة يجب أن تكون بين 0 و 100');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = updateCompanyProfile({
        ...profile,
        vat_rate: Number(profile.vat_rate) || 0,
        vat_enabled: !!profile.vat_enabled,
      });
      if (result.success) {
        setSuccess('✓ تم حفظ الإعدادات بنجاح');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'فشل الحفظ');
      }
    } catch (err) {
      setError('حدث خطأ: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    setSvcError('');
    setSvcSuccess('');
    if (!newService.name_ar.trim()) {
      setSvcError('الاسم بالعربي مطلوب');
      return;
    }
    setAdding(true);
    try {
      const res = await addServiceType({
        name_ar: newService.name_ar.trim(),
        name_en: newService.name_en?.trim() || null,
        is_active: newService.is_active ? 1 : 0,
      });
      if (res?.success) {
        setSvcSuccess('✓ تمت إضافة الخدمة');
        setNewService({ name_ar: '', name_en: '', is_active: true });
        loadServices();
        setTimeout(() => setSvcSuccess(''), 2500);
      } else {
        setSvcError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setSvcError('فشل الإضافة');
    } finally {
      setAdding(false);
    }
  };

  const handleAddMaterial = async () => {
    setMatError('');
    setMatSuccess('');
    if (!newMaterial.name_ar.trim() || !newMaterial.abbreviation.trim()) {
      setMatError('الاسم والاختصار مطلوبان');
      return;
    }
    try {
      const res = await addMetalType(newMaterial);
      if (res?.success) {
        setMatSuccess('✓ تمت إضافة المادة');
        setNewMaterial({ name_ar: '', name_en: '', abbreviation: '', density: '', is_active: true });
        loadMaterials();
        setTimeout(() => setMatSuccess(''), 2500);
      } else {
        setMatError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setMatError('فشل الإضافة');
    }
  };

  const handleAddCurrency = async () => {
    setCurrError('');
    setCurrSuccess('');
    if (!newCurrency.code.trim() || !newCurrency.name_ar.trim()) {
      setCurrError('الكود والاسم مطلوبان');
      return;
    }
    try {
      const res = await addCurrency(newCurrency);
      if (res?.success) {
        setCurrSuccess('✓ تمت إضافة العملة');
        setNewCurrency({ code: '', name_ar: '', name_en: '', symbol: '', exchange_rate: 1, is_active: true });
        loadCurrencies();
        setTimeout(() => setCurrSuccess(''), 2500);
      } else {
        setCurrError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setCurrError('فشل الإضافة');
    }
  };

  const handleAddPayment = async () => {
    setPmError('');
    setPmSuccess('');
    if (!newPayment.name_ar.trim()) {
      setPmError('الاسم بالعربي مطلوب');
      return;
    }
    try {
      const res = await addPaymentMethod(newPayment);
      if (res?.success) {
        setPmSuccess('✓ تمت إضافة طريقة الدفع');
        setNewPayment({ name_ar: '', name_en: '', is_active: true });
        loadPaymentMethods();
        setTimeout(() => setPmSuccess(''), 2500);
      } else {
        setPmError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setPmError('فشل الإضافة');
    }
  };

  // User Management Handlers
  const handleAddUser = async () => {
    setUserError('');
    if (!userForm.username.trim()) {
      setUserError('اسم المستخدم مطلوب');
      return;
    }
    if (!userForm.password) {
      setUserError('كلمة المرور مطلوبة');
      return;
    }

    try {
      const res = await addUser(userForm, getCurrentUser());
      if (res?.success) {
        setUserSuccess('✓ تمت إضافة المستخدم بنجاح');
        setUserDialogOpen(false);
        loadUsers();
        setTimeout(() => setUserSuccess(''), 2500);
      } else {
        setUserError(res?.error || 'فشل إضافة المستخدم');
      }
    } catch (e) {
      setUserError(e.message || 'فشل إضافة المستخدم');
    }
  };

  const handleChangePassword = async () => {
    setUserError('');
    if (!newPassword) {
      setUserError('كلمة المرور الجديدة مطلوبة');
      return;
    }

    try {
      const res = await changeUserPassword(editingUser.id, newPassword, getCurrentUser());
      if (res?.success) {
        setUserSuccess('✓ تم تغيير كلمة المرور بنجاح');
        setPasswordDialogOpen(false);
        setTimeout(() => setUserSuccess(''), 2500);
      } else {
        setUserError(res?.error || 'فشل تغيير كلمة المرور');
      }
    } catch (e) {
      setUserError(e.message || 'فشل تغيير كلمة المرور');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const res = await deleteUser(userId);
      if (res?.success) {
        setUserSuccess('✓ تم حذف المستخدم بنجاح');
        loadUsers();
        setTimeout(() => setUserSuccess(''), 2500);
      } else {
        setUserError(res?.error || 'فشل حذف المستخدم');
      }
    } catch (e) {
      setUserError(e.message || 'فشل حذف المستخدم');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          إعدادات الشركة
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          إدارة معلومات الشركة والإعدادات العامة
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon sx={{ fontSize: 36, color: 'primary.main', ml: 2 }} />
                <Typography variant="h5" fontWeight={700}>معلومات الشركة</Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="اسم الشركة (بالعربية) *"
                    value={profile.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name (English)"
                    value={profile.company_name_en}
                    onChange={(e) => handleChange('company_name_en', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="العنوان"
                    value={profile.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الهاتف 1"
                    value={profile.phone1}
                    onChange={(e) => handleChange('phone1', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الهاتف 2"
                    value={profile.phone2}
                    onChange={(e) => handleChange('phone2', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="البريد الإلكتروني"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الرقم الضريبي"
                    value={profile.tax_number}
                    onChange={(e) => handleChange('tax_number', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>الإعدادات المالية</Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="العملة الأساسية"
                    value={profile.base_currency}
                    onChange={(e) => handleChange('base_currency', e.target.value)}
                    SelectProps={{ native: true }}
                    helperText="جميع المبالغ ستُحفظ بهذه العملة"
                  >
                    {currencies.filter(c => c.is_active).map((curr) => (
                      <option key={curr.id} value={curr.code}>
                        {curr.name_ar} ({curr.code}) - {curr.symbol}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="طريقة الدفع الافتراضية"
                    value={profile.default_payment_method}
                    onChange={(e) => handleChange('default_payment_method', e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    {paymentMethods.filter(pm => pm.is_active).map((pm) => (
                      <option key={pm.id} value={pm.name}>
                        {pm.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={700} gutterBottom>إعدادات الضريبة</Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.vat_enabled}
                        onChange={(e) => handleChange('vat_enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={<Typography fontSize="1rem">تفعيل الضريبة (VAT)</Typography>}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="نسبة الضريبة"
                    value={profile.vat_rate}
                    onChange={(e) => handleChange('vat_rate', parseFloat(e.target.value) || 0)}
                    disabled={!profile.vat_enabled}
                    inputProps={{ step: 0.1, min: 0, max: 100 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for Services, Materials, Currencies, Payment Methods */}
          <Card sx={{ borderRadius: 3, mt: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label={<Typography fontSize="1rem" fontWeight={600}>الخدمات</Typography>} />
              <Tab label={<Typography fontSize="1rem" fontWeight={600}>المواد</Typography>} />
              <Tab label={<Typography fontSize="1rem" fontWeight={600}>العملات</Typography>} />
              <Tab label={<Typography fontSize="1rem" fontWeight={600}>طرق الدفع</Typography>} />
              <Tab label={<Typography fontSize="1rem" fontWeight={600}>المستخدمين</Typography>} />
              <Tab label={<Typography fontSize="1rem" fontWeight={600}>إدارة قاعدة البيانات</Typography>} />
            </Tabs>

            {/* Services Tab */}
            {tabValue === 0 && (
              <CardContent sx={{ p: 3 }}>
                {svcSuccess && <Alert severity="success" sx={{ mb: 2, fontSize: '1rem' }}>{svcSuccess}</Alert>}
                {svcError && <Alert severity="error" sx={{ mb: 2, fontSize: '1rem' }} onClose={() => setSvcError('')}>{svcError}</Alert>}

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالعربي *"
                        value={newService.name_ar}
                        onChange={(e) => setNewService((s) => ({ ...s, name_ar: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالإنجليزي"
                        value={newService.name_en}
                        onChange={(e) => setNewService((s) => ({ ...s, name_en: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={handleAddService}
                        disabled={adding || !newService.name_ar.trim()}
                      >
                        إضافة
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم بالعربي</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم بالإنجليزي</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الحالة</Typography></TableCell>
                        <TableCell align="left"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {services.map((svc) => (
                        <ServiceRow key={svc.id} service={svc} onUpdated={loadServices} />
                      ))}
                      {services.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary" fontSize="1rem">لا توجد خدمات</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* Materials Tab */}
            {tabValue === 1 && (
              <CardContent sx={{ p: 3 }}>
                {matSuccess && <Alert severity="success" sx={{ mb: 2, fontSize: '1rem' }}>{matSuccess}</Alert>}
                {matError && <Alert severity="error" sx={{ mb: 2, fontSize: '1rem' }} onClose={() => setMatError('')}>{matError}</Alert>}

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالعربي *"
                        value={newMaterial.name_ar}
                        onChange={(e) => setNewMaterial((m) => ({ ...m, name_ar: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالإنجليزي"
                        value={newMaterial.name_en}
                        onChange={(e) => setNewMaterial((m) => ({ ...m, name_en: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاختصار *"
                        value={newMaterial.abbreviation}
                        onChange={(e) => setNewMaterial((m) => ({ ...m, abbreviation: e.target.value.toUpperCase() }))}
                        inputProps={{ maxLength: 3 }}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="الكثافة"
                        value={newMaterial.density}
                        onChange={(e) => setNewMaterial((m) => ({ ...m, density: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={handleAddMaterial}
                        disabled={!newMaterial.name_ar.trim() || !newMaterial.abbreviation.trim()}
                      >
                        إضافة
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="40"></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاختصار</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الدرجات</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">التشطيبات</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الحالة</Typography></TableCell>
                        <TableCell align="left"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((mat) => (
                        <MaterialRow key={mat.id} material={mat} onUpdated={loadMaterials} />
                      ))}
                      {materials.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary" fontSize="1rem">لا توجد مواد</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* Currencies Tab */}
            {tabValue === 2 && (
              <CardContent sx={{ p: 3 }}>
                {currSuccess && <Alert severity="success" sx={{ mb: 2, fontSize: '1rem' }}>{currSuccess}</Alert>}
                {currError && <Alert severity="error" sx={{ mb: 2, fontSize: '1rem' }} onClose={() => setCurrError('')}>{currError}</Alert>}

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الكود *"
                        value={newCurrency.code}
                        onChange={(e) => setNewCurrency((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                        inputProps={{ maxLength: 3 }}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الرمز"
                        value={newCurrency.symbol}
                        onChange={(e) => setNewCurrency((c) => ({ ...c, symbol: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالعربي *"
                        value={newCurrency.name_ar}
                        onChange={(e) => setNewCurrency((c) => ({ ...c, name_ar: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="سعر الصرف"
                        value={newCurrency.exchange_rate}
                        onChange={(e) => setNewCurrency((c) => ({ ...c, exchange_rate: parseFloat(e.target.value) || 1 }))}
                        inputProps={{ step: 0.01, min: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={handleAddCurrency}
                        disabled={!newCurrency.code.trim() || !newCurrency.name_ar.trim()}
                      >
                        إضافة
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الكود</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الرمز</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">سعر الصرف</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الحالة</Typography></TableCell>
                        <TableCell align="left"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currencies.map((curr) => (
                        <CurrencyRow key={curr.id} currency={curr} onUpdated={loadCurrencies} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* Payment Methods Tab */}
            {tabValue === 3 && (
              <CardContent sx={{ p: 3 }}>
                {pmSuccess && <Alert severity="success" sx={{ mb: 2, fontSize: '1rem' }}>{pmSuccess}</Alert>}
                {pmError && <Alert severity="error" sx={{ mb: 2, fontSize: '1rem' }} onClose={() => setPmError('')}>{pmError}</Alert>}

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالعربي *"
                        value={newPayment.name_ar}
                        onChange={(e) => setNewPayment((p) => ({ ...p, name_ar: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الاسم بالإنجليزي"
                        value={newPayment.name_en}
                        onChange={(e) => setNewPayment((p) => ({ ...p, name_en: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={handleAddPayment}
                        disabled={!newPayment.name_ar.trim()}
                      >
                        إضافة
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم بالعربي</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الاسم بالإنجليزي</Typography></TableCell>
                        <TableCell><Typography fontWeight={700} fontSize="1rem">الحالة</Typography></TableCell>
                        <TableCell align="left"><Typography fontWeight={700} fontSize="1rem">إجراءات</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentMethods.map((pm) => (
                        <PaymentMethodRow key={pm.id} method={pm} onUpdated={loadPaymentMethods} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* Users Tab */}
            {tabValue === 4 && (
              <CardContent sx={{ p: 3 }}>
                {userSuccess && <Alert severity="success" sx={{ mb: 2, fontSize: '1rem' }} onClose={() => setUserSuccess('')}>{userSuccess}</Alert>}
                {userError && <Alert severity="error" sx={{ mb: 2, fontSize: '1rem' }} onClose={() => setUserError('')}>{userError}</Alert>}

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>
                    إدارة المستخدمين
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({ username: '', password: '', display_name: '' });
                      setUserError('');
                      setUserDialogOpen(true);
                    }}
                  >
                    إضافة مستخدم
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={700}>اسم المستخدم</Typography></TableCell>
                        <TableCell><Typography fontWeight={700}>الاسم</Typography></TableCell>
                        <TableCell><Typography fontWeight={700}>الحالة</Typography></TableCell>
                        <TableCell><Typography fontWeight={700}>تاريخ الإنشاء</Typography></TableCell>
                        <TableCell align="left"><Typography fontWeight={700}>إجراءات</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Typography fontWeight={600}>{user.username}</Typography>
                          </TableCell>
                          <TableCell>{user.display_name || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.is_active ? 'نشط' : 'معطل'}
                              color={user.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString('ar-SY') : '-'}</TableCell>
                          <TableCell align="left">
                            <Tooltip title="تغيير كلمة المرور">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewPassword('');
                                  setUserError('');
                                  setPasswordDialogOpen(true);
                                }}
                              >
                                <LockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.id === 1 ? 'لا يمكن حذف المستخدم الرئيسي' : 'حذف'}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={user.id === 1}
                                  onClick={() => handleDeleteUser(user.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* Database Management Tab */}
            {tabValue === 5 && (
              <CardContent sx={{ p: 3 }}>
                <DatabaseResetSection />
              </CardContent>
            )}
          </Card>
        </Grid>

        {/* Logo Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                شعار الشركة
              </Typography>

              <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
                {profile.logo_base64 ? (
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={profile.logo_base64}
                      sx={{ width: 180, height: 180, border: '3px solid', borderColor: 'primary.main' }}
                      variant="rounded"
                    />
                    <Tooltip title="حذف الشعار">
                      <IconButton
                        onClick={handleDeleteLogo}
                        sx={{
                          position: 'absolute',
                          top: -12,
                          right: -12,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Avatar sx={{ width: 180, height: 180, bgcolor: 'grey.200' }} variant="rounded">
                    <BusinessIcon sx={{ fontSize: 90, color: 'grey.400' }} />
                  </Avatar>
                )}
              </Box>

              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                fullWidth
                size="large"
              >
                {profile.logo_base64 ? 'تغيير الشعار' : 'رفع الشعار'}
                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontSize: '0.875rem' }}>
                الحد الأقصى: 2MB<br />
                PNG, JPG, SVG
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          sx={{ px: 5, py: 1.5, fontWeight: 700 }}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </Box>

      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة مستخدم جديد</DialogTitle>
        <DialogContent>
          {userError && <Alert severity="error" sx={{ mb: 2 }}>{userError}</Alert>}

          <TextField
            fullWidth
            label="اسم المستخدم *"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            autoFocus
          />

          <TextField
            fullWidth
            label="الاسم (اختياري)"
            value={userForm.display_name}
            onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            label="كلمة المرور *"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={handleAddUser}
            disabled={!userForm.username.trim() || !userForm.password}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تغيير كلمة المرور - {editingUser?.username}</DialogTitle>
        <DialogContent>
          {userError && <Alert severity="error" sx={{ mb: 2 }}>{userError}</Alert>}

          <TextField
            fullWidth
            type="password"
            label="كلمة المرور الجديدة *"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={!newPassword}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}