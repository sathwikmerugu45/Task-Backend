const { query } = require('../config/db');

class User {
  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    try {
      const result = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error finding user by ID:', err);
      throw err;
    }
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error finding user by email:', err);
      throw err;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - Hashed password
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const { name, email, password } = userData;
    
    try {
      const result = await query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
        [name, email, password]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user
   */
  static async update(id, userData) {
    const { name, email } = userData;
    
    try {
      const result = await query(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at',
        [name, email, id]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} password - New hashed password
   * @returns {Promise<boolean>} Success status
   */
  static async updatePassword(id, password) {
    try {
      await query('UPDATE users SET password = $1 WHERE id = $2', [password, id]);
      return true;
    } catch (err) {
      console.error('Error updating password:', err);
      throw err;
    }
  }
}

module.exports = User;