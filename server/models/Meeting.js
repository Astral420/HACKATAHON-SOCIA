const pool = require('../utils/db');

class Meeting {
  static async create({ clientId, title, recordingUrl, userId }) {
    const result = await pool.query(
      `INSERT INTO meetings (client_id, title, recording_url, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [clientId, title, recordingUrl, userId]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll(userId, filters = {}) {
    let query = 'SELECT * FROM meetings WHERE user_id = $1';
    const params = [userId];
    
    if (filters.clientId) {
      params.push(filters.clientId);
      query += ` AND client_id = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    values.push(id);
    const result = await pool.query(
      `UPDATE meetings SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM meetings WHERE id = $1', [id]);
  }
}

module.exports = Meeting;
