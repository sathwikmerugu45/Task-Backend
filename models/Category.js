const { query } = require('../config/db');

class Category {
  /**
   * Get all categories for a user
   * @param {number} userId - User ID
   * @param {string} type - Category type (income or expense)
   * @returns {Promise<Array>} Array of categories
   */
  static async getByUser(userId, type = null) {
    try {
      let sql = 'SELECT * FROM categories WHERE user_id = $1';
      const params = [userId];
      
      if (type) {
        sql += ' AND type = $2';
        params.push(type);
      }
      
      sql += ' ORDER BY name ASC';
      
      const result = await query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('Error getting categories by user:', err);
      throw err;
    }
  }

  /**
   * Get a category by ID
   * @param {number} id - Category ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object|null>} Category or null
   */
  static async getById(id, userId) {
    try {
      const result = await query(
        'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error getting category by ID:', err);
      throw err;
    }
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.type - Category type (income or expense)
   * @param {number} categoryData.userId - User ID
   * @returns {Promise<Object>} Created category
   */
  static async create(categoryData) {
    const { name, type, userId } = categoryData;
    
    try {
      const result = await query(
        'INSERT INTO categories (name, type, user_id) VALUES ($1, $2, $3) RETURNING *',
        [name, type, userId]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error creating category:', err);
      throw err;
    }
  }

  /**
   * Update a category
   * @param {number} id - Category ID
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {number} categoryData.userId - User ID (for security)
   * @returns {Promise<Object>} Updated category
   */
  static async update(id, categoryData) {
    const { name, userId } = categoryData;
    
    try {
      const result = await query(
        'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [name, id, userId]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  }

  /**
   * Delete a category
   * @param {number} id - Category ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      await query(
        'DELETE FROM categories WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  }
}

module.exports = Category;