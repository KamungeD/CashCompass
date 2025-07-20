// Cache utilities for better performance

class SimpleCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    return this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

// Create singleton cache instances
export const apiCache = new SimpleCache(50, 2 * 60 * 1000); // 2 minutes for API responses
export const uiCache = new SimpleCache(100, 10 * 60 * 1000); // 10 minutes for UI state

// Debounce function for search and input optimization
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function for scroll and resize events
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization helper for expensive calculations
export const memoize = (fn, getCacheKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getCacheKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
};

// Local storage helper with expiration
export const storageWithExpiry = {
  set: (key, value, ttl = 24 * 60 * 60 * 1000) => { // 24 hours default
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: (key) => {
    const itemStr = localStorage.getItem(key);
    
    if (!itemStr) {
      return null;
    }
    
    try {
      const item = JSON.parse(itemStr);
      const now = new Date();
      
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      localStorage.removeItem(key);
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};

// Image lazy loading helper
export const lazyLoadImage = (src, placeholder = '/placeholder.png') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(placeholder);
    img.src = src;
  });
};

// Performance monitoring
export const performanceMonitor = {
  mark: (name) => {
    if (performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name, startMark, endMark) => {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure ? measure.duration : 0;
    }
    return 0;
  },

  getEntries: () => {
    if (performance.getEntries) {
      return performance.getEntries();
    }
    return [];
  },

  clearMarks: () => {
    if (performance.clearMarks) {
      performance.clearMarks();
    }
  },

  clearMeasures: () => {
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }
};

// Resource hints for preloading
export const resourceHints = {
  preload: (href, as = 'fetch') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (as === 'fetch') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  },

  prefetch: (href) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  preconnect: (href) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
};

// Bundle size optimization helpers
export const optimizeBundle = {
  // Dynamic import wrapper
  dynamicImport: (importFunc) => {
    return importFunc().catch(error => {
      console.error('Dynamic import failed:', error);
      return null;
    });
  },

  // Check if feature is supported before loading polyfill
  conditionalPolyfill: (condition, polyfillLoader) => {
    if (!condition) {
      return polyfillLoader();
    }
    return Promise.resolve();
  }
};

export default {
  SimpleCache,
  apiCache,
  uiCache,
  debounce,
  throttle,
  memoize,
  storageWithExpiry,
  lazyLoadImage,
  performanceMonitor,
  resourceHints,
  optimizeBundle
};
