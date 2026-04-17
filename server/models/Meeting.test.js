const Meeting = require('./Meeting');
const pool = require('../utils/db');

// Mock the database pool
jest.mock('../utils/db', () => ({
  query: jest.fn(),
}));

describe('Meeting Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new meeting with client using parameterized queries', async () => {
      const mockClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const mockMeeting = {
        id: '223e4567-e89b-12d3-a456-426614174000',
        client_id: mockClient.id,
        title: 'Q1 Planning Meeting',
        share_token: 'abc123xyz',
        status: 'pending',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      // Mock client creation
      pool.query.mockResolvedValueOnce({ rows: [mockClient] });
      // Mock meeting creation
      pool.query.mockResolvedValueOnce({ rows: [mockMeeting] });

      const result = await Meeting.create({
        clientName: 'Acme Corp',
        title: 'Q1 Planning Meeting',
        shareToken: 'abc123xyz',
      });

      // Verify client creation query
      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO clients'),
        ['Acme Corp']
      );

      // Verify meeting creation query
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO meetings'),
        [mockClient.id, 'Q1 Planning Meeting', 'abc123xyz']
      );

      expect(result).toEqual(mockMeeting);
      expect(result.status).toBe('pending');
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousName = "'; DROP TABLE meetings; --";
      const maliciousTitle = "'; DELETE FROM clients; --";
      const mockClient = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const mockMeeting = {
        id: '223e4567-e89b-12d3-a456-426614174000',
        client_id: mockClient.id,
        title: maliciousTitle,
        share_token: 'token123',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({ rows: [mockClient] });
      pool.query.mockResolvedValueOnce({ rows: [mockMeeting] });

      await Meeting.create({
        clientName: maliciousName,
        title: maliciousTitle,
        shareToken: 'token123',
      });

      // Verify parameterized queries are used
      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        [maliciousName]
      );
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        [mockClient.id, maliciousTitle, 'token123']
      );
    });
  });

  describe('findAll', () => {
    it('should return meetings with default limit of 50', async () => {
      const mockMeetings = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Meeting 1',
          share_token: 'token1',
          status: 'done',
          created_at: new Date('2024-01-02T00:00:00Z'),
          updated_at: new Date('2024-01-02T00:00:00Z'),
          client_name: 'Client A',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          title: 'Meeting 2',
          share_token: 'token2',
          status: 'pending',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          client_name: 'Client B',
        },
      ];

      pool.query.mockResolvedValue({ rows: mockMeetings });

      const result = await Meeting.findAll();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [50]
      );
      expect(result).toEqual(mockMeetings);
      expect(result).toHaveLength(2);
    });

    it('should support custom limit parameter', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await Meeting.findAll({ limit: 10 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1'),
        [10]
      );
    });

    it('should include client names via LEFT JOIN', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await Meeting.findAll();

      const callArgs = pool.query.mock.calls[0][0];
      expect(callArgs).toContain('LEFT JOIN clients');
      expect(callArgs).toContain('client_name');
    });
  });

  describe('findById', () => {
    it('should find meeting by ID without AI output', async () => {
      const mockMeeting = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        share_token: 'token123',
        status: 'done',
        created_at: new Date(),
        updated_at: new Date(),
        client_name: 'Test Client',
      };

      pool.query.mockResolvedValue({ rows: [mockMeeting] });

      const result = await Meeting.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.id = $1'),
        ['123e4567-e89b-12d3-a456-426614174000']
      );
      expect(result).toEqual(mockMeeting);
    });

    it('should find meeting by ID with AI output when includeAiOutput is true', async () => {
      const mockMeeting = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        share_token: 'token123',
        status: 'done',
        created_at: new Date(),
        updated_at: new Date(),
        client_name: 'Test Client',
        summary: 'Meeting summary',
        action_items: ['Action 1', 'Action 2'],
        key_decisions: ['Decision 1'],
        open_questions: ['Question 1'],
        next_steps: ['Step 1'],
      };

      pool.query.mockResolvedValue({ rows: [mockMeeting] });

      const result = await Meeting.findById('123e4567-e89b-12d3-a456-426614174000', {
        includeAiOutput: true,
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringMatching(/LEFT JOIN ai_outputs/),
        ['123e4567-e89b-12d3-a456-426614174000']
      );
      expect(result).toEqual(mockMeeting);
      expect(result.summary).toBe('Meeting summary');
    });

    it('should return undefined when meeting is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Meeting.findById('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('findByToken', () => {
    it('should find meeting by share token without AI output', async () => {
      const mockMeeting = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        share_token: 'token123',
        status: 'done',
        created_at: new Date(),
        updated_at: new Date(),
        client_name: 'Test Client',
      };

      pool.query.mockResolvedValue({ rows: [mockMeeting] });

      const result = await Meeting.findByToken('token123');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.share_token = $1'),
        ['token123']
      );
      expect(result).toEqual(mockMeeting);
    });

    it('should find meeting by token with AI output when includeAiOutput is true', async () => {
      const mockMeeting = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        share_token: 'token123',
        status: 'done',
        created_at: new Date(),
        updated_at: new Date(),
        client_name: 'Test Client',
        summary: 'Meeting summary',
        action_items: ['Action 1'],
        key_decisions: [],
        open_questions: [],
        next_steps: ['Step 1'],
      };

      pool.query.mockResolvedValue({ rows: [mockMeeting] });

      const result = await Meeting.findByToken('token123', { includeAiOutput: true });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringMatching(/LEFT JOIN ai_outputs/),
        ['token123']
      );
      expect(result).toEqual(mockMeeting);
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousToken = "' OR '1'='1";
      pool.query.mockResolvedValue({ rows: [] });

      await Meeting.findByToken(maliciousToken);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [maliciousToken]
      );
    });
  });

  describe('updateStatus', () => {
    it('should update meeting status using parameterized query', async () => {
      const mockMeeting = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        share_token: 'token123',
        status: 'processing',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T01:00:00Z'),
      };

      pool.query.mockResolvedValue({ rows: [mockMeeting] });

      const result = await Meeting.updateStatus('123e4567-e89b-12d3-a456-426614174000', 'processing');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meetings'),
        ['processing', '123e4567-e89b-12d3-a456-426614174000']
      );
      expect(result).toEqual(mockMeeting);
      expect(result.status).toBe('processing');
    });

    it('should update updated_at timestamp', async () => {
      const mockMeeting = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        client_id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        share_token: 'token123',
        status: 'done',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T02:00:00Z'),
      };

      pool.query.mockResolvedValue({ rows: [mockMeeting] });

      const result = await Meeting.updateStatus('123e4567-e89b-12d3-a456-426614174000', 'done');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
        ['done', '123e4567-e89b-12d3-a456-426614174000']
      );
      expect(result.updated_at).toBeDefined();
    });
  });
});
