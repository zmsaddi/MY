// src/components/sales/RemnantCreationDialog.jsx
import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, TextField, Button, Typography, Alert, Card
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { addSheetWithBatch, getSuppliers, generateSheetCode } from '../../utils/database';

export default function RemnantCreationDialog({
  open,
  onClose,
  currentSaleData,
  onSuccess
}) {
  const [remnantPieces, setRemnantPieces] = useState([
    {
      length: '',
      width: '',
      thickness: currentSaleData?.thickness || '',
      quantity: '1'
    }
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddPiece = () => {
    setRemnantPieces([
      ...remnantPieces,
      {
        length: '',
        width: '',
        thickness: currentSaleData?.thickness || '',
        quantity: '1'
      }
    ]);
  };

  const handleRemovePiece = (index) => {
    setRemnantPieces(remnantPieces.filter((_, i) => i !== index));
  };

  const handleUpdatePiece = (index, field, value) => {
    const updated = [...remnantPieces];
    updated[index][field] = value;
    setRemnantPieces(updated);
  };

  const handleSaveRemnants = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate remnant pieces
      const validPieces = remnantPieces.filter(p =>
        p.length && p.width && p.thickness && p.quantity
      );

      if (validPieces.length === 0) {
        setError('لا توجد قطع صالحة للحفظ');
        setSaving(false);
        return;
      }

      // Get company supplier for remnants
      const suppliers = getSuppliers();
      const companySupplier = suppliers.find(s =>
        s.name === 'الشركة' || s.name.includes('الشركة')
      );

      // Save each remnant piece
      let savedCount = 0;
      for (const piece of validPieces) {
        // Generate sheet code for remnant
        const remnantCode = generateSheetCode(
          currentSaleData.metalTypeId,
          Number(piece.length),
          Number(piece.width),
          Number(piece.thickness),
          currentSaleData.gradeId,
          currentSaleData.finishId,
          true // isRemnant
        );

        const sheetData = {
          code: remnantCode,
          metal_type_id: currentSaleData.metalTypeId,
          grade_id: currentSaleData.gradeId || null,
          finish_id: currentSaleData.finishId || null,
          length_mm: Number(piece.length),
          width_mm: Number(piece.width),
          thickness_mm: Number(piece.thickness),
          weight_per_sheet_kg: null, // Will calculate automatically if needed
          is_remnant: true,
          parent_sheet_id: currentSaleData.sheetId
        };

        const batchData = {
          supplier_id: companySupplier?.id || null,
          quantity: Number(piece.quantity),
          price_per_kg: currentSaleData.originalPrice || null, // Inherit parent sheet price
          total_cost: null,
          storage_location: null,
          received_date: new Date().toISOString().split('T')[0],
          notes: `بقية من قص ${currentSaleData.sheetCode}`
        };

        const result = addSheetWithBatch(sheetData, batchData);
        if (result.success) {
          savedCount++;
        }
      }

      if (savedCount > 0) {
        onSuccess && onSuccess(savedCount);
        onClose();
      } else {
        setError('فشل حفظ البواقي');
      }
    } catch (err) {
      setError('حدث خطأ أثناء حفظ البواقي: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContentCutIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            إضافة البواقي من القطع
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
            تم قص الصفيحة. هل تريد إضافة القطع المتبقية كبواقي؟
          </Alert>

          {currentSaleData && (
            <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                <strong>الصفيحة الأم:</strong> {currentSaleData.sheetCode}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                <strong>القطعة المباعة:</strong> {currentSaleData.soldDimensions}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                <strong>نوع المعدن:</strong> {currentSaleData.metalName}
              </Typography>
            </Card>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {remnantPieces.map((piece, index) => (
            <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    قطعة بقية #{index + 1}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="الطول (مم) *"
                    value={piece.length}
                    onChange={(e) => handleUpdatePiece(index, 'length', e.target.value)}
                    inputProps={{ min: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="العرض (مم) *"
                    value={piece.width}
                    onChange={(e) => handleUpdatePiece(index, 'width', e.target.value)}
                    inputProps={{ min: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="السماكة (مم)"
                    value={piece.thickness}
                    onChange={(e) => handleUpdatePiece(index, 'thickness', e.target.value)}
                    inputProps={{ step: 0.1, min: 0.1 }}
                    InputLabelProps={{ shrink: true }}
                    disabled // Inherited from parent sheet
                    helperText="موروثة من الصفيحة الأم"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="الكمية"
                    value={piece.quantity}
                    onChange={(e) => handleUpdatePiece(index, 'quantity', e.target.value)}
                    inputProps={{ min: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemovePiece(index)}
                    disabled={remnantPieces.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddPiece}
            sx={{ mb: 2 }}
          >
            إضافة قطعة أخرى
          </Button>

          <Alert severity="warning" sx={{ fontSize: '0.9375rem' }}>
            <strong>ملاحظة:</strong> سيتم حفظ البواقي كمخزون للشركة بنفس سعر الصفيحة الأم
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} size="large" disabled={saving}>
          تخطي
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveRemnants}
          size="large"
          disabled={saving}
          startIcon={saving ? null : <ContentCutIcon />}
        >
          {saving ? 'جاري الحفظ...' : 'حفظ البواقي'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}