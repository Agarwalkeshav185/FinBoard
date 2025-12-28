// Dynamic API service for fetching data from any financial API endpoint
// Handles CORS proxying, error handling, data transformation, and intelligent caching

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'; // Fallback for CORS issues

// Cache storage: { url: { data, timestamp, expiresAt } }
const apiCache = new Map();

const DEFAULT_CACHE_DURATION = 5 * 1000; // 5 seconds

/**
 * Get cached data if available and not expired
 * @param {string} url - The API endpoint URL
 * @returns {object|null} - Cached data or null
 */
const getCachedData = (url) => {
  const cached = apiCache.get(url);
  if (!cached) return null;

  const now = Date.now();
  if (now > cached.expiresAt) {
    // Cache expired, remove it
    apiCache.delete(url);
    return null;
  }

  console.log(`[Cache HIT] Using cached data for: ${url}`);
  return cached.data;
};

/**
 * Store data in cache
 * @param {string} url - The API endpoint URL
 * @param {object} data - Data to cache
 * @param {number} duration - Cache duration in milliseconds
 */
const setCachedData = (url, data, duration = DEFAULT_CACHE_DURATION) => {
  const now = Date.now();
  apiCache.set(url, {
    data,
    timestamp: now,
    expiresAt: now + duration,
  });
  console.log(`[Cache SET] Cached data for ${duration/1000}s: ${url}`);
};

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();
  let cleared = 0;
  
  for (const [url, cached] of apiCache.entries()) {
    if (now > cached.expiresAt) {
      apiCache.delete(url);
      cleared++;
    }
  }
  
  if (cleared > 0) {
    console.log(`[Cache CLEANUP] Removed ${cleared} expired entries`);
  }
};

// Clear expired cache every minute
setInterval(clearExpiredCache, 60 * 1000);

/**
 * Fetch data from any API endpoint with intelligent caching
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (headers, method, etc.)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @param {number} cacheDuration - Cache duration in seconds (default: 30)
 * @returns {Promise<any>} - Parsed JSON response
 */
