const logger = require('./logger');

describe('Logger', () => {
  it('should export logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should export logRequest helper', () => {
    expect(typeof logger.logRequest).toBe('function');
  });

  it('should export logResponse helper', () => {
    expect(typeof logger.logResponse).toBe('function');
  });

  it('should export logError helper', () => {
    expect(typeof logger.logError).toBe('function');
  });

  describe('logRequest', () => {
    it('should log request details', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/meetings',
        query: { limit: 10 }
      };

      // Should not throw
      expect(() => logger.logRequest(mockReq)).not.toThrow();
    });

    it('should log request with additional data', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/meetings',
        query: {}
      };

      // Should not throw
      expect(() => logger.logRequest(mockReq, { userId: '123' })).not.toThrow();
    });
  });

  describe('logResponse', () => {
    it('should log response details', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/meetings'
      };
      const mockRes = {
        statusCode: 200
      };

      // Should not throw
      expect(() => logger.logResponse(mockReq, mockRes)).not.toThrow();
    });

    it('should log response with additional data', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/meetings'
      };
      const mockRes = {
        statusCode: 201
      };

      // Should not throw
      expect(() => logger.logResponse(mockReq, mockRes, { meetingId: 'abc' })).not.toThrow();
    });
  });

  describe('logError', () => {
    it('should log error details', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/meetings'
      };
      const mockError = new Error('Test error');

      // Should not throw
      expect(() => logger.logError(mockReq, mockError)).not.toThrow();
    });

    it('should log error with custom status code', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/meetings/123'
      };
      const mockError = new Error('Not found');

      // Should not throw
      expect(() => logger.logError(mockReq, mockError, 404)).not.toThrow();
    });
  });
});
