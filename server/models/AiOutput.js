const pool = require('../utils/db');

class AiOutput {
  static async create({ meetingId, summary, actionItems, keyPoints, sentiment }) {
    const result = await pool.query(
      `INSERT INTO ai_outputs (meeting_id, summary, action_items, key_points, sentiment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [meetingId, summary, actionItems, keyPoints, sentiment]
    );
    return result.rows[0];
  }

  static async findByMeetingId(meetingId) {
    const result = await pool.query(
      'SELECT * FROM ai_outputs WHERE meeting_id = $1',
      [meetingId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { summary, actionItems, keyPoints, sentiment } = data;
    const result = await pool.query(
      `UPDATE ai_outputs 
       SET summary = $1, action_items = $2, key_points = $3, sentiment = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [summary, actionItems, keyPoints, sentiment, id]
    );
    return result.rows[0];
  }
}

module.exports = AiOutput;
