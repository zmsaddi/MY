// src/components/common/TableWithPagination.jsx
import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography
} from '@mui/material';
import { usePagination } from '../../utils/hooks';

// Memoized table row component to prevent unnecessary re-renders
const TableRowMemo = memo(({ row, columns, onRowClick, rowKey }) => {
  const handleClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick, row]);

  return (
    <TableRow
      hover
      onClick={handleClick}
      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
    >
      {columns.map((col, index) => (
        <TableCell key={col.field || index} align={col.align || 'inherit'}>
          {col.render ? col.render(row) : row[col.field]}
        </TableCell>
      ))}
    </TableRow>
  );
});

TableRowMemo.displayName = 'TableRowMemo';

TableRowMemo.propTypes = {
  row: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  rowKey: PropTypes.string.isRequired,
};

/**
 * Reusable table component with built-in pagination
 * @param {Array} data - Array of data to display
 * @param {Array} columns - Column configuration [{field, header, render}]
 * @param {React.Component} emptyState - Component to show when data is empty
 * @param {number} initialRowsPerPage - Initial rows per page
 * @param {Array} rowsPerPageOptions - Options for rows per page selector
 */
function TableWithPagination({
  data,
  columns,
  emptyState,
  initialRowsPerPage = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
  onRowClick,
  rowKey = 'id',
  ...otherProps
}) {
  const {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
    totalRows
  } = usePagination(data, initialRowsPerPage);

  return (
    <Box>
      <TableContainer component={Paper} {...otherProps}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col, index) => (
                <TableCell
                  key={col.field || index}
                  align={col.align || 'inherit'}
                  sx={{ fontWeight: 700, ...col.headerSx }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  {emptyState || (
                    <Box sx={{ py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        لا توجد بيانات
                      </Typography>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRowMemo
                  key={row[rowKey]}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                  rowKey={rowKey}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalRows > rowsPerPageOptions[0] && (
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="عدد الصفوف:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        />
      )}
    </Box>
  );
}

TableWithPagination.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string,
      header: PropTypes.string.isRequired,
      render: PropTypes.func,
      align: PropTypes.oneOf(['inherit', 'left', 'center', 'right', 'justify']),
      headerSx: PropTypes.object,
    })
  ).isRequired,
  emptyState: PropTypes.node,
  initialRowsPerPage: PropTypes.number,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  onRowClick: PropTypes.func,
  rowKey: PropTypes.string,
};

export default TableWithPagination;
