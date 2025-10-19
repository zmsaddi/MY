// src/components/tabs/ReportsTab.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tabs, Tab, Divider, Chip, Alert
} from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TimelineIcon from '@mui/icons-material/Timeline';
import BuildIcon from '@mui/icons-material/Build';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import {
  getAllSheets, getAllSales, getCustomers, getSuppliers,
  getCustomerBalance, getSupplierBalance, getBaseCurrencyInfo,
  getProfitBreakdown, getBestSellingMaterials, getBestSellingServices,
  getPurchasesBySupplier, getPurchasesSummary
} from '../../utils/database';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function ReportsTab() {
  const [tabValue, setTabValue] = useState(0);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState({ code: 'USD', symbol: '$' });
  
  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data
  const [sheets, setSheets] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const currInfo = getBaseCurrencyInfo();
      setBaseCurrencyInfo(currInfo);

      setSheets(getAllSheets());
      setSales(getAllSales());
      setCustomers(getCustomers());
      setSuppliers(getSuppliers());

      // Default: last 30 days (consistent with other tabs)
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } catch (e) {
      console.error('Failed to load report data:', e);
    }
  };

  // Filtered sales by date
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (dateFrom && s.sale_date < dateFrom) return false;
      if (dateTo && s.sale_date > dateTo) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          التقارير والتحليلات
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          تقارير شاملة عن المخزون، المبيعات، المشتريات، الخدمات، والأرباح الدقيقة
        </Typography>
      </Box>

      {/* Date Filter */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="من تاريخ"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="إلى تاريخ"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const now = new Date();
                    setDateFrom(now.toISOString().split('T')[0]);
                    setDateTo(now.toISOString().split('T')[0]);
                  }}
                >
                  اليوم
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    setDateFrom(firstDay.toISOString().split('T')[0]);
                    setDateTo(now.toISOString().split('T')[0]);
                  }}
                >
                  الشهر الحالي
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), 0, 1);
                    setDateFrom(firstDay.toISOString().split('T')[0]);
                    setDateTo(now.toISOString().split('T')[0]);
                  }}
                >
                  السنة الحالية
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<InventoryIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>تقرير المخزون</Typography>}
          />
          <Tab 
            icon={<ShoppingCartIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>تقرير المبيعات</Typography>}
          />
          <Tab 
            icon={<LocalShippingIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>تقرير المشتريات</Typography>}
          />
          <Tab 
            icon={<BuildIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>الخدمات والمواد</Typography>}
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>تقرير الأرباح</Typography>}
          />
          <Tab 
            icon={<AccountBalanceIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>تقرير الحسابات</Typography>}
          />
          <Tab 
            icon={<TimelineIcon />} 
            iconPosition="start" 
            label={<Typography fontSize="1rem" fontWeight={600}>ملخص النشاط</Typography>}
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabValue === 0 && <InventoryReport sheets={sheets} baseCurrencyInfo={baseCurrencyInfo} />}
      {tabValue === 1 && <SalesReport sales={filteredSales} baseCurrencyInfo={baseCurrencyInfo} dateFrom={dateFrom} dateTo={dateTo} />}
      {tabValue === 2 && <PurchaseReport baseCurrencyInfo={baseCurrencyInfo} dateFrom={dateFrom} dateTo={dateTo} suppliers={suppliers} />}
      {tabValue === 3 && <BestSellingReport baseCurrencyInfo={baseCurrencyInfo} dateFrom={dateFrom} dateTo={dateTo} />}
      {tabValue === 4 && <ProfitReport baseCurrencyInfo={baseCurrencyInfo} dateFrom={dateFrom} dateTo={dateTo} />}
      {tabValue === 5 && <AccountsReport customers={customers} suppliers={suppliers} baseCurrencyInfo={baseCurrencyInfo} />}
      {tabValue === 6 && <ActivityReport sales={filteredSales} sheets={sheets} baseCurrencyInfo={baseCurrencyInfo} />}
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   1. تقرير المخزون
──────────────────────────────────────────────────────────────── */
function InventoryReport({ sheets, baseCurrencyInfo }) {
  const stats = useMemo(() => {
    const totalItems = sheets.reduce((sum, s) => sum + (s.total_quantity || 0), 0);
    const totalValue = sheets.reduce((sum, s) => {
      const qty = s.total_quantity || 0;
      const avgPrice = ((s.min_price || 0) + (s.max_price || 0)) / 2;
      const weight = qty * (s.weight_per_sheet_kg || 0);
      return sum + (weight * avgPrice);
    }, 0);
    const lowStock = sheets.filter(s => s.total_quantity > 0 && s.total_quantity < 10);

    return { totalItems, totalValue, lowStock };
  }, [sheets]);

  const topItems = useMemo(() => {
    return [...sheets]
      .filter(s => s.total_quantity > 0)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10);
  }, [sheets]);

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي الأصناف</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {sheets.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي القطع</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {stats.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'info.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">قيمة المخزون</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {fmt(stats.totalValue)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">مخزون منخفض</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {stats.lowStock.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {stats.lowStock.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: '1rem' }}>
          يوجد {stats.lowStock.length} صنف بكمية أقل من 10 قطع
        </Alert>
      )}

      {/* Top Items */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            أكثر 10 أصناف مخزوناً
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الكود</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">النوع</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الأبعاد (مم)</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">سعر/كغ (أدنى)</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell><Typography fontSize="0.9375rem">{item.code}</Typography></TableCell>
                    <TableCell><Typography fontSize="0.9375rem">{item.metal_name}</Typography></TableCell>
                    <TableCell>
                      <Typography fontSize="0.9375rem">
                        {item.length_mm}×{item.width_mm}×{item.thickness_mm}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={item.total_quantity} color="primary" size="small" sx={{ fontSize: '0.875rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontSize="0.9375rem">
                        {item.min_price ? fmt(item.min_price) : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   2. تقرير المبيعات
──────────────────────────────────────────────────────────────── */
function SalesReport({ sales, baseCurrencyInfo, dateFrom, dateTo }) {
  const stats = useMemo(() => {
    const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.total_paid || 0), 0);
    const totalRemaining = sales.reduce((sum, s) => sum + (s.remaining || 0), 0);
    const count = sales.length;

    return { totalSales, totalPaid, totalRemaining, count };
  }, [sales]);

  const topCustomers = useMemo(() => {
    const customerMap = {};
    sales.forEach(s => {
      if (!s.customer_id) return;
      if (!customerMap[s.customer_id]) {
        customerMap[s.customer_id] = {
          id: s.customer_id,
          name: s.customer_name,
          total: 0,
          count: 0
        };
      }
      customerMap[s.customer_id].total += s.total_amount;
      customerMap[s.customer_id].count += 1;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [sales]);

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي المبيعات</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.totalSales)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">المدفوع</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.totalPaid)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'error.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">المتبقي</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.totalRemaining)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'info.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">عدد الفواتير</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {stats.count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Period Info */}
      <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
        الفترة: {dateFrom} - {dateTo}
      </Alert>

      {/* Top Customers */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            أفضل 10 زبائن
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الزبون</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">عدد الفواتير</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">إجمالي المبيعات</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد مبيعات</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  topCustomers.map(c => (
                    <TableRow key={c.id}>
                      <TableCell><Typography fontSize="0.9375rem">{c.name}</Typography></TableCell>
                      <TableCell align="center"><Typography fontSize="0.9375rem">{c.count}</Typography></TableCell>
                      <TableCell align="center">
                        <Typography fontWeight={600} color="primary" fontSize="0.9375rem">
                          {fmt(c.total)} {baseCurrencyInfo.symbol}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   3. تقرير المشتريات - NEW
──────────────────────────────────────────────────────────────── */
function PurchaseReport({ baseCurrencyInfo, dateFrom, dateTo, suppliers }) {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  const summary = useMemo(() => getPurchasesSummary(dateFrom, dateTo), [dateFrom, dateTo]);
  const purchases = useMemo(() => getPurchasesBySupplier(selectedSupplier || null, dateFrom, dateTo), [selectedSupplier, dateFrom, dateTo]);

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي المشتريات</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(summary.total_cost)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">عدد الدفعات</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {summary.total_purchases}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'info.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي الكمية</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {summary.total_quantity} قطعة
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">عدد الموردين</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {summary.by_supplier.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Period Info */}
      <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
        الفترة: {dateFrom} - {dateTo}
      </Alert>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="تصفية حسب المورد"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiNativeSelect-select': {
                    paddingRight: '16px !important',
                    paddingLeft: '40px !important'
                  },
                  '& .MuiNativeSelect-icon': {
                    left: '12px',
                    right: 'auto'
                  }
                }}
              >
                <option value="">جميع الموردين</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* By Supplier */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                المشتريات حسب المورد
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">المورد</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الدفعات</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">التكلفة</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.by_supplier.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد مشتريات</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      summary.by_supplier.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Typography fontSize="0.9375rem">{item.supplier_name}</Typography></TableCell>
                          <TableCell align="center"><Typography fontSize="0.9375rem">{item.purchase_count}</Typography></TableCell>
                          <TableCell align="center"><Typography fontSize="0.9375rem">{item.total_quantity}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="primary" fontSize="0.9375rem">
                              {fmt(item.total_cost)} {baseCurrencyInfo.symbol}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* By Material */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                المشتريات حسب المادة
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">المادة</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الدفعات</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">التكلفة</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.by_material.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد مشتريات</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      summary.by_material.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Typography fontSize="0.9375rem">{item.metal_name}</Typography></TableCell>
                          <TableCell align="center"><Typography fontSize="0.9375rem">{item.purchase_count}</Typography></TableCell>
                          <TableCell align="center"><Typography fontSize="0.9375rem">{item.total_quantity}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="secondary.main" fontSize="0.9375rem">
                              {fmt(item.total_cost)} {baseCurrencyInfo.symbol}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Purchases */}
      <Card sx={{ borderRadius: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            تفاصيل المشتريات
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">التاريخ</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">المورد</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الكود</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">المادة</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize="1rem">الأبعاد</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">المتبقي</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">السعر/كغ</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">التكلفة</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد مشتريات</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.slice(0, 20).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Typography fontSize="0.9375rem">{p.received_date}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{p.supplier_name}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem" fontWeight={600}>{p.sheet_code}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{p.metal_name}</Typography></TableCell>
                      <TableCell><Typography fontSize="0.9375rem">{p.dimensions}</Typography></TableCell>
                      <TableCell align="center"><Typography fontSize="0.9375rem">{p.quantity_original}</Typography></TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={p.quantity_remaining} 
                          size="small" 
                          color={p.quantity_remaining > 0 ? 'success' : 'default'}
                          sx={{ fontSize: '0.875rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontSize="0.9375rem">
                          {p.price_per_kg ? fmt(p.price_per_kg) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight={600} fontSize="0.9375rem">
                          {p.total_cost ? fmt(p.total_cost) : '—'} {baseCurrencyInfo.symbol}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   4. أفضل المبيعات (مواد وخدمات منفصل)
──────────────────────────────────────────────────────────────── */
function BestSellingReport({ baseCurrencyInfo, dateFrom, dateTo }) {
  const bestMaterials = useMemo(() => getBestSellingMaterials(dateFrom, dateTo, 10), [dateFrom, dateTo]);
  const bestServices  = useMemo(() => getBestSellingServices(dateFrom, dateTo, 10), [dateFrom, dateTo]);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Materials */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                أفضل 10 مواد مبيعاً
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">الكود</Typography></TableCell>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">الأبعاد (مم)</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإيراد</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">التكلفة</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الربح</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bestMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد بيانات</Typography>
                        </TableCell>
                      </TableRow>
                    ) : bestMaterials.map((m) => (
                      <TableRow key={m.sheet_id}>
                        <TableCell><Typography fontSize="0.9375rem">{m.code}</Typography></TableCell>
                        <TableCell><Typography fontSize="0.9375rem">{m.length_mm}×{m.width_mm}×{m.thickness_mm}</Typography></TableCell>
                        <TableCell align="center">
                          <Chip label={m.quantity} size="small" color="primary" sx={{ fontSize: '0.875rem' }} />
                        </TableCell>
                        <TableCell align="center"><Typography fontSize="0.9375rem">{fmt(m.revenue)} {baseCurrencyInfo.symbol}</Typography></TableCell>
                        <TableCell align="center"><Typography fontSize="0.9375rem">{fmt(m.cogs)} {baseCurrencyInfo.symbol}</Typography></TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} color={(m.profit >= 0) ? 'success.main' : 'error'} fontSize="0.9375rem">
                            {fmt(m.profit)} {baseCurrencyInfo.symbol}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Services */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                أفضل 10 خدمات مبيعاً
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">الخدمة</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الكمية</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الإيراد</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">التكلفة</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الربح</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bestServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد بيانات</Typography>
                        </TableCell>
                      </TableRow>
                    ) : bestServices.map((s) => (
                      <TableRow key={s.service_type_id ?? s.name_ar}>
                        <TableCell><Typography fontSize="0.9375rem">{s.name_ar}</Typography></TableCell>
                        <TableCell align="center">
                          <Chip label={s.quantity} size="small" color="secondary" sx={{ fontSize: '0.875rem' }} />
                        </TableCell>
                        <TableCell align="center"><Typography fontSize="0.9375rem">{fmt(s.revenue)} {baseCurrencyInfo.symbol}</Typography></TableCell>
                        <TableCell align="center"><Typography fontSize="0.9375rem">{fmt(s.cost)} {baseCurrencyInfo.symbol}</Typography></TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} color={(s.profit >= 0) ? 'success.main' : 'error'} fontSize="0.9375rem">
                            {fmt(s.profit)} {baseCurrencyInfo.symbol}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Alert severity="info" sx={{ mt: 2, fontSize: '0.9375rem' }}>
                ملاحظة: تكلفة الخدمات تُقرأ من تكلفة السطر أو <b>التكلفة الافتراضية</b> في إعدادات نوع الخدمة.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   5. تقرير الأرباح (دقيق)
──────────────────────────────────────────────────────────────── */
function ProfitReport({ baseCurrencyInfo, dateFrom, dateTo }) {
  const pb = useMemo(() => getProfitBreakdown(dateFrom, dateTo), [dateFrom, dateTo]);
  const matMargin = pb.materials.revenue > 0 ? (pb.materials.gross / pb.materials.revenue) * 100 : 0;
  const srvMargin = pb.services.revenue  > 0 ? (pb.services.gross  / pb.services.revenue)  * 100 : 0;
  const totalMargin = pb.total.revenue   > 0 ? (pb.total.gross     / pb.total.revenue)     * 100 : 0;

  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>
        تم احتساب الأرباح بدقة باستخدام FIFO للمواد وتكلفة فعلية للخدمات.
      </Alert>

      <Grid container spacing={2}>
        {/* Materials */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إيراد المواد</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(pb.materials.revenue)} {baseCurrencyInfo.symbol}
              </Typography>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Typography variant="body2" color="white" fontSize="0.9375rem">تكلفة المواد (COGS)</Typography>
              <Typography variant="h6" fontWeight={700} color="white">
                {fmt(pb.materials.cogs)} {baseCurrencyInfo.symbol}
              </Typography>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Typography variant="body2" color="white" fontSize="0.9375rem">ربح المواد</Typography>
              <Typography variant="h6" fontWeight={700} color="white">
                {fmt(pb.materials.gross)} {baseCurrencyInfo.symbol} ({fmt(matMargin)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Services */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: 'secondary.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إيراد الخدمات</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(pb.services.revenue)} {baseCurrencyInfo.symbol}
              </Typography>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Typography variant="body2" color="white" fontSize="0.9375rem">تكلفة الخدمات</Typography>
              <Typography variant="h6" fontWeight={700} color="white">
                {fmt(pb.services.cost)} {baseCurrencyInfo.symbol}
              </Typography>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Typography variant="body2" color="white" fontSize="0.9375rem">ربح الخدمات</Typography>
              <Typography variant="h6" fontWeight={700} color="white">
                {fmt(pb.services.gross)} {baseCurrencyInfo.symbol} ({fmt(srvMargin)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي الإيرادات</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(pb.total.revenue)} {baseCurrencyInfo.symbol}
              </Typography>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي التكلفة</Typography>
              <Typography variant="h6" fontWeight={700} color="white">
                {fmt(pb.total.cost)} {baseCurrencyInfo.symbol}
              </Typography>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي الربح</Typography>
              <Typography variant="h6" fontWeight={700} color="white">
                {fmt(pb.total.gross)} {baseCurrencyInfo.symbol} ({fmt(totalMargin)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   6. تقرير الحسابات
──────────────────────────────────────────────────────────────── */
function AccountsReport({ customers, suppliers, baseCurrencyInfo }) {
  const customerBalances = useMemo(() => {
    return customers
      .map(c => ({
        ...c,
        balance: getCustomerBalance(c.id)
      }))
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [customers]);

  const supplierBalances = useMemo(() => {
    return suppliers
      .map(s => ({
        ...s,
        balance: getSupplierBalance(s.id)
      }))
      .filter(s => s.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [suppliers]);

  const stats = useMemo(() => {
    const totalReceivables = customerBalances.reduce((sum, c) => sum + c.balance, 0);
    const totalPayables = supplierBalances.reduce((sum, s) => sum + s.balance, 0);
    const netPosition = totalReceivables - totalPayables;

    return { totalReceivables, totalPayables, netPosition };
  }, [customerBalances, supplierBalances]);

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: 'error.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">ذمم الزبائن</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.totalReceivables)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">ذمم الموردين</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.totalPayables)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: stats.netPosition >= 0 ? 'success.main' : 'error.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">صافي المركز المالي</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.netPosition)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Debtors */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                أكبر الزبائن المدينين
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">الزبون</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الرصيد</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد ديون</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerBalances.slice(0, 10).map(c => (
                        <TableRow key={c.id}>
                          <TableCell><Typography fontSize="0.9375rem">{c.name}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="error" fontSize="0.9375rem">
                              {fmt(c.balance)} {baseCurrencyInfo.symbol}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Creditors */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                أكبر الموردين الدائنين
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight={700} fontSize="1rem">المورد</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight={700} fontSize="1rem">الرصيد</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supplierBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          <Typography color="text.secondary" py={2} fontSize="1rem">لا توجد ديون</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplierBalances.slice(0, 10).map(s => (
                        <TableRow key={s.id}>
                          <TableCell><Typography fontSize="0.9375rem">{s.name}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="warning.main" fontSize="0.9375rem">
                              {fmt(s.balance)} {baseCurrencyInfo.symbol}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────
   7. ملخص النشاط
──────────────────────────────────────────────────────────────── */
function ActivityReport({ sales, sheets, baseCurrencyInfo }) {
  const stats = useMemo(() => {
    const totalSales = sales.length;
    const totalItems = sheets.reduce((sum, s) => sum + (s.total_quantity || 0), 0);
    const avgSaleValue = totalSales > 0
      ? sales.reduce((sum, s) => sum + s.total_amount, 0) / totalSales
      : 0;

    const totalAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalPaid = sales.reduce((sum, s) => sum + s.total_paid, 0);
    const collectionRate = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

    return { totalSales, totalItems, avgSaleValue, collectionRate };
  }, [sales, sheets]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">عدد الفواتير</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {stats.totalSales}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">متوسط قيمة الفاتورة</Typography>
              <Typography variant="h5" fontWeight={700} color="white">
                {fmt(stats.avgSaleValue)} {baseCurrencyInfo.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'info.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">إجمالي المخزون</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {stats.totalItems} قطعة
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="white" fontSize="0.9375rem">معدل التحصيل</Typography>
              <Typography variant="h4" fontWeight={700} color="white">
                {fmt(stats.collectionRate)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}