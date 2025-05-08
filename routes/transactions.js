const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { check, validationResult } = require('express-validator');
const moment = require('moment');

// @route   GET /transactions
// @desc    Transactions list page
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Parse query parameters for filtering
    const type = req.query.type;
    const categoryId = req.query.category ? parseInt(req.query.category) : null;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    // Get transactions with filters
    const transactions = await Transaction.getByUser(userId, {
      type,
      categoryId,
      startDate,
      endDate
    });
    
    // Get categories for the filter dropdown
    const incomeCategories = await Category.getByUser(userId, 'income');
    const expenseCategories = await Category.getByUser(userId, 'expense');
    
    res.render('transactions/index', {
      title: 'Transactions',
      transactions,
      incomeCategories,
      expenseCategories,
      filters: {
        type,
        categoryId,
        startDate,
        endDate
      },
      moment
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading transactions');
    res.redirect('/dashboard');
  }
});

// @route   GET /transactions/add
// @desc    Add transaction form
// @access  Private
router.get('/add', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const incomeCategories = await Category.getByUser(userId, 'income');
    const expenseCategories = await Category.getByUser(userId, 'expense');
    
    // Default type from query parameter or default to expense
    const type = ['income', 'expense'].includes(req.query.type) ? req.query.type : 'expense';
    
    res.render('transactions/add', {
      title: 'Add Transaction',
      incomeCategories,
      expenseCategories,
      defaultType: type,
      transaction: {
        date: moment().format('YYYY-MM-DD')
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading transaction form');
    res.redirect('/transactions');
  }
});

// @route   POST /transactions
// @desc    Create transaction
// @access  Private
router.post('/', [
  ensureAuthenticated,
  check('amount', 'Amount is required').notEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  check('description', 'Description is required').notEmpty(),
  check('date', 'Date is required').notEmpty(),
  check('date', 'Date must be valid').isDate(),
  check('type', 'Type must be either income or expense').isIn(['income', 'expense']),
  check('category', 'Category is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    try {
      const userId = req.session.user.id;
      
      const incomeCategories = await Category.getByUser(userId, 'income');
      const expenseCategories = await Category.getByUser(userId, 'expense');
      
      return res.render('transactions/add', {
        title: 'Add Transaction',
        incomeCategories,
        expenseCategories,
        errors: errors.array(),
        transaction: req.body,
        defaultType: req.body.type
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading transaction form');
      return res.redirect('/transactions');
    }
  }

  try {
    const userId = req.session.user.id;
    
    // Create transaction
    await Transaction.create({
      amount: req.body.amount,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      categoryId: req.body.category,
      userId
    });
    
    req.flash('success_msg', 'Transaction added successfully');
    res.redirect('/transactions');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating transaction');
    res.redirect('/transactions/add');
  }
});

// @route   GET /transactions/:id/edit
// @desc    Edit transaction form
// @access  Private
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const transactionId = req.params.id;
    
    const transaction = await Transaction.getById(transactionId, userId);
    
    if (!transaction) {
      req.flash('error_msg', 'Transaction not found');
      return res.redirect('/transactions');
    }
    
    const incomeCategories = await Category.getByUser(userId, 'income');
    const expenseCategories = await Category.getByUser(userId, 'expense');
    
    res.render('transactions/edit', {
      title: 'Edit Transaction',
      transaction,
      incomeCategories,
      expenseCategories,
      defaultType: transaction.type
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading transaction form');
    res.redirect('/transactions');
  }
});

// @route   PUT /transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', [
  ensureAuthenticated,
  check('amount', 'Amount is required').notEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  check('description', 'Description is required').notEmpty(),
  check('date', 'Date is required').notEmpty(),
  check('date', 'Date must be valid').isDate(),
  check('category', 'Category is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    try {
      const userId = req.session.user.id;
      
      const incomeCategories = await Category.getByUser(userId, 'income');
      const expenseCategories = await Category.getByUser(userId, 'expense');
      
      return res.render('transactions/edit', {
        title: 'Edit Transaction',
        incomeCategories,
        expenseCategories,
        errors: errors.array(),
        transaction: {
          id: req.params.id,
          ...req.body
        },
        defaultType: req.body.type
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading transaction form');
      return res.redirect('/transactions');
    }
  }

  try {
    const userId = req.session.user.id;
    const transactionId = req.params.id;
    
    // Get the transaction to check if it exists and belongs to the user
    const existingTransaction = await Transaction.getById(transactionId, userId);
    
    if (!existingTransaction) {
      req.flash('error_msg', 'Transaction not found');
      return res.redirect('/transactions');
    }
    
    // Update transaction
    await Transaction.update(transactionId, {
      amount: req.body.amount,
      description: req.body.description,
      date: req.body.date,
      categoryId: req.body.category,
      userId
    });
    
    req.flash('success_msg', 'Transaction updated successfully');
    res.redirect('/transactions');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating transaction');
    res.redirect(`/transactions/${req.params.id}/edit`);
  }
});

// @route   DELETE /transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const transactionId = req.params.id;
    
    // Get the transaction to check if it exists and belongs to the user
    const existingTransaction = await Transaction.getById(transactionId, userId);
    
    if (!existingTransaction) {
      req.flash('error_msg', 'Transaction not found');
      return res.redirect('/transactions');
    }
    
    // Delete transaction
    await Transaction.delete(transactionId, userId);
    
    req.flash('success_msg', 'Transaction deleted successfully');
    res.redirect('/transactions');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting transaction');
    res.redirect('/transactions');
  }
});

module.exports = router;