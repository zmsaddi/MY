// src/components/common/ResponsiveTable.jsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Collapse,
  IconButton,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
  Stack,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * Responsive Table Component
 * Automatically switches between table and card view based on screen size
 */
export default function ResponsiveTable({
  columns,
  data,
  actions,
  keyField = 'id',
  stickyHeader = true,
  size = 'medium',
  hover = true,
  emptyMessage = 'لا توجد بيانات',
  mobileBreakpoint = 'md'
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) {
      return '—';
    }

    if (column.type === 'number') {
      const num = Number(value);
      return isNaN(num) ? value : num.toLocaleString(undefined, {
        minimumFractionDigits: column.decimals || 0,
        maximumFractionDigits: column.decimals || 2
      });
    }

    if (column.type === 'currency') {
      const num = Number(value);
      return isNaN(num) ? value : `${num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${column.currencySymbol || '$'}`;
    }

    if (column.type === 'chip') {
      return (
        <Chip
          label={value}
          color={column.getColor ? column.getColor(value) : 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }

    if (column.type === 'custom' && column.render) {
      return column.render(value);
    }

    return value;
  };

  // Mobile Card View
  const MobileCardView = () => (
    <Stack spacing={2} sx={{ p: { xs: 1, sm: 2 } }}>
      {data.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              {emptyMessage}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        data.map((row) => (
          <Card key={row[keyField]} elevation={2}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Primary Fields - Always Visible */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {columns.filter(col => col.priority === 'primary').map(col => (
                  <Grid item xs={col.mobileWidth || 6} key={col.field}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {col.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: col.bold ? 700 : 400 }}>
                      {formatValue(row[col.field], col)}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Secondary Fields - Collapsible */}
              {columns.filter(col => col.priority !== 'primary').length > 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => toggleRow(row[keyField])}
                      sx={{ p: 0.5 }}
                    >
                      {expandedRows.has(row[keyField]) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {expandedRows.has(row[keyField]) ? 'إخفاء' : 'المزيد'}
                      </Typography>
                    </IconButton>
                  </Box>

                  <Collapse in={expandedRows.has(row[keyField])}>
                    <Grid container spacing={1} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      {columns.filter(col => col.priority !== 'primary' && !col.hideOnMobile).map(col => (
                        <Grid item xs={col.mobileWidth || 6} key={col.field}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {col.label}
                          </Typography>
                          <Typography variant="body2">
                            {formatValue(row[col.field], col)}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Collapse>
                </>
              )}

              {/* Actions */}
              {actions && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  {actions(row)}
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: '70vh' }}>
      <Table stickyHeader={stickyHeader} size={size}>
        <TableHead>
          <TableRow>
            {columns.filter(col => !col.hideOnDesktop).map(col => (
              <TableCell
                key={col.field}
                align={col.align || 'right'}
                sx={{
                  bgcolor: 'grey.100',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 }
                }}
              >
                {col.label}
              </TableCell>
            ))}
            {actions && (
              <TableCell
                align="center"
                sx={{
                  bgcolor: 'grey.100',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 }
                }}
              >
                الإجراءات
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions ? 1 : 0)}
                align="center"
                sx={{ py: 5 }}
              >
                <Typography color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row[keyField]} hover={hover}>
                {columns.filter(col => !col.hideOnDesktop).map(col => (
                  <TableCell
                    key={col.field}
                    align={col.align || 'right'}
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.8125rem', md: '0.875rem' },
                      py: { xs: 1, sm: 1.5 },
                      px: { xs: 1, sm: 2 },
                      fontWeight: col.bold ? 600 : 400
                    }}
                  >
                    {formatValue(row[col.field], col)}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell
                    align="center"
                    sx={{
                      py: { xs: 1, sm: 1.5 },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    {actions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return isMobile ? <MobileCardView /> : <DesktopTableView />;
}

ResponsiveTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['text', 'number', 'currency', 'chip', 'custom']),
    align: PropTypes.oneOf(['left', 'right', 'center']),
    priority: PropTypes.oneOf(['primary', 'secondary']),
    mobileWidth: PropTypes.number,
    hideOnMobile: PropTypes.bool,
    hideOnDesktop: PropTypes.bool,
    bold: PropTypes.bool,
    decimals: PropTypes.number,
    currencySymbol: PropTypes.string,
    getColor: PropTypes.func,
    render: PropTypes.func
  })).isRequired,
  data: PropTypes.array.isRequired,
  actions: PropTypes.func,
  keyField: PropTypes.string,
  stickyHeader: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  hover: PropTypes.bool,
  emptyMessage: PropTypes.string,
  mobileBreakpoint: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl'])
};