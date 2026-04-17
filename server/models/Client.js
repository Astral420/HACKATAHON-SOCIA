const pool = require('../utils/db');

class Client {
  /**
   * Create a new client
   * @param {string} name - Client name
   * @returns {Promise<Object>} Created client object with id, name, created_at
   */
  static async create(name) {
    const result = await pool.query(
      `INSERT INTO clients (name, created_at)
       VALUES ($1, CURRENT_TIMESTAMP)
       RETURNING id, name, created_at`,
      [name]
    );
    return result.rows[0];
  }

  /**
   * Find a client by name
   * @param {string} name - Client name to search for
   * @returns {Promise<Object|undefined>} Client object if found, undefined otherwise
   */
  static async findByName(name) {
    const result = await pool.query(
      'SELECT id, name, created_at FROM clients WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll(userId) {
    const result = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return result.rows;
  }

  static async update(id, data) {
    const { name, email, company } = data;
    const result = await pool.query(
      `UPDATE clients SET name = $1, email = $2, company = $3
       WHERE id = $4
       RETURNING *`,
      [name, email, company, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
  }
}

module.exports = Client;
