const redis = require('../utils/redis');
const logger = require('../utils/logger');

class CacheService {
  static async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error({ err, key }, 'Cache get error');
      return null;
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      logger.error({ err, key }, 'Cache set error');
    }
  }

  static async del(key) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.error({ err, key }, 'Cache delete error');
    }
  }

  static async invalidatePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.error({ err, pattern }, 'Cache invalidate pattern error');
    }
  }
}

module.exports = CacheService;
