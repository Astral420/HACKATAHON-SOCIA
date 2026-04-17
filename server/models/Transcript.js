const pool = require('../utils/db');

class Transcript {
  /**
   * Upsert a transcript (insert or replace existing)
   * @param {Object} params - Transcript parameters
   * @param {string} params.meetingId - Meeting ID
   * @param {string} params.content - Transcript content
   * @param {string} params.source - Source type (default: 'text')
   * @returns {Promise<Object>} Upserted transcript object
   */
  static async upsert({ meetingId, content, source = 'text' }) {
    const result = await pool.query(
      `INSERT INTO transcripts (meeting_id, content, source, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (meeting_id) 
       DO UPDATE SET 
         content = EXCLUDED.content,
         source = EXCLUDED.source
       RETURNING id, meeting_id, content, source, created_at`,
      [meetingId, content, source]
    );
    return result.rows[0];
  }

  /**
   * Find a transcript by meeting ID
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object|undefined>} Transcript object if found, undefined otherwise
   */
  static async findByMeetingId(meetingId) {
    const result = await pool.query(
      'SELECT id, meeting_id, content, source, created_at FROM transcripts WHERE meeting_id = $1',
      [meetingId]
    );
    return result.rows[0];
  }
}

module.exports = Transcript;
