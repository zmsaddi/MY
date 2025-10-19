// src/components/sales/SalesTable.jsx
import { Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box, IconButton, Tooltip, Collapse
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const getPaymentStatusLabel = (status) => {
  switch (status) {
    case 'paid':
      return 'مدفوع';
    case 'partial':
      return 'جزئي';
    case 'unpaid':
      return 'غير مدفوع';
    default:
      return status;
  }
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'unpaid':
      return 'error';
    default:
      return 'default';
  }
};

export default function SalesTable({
  sales,
  baseCurrencyInfo,
  expandedSale,
  onToggleExpand,
  onViewSale,
  onDeleteSale
}) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.100' }}>
          <TableRow>
            <TableCell sx={{ width: 40 }} />
            <TableCell><Typography fontWeight={700} fontSize="1rem">رقم الفاتورة</Typography></TableCell>
            <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
            <TableCell><Typography fontWeight={700} fontSize="1rem">العميل</Typography></TableCell>
            <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجمالي</Typography></TableCell>
            <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">المدفوع</Typography></TableCell>
            <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">المتبقي</Typography></TableCell>
            <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الحالة</Typography></TableCell>
            <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإجراءات</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography color="text.secondary" py={3} fontSize="1rem">
                  لا توجد مبيعات
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <Fragment key={sale.id}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => onToggleExpand(sale.id)}
                    >
                      {expandedSale === sale.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} fontSize="0.9375rem">
                      {sale.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize="0.9375rem">
                      {new Date(sale.sale_date).toLocaleDateString('ar-EG')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize="0.9375rem">
                      {sale.customer_name || 'زبون عام'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600} fontSize="0.9375rem">
                      {fmt(sale.total_amount)} {baseCurrencyInfo.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize="0.9375rem">
                      {fmt(sale.total_paid)} {baseCurrencyInfo.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      fontWeight={700}
                      color={sale.remaining > 0 ? 'error.main' : 'success.main'}
                      fontSize="0.9375rem"
                    >
                      {fmt(sale.remaining)} {baseCurrencyInfo.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getPaymentStatusLabel(sale.payment_status)}
                      color={getPaymentStatusColor(sale.payment_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onViewSale(sale.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteSale(sale.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedSale === sale.id} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom fontSize="1rem">
                          ملاحظات:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontSize="0.9375rem">
                          {sale.notes || 'لا توجد ملاحظات'}
                        </Typography>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}