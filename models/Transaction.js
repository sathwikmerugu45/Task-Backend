const { query } = require('../config/db');

class Transaction {
  /**
   * Get all transactions for a user with optional filters
   * @param {number} userId - User ID
   * @param {Object} filters - Optional filters
   * @param {string} filters.type - Transaction type (income or expense)
   * @param {number} filters.categoryId - Category ID
   * @param {string} filters.startDate - Start date (YYYY-MM-DD)
   * @param {string} filters.endDate - End date (YYYY-MM-DD)
   * @param {number} filters.limit - Limit number of results
   * @returns {Promise<Array>} Array of transactions
   */
  static async getByUser(userId, filters = {}) {
    try {
      let sql = `
        SELECT t.*, c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      `;
      
      const params = [userId];
      let paramCount = 1;
      
      if (filters.type) {
        paramCount++;
        sql += ` AND t.type = $${paramCount}`;
        params.push(filters.type);
      }
      
      if (filters.categoryId) {
        paramCount++;
        sql += ` AND t.category_id = $${paramCount}`;
        params.push(filters.categoryId);
      }
      
      if (filters.startDate) {
        paramCount++;
        sql += ` AND t.date >= $${paramCount}`;
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        paramCount++;
        sql += ` AND t.date <= $${paramCount}`;
        params.push(filters.endDate);
      }
      
      sql += ' ORDER BY t.date DESC';
      
      if (filters.limit) {
        paramCount++;
        sql += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }
      
      const result = await query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('Error getting transactions by user:', err);
      throw err;
    }
  }

  /**
   * Get a transaction by ID
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object|null>} Transaction or null
   */
  static async getById(id, userId) {
    try {
      const result = await query(
        `SELECT t.*, c.name as category_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );
      
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error getting transaction by ID:', err);
      throw err;
    }
  }

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @param {number} transactionData.amount - Transaction amount
   * @param {string} transactionData.description - Transaction description
   * @param {string} transactionData.date - Transaction date (YYYY-MM-DD)
   * @param {string} transactionData.type - Transaction type (income or expense)
   * @param {number} transactionData.categoryId - Category ID
   * @param {number} transactionData.userId - User ID
   * @returns {Promise<Object>} Created transaction
   */
  static async create(transactionData) {
    const { amount, description, date, type, categoryId, userId } = transactionData;
    
    try {
      const result = await query(
        `INSERT INTO transactions 
         (amount, description, date, type, category_id, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [amount, description, date, type, categoryId, userId]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  }

  /**
   * Update a transaction
   * @param {number} id - Transaction ID
   * @param {Object} transactionData - Transaction data
   * @param {number} transactionData.amount - Transaction amount
   * @param {string} transactionData.description - Transaction description
   * @param {string} transactionData.date - Transaction date (YYYY-MM-DD)
   * @param {number} transactionData.categoryId - Category ID
   * @param {number} transactionData.userId - User ID (for security)
   * @returns {Promise<Object>} Updated transaction
   */
  static async update(id, transactionData) {
    const { amount, description, date, categoryId, userId } = transactionData;
    
    try {
      const result = await query(
        `UPDATE transactions 
         SET amount = $1, description = $2, date = $3, category_id = $4
         WHERE id = $5 AND user_id = $6 
         RETURNING *`,
        [amount, description, date, categoryId, id, userId]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  }

  /**
   * Delete a transaction
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      await query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  }

  /**
   * Get monthly summary of transactions
   * @param {number} userId - User ID
   * @param {number} year - Year
   * @returns {Promise<Array>} Monthly summary
   */
  static async getMonthlySummary(userId, year) {
    try {
      const result = await query(
        `SELECT 
          EXTRACT(MONTH FROM date) as month,
          type,
          SUM(amount) as total
         FROM transactions
         WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
         GROUP BY EXTRACT(MONTH FROM date), type
         ORDER BY month`,
        [userId, year]
      );
      
      return result.rows;
    } catch (err) {
      console.error('Error getting monthly summary:', err);
      throw err;
    }
  }

  /**
   * Get category summary of transactions
   * @param {number} userId - User ID
   * @param {string} type - Transaction type (income or expense)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Category summary
   */
  static async getCategorySummary(userId, type, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          c.name as category_name,
          SUM(t.amount) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 
           AND t.type = $2 
           AND t.date BETWEEN $3 AND $4
         GROUP BY c.name
         ORDER BY total DESC`,
        [userId, type, startDate, endDate]
      );
      
      return result.rows;
    } catch (err) {
      console.error('Error getting category summary:', err);
      throw err;
    }
  }
}

module.exports = Transaction;