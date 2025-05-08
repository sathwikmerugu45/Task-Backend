const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { forwardAuthenticated } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET /auth/login
// @desc    Render login page
// @access  Public
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('login', { title: 'Login' });
});

// @route   GET /auth/register
// @desc    Render registration page
// @access  Public
router.get('/register', forwardAuthenticated, (req, res) => {
  res.render('register', { title: 'Register' });
});

// @route   POST /auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('password2').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('register', {
      title: 'Register',
      errors: errors.array(),
      name: req.body.name,
      email: req.body.email
    });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      return res.render('register', {
        title: 'Register',
        errors: [{ msg: 'Email is already registered' }],
        name,
        email
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Create default categories for new user
    const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
    for (const category of incomeCategories) {
      await query(
        'INSERT INTO categories (name, type, user_id) VALUES ($1, $2, $3) ON CONFLICT (name, user_id, type) DO NOTHING',
        [category, 'income', user.id]
      );
    }
    
    const expenseCategories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other Expense'];
    for (const category of expenseCategories) {
      await query(
        'INSERT INTO categories (name, type, user_id) VALUES ($1, $2, $3) ON CONFLICT (name, user_id, type) DO NOTHING',
        [category, 'expense', user.id]
      );
    }

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
});

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Login',
      errors: errors.array(),
      email: req.body.email
    });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.render('login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password' }],
        email
      });
    }

    const user = result.rows[0];

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password' }],
        email
      });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Login failed. Please try again.');
    res.redirect('/auth/login');
  }
});

// @route   GET /auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;