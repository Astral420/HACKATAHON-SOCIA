const errorMiddleware = require('./errorMiddleware');
const { logError } = require('../utils/logger');

// Mock the logger
jest.mock('../utils/logger', () => ({
  logError: jest.fn()
}));

describe('errorMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/meetings'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Requirement 12.1: Return JSON response with error message', () => {
    it('should return JSON response with error message', () => {
      const error = new Error('Test error');
      error.statusCode = 400;

      errorMiddleware(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error'
      });
    });

    it('should return default message for errors without message', () => {
      const error = new Error();
      error.statusCode = 500;

      errorMiddleware(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('Requirement 12.2: Log HTTP method, path, status code, and error message', () => {
    it('should log error with HTTP method, path, status code, and message', () => {
      const error = new Error('Database connection failed');
      error.statusCode = 500;

      errorMiddleware(error, req, res, next);

      expect(logError).toHaveBeenCalledWith(req, error, 500);
    });

    it('should log with correct HTTP context', () => {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      req.method = 'GET';
      req.path = '/api/meetings/123';

      errorMiddleware(error, req, res, next);

      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/api/meetings/123'
        }),
        error,
        400
      );
    });
  });

  describe('Requirement 12.3: Return 400 for validation errors', () => {
    it('should return 400 for ValidationError', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid input'
      });
    });

    it('should return 400 when statusCode is explicitly set', () => {
      const error = new Error('Missing required field');
      error.statusCode = 400;

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Requirement 12.4: Return 404 for not found errors', () => {
    it('should return 404 for NotFoundError', () => {
      const error = new Error('Resource not found');
      error.name = 'NotFoundError';

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Resource not found'
      });
    });

    it('should return 404 when statusCode is explicitly set', () => {
      const error = new Error('Meeting not found');
      error.statusCode = 404;

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when error message contains "not found"', () => {
      const error = new Error('Meeting not found');

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Requirement 12.5: Return 500 for internal errors and log full stack trace', () => {
    it('should return 500 for internal errors', () => {
      const error = new Error('Unexpected error');

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unexpected error'
      });
    });

    it('should log full stack trace for internal errors', () => {
      const error = new Error('Database crash');
      error.stack = 'Error: Database crash\n    at someFunction (file.js:10:5)';

      errorMiddleware(error, req, res, next);

      expect(logError).toHaveBeenCalledWith(
        req,
        expect.objectContaining({
          message: 'Database crash',
          stack: expect.stringContaining('Database crash')
        }),
        500
      );
    });

    it('should default to 500 when no statusCode is provided', () => {
      const error = new Error('Unknown error');

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Edge cases', () => {
    it('should handle error with status property instead of statusCode', () => {
      const error = new Error('Error with status');
      error.status = 403;

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should prioritize statusCode over status property', () => {
      const error = new Error('Error with both');
      error.statusCode = 400;
      error.status = 500;

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors without any properties', () => {
      const error = {};

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });
});
