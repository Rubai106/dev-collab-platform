/**
 * Response caching middleware
 * Caches GET request responses to reduce database queries
 */

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (req) => {
  return `${req.method}:${req.originalUrl}`;
};

const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = getCacheKey(req);
  const cached = cache.get(cacheKey);

  if (cached) {
    const { data, statusCode, headers, timestamp } = cached;
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      res.set('X-Cache', 'HIT');
      return res.status(statusCode).set(headers).json(data);
    }
    // Remove expired cache
    cache.delete(cacheKey);
  }

  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const cacheKey = getCacheKey(req);
    cache.set(cacheKey, {
      data,
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      timestamp: Date.now(),
    });

    res.set('X-Cache', 'MISS');
    return originalJson(data);
  };

  next();
};

const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

module.exports = { cacheMiddleware, clearCache };
