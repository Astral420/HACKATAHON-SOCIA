const Transcript = require('./Transcript');
const pool = require('../utils/db');

// Mock the database pool
jest.mock('../utils/db', () => ({
  query: jest.fn(),
}));

describe('Transcript Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should insert a new transcript', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-456',
        content: 'Test transcript content',
        source: 'text',
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockTranscript] });

      const result = await Transcript.upsert({
        meetingId: 'meeting-456',
        content: 'Test transcript content',
        source: 'text',
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transcripts'),
        ['meeting-456', 'Test transcript content', 'text']
      );
      expect(result).toEqual(mockTranscript);
    });

    it('should update existing transcript on conflict', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-456',
        content: 'Updated transcript content',
        source: 'text',
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockTranscript] });

      const result = await Transcript.upsert({
        meetingId: 'meeting-456',
        content: 'Updated transcript content',
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (meeting_id)'),
        ['meeting-456', 'Updated transcript content', 'text']
      );
      expect(result).toEqual(mockTranscript);
    });

    it('should use default source value of "text"', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-456',
        content: 'Test content',
        source: 'text',
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockTranscript] });

      await Transcript.upsert({
        meetingId: 'meeting-456',
        content: 'Test content',
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['meeting-456', 'Test content', 'text']
      );
    });
  });

  describe('findByMeetingId', () => {
    it('should find transcript by meeting ID', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-456',
        content: 'Test transcript content',
        source: 'text',
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockTranscript] });

      const result = await Transcript.findByMeetingId('meeting-456');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, meeting_id, content, source, created_at FROM transcripts WHERE meeting_id = $1',
        ['meeting-456']
      );
      expect(result).toEqual(mockTranscript);
    });

    it('should return undefined when transcript not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Transcript.findByMeetingId('non-existent');

      expect(result).toBeUndefined();
    });
  });
});
