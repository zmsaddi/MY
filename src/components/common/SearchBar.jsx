// src/components/common/SearchBar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useDebounce } from '../../utils/hooks';

/**
 * Search bar with built-in debouncing
 * @param {Function} onSearch - Callback function called with debounced search term
 * @param {string} placeholder - Placeholder text
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 */
function SearchBar({
  onSearch,
  placeholder = 'بحث...',
  debounceMs = 300,
  ...otherProps
}) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, debounceMs);

  // Call onSearch when debounced value changes
  React.useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  const handleClear = () => {
    setSearchInput('');
  };

  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder}
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: searchInput && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear}>
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...otherProps}
    />
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  debounceMs: PropTypes.number,
};

export default SearchBar;
