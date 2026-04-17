const pool = require('../utils/db');

class Client {
  static async create({ name, email, company, userId }) {
    const result = await pool.query(
      `INSERT INTO clients (name, email, company, user_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [name, email, company, userId]
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
