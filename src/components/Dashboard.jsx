// src/components/Dashboard.jsx
import { Box, Grid, Card, CardContent, Typography, Paper } from '@mui/material';
import { 
  TrendingUp, 
  ShoppingCart, 
  People, 
  Inventory 
} from '@mui/icons-material';
import { 
  getAllSales, 
  getCustomers, 
  getAllSheets, 
  getProfitBreakdown,
  getBaseCurrencyInfo
} from '../utils/database';

export default function DashboardTab() {
  const sales = getAllSales();
  const customers = getCustomers();
  const sheets = getAllSheets();
  const profitData = getProfitBreakdown();
  const currencyInfo = getBaseCurrencyInfo();

  const totalRevenue = profitData.total.revenue;
  const totalProfit = profitData.total.net;
  const totalSheets = sheets.reduce((sum, s) => sum + s.total_quantity, 0);

  const stats = [
    {
      title: 'إجمالي المبيعات',
      value: `${totalRevenue.toFixed(0)} ${currencyInfo.symbol}`,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd'
    },
    {
      title: 'صافي الربح',
      value: `${totalProfit.toFixed(0)} ${currencyInfo.symbol}`,
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9'
    },
    {
      title: 'عدد الزبائن',
      value: customers.length,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0'
    },
    {
      title: 'المخزون',
      value: `${totalSheets} قطعة`,
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      bgColor: '#f3e5f5'
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          لوحة التحكم
        </Typography>
        <Typography variant="body1" color="text.secondary" fontSize="1.0625rem">
          نظرة عامة على نشاط الأعمال
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontSize="0.9375rem" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: stat.bgColor,
                      color: stat.color,
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              آخر المبيعات
            </Typography>
            {sales.length === 0 ? (
              <Typography color="text.secondary" fontSize="0.9375rem">لا توجد مبيعات</Typography>
            ) : (
              <Box>
                {sales.slice(0, 5).map((sale) => (
                  <Box
                    key={sale.id}
                    sx={{
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography fontWeight={600} fontSize="1rem">
                          {sale.invoice_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                          {sale.customer_name || 'زبون غير محدد'}
                        </Typography>
                      </Box>
                      <Typography fontWeight={700} color="primary" fontSize="1rem">
                        {sale.total_amount.toFixed(0)} {currencyInfo.symbol}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              ملخص الربحية
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography fontSize="0.9375rem">إيرادات المواد:</Typography>
                <Typography fontWeight={600} fontSize="0.9375rem">
                  {profitData.materials.revenue.toFixed(0)} {currencyInfo.symbol}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography fontSize="0.9375rem">إيرادات الخدمات:</Typography>
                <Typography fontWeight={600} fontSize="0.9375rem">
                  {profitData.services.revenue.toFixed(0)} {currencyInfo.symbol}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography fontSize="0.9375rem">المصروفات:</Typography>
                <Typography fontWeight={600} color="error" fontSize="0.9375rem">
                  {profitData.expenses.total.toFixed(0)} {currencyInfo.symbol}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  pt: 2, 
                  borderTop: '2px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography fontWeight={700} fontSize="1.0625rem">صافي الربح:</Typography>
                <Typography fontWeight={700} color="success.main" fontSize="1.125rem">
                  {profitData.total.net.toFixed(0)} {currencyInfo.symbol}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}