export const fetchFromAPI = async (url, options = {}, useCache = true, cacheDuration = 30) => {
  // Check cache first
  if (useCache) {
    const cachedData = getCachedData(url);
    if (cachedData) {
      return { success: true, data: cachedData, error: null, cached: true };
    }
  }

  console.log(`[API CALL] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache successful response
    if (useCache) {
      setCachedData(url, data, cacheDuration * 1000);
    }

    return { success: true, data, error: null, cached: false };
  } catch (error) {
    // Try with CORS proxy if direct fetch fails
    if (error.message.includes('CORS') || error.name === 'TypeError') {
      try {
        console.log(`[CORS Proxy] Retrying with proxy: ${url}`);
        const proxyResponse = await fetch(CORS_PROXY + url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        if (!proxyResponse.ok) {
          throw new Error(`HTTP ${proxyResponse.status}: ${proxyResponse.statusText}`);
        }
        
        const data = await proxyResponse.json();
        
        // Cache successful response
        if (useCache) {
          setCachedData(url, data, cacheDuration * 1000);
        }

        return { success: true, data, error: null, cached: false };
      } catch (proxyError) {
        return {
          success: false,
          data: null,
          error: `CORS Error: ${proxyError.message}. Try enabling CORS in your API or use a proxy.`,
        };
      }
    }

    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch data from API',
    };
  }
};

/**
 * Extract nested value from object using dot notation path
 * @param {object} obj - The object to extract from
 * @param {string} path - Dot notation path (e.g., "data.rates.BTC")
 * @returns {any} - The extracted value
 */
export const getNestedValue = (obj, path) => {
  if (!path || !obj) return obj;
  
  return path.split('.').reduce((current, key) => {
    // Handle array indices
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      return current?.[arrayKey]?.[parseInt(index)];
    }
    return current?.[key];
  }, obj);
};

/**
 * Explore JSON structure and return all possible paths
 * @param {object} obj - The object to explore
 * @param {string} prefix - Current path prefix
 * @param {number} maxDepth - Maximum depth to explore
 * @returns {Array} - Array of {path, value, type} objects
 */
export const exploreJSONPaths = (obj, prefix = '', maxDepth = 5) => {
  const paths = [];
  
  const explore = (current, currentPath, depth) => {
    if (depth > maxDepth || current === null || current === undefined) {
      return;
    }

    const type = Array.isArray(current) ? 'array' : typeof current;

    if (type === 'object' || type === 'array') {
      if (type === 'array' && current.length > 0) {
        // For arrays, explore first element
        paths.push({
          path: currentPath,
          value: `Array(${current.length})`,
          type: 'array',
          sample: current[0],
        });
        explore(current[0], `${currentPath}[0]`, depth + 1);
      } else if (type === 'object') {
        Object.keys(current).forEach((key) => {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          const value = current[key];
          const valueType = Array.isArray(value) ? 'array' : typeof value;

          paths.push({
            path: newPath,
            value: valueType === 'object' || valueType === 'array' ? `{${valueType}}` : value,
            type: valueType,
          });

          if (valueType === 'object' || valueType === 'array') {
            explore(value, newPath, depth + 1);
          }
        });
      }
    }
  };

  explore(obj, prefix, 0);
  return paths;
};

/**
 * Transform API response based on field mappings
 * @param {object} data - Raw API response
 * @param {Array} fieldMappings - Array of {path, displayName} mappings
 * @param {string} widgetType - 'table', 'chart', or 'card'
 * @returns {Array} - Transformed data array
 */
export const transformAPIData = (data, fieldMappings, widgetType = 'table') => {
  if (!data || !fieldMappings || fieldMappings.length === 0) {
    return [];
  }

  // If data is an array, transform each item
  if (Array.isArray(data)) {
    return data.map((item) => {
      const transformed = {};
      fieldMappings.forEach(({ path, displayName }) => {
        const value = getNestedValue(item, path);
        transformed[displayName] = value;
      });
      return transformed;
    });
  }

  // For charts with single object: convert selected fields into array of data points
  if (widgetType === 'chart' && fieldMappings.length > 1) {
    // Create array where each field becomes a data point
    return fieldMappings.map(({ path, displayName }) => {
      const value = getNestedValue(data, path);
      return {
        name: displayName,
        value: parseFloat(value) || 0
      };
    });
  }

  // Single object - extract selected fields and wrap in array for table display
  const transformed = {};
  fieldMappings.forEach(({ path, displayName }) => {
    const value = getNestedValue(data, path);
    transformed[displayName] = value;
  });
  return [transformed];
};

/**
 * Test API endpoint and return sample response structure
 * @param {string} url - API endpoint to test
 * @returns {Promise<object>} - Test result with sample data and paths
 */
export const testAPIEndpoint = async (url) => {
  // Don't use cache for testing, always fetch fresh
  const result = await fetchFromAPI(url, {}, false);
  
  if (result.success) {
    const paths = exploreJSONPaths(result.data);
    return {
      success: true,
      data: result.data,
      paths,
      error: null,
    };
  }
  
  return result;
};

/**
 * Clear all cached data
 */
export const clearAllCache = () => {
  const size = apiCache.size;
  apiCache.clear();
  console.log(`[Cache CLEAR] Cleared ${size} entries`);
  return size;
};

/**
 * Clear cache for specific URL
 * @param {string} url - The API endpoint URL
 */
export const clearCacheForUrl = (url) => {
  const existed = apiCache.delete(url);
  if (existed) {
    console.log(`[Cache DELETE] Cleared cache for: ${url}`);
  }
  return existed;
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  const entries = Array.from(apiCache.entries());
  
  return {
    totalEntries: entries.length,
    activeEntries: entries.filter(([, cache]) => now <= cache.expiresAt).length,
    expiredEntries: entries.filter(([, cache]) => now > cache.expiresAt).length,
    urls: entries.map(([url, cache]) => ({
      url,
      age: Math.floor((now - cache.timestamp) / 1000),
      expiresIn: Math.max(0, Math.floor((cache.expiresAt - now) / 1000)),
    })),
  };
};
