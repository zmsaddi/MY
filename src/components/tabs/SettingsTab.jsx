// src/components/tabs/SettingsTab.jsx
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Button, Typography,
  Alert, Divider, InputAdornment, Switch, FormControlLabel,
  Avatar, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Tabs, Tab, Chip, MenuItem
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';

import UnifiedFormField from '../common/forms/UnifiedFormField';
import UnifiedFormDialog from '../common/forms/UnifiedFormDialog';
import UnifiedConfirmDialog from '../common/dialogs/UnifiedConfirmDialog';
import { confirmationMessages } from '../../theme/designSystem';

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
import { safeText, safeNotes, safeCompanyName } from '../../utils/displayHelpers';
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
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'update',
    action: null
  });

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

  const handleActualSave = async () => {
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
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSaveEdit = () => {
    setConfirmDialog({
      open: true,
      type: 'update',
      action: handleActualSave
    });
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
    <>
      <TableRow hover>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.name_ar}
              onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
              name="name_ar"
              fullWidth
            />
          ) : (
            <Typography fontSize="1rem">{safeText(service.name_ar)}</Typography>
          )}
        </TableCell>

        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.name_en}
              onChange={(e) => setRow((r) => ({ ...r, name_en: e.target.value }))}
              name="name_en"
              fullWidth
            />
          ) : (
            <Typography color="text.secondary" fontSize="0.95rem">{safeText(service.name_en) || '—'}</Typography>
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

      <UnifiedConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={async () => {
          await confirmDialog.action();
        }}
        {...confirmationMessages[confirmDialog.type]}
        loading={saving}
      />
    </>
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
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'update',
    action: null
  });

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

  const handleActualSave = async () => {
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
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSaveEdit = () => {
    setConfirmDialog({
      open: true,
      type: 'update',
      action: handleActualSave
    });
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
            <UnifiedFormField
              value={row.name_ar}
              onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
              name="name_ar"
            />
          ) : (
            <Typography fontSize="1rem">{safeText(material.name_ar)}</Typography>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.abbreviation}
              onChange={(e) => setRow((r) => ({ ...r, abbreviation: e.target.value.toUpperCase() }))}
              name="abbreviation"
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
                    <UnifiedFormField
                      label="اسم الدرجة (مثل: 304)"
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      name="new_grade"
                      fullWidth
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
                          <UnifiedFormField
                            value={editGradeValue}
                            onChange={(e) => setEditGradeValue(e.target.value)}
                            name="edit_grade"
                            fullWidth={false}
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
                            label={safeText(grade.name)}
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
                    <UnifiedFormField
                      label="الاسم بالعربي"
                      value={newFinish.name_ar}
                      onChange={(e) => setNewFinish((f) => ({ ...f, name_ar: e.target.value }))}
                      name="new_finish_ar"
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <UnifiedFormField
                        label="الاسم بالإنجليزي"
                        value={newFinish.name_en}
                        onChange={(e) => setNewFinish((f) => ({ ...f, name_en: e.target.value }))}
                        name="new_finish_en"
                        fullWidth
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
                          <UnifiedFormField
                            label="عربي"
                            value={editFinishValue.name_ar}
                            onChange={(e) => setEditFinishValue((f) => ({ ...f, name_ar: e.target.value }))}
                            name="edit_finish_ar"
                          />
                          <UnifiedFormField
                            label="English"
                            value={editFinishValue.name_en}
                            onChange={(e) => setEditFinishValue((f) => ({ ...f, name_en: e.target.value }))}
                            name="edit_finish_en"
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
                            label={`${safeText(finish.name_ar)} (${safeText(finish.name_en) || '-'})`}
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
      <UnifiedConfirmDialog
        open={deleteConfirm.open}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.type === 'grade' ? 'الدرجة' : 'التشطيب'} "${deleteConfirm.name}"؟ سيتم تعطيل العنصر فقط للحفاظ على سلامة البيانات التاريخية.`}
        type="warning"
        confirmText="حذف"
        confirmColor="error"
      />

      {/* Update Confirmation Dialog */}
      <UnifiedConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={async () => {
          await confirmDialog.action();
        }}
        {...confirmationMessages[confirmDialog.type]}
        loading={saving}
      />
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
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'update',
    action: null
  });

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

  const handleActualSave = async () => {
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
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSaveEdit = () => {
    setConfirmDialog({
      open: true,
      type: 'update',
      action: handleActualSave
    });
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
    <>
      <TableRow hover>
        <TableCell>
          <Typography fontSize="1rem" fontWeight={600}>{currency.code}</Typography>
        </TableCell>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.name_ar}
              onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
              name="name_ar"
            />
          ) : (
            <Typography fontSize="1rem">{safeText(currency.name_ar)}</Typography>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.symbol}
              onChange={(e) => setRow((r) => ({ ...r, symbol: e.target.value }))}
              name="symbol"
            />
          ) : (
            <Typography fontSize="1rem">{currency.symbol}</Typography>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.exchange_rate}
              onChange={(e) => setRow((r) => ({ ...r, exchange_rate: e.target.value }))}
              name="exchange_rate"
              type="number"
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

      <UnifiedConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={async () => {
          await confirmDialog.action();
        }}
        {...confirmationMessages[confirmDialog.type]}
        loading={saving}
      />
    </>
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
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'update',
    action: null
  });

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

  const handleActualSave = async () => {
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
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSaveEdit = () => {
    setConfirmDialog({
      open: true,
      type: 'update',
      action: handleActualSave
    });
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
    <>
      <TableRow hover>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.name_ar}
              onChange={(e) => setRow((r) => ({ ...r, name_ar: e.target.value }))}
              name="name_ar"
              fullWidth
            />
          ) : (
            <Typography fontSize="1rem">{safeText(method.name_ar)}</Typography>
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <UnifiedFormField
              value={row.name_en}
              onChange={(e) => setRow((r) => ({ ...r, name_en: e.target.value }))}
              name="name_en"
              fullWidth
            />
          ) : (
            <Typography color="text.secondary" fontSize="0.95rem">{safeText(method.name_en) || '—'}</Typography>
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

      <UnifiedConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={async () => {
          await confirmDialog.action();
        }}
        {...confirmationMessages[confirmDialog.type]}
        loading={saving}
      />
    </>
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Services
  const [services, setServices] = useState([]);
  const [svcError, setSvcError] = useState('');
  const [svcErrors, setSvcErrors] = useState({});
  const [svcSuccess, setSvcSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [newService, setNewService] = useState({ name_ar: '', name_en: '', is_active: true });
  const [svcDialogOpen, setSvcDialogOpen] = useState(false);
  const [svcConfirmDialog, setSvcConfirmDialog] = useState({
    open: false,
    type: 'save',
    action: null
  });

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
  const [matErrors, setMatErrors] = useState({});
  const [matSuccess, setMatSuccess] = useState('');
  const [matDialogOpen, setMatDialogOpen] = useState(false);
  const [matConfirmDialog, setMatConfirmDialog] = useState({
    open: false,
    type: 'save',
    action: null
  });

  // Currencies
  const [currencies, setCurrencies] = useState([]);
  const [newCurrency, setNewCurrency] = useState({ code: '', name_ar: '', name_en: '', symbol: '', exchange_rate: 1, is_active: true });
  const [currError, setCurrError] = useState('');
  const [currErrors, setCurrErrors] = useState({});
  const [currSuccess, setCurrSuccess] = useState('');
  const [currDialogOpen, setCurrDialogOpen] = useState(false);
  const [currConfirmDialog, setCurrConfirmDialog] = useState({
    open: false,
    type: 'save',
    action: null
  });

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPayment, setNewPayment] = useState({ name_ar: '', name_en: '', is_active: true });
  const [pmError, setPmError] = useState('');
  const [pmErrors, setPmErrors] = useState({});
  const [pmSuccess, setPmSuccess] = useState('');
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [pmConfirmDialog, setPmConfirmDialog] = useState({
    open: false,
    type: 'save',
    action: null
  });

  // Users
  const [users, setUsers] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', display_name: '', role: 'user' });
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userErrors, setUserErrors] = useState({});
  const [userSuccess, setUserSuccess] = useState('');
  const [userConfirmDialog, setUserConfirmDialog] = useState({
    open: false,
    type: 'save',
    action: null
  });
  const [deleteUserConfirm, setDeleteUserConfirm] = useState({
    open: false,
    userId: null,
    userName: ''
  });

  // Company profile confirmation
  const [profileConfirmDialog, setProfileConfirmDialog] = useState({
    open: false,
    type: 'update',
    action: null
  });

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
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
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

  const validateProfile = () => {
    const newErrors = {};

    if (!profile.company_name?.trim()) {
      newErrors.company_name = 'اسم الشركة مطلوب';
    }

    if (profile.vat_enabled && (isNaN(profile.vat_rate) || profile.vat_rate < 0 || profile.vat_rate > 100)) {
      newErrors.vat_rate = 'نسبة الضريبة يجب أن تكون بين 0 و 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualSave = async () => {
    if (!validateProfile()) {
      setProfileConfirmDialog({ ...profileConfirmDialog, open: false });
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
      setProfileConfirmDialog({ ...profileConfirmDialog, open: false });
    }
  };

  const handleSave = () => {
    setProfileConfirmDialog({
      open: true,
      type: 'update',
      action: handleActualSave
    });
  };

  // Service handlers
  const validateService = () => {
    const newErrors = {};
    if (!newService.name_ar.trim()) {
      newErrors.name_ar = 'الاسم بالعربي مطلوب';
    }
    setSvcErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualAddService = async () => {
    if (!validateService()) {
      setSvcConfirmDialog({ ...svcConfirmDialog, open: false });
      return;
    }

    setAdding(true);
    setSvcError('');
    try {
      const res = await addServiceType({
        name_ar: newService.name_ar.trim(),
        name_en: newService.name_en?.trim() || null,
        is_active: newService.is_active ? 1 : 0,
      });
      if (res?.success) {
        setSvcSuccess('✓ تمت إضافة الخدمة');
        setNewService({ name_ar: '', name_en: '', is_active: true });
        setSvcDialogOpen(false);
        loadServices();
        setTimeout(() => setSvcSuccess(''), 2500);
      } else {
        setSvcError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setSvcError('فشل الإضافة');
    } finally {
      setAdding(false);
      setSvcConfirmDialog({ ...svcConfirmDialog, open: false });
    }
  };

  const handleAddService = () => {
    setSvcConfirmDialog({
      open: true,
      type: 'save',
      action: handleActualAddService
    });
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService({ ...newService, [name]: value });
    if (svcErrors[name]) {
      setSvcErrors({ ...svcErrors, [name]: null });
    }
  };

  // Material handlers
  const validateMaterial = () => {
    const newErrors = {};
    if (!newMaterial.name_ar.trim()) {
      newErrors.name_ar = 'الاسم بالعربي مطلوب';
    }
    if (!newMaterial.abbreviation.trim()) {
      newErrors.abbreviation = 'الاختصار مطلوب';
    }
    if (newMaterial.density && isNaN(parseFloat(newMaterial.density))) {
      newErrors.density = 'الكثافة يجب أن تكون رقماً';
    }
    setMatErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualAddMaterial = async () => {
    if (!validateMaterial()) {
      setMatConfirmDialog({ ...matConfirmDialog, open: false });
      return;
    }

    setMatError('');
    setMatSuccess('');
    try {
      const res = await addMetalType({
        name_ar: newMaterial.name_ar.trim(),
        name_en: newMaterial.name_en?.trim() || null,
        abbreviation: newMaterial.abbreviation.toUpperCase().trim(),
        density: newMaterial.density ? parseFloat(newMaterial.density) : null,
        is_active: newMaterial.is_active ? 1 : 0,
      });
      if (res?.success) {
        setMatSuccess('✓ تمت إضافة المادة');
        setNewMaterial({ name_ar: '', name_en: '', abbreviation: '', density: '', is_active: true });
        setMatDialogOpen(false);
        loadMaterials();
        setTimeout(() => setMatSuccess(''), 2500);
      } else {
        setMatError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setMatError('فشل الإضافة');
    } finally {
      setMatConfirmDialog({ ...matConfirmDialog, open: false });
    }
  };

  const handleAddMaterial = () => {
    setMatConfirmDialog({
      open: true,
      type: 'save',
      action: handleActualAddMaterial
    });
  };

  const handleMaterialChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial({ ...newMaterial, [name]: value });
    if (matErrors[name]) {
      setMatErrors({ ...matErrors, [name]: null });
    }
  };

  // Currency handlers
  const validateCurrency = () => {
    const newErrors = {};
    if (!newCurrency.code.trim()) {
      newErrors.code = 'الكود مطلوب';
    }
    if (!newCurrency.name_ar.trim()) {
      newErrors.name_ar = 'الاسم بالعربي مطلوب';
    }
    if (!newCurrency.symbol.trim()) {
      newErrors.symbol = 'الرمز مطلوب';
    }
    if (!newCurrency.exchange_rate || newCurrency.exchange_rate <= 0) {
      newErrors.exchange_rate = 'سعر الصرف يجب أن يكون أكبر من صفر';
    }
    setCurrErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualAddCurrency = async () => {
    if (!validateCurrency()) {
      setCurrConfirmDialog({ ...currConfirmDialog, open: false });
      return;
    }

    setCurrError('');
    setCurrSuccess('');
    try {
      const res = await addCurrency({
        code: newCurrency.code.toUpperCase().trim(),
        name_ar: newCurrency.name_ar.trim(),
        name_en: newCurrency.name_en?.trim() || null,
        symbol: newCurrency.symbol.trim(),
        exchange_rate: parseFloat(newCurrency.exchange_rate),
        is_active: newCurrency.is_active ? 1 : 0,
      });
      if (res?.success) {
        setCurrSuccess('✓ تمت إضافة العملة');
        setNewCurrency({ code: '', name_ar: '', name_en: '', symbol: '', exchange_rate: 1, is_active: true });
        setCurrDialogOpen(false);
        loadCurrencies();
        setTimeout(() => setCurrSuccess(''), 2500);
      } else {
        setCurrError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setCurrError('فشل الإضافة');
    } finally {
      setCurrConfirmDialog({ ...currConfirmDialog, open: false });
    }
  };

  const handleAddCurrency = () => {
    setCurrConfirmDialog({
      open: true,
      type: 'save',
      action: handleActualAddCurrency
    });
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    setNewCurrency({ ...newCurrency, [name]: value });
    if (currErrors[name]) {
      setCurrErrors({ ...currErrors, [name]: null });
    }
  };

  // Payment Method handlers
  const validatePaymentMethod = () => {
    const newErrors = {};
    if (!newPayment.name_ar.trim()) {
      newErrors.name_ar = 'الاسم بالعربي مطلوب';
    }
    setPmErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualAddPayment = async () => {
    if (!validatePaymentMethod()) {
      setPmConfirmDialog({ ...pmConfirmDialog, open: false });
      return;
    }

    setPmError('');
    setPmSuccess('');
    try {
      const res = await addPaymentMethod({
        name_ar: newPayment.name_ar.trim(),
        name_en: newPayment.name_en?.trim() || null,
        is_active: newPayment.is_active ? 1 : 0,
      });
      if (res?.success) {
        setPmSuccess('✓ تمت إضافة طريقة الدفع');
        setNewPayment({ name_ar: '', name_en: '', is_active: true });
        setPmDialogOpen(false);
        loadPaymentMethods();
        setTimeout(() => setPmSuccess(''), 2500);
      } else {
        setPmError(res?.error || 'فشل الإضافة');
      }
    } catch (e) {
      setPmError('فشل الإضافة');
    } finally {
      setPmConfirmDialog({ ...pmConfirmDialog, open: false });
    }
  };

  const handleAddPayment = () => {
    setPmConfirmDialog({
      open: true,
      type: 'save',
      action: handleActualAddPayment
    });
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment({ ...newPayment, [name]: value });
    if (pmErrors[name]) {
      setPmErrors({ ...pmErrors, [name]: null });
    }
  };

  // User Management Handlers
  const validateUser = () => {
    const newErrors = {};
    if (!userForm.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }
    if (!editingUser && !userForm.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }
    if (!userForm.role) {
      newErrors.role = 'الدور مطلوب';
    }
    setUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualAddUser = async () => {
    if (!validateUser()) {
      setUserConfirmDialog({ ...userConfirmDialog, open: false });
      return;
    }

    setUserError('');
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
    } finally {
      setUserConfirmDialog({ ...userConfirmDialog, open: false });
    }
  };

  const handleAddUser = () => {
    setUserConfirmDialog({
      open: true,
      type: 'save',
      action: handleActualAddUser
    });
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.password = 'كلمة المرور الجديدة مطلوبة';
    }
    setUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualChangePassword = async () => {
    if (!validatePassword()) {
      setUserConfirmDialog({ ...userConfirmDialog, open: false });
      return;
    }

    setUserError('');
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
    } finally {
      setUserConfirmDialog({ ...userConfirmDialog, open: false });
    }
  };

  const handleChangePassword = () => {
    setUserConfirmDialog({
      open: true,
      type: 'update',
      action: handleActualChangePassword
    });
  };

  const handleActualDeleteUser = async () => {
    try {
      const res = await deleteUser(deleteUserConfirm.userId);
      if (res?.success) {
        setUserSuccess('✓ تم حذف المستخدم بنجاح');
        loadUsers();
        setTimeout(() => setUserSuccess(''), 2500);
      } else {
        setUserError(res?.error || 'فشل حذف المستخدم');
      }
    } catch (e) {
      setUserError(e.message || 'فشل حذف المستخدم');
    } finally {
      setDeleteUserConfirm({ open: false, userId: null, userName: '' });
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteUserConfirm({
      open: true,
      userId: user.id,
      userName: user.username
    });
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });
    if (userErrors[name]) {
      setUserErrors({ ...userErrors, [name]: null });
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
                  <UnifiedFormField
                    label="اسم الشركة (بالعربية)"
                    value={profile.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    name="company_name"
                    required
                    error={errors.company_name}
                  />
                </Grid>

                <Grid item xs={12}>
                  <UnifiedFormField
                    label="Company Name (English)"
                    value={profile.company_name_en}
                    onChange={(e) => handleChange('company_name_en', e.target.value)}
                    name="company_name_en"
                  />
                </Grid>

                <Grid item xs={12}>
                  <UnifiedFormField
                    label="العنوان"
                    value={profile.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    name="address"
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="الهاتف 1"
                    value={profile.phone1}
                    onChange={(e) => handleChange('phone1', e.target.value)}
                    name="phone1"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="الهاتف 2"
                    value={profile.phone2}
                    onChange={(e) => handleChange('phone2', e.target.value)}
                    name="phone2"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="البريد الإلكتروني"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    name="email"
                    type="email"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="الرقم الضريبي"
                    value={profile.tax_number}
                    onChange={(e) => handleChange('tax_number', e.target.value)}
                    name="tax_number"
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
                  <UnifiedFormField
                    label="العملة الأساسية"
                    value={profile.base_currency}
                    onChange={(e) => handleChange('base_currency', e.target.value)}
                    name="base_currency"
                    select
                    helperText="جميع المبالغ ستُحفظ بهذه العملة"
                  >
                    {currencies.filter(c => c.is_active).map((curr) => (
                      <MenuItem key={curr.id} value={curr.code}>
                        {safeText(curr.name_ar)} ({curr.code}) - {curr.symbol}
                      </MenuItem>
                    ))}
                  </UnifiedFormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <UnifiedFormField
                    label="طريقة الدفع الافتراضية"
                    value={profile.default_payment_method}
                    onChange={(e) => handleChange('default_payment_method', e.target.value)}
                    name="default_payment_method"
                    select
                  >
                    {paymentMethods.filter(pm => pm.is_active).map((pm) => (
                      <MenuItem key={pm.id} value={pm.name}>
                        {safeText(pm.name)}
                      </MenuItem>
                    ))}
                  </UnifiedFormField>
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
                  <UnifiedFormField
                    label="نسبة الضريبة"
                    value={profile.vat_rate}
                    onChange={(e) => handleChange('vat_rate', parseFloat(e.target.value) || 0)}
                    name="vat_rate"
                    type="number"
                    disabled={!profile.vat_enabled}
                    error={errors.vat_rate}
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

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewService({ name_ar: '', name_en: '', is_active: true });
                      setSvcErrors({});
                      setSvcError('');
                      setSvcDialogOpen(true);
                    }}
                  >
                    إضافة خدمة
                  </Button>
                </Box>

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

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewMaterial({ name_ar: '', name_en: '', abbreviation: '', density: '', is_active: true });
                      setMatErrors({});
                      setMatError('');
                      setMatDialogOpen(true);
                    }}
                  >
                    إضافة مادة
                  </Button>
                </Box>

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

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewCurrency({ code: '', name_ar: '', name_en: '', symbol: '', exchange_rate: 1, is_active: true });
                      setCurrErrors({});
                      setCurrError('');
                      setCurrDialogOpen(true);
                    }}
                  >
                    إضافة عملة
                  </Button>
                </Box>

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

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewPayment({ name_ar: '', name_en: '', is_active: true });
                      setPmErrors({});
                      setPmError('');
                      setPmDialogOpen(true);
                    }}
                  >
                    إضافة طريقة دفع
                  </Button>
                </Box>

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
                      setUserForm({ username: '', password: '', display_name: '', role: 'user' });
                      setUserErrors({});
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
                            <Typography fontWeight={600}>{safeText(user.username)}</Typography>
                          </TableCell>
                          <TableCell>{safeText(user.display_name) || '-'}</TableCell>
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
                                  setUserErrors({});
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
                                  onClick={() => handleDeleteUser(user)}
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

      {/* Add Service Dialog */}
      <UnifiedFormDialog
        open={svcDialogOpen}
        onClose={() => setSvcDialogOpen(false)}
        onSubmit={handleAddService}
        title="إضافة خدمة جديدة"
        subtitle="أدخل بيانات الخدمة"
        submitText="حفظ"
        loading={adding}
      >
        <UnifiedFormField
          label="الاسم بالعربي"
          value={newService.name_ar}
          onChange={handleServiceChange}
          name="name_ar"
          required
          error={svcErrors.name_ar}
          autoFocus
        />
        <UnifiedFormField
          label="الاسم بالإنجليزي"
          value={newService.name_en}
          onChange={handleServiceChange}
          name="name_en"
          helperText="اختياري"
        />
      </UnifiedFormDialog>

      {/* Add Material Dialog */}
      <UnifiedFormDialog
        open={matDialogOpen}
        onClose={() => setMatDialogOpen(false)}
        onSubmit={handleAddMaterial}
        title="إضافة مادة جديدة"
        subtitle="أدخل بيانات المادة"
        submitText="حفظ"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الاسم بالعربي"
              value={newMaterial.name_ar}
              onChange={handleMaterialChange}
              name="name_ar"
              required
              error={matErrors.name_ar}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الاسم بالإنجليزي"
              value={newMaterial.name_en}
              onChange={handleMaterialChange}
              name="name_en"
              helperText="اختياري"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الاختصار (3 أحرف)"
              value={newMaterial.abbreviation}
              onChange={(e) => handleMaterialChange({ target: { name: 'abbreviation', value: e.target.value.toUpperCase() } })}
              name="abbreviation"
              required
              error={matErrors.abbreviation}
              inputProps={{ maxLength: 3 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <UnifiedFormField
              label="الكثافة"
              value={newMaterial.density}
              onChange={handleMaterialChange}
              name="density"
              type="number"
              error={matErrors.density}
              helperText="اختياري - بوحدة g/cm³"
              inputProps={{ step: 0.01, min: 0 }}
            />
          </Grid>
        </Grid>
      </UnifiedFormDialog>

      {/* Add Currency Dialog */}
      <UnifiedFormDialog
        open={currDialogOpen}
        onClose={() => setCurrDialogOpen(false)}
        onSubmit={handleAddCurrency}
        title="إضافة عملة جديدة"
        subtitle="أدخل بيانات العملة"
        submitText="حفظ"
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <UnifiedFormField
              label="الكود (3 أحرف)"
              value={newCurrency.code}
              onChange={(e) => handleCurrencyChange({ target: { name: 'code', value: e.target.value.toUpperCase() } })}
              name="code"
              required
              error={currErrors.code}
              autoFocus
              inputProps={{ maxLength: 3 }}
              helperText="مثل: USD, EUR"
            />
          </Grid>
          <Grid item xs={6}>
            <UnifiedFormField
              label="الرمز"
              value={newCurrency.symbol}
              onChange={handleCurrencyChange}
              name="symbol"
              required
              error={currErrors.symbol}
              helperText="مثل: $, €"
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="الاسم بالعربي"
              value={newCurrency.name_ar}
              onChange={handleCurrencyChange}
              name="name_ar"
              required
              error={currErrors.name_ar}
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="الاسم بالإنجليزي"
              value={newCurrency.name_en}
              onChange={handleCurrencyChange}
              name="name_en"
              helperText="اختياري"
            />
          </Grid>
          <Grid item xs={12}>
            <UnifiedFormField
              label="سعر الصرف"
              value={newCurrency.exchange_rate}
              onChange={handleCurrencyChange}
              name="exchange_rate"
              type="number"
              required
              error={currErrors.exchange_rate}
              helperText="نسبة إلى العملة الأساسية"
              inputProps={{ step: 0.01, min: 0.01 }}
            />
          </Grid>
        </Grid>
      </UnifiedFormDialog>

      {/* Add Payment Method Dialog */}
      <UnifiedFormDialog
        open={pmDialogOpen}
        onClose={() => setPmDialogOpen(false)}
        onSubmit={handleAddPayment}
        title="إضافة طريقة دفع جديدة"
        subtitle="أدخل بيانات طريقة الدفع"
        submitText="حفظ"
      >
        <UnifiedFormField
          label="الاسم بالعربي"
          value={newPayment.name_ar}
          onChange={handlePaymentChange}
          name="name_ar"
          required
          error={pmErrors.name_ar}
          autoFocus
        />
        <UnifiedFormField
          label="الاسم بالإنجليزي"
          value={newPayment.name_en}
          onChange={handlePaymentChange}
          name="name_en"
          helperText="اختياري"
        />
      </UnifiedFormDialog>

      {/* Add User Dialog */}
      <UnifiedFormDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        onSubmit={handleAddUser}
        title="إضافة مستخدم جديد"
        submitText="حفظ"
      >
        <UnifiedFormField
          label="اسم المستخدم"
          value={userForm.username}
          onChange={handleUserChange}
          name="username"
          required
          error={userErrors.username}
          autoFocus
        />

        <UnifiedFormField
          label="الاسم الكامل"
          value={userForm.display_name}
          onChange={handleUserChange}
          name="display_name"
          helperText="اختياري"
        />

        <UnifiedFormField
          label="كلمة المرور"
          value={userForm.password}
          onChange={handleUserChange}
          name="password"
          type="password"
          required
          error={userErrors.password}
        />

        <UnifiedFormField
          label="الدور"
          value={userForm.role}
          onChange={handleUserChange}
          name="role"
          select
          required
          error={userErrors.role}
        >
          <MenuItem value="admin">مدير</MenuItem>
          <MenuItem value="user">مستخدم</MenuItem>
        </UnifiedFormField>
      </UnifiedFormDialog>

      {/* Change Password Dialog */}
      <UnifiedFormDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onSubmit={handleChangePassword}
        title={`تغيير كلمة المرور - ${editingUser?.username}`}
        submitText="حفظ"
      >
        <UnifiedFormField
          label="كلمة المرور الجديدة"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          name="new_password"
          type="password"
          required
          error={userErrors.password}
          autoFocus
        />
      </UnifiedFormDialog>

      {/* Confirmation Dialogs */}
      <UnifiedConfirmDialog
        open={profileConfirmDialog.open}
        onClose={() => setProfileConfirmDialog({ ...profileConfirmDialog, open: false })}
        onConfirm={async () => {
          await profileConfirmDialog.action();
        }}
        {...confirmationMessages[profileConfirmDialog.type]}
        loading={loading}
      />

      <UnifiedConfirmDialog
        open={svcConfirmDialog.open}
        onClose={() => setSvcConfirmDialog({ ...svcConfirmDialog, open: false })}
        onConfirm={async () => {
          await svcConfirmDialog.action();
        }}
        {...confirmationMessages[svcConfirmDialog.type]}
        loading={adding}
      />

      <UnifiedConfirmDialog
        open={matConfirmDialog.open}
        onClose={() => setMatConfirmDialog({ ...matConfirmDialog, open: false })}
        onConfirm={async () => {
          await matConfirmDialog.action();
        }}
        {...confirmationMessages[matConfirmDialog.type]}
      />

      <UnifiedConfirmDialog
        open={currConfirmDialog.open}
        onClose={() => setCurrConfirmDialog({ ...currConfirmDialog, open: false })}
        onConfirm={async () => {
          await currConfirmDialog.action();
        }}
        {...confirmationMessages[currConfirmDialog.type]}
      />

      <UnifiedConfirmDialog
        open={pmConfirmDialog.open}
        onClose={() => setPmConfirmDialog({ ...pmConfirmDialog, open: false })}
        onConfirm={async () => {
          await pmConfirmDialog.action();
        }}
        {...confirmationMessages[pmConfirmDialog.type]}
      />

      <UnifiedConfirmDialog
        open={userConfirmDialog.open}
        onClose={() => setUserConfirmDialog({ ...userConfirmDialog, open: false })}
        onConfirm={async () => {
          await userConfirmDialog.action();
        }}
        {...confirmationMessages[userConfirmDialog.type]}
      />

      <UnifiedConfirmDialog
        open={deleteUserConfirm.open}
        onClose={() => setDeleteUserConfirm({ open: false, userId: null, userName: '' })}
        onConfirm={handleActualDeleteUser}
        title="تأكيد حذف المستخدم"
        message={`هل أنت متأكد من حذف المستخدم "${deleteUserConfirm.userName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        type="warning"
        confirmText="حذف"
        confirmColor="error"
      />
    </Box>
  );
}
