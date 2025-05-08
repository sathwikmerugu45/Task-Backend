const { pool } = require('./db');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// SQL queries to create tables
const createTables = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, user_id, type)
      );
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create budgets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(12,2) NOT NULL,
        month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
        year INTEGER NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(month, year, category_id, user_id)
      );
    `);

    console.log('All tables created successfully');

    // Insert default categories for demo
    await createDefaultCategories();

    console.log('Database initialization completed');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    pool.end();
  }
};

// Create default categories for new users
const createDefaultCategories = async () => {
  // Create a demo user for testing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  try {
    // Insert demo user
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['Demo User', 'demo@example.com', hashedPassword]
    );
    
    // If user was inserted, create default categories
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      // Default income categories
      const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
      for (const category of incomeCategories) {
        await pool.query(
          'INSERT INTO categories (name, type, user_id) VALUES ($1, $2, $3) ON CONFLICT (name, user_id, type) DO NOTHING',
          [category, 'income', userId]
        );
      }
      
      // Default expense categories
      const expenseCategories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other Expense'];
      for (const category of expenseCategories) {
        await pool.query(
          'INSERT INTO categories (name, type, user_id) VALUES ($1, $2, $3) ON CONFLICT (name, user_id, type) DO NOTHING',
          [category, 'expense', userId]
        );
      }
      
      console.log('Default categories created for demo user');
    }
  } catch (err) {
    console.error('Error creating default categories:', err);
  }
};

// Run the function to create tables
createTables();