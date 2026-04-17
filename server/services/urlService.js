const crypto = require('crypto');
const pool = require('../utils/db');

/**
 * URL Service for generating share tokens
 * Tokens are URL-safe and unique identifiers for public meeting access
 */
class UrlService {
  /**
   * Generate a unique, URL-safe share token
   * Uses crypto.randomBytes to ensure uniqueness and security
   * @returns {string} URL-safe token (16 characters, hex encoded)
   */
  static generateToken() {
    // Generate 8 random bytes and convert to hex (16 characters)
    // Hex encoding ensures URL-safe characters (0-9, a-f)
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Validate a share token and return meeting ID if valid
   * @param {string} token - Share token to validate
   * @returns {Promise<{valid: boolean, meetingId?: string}>} Validation result
   */
  static async validateToken(token) {
    const result = await pool.query(
      'SELECT id FROM meetings WHERE share_token = $1 AND status = $2',
      [token, 'done']
    );

    if (result.rows.length > 0) {
      return { valid: true, meetingId: result.rows[0].id };
    }

    return { valid: false };
  }
}

module.exports = UrlService;
