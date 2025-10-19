// src/utils/hooks.js
// Custom React hooks for common patterns

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce hook - delays updating value until user stops typing
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Pagination hook - handles pagination state and logic
 * @param {Array} data - The array of data to paginate
 * @param {number} initialRowsPerPage - Initial rows per page (default: 25)
 * @returns {Object} Pagination state and handlers
 */
export function usePagination(data, initialRowsPerPage = 25) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Reset to page 0 if current page is out of bounds
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(data.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [data.length, rowsPerPage, page]);

  return {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
    totalRows: data.length
  };
}

/**
 * Keyboard shortcut hook
 * @param {string} key - Key to listen for (e.g., 'n', 's', 'Escape')
 * @param {Function} callback - Function to call when key is pressed
 * @param {Object} modifiers - Modifier keys (ctrl, alt, shift, meta)
 */
export function useKeyboardShortcut(key, callback, modifiers = {}) {
  const { ctrl = false, alt = false, shift = false, meta = false } = modifiers;

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Safety check for IME/assistive inputs that might not have a key property
      if (typeof event.key !== 'string') return;

      const matchesModifiers =
        event.ctrlKey === ctrl &&
        event.altKey === alt &&
        event.shiftKey === shift &&
        event.metaKey === meta;

      const matchesKey = event.key.toLowerCase() === key.toLowerCase();

      if (matchesModifiers && matchesKey) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [key, callback, ctrl, alt, shift, meta]);
}

/**
 * LocalStorage hook with auto-save
 * @param {string} key - LocalStorage key
 * @param {any} initialValue - Initial value
 * @param {number} debounceMs - Debounce save (default: 1000ms)
 * @returns {Array} [value, setValue, clearValue]
 */
export function useLocalStorage(key, initialValue, debounceMs = 1000) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, debounceMs]);

  const clearValue = useCallback(() => {
    setValue(initialValue);
    window.localStorage.removeItem(key);
  }, [key, initialValue]);

  return [value, setValue, clearValue];
}

/**
 * Online status hook
 * @returns {boolean} Whether the browser is online
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Click outside hook - detects clicks outside an element
 * @param {Function} handler - Function to call when clicking outside
 * @returns {React.RefObject} Ref to attach to the element
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [handler]);

  return ref;
}

/**
 * Previous value hook - returns the previous value of a variable
 * @param {any} value - Current value
 * @returns {any} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Media query hook
 * @param {string} query - Media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Auto-save hook for forms - combines localStorage with debounced saving
 * @param {string} formKey - Unique key for the form (e.g., 'sale-draft-123')
 * @param {Object} initialFormData - Initial form data
 * @param {number} autoSaveMs - Auto-save interval (default: 30000ms = 30 seconds)
 * @returns {Object} { formData, updateFormData, clearDraft, hasDraft }
 */
export function useAutoSave(formKey, initialFormData = {}, autoSaveMs = 30000) {
  const storageKey = `draft_${formKey}`;
  const [formData, setFormData, clearDraft] = useLocalStorage(storageKey, initialFormData, autoSaveMs);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    // Check if there's a saved draft on mount
    try {
      const savedDraft = window.localStorage.getItem(storageKey);
      setHasDraft(!!savedDraft && savedDraft !== JSON.stringify(initialFormData));
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  }, [storageKey, initialFormData]);

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
    setHasDraft(true);
  }, [setFormData]);

  const removeDraft = useCallback(() => {
    clearDraft();
    setHasDraft(false);
  }, [clearDraft]);

  return {
    formData,
    updateFormData,
    clearDraft: removeDraft,
    hasDraft,
  };
}
