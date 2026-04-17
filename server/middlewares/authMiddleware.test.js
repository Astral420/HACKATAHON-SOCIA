const authMiddleware = require('./authMiddleware');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request, response, and next function
    req = {
      headers: {},
      path: '/api/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Set up environment variable
    process.env.API_KEY = 'test-api-key-12345';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Missing API Key', () => {
    it('should return 401 when X-API-Key header is missing', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'API key required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when X-API-Key header is empty string', () => {
      req.headers['x-api-key'] = '';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'API key required' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid API Key', () => {
    it('should return 403 when X-API-Key header is invalid', () => {
      req.headers['x-api-key'] = 'wrong-api-key';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when X-API-Key is partially correct', () => {
      req.headers['x-api-key'] = 'test-api-key';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Valid API Key', () => {
    it('should call next() when X-API-Key header is valid', () => {
      req.headers['x-api-key'] = 'test-api-key-12345';

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next() when API key matches environment variable exactly', () => {
      const validKey = process.env.API_KEY;
      req.headers['x-api-key'] = validKey;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined API_KEY environment variable', () => {
      delete process.env.API_KEY;
      req.headers['x-api-key'] = 'any-key';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for header name', () => {
      req.headers['X-API-KEY'] = 'test-api-key-12345';

      authMiddleware(req, res, next);

      // Express normalizes headers to lowercase, so this should fail
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
