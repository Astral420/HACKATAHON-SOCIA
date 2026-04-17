const pool = require('../utils/db');

class Meeting {
  /**
   * Create a new meeting with client
   * @param {Object} params - Meeting creation parameters
   * @param {string} params.clientName - Name of the client
   * @param {string} params.title - Meeting title
   * @param {string} params.shareToken - Unique share token for public access
   * @returns {Promise<Object>} Created meeting object
   */
  static async create({ clientName, title, shareToken }) {
    // First, create the client
    const clientResult = await pool.query(
      `INSERT INTO clients (name, created_at)
       VALUES ($1, CURRENT_TIMESTAMP)
       RETURNING id`,
      [clientName]
    );
    const clientId = clientResult.rows[0].id;

    // Then create the meeting
    const result = await pool.query(
      `INSERT INTO meetings (client_id, title, share_token, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, client_id, title, share_token, status, created_at, updated_at`,
      [clientId, title, shareToken]
    );
    return result.rows[0];
  }

  /**
   * Find all meetings with pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of meetings to return (default: 50)
   * @returns {Promise<Array>} Array of meeting objects with client names
   */
  static async findAll({ limit = 50 } = {}) {
    const result = await pool.query(
      `SELECT 
         m.id, 
         m.title, 
         m.share_token, 
         m.status, 
         m.created_at, 
         m.updated_at,
         c.name as client_name
       FROM meetings m
       LEFT JOIN clients c ON m.client_id = c.id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Find a meeting by ID
   * @param {string} id - Meeting ID
   * @param {Object} options - Query options
   * @param {boolean} options.includeAiOutput - Whether to include AI output (default: false)
   * @returns {Promise<Object|undefined>} Meeting object with optional AI output
   */
  static async findById(id, { includeAiOutput = false } = {}) {
    if (includeAiOutput) {
      const result = await pool.query(
        `SELECT 
           m.id, 
           m.title, 
           m.share_token, 
           m.status, 
           m.created_at, 
           m.updated_at,
           c.name as client_name,
           ao.summary,
           ao.action_items,
           ao.key_decisions,
           ao.open_questions,
           ao.next_steps
         FROM meetings m
         LEFT JOIN clients c ON m.client_id = c.id
         LEFT JOIN ai_outputs ao ON m.id = ao.meeting_id
         WHERE m.id = $1`,
        [id]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `SELECT 
           m.id, 
           m.title, 
           m.share_token, 
           m.status, 
           m.created_at, 
           m.updated_at,
           c.name as client_name
         FROM meetings m
         LEFT JOIN clients c ON m.client_id = c.id
         WHERE m.id = $1`,
        [id]
      );
      return result.rows[0];
    }
  }

  /**
   * Find a meeting by share token
   * @param {string} token - Share token
   * @param {Object} options - Query options
   * @param {boolean} options.includeAiOutput - Whether to include AI output (default: false)
   * @returns {Promise<Object|undefined>} Meeting object with optional AI output
   */
  static async findByToken(token, { includeAiOutput = false } = {}) {
    if (includeAiOutput) {
      const result = await pool.query(
        `SELECT 
           m.id, 
           m.title, 
           m.share_token, 
           m.status, 
           m.created_at, 
           m.updated_at,
           c.name as client_name,
           ao.summary,
           ao.action_items,
           ao.key_decisions,
           ao.open_questions,
           ao.next_steps
         FROM meetings m
         LEFT JOIN clients c ON m.client_id = c.id
         LEFT JOIN ai_outputs ao ON m.id = ao.meeting_id
         WHERE m.share_token = $1`,
        [token]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `SELECT 
           m.id, 
           m.title, 
           m.share_token, 
           m.status, 
           m.created_at, 
           m.updated_at,
           c.name as client_name
         FROM meetings m
         LEFT JOIN clients c ON m.client_id = c.id
         WHERE m.share_token = $1`,
        [token]
      );
      return result.rows[0];
    }
  }

  /**
   * Update meeting status
   * @param {string} id - Meeting ID
   * @param {string} status - New status (pending, processing, done, error)
   * @returns {Promise<Object>} Updated meeting object
   */
  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE meetings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, client_id, title, share_token, status, created_at, updated_at`,
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = Meeting;
