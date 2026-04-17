const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error({
    err,
    path: req.path,
    method: req.method,
    body: req.body,
  }, 'Request error');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
