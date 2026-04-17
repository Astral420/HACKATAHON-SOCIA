const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  // Simple API key check
  if (apiKey && apiKey === process.env.API_KEY) {
    req.userId = 'api-user'; // In production, decode from JWT or session
    return next();
  }

  // JWT check (placeholder)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Verify JWT token
    // For now, accept any bearer token
    req.userId = 'jwt-user';
    return next();
  }

  logger.warn({ path: req.path }, 'Unauthorized access attempt');
  return res.status(401).json({ error: 'Unauthorized' });
};

module.exports = authMiddleware;
