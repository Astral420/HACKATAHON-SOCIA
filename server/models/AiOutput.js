const pool = require('../utils/db');

class AiOutput {
  /**
   * Upsert an AI output (insert or replace existing)
   * @param {Object} params - AI output parameters
   * @param {string} params.meetingId - Meeting ID
   * @param {string} params.summary - Executive summary (2-3 sentences)
   * @param {Array<string>} params.action_items - Array of action items
   * @param {Array<string>} params.key_decisions - Array of key decisions
   * @param {Array<string>} params.open_questions - Array of open questions
   * @param {Array<string>} params.next_steps - Array of next steps
   * @returns {Promise<Object>} Upserted AI output object
   */
  static async upsert({ meetingId, summary, action_items, key_decisions, open_questions, next_steps }) {
    const result = await pool.query(
      `INSERT INTO ai_outputs (meeting_id, summary, action_items, key_decisions, open_questions, next_steps, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (meeting_id) 
       DO UPDATE SET 
         summary = EXCLUDED.summary,
         action_items = EXCLUDED.action_items,
         key_decisions = EXCLUDED.key_decisions,
         open_questions = EXCLUDED.open_questions,
         next_steps = EXCLUDED.next_steps
       RETURNING id, meeting_id, summary, action_items, key_decisions, open_questions, next_steps, created_at`,
      [meetingId, summary, JSON.stringify(action_items), JSON.stringify(key_decisions), JSON.stringify(open_questions), JSON.stringify(next_steps)]
    );
    return result.rows[0];
  }

  /**
   * Find an AI output by meeting ID
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object|undefined>} AI output object if found, undefined otherwise
   */
  static async findByMeetingId(meetingId) {
    const result = await pool.query(
      'SELECT id, meeting_id, summary, action_items, key_decisions, open_questions, next_steps, created_at FROM ai_outputs WHERE meeting_id = $1',
      [meetingId]
    );
    return result.rows[0];
  }
}

module.exports = AiOutput;
