const { z } = require('zod');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors,
        });
      }
      next(err);
    }
  };
};

// Common schemas
const schemas = {
  createMeeting: z.object({
    body: z.object({
      clientId: z.number().int().positive(),
      title: z.string().min(1).max(255),
      recordingUrl: z.string().url().optional(),
    }),
  }),

  updateMeeting: z.object({
    params: z.object({
      id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
      title: z.string().min(1).max(255).optional(),
      recordingUrl: z.string().url().optional(),
    }),
  }),

  processMeeting: z.object({
    params: z.object({
      id: z.string().regex(/^\d+$/),
    }),
  }),

  shareToken: z.object({
    params: z.object({
      token: z.string().length(16),
    }),
  }),
};

module.exports = { validate, schemas };
