// src/components/features/settings/DatabaseResetSection.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import ConfirmDialog from '../../common/dialogs/ConfirmDialog';
import {
  getDatabaseStats,
  clearTransactionalData,
  clearMasterData,
  resetDatabaseToInitialState,
  exportDatabaseToJSON,
  deleteStoredDatabase,
} from '../../../utils/database/reset';

/**
 * Database Reset & Maintenance Section
 * Provides UI for cleaning and resetting database data
 */
function DatabaseResetSection({ onDataReset }) {
  const [stats, setStats] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [alert, setAlert] = useState({ show: false, type: 'info', message: '' });

  // Load statistics on mount
  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const dbStats = getDatabaseStats();
    setStats(dbStats);
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: 'info', message: '' }), 5000);
  };

  const handleClearTransactional = () => {
    setConfirmDialog({ open: true, type: 'transactional' });
  };

  const handleClearMaster = () => {
    setConfirmDialog({ open: true, type: 'master' });
  };

  const handleResetToInitial = () => {
    setConfirmDialog({ open: true, type: 'initial' });
  };

  const handleDeleteStorage = () => {
    setConfirmDialog({ open: true, type: 'storage' });
  };

  const handleExportBackup = () => {
    const result = exportDatabaseToJSON();

    if (result.success) {
      // Create downloadable JSON file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showAlert('success', 'تم تصدير النسخة الاحتياطية بنجاح');
    } else {
      showAlert('error', result.error || 'فشل التصدير');
    }
  };

  const handleConfirm = () => {
    const { type } = confirmDialog;
    let result;

    switch (type) {
      case 'transactional':
        result = clearTransactionalData();
        break;
      case 'master':
        result = clearMasterData();
        break;
      case 'initial':
        result = resetDatabaseToInitialState();
        break;
      case 'storage':
        result = deleteStoredDatabase();
        break;
      default:
        return;
    }

    if (result.success) {
      showAlert('success', result.message);
      loadStats();
      if (onDataReset) onDataReset();

      // Reload page if storage was deleted
      if (type === 'storage') {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      showAlert('error', result.error || 'فشلت العملية');
    }

    setConfirmDialog({ open: false, type: null });
  };

  const getConfirmDialogContent = () => {
    const { type } = confirmDialog;

    switch (type) {
      case 'transactional':
        return {
          title: 'حذف البيانات التشغيلية',
          message: 'هل أنت متأكد من حذف جميع المبيعات، المدفوعات، الصفائح، والحركات؟ سيتم الاحتفاظ بالعملاء والموردين والإعدادات.',
          confirmColor: 'warning',
        };
      case 'master':
        return {
          title: 'حذف البيانات الأساسية',
          message: 'هل أنت متأكد من حذف جميع العملاء، الموردين، وجميع البيانات المرتبطة بهم؟ سيتم الاحتفاظ بالمستخدمين والإعدادات فقط.',
          confirmColor: 'error',
        };
      case 'initial':
        return {
          title: 'إعادة تعيين قاعدة البيانات',
          message: 'هل أنت متأكد من إعادة تعيين قاعدة البيانات إلى حالتها الأولية؟ سيتم حذف كل شيء ماعدا المستخدمين وإعدادات الشركة!',
          confirmColor: 'error',
        };
      case 'storage':
        return {
          title: 'حذف قاعدة البيانات من التخزين',
          message: 'هل أنت متأكد؟ سيتم حذف قاعدة البيانات بالكامل وإنشاء قاعدة جديدة عند إعادة تحميل الصفحة. تأكد من أخذ نسخة احتياطية!',
          confirmColor: 'error',
        };
      default:
        return { title: '', message: '', confirmColor: 'error' };
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CleaningServicesIcon />
          صيانة قاعدة البيانات
        </Typography>

        {alert.show && (
          <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert({ show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Database Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            إحصائيات قاعدة البيانات
          </Typography>
          {stats && (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الجدول</TableCell>
                    <TableCell align="right">عدد السجلات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{value.label}</TableCell>
                      <TableCell align="right">
                        <Chip label={value.count} size="small" color={value.count > 0 ? 'primary' : 'default'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Export Backup */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="primary">
            النسخ الاحتياطي
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            قم بتصدير نسخة احتياطية من قاعدة البيانات قبل إجراء أي عملية حذف
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportBackup}
            fullWidth
          >
            تصدير نسخة احتياطية (JSON)
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Warning */}
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>
            تحذير: جميع عمليات الحذف أدناه لا يمكن التراجع عنها!
          </Typography>
          <Typography variant="caption">
            تأكد من أخذ نسخة احتياطية قبل المتابعة
          </Typography>
        </Alert>

        {/* Reset Options */}
        <Grid container spacing={2}>
          {/* Clear Transactional Data */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom color="warning.main">
                  حذف البيانات التشغيلية
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  يحذف: المبيعات، المدفوعات، الصفائح، المخزون، المصاريف
                  <br />
                  يحتفظ: العملاء، الموردين، الإعدادات
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  startIcon={<CleaningServicesIcon />}
                  onClick={handleClearTransactional}
                >
                  حذف البيانات التشغيلية
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Clear Master Data */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom color="error">
                  حذف البيانات الأساسية
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  يحذف: كل شيء (العملاء، الموردين، المبيعات، المخزون...)
                  <br />
                  يحتفظ: المستخدمين، إعدادات الشركة
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<DeleteForeverIcon />}
                  onClick={handleClearMaster}
                >
                  حذف البيانات الأساسية
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Reset to Initial State */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom color="error">
                  إعادة تعيين كاملة
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  إعادة تعيين قاعدة البيانات للحالة الأولية
                  <br />
                  يحتفظ: المستخدمين، معلومات الشركة، الإعدادات
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  startIcon={<RestoreIcon />}
                  onClick={handleResetToInitial}
                >
                  إعادة تعيين كاملة
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Delete from Storage */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom color="error">
                  حذف من التخزين (خطر!)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  يحذف قاعدة البيانات بالكامل من المتصفح
                  <br />
                  يتطلب: إعادة إعداد كامل للنظام
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  startIcon={<DeleteForeverIcon />}
                  onClick={handleDeleteStorage}
                >
                  حذف من التخزين المحلي
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, type: null })}
          onConfirm={handleConfirm}
          title={dialogContent.title}
          message={dialogContent.message}
          confirmLabel="نعم، متأكد"
          cancelLabel="إلغاء"
          confirmColor={dialogContent.confirmColor}
        />
      </CardContent>
    </Card>
  );
}

DatabaseResetSection.propTypes = {
  onDataReset: PropTypes.func,
};

export default DatabaseResetSection;
