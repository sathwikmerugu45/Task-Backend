const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { check, validationResult } = require('express-validator');
const moment = require('moment');

// @route   GET /budgets
// @desc    Budgets list page
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get month and year from query or use current month
    const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    // Fetch budgets for the user for the specified month and year
    const budgets = await Budget.find({ user: userId, month, year }).populate('category');

    res.render('budgets', {
      budgets,
      month,
      year,
      moment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /budgets
// @desc    Add a new budget
// @access  Private
router.post(
  '/',
  ensureAuthenticated,
  [
    check('amount', 'Amount is required').notEmpty(),
    check('category', 'Category is required').notEmpty(),
    check('month', 'Month is required').isInt({ min: 1, max: 12 }),
    check('year', 'Year is required').isInt({ min: 2000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, month, year } = req.body;

    try {
      const userId = req.session.user.id;

      const newBudget = new Budget({
        user: userId,
        amount,
        category,
        month,
        year,
      });

      await newBudget.save();
      res.redirect('/budgets');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE /budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ msg: 'Budget not found' });
    }

    // Ensure the budget belongs to the logged-in user
    if (budget.user.toString() !== req.session.user.id) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    await budget.remove();
    res.redirect('/budgets');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;