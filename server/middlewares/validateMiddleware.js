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
        // Return descriptive error message from the first validation error
        const firstError = err.errors[0];
        const message = firstError.message || 'Validation failed';
        return res.status(400).json({
          error: message,
        });
      }
      next(err);
    }
  };
};

// Validation schemas for meeting creation
const createMeetingSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
    clientName: z.string({ required_error: 'Client name is required' }).min(1, 'Client name is required').max(255, 'Client name must not exceed 255 characters'),
  }),
});

// Validation schema for transcript upload
const uploadTranscriptSchema = z.object({
  body: z.object({
    content: z.string({ required_error: 'Transcript content is required' }).min(1, 'Transcript content is required').max(50000, 'Transcript content must not exceed 50,000 characters'),
  }),
});

// Common schemas
const schemas = {
  createMeeting: createMeetingSchema,
  uploadTranscript: uploadTranscriptSchema,

  updateMeeting: z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      title: z.string().min(1).max(255).optional(),
      recordingUrl: z.string().url().optional(),
    }),
  }),

  processMeeting: z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
  }),

  shareToken: z.object({
    params: z.object({
      token: z.string().length(16),
    }),
  }),
};

module.exports = { validate, schemas };
