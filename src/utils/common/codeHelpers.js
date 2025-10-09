// src/utils/common/codeHelpers.js
// Common Code Patterns and Helpers to Reduce Duplication

/**
 * Generic CRUD operations factory
 */
export function createCRUDOperations(tableName, primaryKey = 'id') {
  return {
    /**
     * Generic get all records
     */
    getAll(db, orderBy = primaryKey) {
      const query = `SELECT * FROM ${tableName} ORDER BY ${orderBy}`;
      try {
        const result = db.exec(query);
        if (!result.length) return [];

        const [columns, ...rows] = [result[0].columns, ...result[0].values];
        return rows.map(row => {
          const obj = {};
          columns.forEach((col, i) => obj[col] = row[i]);
          return obj;
        });
      } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
      }
    },

    /**
     * Generic get by ID
     */
    getById(db, id) {
      const query = `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`;
      try {
        const stmt = db.prepare(query);
        stmt.bind([id]);

        if (stmt.step()) {
          const result = stmt.getAsObject();
          stmt.free();
          return result;
        }
        stmt.free();
        return null;
      } catch (error) {
        console.error(`Error fetching ${tableName} by ID:`, error);
        return null;
      }
    },

    /**
     * Generic create record
     */
    create(db, data) {
      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

      try {
        const stmt = db.prepare(query);
        stmt.run(Object.values(data));
        stmt.free();
        return { success: true, id: db.exec(`SELECT last_insert_rowid()`)[0].values[0][0] };
      } catch (error) {
        console.error(`Error creating ${tableName}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Generic update record
     */
    update(db, id, data) {
      const fields = Object.keys(data);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${primaryKey} = ?`;

      try {
        const stmt = db.prepare(query);
        stmt.run([...Object.values(data), id]);
        stmt.free();
        return { success: true };
      } catch (error) {
        console.error(`Error updating ${tableName}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Generic delete record
     */
    delete(db, id) {
      const query = `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`;
      try {
        const stmt = db.prepare(query);
        stmt.run([id]);
        stmt.free();
        return { success: true };
      } catch (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        return { success: false, error: error.message };
      }
    }
  };
}

/**
 * Generic form handler factory
 */
export function createFormHandler(initialState, validator, submitHandler) {
  return {
    state: { ...initialState },
    errors: {},
    loading: false,

    /**
     * Handle field change
     */
    handleChange(field, value) {
      this.state[field] = value;
      // Clear error for this field
      if (this.errors[field]) {
        delete this.errors[field];
      }
    },

    /**
     * Validate form
     */
    validate() {
      if (validator) {
        const result = validator(this.state);
        this.errors = result.errors || {};
        return result.valid;
      }
      return true;
    },

    /**
     * Submit form
     */
    async submit() {
      if (!this.validate()) {
        return { success: false, errors: this.errors };
      }

      this.loading = true;
      try {
        const result = await submitHandler(this.state);
        if (result.success) {
          this.reset();
        }
        return result;
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Reset form
     */
    reset() {
      this.state = { ...initialState };
      this.errors = {};
      this.loading = false;
    }
  };
}

/**
 * Generic table data handler
 */
export function createTableHandler(fetchDataFunc, itemsPerPage = 10) {
  return {
    data: [],
    filteredData: [],
    loading: false,
    error: null,
    page: 0,
    rowsPerPage: itemsPerPage,
    sortField: null,
    sortDirection: 'asc',
    searchQuery: '',
    filters: {},

    /**
     * Fetch data
     */
    async fetchData() {
      this.loading = true;
      this.error = null;
      try {
        this.data = await fetchDataFunc(this.filters);
        this.applyFilters();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Apply filters and search
     */
    applyFilters() {
      let filtered = [...this.data];

      // Apply search
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(query)
          )
        );
      }

      // Apply filters
      Object.entries(this.filters).forEach(([field, value]) => {
        if (value) {
          filtered = filtered.filter(item => item[field] === value);
        }
      });

      // Apply sorting
      if (this.sortField) {
        filtered.sort((a, b) => {
          const aVal = a[this.sortField];
          const bVal = b[this.sortField];

          if (this.sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }

      this.filteredData = filtered;
    },

    /**
     * Handle pagination
     */
    handlePageChange(newPage) {
      this.page = newPage;
    },

    /**
     * Handle rows per page change
     */
    handleRowsPerPageChange(newRowsPerPage) {
      this.rowsPerPage = newRowsPerPage;
      this.page = 0;
    },

    /**
     * Handle sort
     */
    handleSort(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      this.applyFilters();
    },

    /**
     * Handle search
     */
    handleSearch(query) {
      this.searchQuery = query;
      this.page = 0;
      this.applyFilters();
    },

    /**
     * Get paginated data
     */
    getPaginatedData() {
      const startIndex = this.page * this.rowsPerPage;
      const endIndex = startIndex + this.rowsPerPage;
      return this.filteredData.slice(startIndex, endIndex);
    }
  };
}

/**
 * Generic API handler with retry logic
 */
export function createAPIHandler(baseURL, headers = {}) {
  return {
    /**
     * Make API request with retry
     */
    async request(endpoint, options = {}, maxRetries = 3) {
      const url = `${baseURL}${endpoint}`;
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers
        }
      };

      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, config);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          lastError = error;

          if (attempt < maxRetries) {
            // Exponential backoff
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      throw lastError;
    },

    /**
     * GET request
     */
    get(endpoint, params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
      return this.request(fullEndpoint, { method: 'GET' });
    },

    /**
     * POST request
     */
    post(endpoint, data) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * PUT request
     */
    put(endpoint, data) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * DELETE request
     */
    delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    }
  };
}

/**
 * Generic state manager
 */
export function createStateManager(initialState) {
  return {
    state: { ...initialState },
    listeners: new Set(),

    /**
     * Get current state
     */
    getState() {
      return { ...this.state };
    },

    /**
     * Set state
     */
    setState(updates) {
      const prevState = { ...this.state };
      this.state = { ...this.state, ...updates };
      this.notify(prevState);
    },

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    },

    /**
     * Notify listeners
     */
    notify(prevState) {
      this.listeners.forEach(listener =>
        listener(this.state, prevState)
      );
    },

    /**
     * Reset state
     */
    reset() {
      this.setState(initialState);
    }
  };
}

/**
 * Generic error handler
 */
export function createErrorHandler(options = {}) {
  const {
    showNotification = true,
    logToConsole = true,
    logToServer = false,
    serverEndpoint = '/api/errors'
  } = options;

  return {
    /**
     * Handle error
     */
    async handle(error, context = {}) {
      const errorInfo = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Log to console
      if (logToConsole) {
        console.error('Error:', errorInfo);
      }

      // Show notification
      if (showNotification && window.showNotification) {
        window.showNotification({
          type: 'error',
          message: errorInfo.message
        });
      }

      // Log to server
      if (logToServer) {
        try {
          await fetch(serverEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorInfo)
          });
        } catch (serverError) {
          console.error('Failed to log error to server:', serverError);
        }
      }

      return errorInfo;
    },

    /**
     * Wrap function with error handling
     */
    wrap(fn) {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          this.handle(error, { function: fn.name, arguments: args });
          throw error;
        }
      };
    }
  };
}

/**
 * Generic cache manager
 */
export function createCacheManager(options = {}) {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000, // 5 minutes
    storage = 'memory' // 'memory', 'localStorage', 'sessionStorage'
  } = options;

  const cache = storage === 'memory' ? new Map() : null;

  return {
    /**
     * Get from cache
     */
    get(key) {
      if (storage === 'memory') {
        const item = cache.get(key);
        if (item && Date.now() - item.timestamp < ttl) {
          return item.value;
        }
        cache.delete(key);
      } else {
        const item = JSON.parse(window[storage].getItem(key) || 'null');
        if (item && Date.now() - item.timestamp < ttl) {
          return item.value;
        }
        window[storage].removeItem(key);
      }
      return null;
    },

    /**
     * Set in cache
     */
    set(key, value) {
      const item = { value, timestamp: Date.now() };

      if (storage === 'memory') {
        // Enforce max size
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, item);
      } else {
        try {
          window[storage].setItem(key, JSON.stringify(item));
        } catch (e) {
          // Storage quota exceeded, clear old items
          this.cleanup();
          window[storage].setItem(key, JSON.stringify(item));
        }
      }
    },

    /**
     * Remove from cache
     */
    remove(key) {
      if (storage === 'memory') {
        cache.delete(key);
      } else {
        window[storage].removeItem(key);
      }
    },

    /**
     * Clear cache
     */
    clear() {
      if (storage === 'memory') {
        cache.clear();
      } else {
        const keysToRemove = [];
        for (let i = 0; i < window[storage].length; i++) {
          const key = window[storage].key(i);
          if (key) keysToRemove.push(key);
        }
        keysToRemove.forEach(key => window[storage].removeItem(key));
      }
    },

    /**
     * Clean up expired items
     */
    cleanup() {
      if (storage === 'memory') {
        for (const [key, item] of cache) {
          if (Date.now() - item.timestamp >= ttl) {
            cache.delete(key);
          }
        }
      } else {
        const keysToRemove = [];
        for (let i = 0; i < window[storage].length; i++) {
          const key = window[storage].key(i);
          const item = JSON.parse(window[storage].getItem(key) || 'null');
          if (item && Date.now() - item.timestamp >= ttl) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => window[storage].removeItem(key));
      }
    }
  };
}

// Export all utilities
export default {
  createCRUDOperations,
  createFormHandler,
  createTableHandler,
  createAPIHandler,
  createStateManager,
  createErrorHandler,
  createCacheManager
};