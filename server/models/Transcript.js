const pool = require('../utils/db');

class Transcript {
  static async create({ meetingId, text, language = 'en' }) {
    const result = await pool.query(
      `INSERT INTO transcripts (meeting_id, text, language, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [meetingId, text, language]
    );
    return result.rows[0];
  }

  static async findByMeetingId(meetingId) {
    const result = await pool.query(
      'SELECT * FROM transcripts WHERE meeting_id = $1',
      [meetingId]
    );
    return result.rows[0];
  }

  static async update(id, text) {
    const result = await pool.query(
      `UPDATE transcripts SET text = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [text, id]
    );
    return result.rows[0];
  }
}

module.exports = Transcript;
