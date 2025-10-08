// src/components/inventory/InventoryStats.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ScaleIcon from '@mui/icons-material/Scale';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

/**
 * Inventory statistics cards
 * Extracted from InventoryTab for better organization
 */
function InventoryStats({ sheets, baseCurrencySymbol = '$' }) {
  const stats = React.useMemo(() => {
    const totalTypes = new Set(sheets.map((s) => s.metal_type_id)).size;
    const totalQuantity = sheets.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalWeight = sheets.reduce((sum, s) => sum + (s.total_weight_kg || 0), 0);
    const totalValue = sheets.reduce((sum, s) => sum + (s.total_cost || 0), 0);

    return { totalTypes, totalQuantity, totalWeight, totalValue };
  }, [sheets]);

  const statCards = [
    {
      title: 'أنواع الصفائح',
      value: stats.totalTypes,
      icon: CategoryIcon,
      color: '#1976d2',
    },
    {
      title: 'إجمالي الصفائح',
      value: fmt(stats.totalQuantity),
      icon: InventoryIcon,
      color: '#2e7d32',
    },
    {
      title: 'الوزن الكلي (kg)',
      value: fmt(stats.totalWeight),
      icon: ScaleIcon,
      color: '#ed6c02',
    },
    {
      title: `القيمة الكلية (${baseCurrencySymbol})`,
      value: fmt(stats.totalValue),
      icon: AttachMoneyIcon,
      color: '#9c27b0',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <stat.icon sx={{ fontSize: 28, color: stat.color }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

InventoryStats.propTypes = {
  sheets: PropTypes.array.isRequired,
  baseCurrencySymbol: PropTypes.string,
};

export default InventoryStats;
