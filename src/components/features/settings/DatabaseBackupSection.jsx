import { useState } from 'react';
import { Box, Card, CardContent, Grid, Button, Typography, Alert } from '@mui/material';
import { exportDatabase, importDatabase } from '../../../utils/database';

export default function DatabaseBackupSection() {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const exportDb = async () => {
    try {
      setBusy(true);
      setErr('');

      // Export the database using the database utility
      const data = await exportDatabase();

      // Create a blob and download it
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = URL.createObjectURL(blob);
      a.download = `metalsheets-${ts}.sqlite`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);

      setMsg('تم تصدير قاعدة البيانات بنجاح.');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setErr(e?.message || 'فشل تصدير قاعدة البيانات');
    } finally {
      setBusy(false);
    }
  };

  const importDb = async () => {
    try {
      setBusy(true);
      setErr('');

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.sqlite,.db';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          setBusy(false);
          return;
        }

        try {
          const arrayBuffer = await file.arrayBuffer();
          await importDatabase(arrayBuffer);

          setMsg('تم استيراد قاعدة البيانات بنجاح. سيتم إعادة تحميل الصفحة...');
          setTimeout(() => window.location.reload(), 800);
        } catch (e) {
          setErr(e?.message || 'فشل استيراد قاعدة البيانات');
          setBusy(false);
        }
      };

      input.click();
    } catch (e) {
      setErr(e?.message || 'فشل استيراد قاعدة البيانات');
      setBusy(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>نسخ احتياطي واستعادة</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          يمكنك تصدير قاعدة البيانات كملف واستيرادها لاحقاً على نفس الجهاز أو جهاز آخر.
        </Typography>

        {msg && (<Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>)}
        {err && (<Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>)}

        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" onClick={exportDb} disabled={busy}>
              تصدير قاعدة البيانات
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={importDb} disabled={busy}>
              استيراد قاعدة البيانات
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
