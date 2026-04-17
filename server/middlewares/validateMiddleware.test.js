const { validate, schemas } = require('./validateMiddleware');

describe('validateMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('createMeeting validation', () => {
    it('should pass validation with valid title and clientName', () => {
      req.body = {
        title: 'Test Meeting',
        clientName: 'John Doe',
      };

      const middleware = validate(schemas.createMeeting);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when title is missing', () => {
      req.body = {
        clientName: 'John Doe',
      };

      const middleware = validate(schemas.createMeeting);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Title is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when clientName is missing', () => {
      req.body = {
        title: 'Test Meeting',
      };

      const middleware = validate(schemas.createMeeting);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Client name is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when title exceeds 255 characters', () => {
      req.body = {
        title: 'a'.repeat(256),
        clientName: 'John Doe',
      };

      const middleware = validate(schemas.createMeeting);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Title must not exceed 255 characters',
      });
    });

    it('should return 400 when clientName exceeds 255 characters', () => {
      req.body = {
        title: 'Test Meeting',
        clientName: 'a'.repeat(256),
      };

      const middleware = validate(schemas.createMeeting);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Client name must not exceed 255 characters',
      });
    });
  });

  describe('uploadTranscript validation', () => {
    it('should pass validation with valid content', () => {
      req.body = {
        content: 'This is a valid transcript content.',
      };

      const middleware = validate(schemas.uploadTranscript);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when content is missing', () => {
      req.body = {};

      const middleware = validate(schemas.uploadTranscript);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Transcript content is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when content is empty string', () => {
      req.body = {
        content: '',
      };

      const middleware = validate(schemas.uploadTranscript);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Transcript content is required',
      });
    });

    it('should return 400 when content exceeds 50,000 characters', () => {
      req.body = {
        content: 'a'.repeat(50001),
      };

      const middleware = validate(schemas.uploadTranscript);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Transcript content must not exceed 50,000 characters',
      });
    });

    it('should pass validation with content at max length (50,000 chars)', () => {
      req.body = {
        content: 'a'.repeat(50000),
      };

      const middleware = validate(schemas.uploadTranscript);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
