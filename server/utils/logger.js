const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

/**
 * Log HTTP request details
 * @param {Object} req - Express request object
 * @param {Object} additionalData - Additional data to log
 */
const logRequest = (req, additionalData = {}) => {
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    ...additionalData
  });
};

/**
 * Log HTTP response details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} additionalData - Additional data to log
 */
const logResponse = (req, res, additionalData = {}) => {
  logger.info({
    type: 'response',
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    ...additionalData
  });
};

/**
 * Log error with HTTP context
 * @param {Object} req - Express request object
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code
 */
const logError = (req, error, statusCode = 500) => {
  logger.error({
    type: 'error',
    method: req.method,
    path: req.path,
    statusCode,
    message: error.message,
    stack: error.stack
  });
};

module.exports = logger;
module.exports.logRequest = logRequest;
module.exports.logResponse = logResponse;
module.exports.logError = logError;
