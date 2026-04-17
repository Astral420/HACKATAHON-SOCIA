const logger = require('../utils/logger');

/**
 * Authentication middleware for API endpoints
 * Validates X-API-Key header against environment variable
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void}
 * - 401: Missing API key
 * - 403: Invalid API key
 * - Calls next() if authentication succeeds
 * 
 * Requirements: 11.1, 11.2, 11.3
 */
const authMiddleware = (req, res, next) => {
  if (process.env.DISABLE_API_KEY_AUTH === 'true') {
    logger.warn({ path: req.path }, 'API key auth bypass enabled via DISABLE_API_KEY_AUTH');
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  // Check if API key header is missing
  if (!apiKey) {
    logger.warn({ path: req.path }, 'Missing API key');
    return res.status(401).json({ error: 'API key required' });
  }

  // Check if API key is invalid
  if (apiKey !== process.env.API_KEY) {
    logger.warn({ path: req.path, providedKey: apiKey }, 'Invalid API key');
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // API key is valid, proceed
  next();
};

module.exports = authMiddleware;
