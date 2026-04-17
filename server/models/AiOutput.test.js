const AiOutput = require('./AiOutput');
const pool = require('../utils/db');

// Mock the database pool
jest.mock('../utils/db', () => ({
  query: jest.fn(),
}));

describe('AiOutput Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should insert a new AI output', async () => {
      const mockAiOutput = {
        id: 'ai-output-123',
        meeting_id: 'meeting-456',
        summary: 'This is a test summary of the meeting.',
        action_items: ['Action 1', 'Action 2'],
        key_decisions: ['Decision 1'],
        open_questions: ['Question 1'],
        next_steps: ['Next step 1'],
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockAiOutput] });

      const result = await AiOutput.upsert({
        meetingId: 'meeting-456',
        summary: 'This is a test summary of the meeting.',
        action_items: ['Action 1', 'Action 2'],
        key_decisions: ['Decision 1'],
        open_questions: ['Question 1'],
        next_steps: ['Next step 1'],
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_outputs'),
        [
          'meeting-456',
          'This is a test summary of the meeting.',
          JSON.stringify(['Action 1', 'Action 2']),
          JSON.stringify(['Decision 1']),
          JSON.stringify(['Question 1']),
          JSON.stringify(['Next step 1']),
        ]
      );
      expect(result).toEqual(mockAiOutput);
    });

    it('should update existing AI output on conflict', async () => {
      const mockAiOutput = {
        id: 'ai-output-123',
        meeting_id: 'meeting-456',
        summary: 'Updated summary.',
        action_items: ['Updated action'],
        key_decisions: [],
        open_questions: [],
        next_steps: ['Updated next step'],
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockAiOutput] });

      const result = await AiOutput.upsert({
        meetingId: 'meeting-456',
        summary: 'Updated summary.',
        action_items: ['Updated action'],
        key_decisions: [],
        open_questions: [],
        next_steps: ['Updated next step'],
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (meeting_id)'),
        [
          'meeting-456',
          'Updated summary.',
          JSON.stringify(['Updated action']),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify(['Updated next step']),
        ]
      );
      expect(result).toEqual(mockAiOutput);
    });

    it('should handle empty arrays for all JSONB fields', async () => {
      const mockAiOutput = {
        id: 'ai-output-123',
        meeting_id: 'meeting-456',
        summary: 'Summary with no items.',
        action_items: [],
        key_decisions: [],
        open_questions: [],
        next_steps: [],
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockAiOutput] });

      const result = await AiOutput.upsert({
        meetingId: 'meeting-456',
        summary: 'Summary with no items.',
        action_items: [],
        key_decisions: [],
        open_questions: [],
        next_steps: [],
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [
          'meeting-456',
          'Summary with no items.',
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
        ]
      );
      expect(result).toEqual(mockAiOutput);
    });
  });

  describe('findByMeetingId', () => {
    it('should find AI output by meeting ID', async () => {
      const mockAiOutput = {
        id: 'ai-output-123',
        meeting_id: 'meeting-456',
        summary: 'Test summary',
        action_items: ['Action 1'],
        key_decisions: ['Decision 1'],
        open_questions: ['Question 1'],
        next_steps: ['Next step 1'],
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockAiOutput] });

      const result = await AiOutput.findByMeetingId('meeting-456');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, meeting_id, summary, action_items, key_decisions, open_questions, next_steps, created_at FROM ai_outputs WHERE meeting_id = $1',
        ['meeting-456']
      );
      expect(result).toEqual(mockAiOutput);
    });

    it('should return undefined when AI output not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await AiOutput.findByMeetingId('non-existent');

      expect(result).toBeUndefined();
    });
  });
});
