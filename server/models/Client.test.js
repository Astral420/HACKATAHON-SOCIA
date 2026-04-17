const Client = require('./Client');
const pool = require('../utils/db');

// Mock the database pool
jest.mock('../utils/db', () => ({
  query: jest.fn(),
}));

describe('Client Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new client with parameterized query', async () => {
      const mockClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corp',
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      pool.query.mockResolvedValue({ rows: [mockClient] });

      const result = await Client.create('Acme Corp');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clients'),
        ['Acme Corp']
      );
      expect(result).toEqual(mockClient);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Acme Corp');
      expect(result.created_at).toBeDefined();
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousName = "'; DROP TABLE clients; --";
      const mockClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: maliciousName,
        created_at: new Date(),
      };

      pool.query.mockResolvedValue({ rows: [mockClient] });

      await Client.create(maliciousName);

      // Verify parameterized query is used (value passed as parameter, not concatenated)
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [maliciousName]
      );
    });
  });

  describe('findByName', () => {
    it('should find a client by name using parameterized query', async () => {
      const mockClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corp',
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      pool.query.mockResolvedValue({ rows: [mockClient] });

      const result = await Client.findByName('Acme Corp');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, created_at FROM clients WHERE name = $1'),
        ['Acme Corp']
      );
      expect(result).toEqual(mockClient);
    });

    it('should return undefined when client is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Client.findByName('Nonexistent Client');

      expect(result).toBeUndefined();
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousName = "' OR '1'='1";
      pool.query.mockResolvedValue({ rows: [] });

      await Client.findByName(maliciousName);

      // Verify parameterized query is used
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [maliciousName]
      );
    });
  });
});
