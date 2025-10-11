import { Box } from '@mui/material';
import PropTypes from 'prop-types';

export function TabPanel({ children, value, index, sx = {} }) {
  if (value !== index) return null;

  return (
    <Box sx={{ py: 2, ...sx }}>
      {children}
    </Box>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  sx: PropTypes.object
};

export default TabPanel;
