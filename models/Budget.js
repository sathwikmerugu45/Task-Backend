const { query } = require('../config/db');

class Budget {
  /**
   * Get all budgets for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Optional filters
   * @param {number} filters.month - Month (1-12)
   * @param {number} filters.year - Year
   * @returns {Promise<Array>} Array of budgets
   */
  static async getByUser(userId, filters = {}) {
    try {
      let sql = `
        SELECT b.*, c.name as category_name, c.type as category_type
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = $1
      `;
      
      const params = [userId];
      let paramCount = 1;
      
      if (filters.month) {
        paramCount++;
        sql += ` AND b.month = $${paramCount}`;
        params.push(filters.month);
      }
      
      if (filters.year) {
        paramCount++;
        sql += ` AND b.year = $${paramCount}`;
        params.push(filters.year);
      }
      
      sql += ` ORDER BY c.name ASC`;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('Error getting budgets by user:', err);
      throw err;
    }
  }

  /**
   * Get budget by ID
   * @param {number} id - Budget ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object|null>} Budget or null
   */
  static async getById(id, userId) {
    try {
      const result = await query(
        `SELECT b.*, c.name as category_name, c.type as category_type
         FROM budgets b
         JOIN categories c ON b.category_id = c.id
         WHERE b.id = $1 AND b.user_id = $2`,
        [id, userId]
      );
      
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error getting budget by ID:', err);
      throw err;
    }
  }

  /**
   * Create a new budget
   * @param {Object} budgetData - Budget data
   * @param {number} budgetData.amount - Budget amount
   * @param {number} budgetData.month - Month (1-12)
   * @param {number} budgetData.year - Year
   * @param {number} budgetData.categoryId - Category ID
   * @param {number} budgetData.userId - User ID
   * @returns {Promise<Object>} Created budget
   */
  static async create(budgetData) {
    const { amount, month, year, categoryId, userId } = budgetData;
    
    try {
      const result = await query(
        `INSERT INTO budgets 
         (amount, month, year, category_id, user_id) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [amount, month, year, categoryId, userId]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error creating budget:', err);
      throw err;
    }
  }

  /**
   * Update a budget
   * @param {number} id - Budget ID
   * @param {Object} budgetData - Budget data
   * @param {number} budgetData.amount - Budget amount
   * @param {number} budgetData.userId - User ID (for security)
   * @returns {Promise<Object>} Updated budget
   */
  static async update(id, budgetData) {
    const { amount, userId } = budgetData;
    
    try {
      const result = await query(
        `UPDATE budgets 
         SET amount = $1
         WHERE id = $2 AND user_id = $3 
         RETURNING *`,
        [amount, id, userId]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error updating budget:', err);
      throw err;
    }
  }

  /**
   * Delete a budget
   * @param {number} id - Budget ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      await query(
        'DELETE FROM budgets WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting budget:', err);
      throw err;
    }
  }

  /**
   * Get budget vs actual spending comparison
   * @param {number} userId - User ID
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Promise<Array>} Budget vs actual comparison
   */
  static async getBudgetComparison(userId, month, year) {
    try {
      const result = await query(
        `SELECT 
          c.id as category_id,
          c.name as category_name,
          b.amount as budget_amount,
          COALESCE(SUM(t.amount), 0) as actual_amount,
          b.amount - COALESCE(SUM(t.amount), 0) as difference
         FROM categories c
         LEFT JOIN budgets b ON c.id = b.category_id AND b.month = $2 AND b.year = $3 AND b.user_id = $1
         LEFT JOIN transactions t ON c.id = t.category_id 
           AND EXTRACT(MONTH FROM t.date) = $2 
           AND EXTRACT(YEAR FROM t.date) = $3 
           AND t.user_id = $1
           AND t.type = 'expense'
         WHERE c.user_id = $1 AND c.type = 'expense'
         GROUP BY c.id, c.name, b.amount
         ORDER BY c.name`,
        [userId, month, year]
      );
      
      return result.rows;
    } catch (err) {
      console.error('Error getting budget comparison:', err);
      throw err;
    }
  }
}

module.exports = Budget;