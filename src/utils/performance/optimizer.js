// src/utils/performance/optimizer.js
// Performance Optimization Utilities

import React from 'react';

/**
 * Debounce function for input handlers
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization decorator for expensive computations
 */
export function memoize(fn, maxSize = 10) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);

    // Limit cache size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  };
}

/**
 * Request Animation Frame wrapper for smooth animations
 */
export function rafThrottle(callback) {
  let requestId = null;

  return function (...args) {
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        callback.apply(this, args);
        requestId = null;
      });
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(selector = 'img[data-src]') {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll(selector).forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers without Intersection Observer
    document.querySelectorAll(selector).forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

/**
 * Virtual scrolling helper for large lists
 */
export class VirtualScroller {
  constructor(options) {
    this.itemHeight = options.itemHeight;
    this.containerHeight = options.containerHeight;
    this.items = options.items || [];
    this.overscan = options.overscan || 3;
    this.scrollTop = 0;
  }

  getVisibleRange() {
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);

    const startIndex = Math.max(0, visibleStart - this.overscan);
    const endIndex = Math.min(this.items.length - 1, visibleEnd + this.overscan);

    return {
      startIndex,
      endIndex,
      offsetY: startIndex * this.itemHeight,
      totalHeight: this.items.length * this.itemHeight
    };
  }

  updateScrollTop(scrollTop) {
    this.scrollTop = scrollTop;
  }

  getVisibleItems() {
    const { startIndex, endIndex } = this.getVisibleRange();
    return this.items.slice(startIndex, endIndex + 1);
  }
}

/**
 * Web Worker manager for heavy computations
 */
export class WorkerManager {
  constructor(workerScript) {
    this.workers = [];
    this.queue = [];
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.workerScript = workerScript;
  }

  getWorker() {
    if (this.workers.length < this.maxWorkers) {
      const worker = new Worker(this.workerScript);
      this.workers.push(worker);
      return worker;
    }

    // Return least busy worker
    return this.workers.reduce((prev, curr) =>
      prev.pending < curr.pending ? prev : curr
    );
  }

  execute(data) {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      worker.pending = (worker.pending || 0) + 1;

      const handler = (e) => {
        worker.pending--;
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errorHandler);
        resolve(e.data);
      };

      const errorHandler = (e) => {
        worker.pending--;
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errorHandler);
        reject(e);
      };

      worker.addEventListener('message', handler);
      worker.addEventListener('error', errorHandler);
      worker.postMessage(data);
    });
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}

/**
 * Memory management utilities
 */
export const MemoryManager = {
  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        usage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
      };
    }
    return null;
  },

  /**
   * Force garbage collection (if available)
   */
  collectGarbage() {
    if (window.gc) {
      window.gc();
      return true;
    }
    return false;
  },

  /**
   * Clear various caches
   */
  clearCaches() {
    // Clear image cache
    const images = document.getElementsByTagName('img');
    Array.from(images).forEach(img => {
      const src = img.src;
      img.src = '';
      img.src = src;
    });

    // Clear module cache if using module system
    if (typeof require !== 'undefined' && require.cache) {
      Object.keys(require.cache).forEach(key => {
        delete require.cache[key];
      });
    }

    return true;
  }
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  /**
   * Start measuring performance
   */
  start(name) {
    performance.mark(`${name}-start`);
  }

  /**
   * End measuring and record
   */
  end(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      this.metrics.set(name, {
        duration: measure.duration,
        timestamp: Date.now()
      });
    }

    // Clean up marks
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return Array.from(this.metrics.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  /**
   * Monitor long tasks
   */
  monitorLongTasks(threshold = 50) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > threshold) {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

/**
 * React-specific optimizations
 */
export const ReactOptimizations = {
  /**
   * Create optimized context provider
   */
  createOptimizedContext(defaultValue) {
    const Context = React.createContext(defaultValue);

    // Split provider to prevent unnecessary re-renders
    const Provider = ({ children, value }) => {
      const memoizedValue = React.useMemo(() => value, [value]);
      return React.createElement(Context.Provider, { value: memoizedValue }, children);
    };

    return { Context, Provider };
  },

  /**
   * Use callback with dependencies
   */
  useStableCallback(callback) {
    const callbackRef = React.useRef(callback);
    React.useLayoutEffect(() => {
      callbackRef.current = callback;
    });
    return React.useCallback((...args) => callbackRef.current(...args), []);
  },

  /**
   * Batch state updates
   */
  batchUpdates(updates) {
    if (React.unstable_batchedUpdates) {
      React.unstable_batchedUpdates(() => {
        updates.forEach(update => update());
      });
    } else {
      updates.forEach(update => update());
    }
  }
};

/**
 * Bundle size optimization utilities
 */
export const BundleOptimizer = {
  /**
   * Dynamic import with loading state
   */
  async dynamicImport(modulePathJ, fallback = null) {
    try {
      const module = await import(modulePath);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      return fallback;
    }
  },

  /**
   * Lazy load component with Suspense
   */
  lazyComponent(importFunc, fallback = null) {
    return React.lazy(async () => {
      try {
        return await importFunc();
      } catch (error) {
        console.error('Failed to load component:', error);
        return {
          default: fallback || (() => React.createElement('div', null, 'Error loading component'))
        };
      }
    });
  },

  /**
   * Preload critical resources
   */
  preloadResources(resources) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.type || 'script';

      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }

      document.head.appendChild(link);
    });
  }
};

/**
 * Database optimization utilities
 */
export const DatabaseOptimizer = {
  /**
   * Batch database operations
   */
  createBatcher(executor, delay = 10) {
    let batch = [];
    let timeoutId = null;

    const flush = async () => {
      const currentBatch = batch;
      batch = [];
      timeoutId = null;

      if (currentBatch.length > 0) {
        await executor(currentBatch);
      }
    };

    return {
      add(operation) {
        batch.push(operation);

        if (!timeoutId) {
          timeoutId = setTimeout(flush, delay);
        }

        if (batch.length >= 50) {
          clearTimeout(timeoutId);
          flush();
        }
      },

      flush
    };
  },

  /**
   * Connection pool manager
   */
  createConnectionPool(createConnection, maxConnections = 5) {
    const pool = [];
    const waiting = [];

    return {
      async acquire() {
        if (pool.length > 0) {
          return pool.pop();
        }

        if (pool.length + waiting.length < maxConnections) {
          return await createConnection();
        }

        return new Promise(resolve => {
          waiting.push(resolve);
        });
      },

      release(connection) {
        if (waiting.length > 0) {
          const resolve = waiting.shift();
          resolve(connection);
        } else {
          pool.push(connection);
        }
      },

      async withConnection(fn) {
        const connection = await this.acquire();
        try {
          return await fn(connection);
        } finally {
          this.release(connection);
        }
      }
    };
  }
};

// Export all utilities
export default {
  debounce,
  throttle,
  memoize,
  rafThrottle,
  lazyLoadImages,
  VirtualScroller,
  WorkerManager,
  MemoryManager,
  PerformanceMonitor,
  ReactOptimizations,
  BundleOptimizer,
  DatabaseOptimizer
};