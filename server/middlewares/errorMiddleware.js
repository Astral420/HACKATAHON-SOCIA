const { logError } = require('../utils/logger');

/**
 * Central error handling middleware
 * Catches all errors, logs them with HTTP context, and returns consistent JSON responses
 * 
 * Requirements:
 * - 12.1: Return JSON response with error message
 * - 12.2: Log HTTP method, path, status code, and error message
 * - 12.3: Return 400 for validation errors
 * - 12.4: Return 404 for not found errors
 * - 12.5: Return 500 for internal errors and log full stack trace
 */
const errorMiddleware = (err, req, res, next) => {
  // Extract status code from error object, default to 500 for internal errors
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle different error types appropriately
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'NotFoundError' || (err.message && err.message.toLowerCase().includes('not found'))) {
    statusCode = 404;
  }
  
  // Log error with HTTP method, path, status code, message, and stack trace
  logError(req, err, statusCode);

  const message = err.message || 'Internal server error';

  // Return consistent JSON error response
  res.status(statusCode).json({
    error: message
  });
};

module.exports = errorMiddleware;
