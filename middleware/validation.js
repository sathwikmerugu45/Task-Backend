const { check } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('password2').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

/**
 * Validation rules for transaction creation/update
 */
const transactionValidation = [
  check('amount', 'Amount is required').notEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  check('description', 'Description is required').notEmpty(),
  check('date', 'Date is required').notEmpty(),
  check('date', 'Date must be valid').isDate(),
  check('type', 'Type must be either income or expense').isIn(['income', 'expense']),
  check('category', 'Category is required').notEmpty()
];

/**
 * Validation rules for transaction update (doesn't check type)
 */
const transactionUpdateValidation = [
  check('amount', 'Amount is required').notEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  check('description', 'Description is required').notEmpty(),
  check('date', 'Date is required').notEmpty(),
  check('date', 'Date must be valid').isDate(),
  check('category', 'Category is required').notEmpty()
];

/**
 * Validation rules for category creation/update
 */
const categoryValidation = [
  check('name', 'Name is required').notEmpty(),
  check('type', 'Type must be either income or expense').isIn(['income', 'expense'])
];

/**
 * Validation rules for budget creation
 */
const budgetValidation = [
  check('amount', 'Amount is required').notEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  check('month', 'Month is required').isInt({ min: 1, max: 12 }),
  check('year', 'Year is required').isInt({ min: 2000 }),
  check('category', 'Category is required').notEmpty()
];

module.exports = {
  registerValidation,
  loginValidation,
  transactionValidation,
  transactionUpdateValidation,
  categoryValidation,
  budgetValidation
};