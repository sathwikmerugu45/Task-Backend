const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const moment = require('moment');

// @route   GET /
// @desc    Redirect to dashboard or login
// @access  Public
router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// @route   GET /dashboard
// @desc    Dashboard page
// @access  Private
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    
    // Get current month's data
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
    
    // Get recent transactions
    const recentTransactions = await Transaction.getByUser(userId, {
      limit: 5
    });
    
    // Get monthly income and expense totals
    const monthlySummary = await Transaction.getMonthlySummary(userId, currentYear);
    
    // Get category breakdown for current month
    const expenseSummary = await Transaction.getCategorySummary(
      userId, 'expense', startDate, endDate
    );
    
    const incomeSummary = await Transaction.getCategorySummary(
      userId, 'income', startDate, endDate
    );
    
    // Get budget information
    const budgetComparison = await Budget.getBudgetComparison(
      userId, currentMonth, currentYear
    );
    
    // Calculate totals
    const monthlyData = {
      income: 0,
      expense: 0,
      savings: 0
    };
    
    monthlySummary.forEach(item => {
      if (parseInt(item.month) === currentMonth) {
        if (item.type === 'income') {
          monthlyData.income += parseFloat(item.total);
        } else if (item.type === 'expense') {
          monthlyData.expense += parseFloat(item.total);
        }
      }
    });
    
    monthlyData.savings = monthlyData.income - monthlyData.expense;
    
    // Format data for charts
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const chartData = {
      labels: monthNames.slice(0, currentMonth),
      incomeData: Array(currentMonth).fill(0),
      expenseData: Array(currentMonth).fill(0)
    };
    
    monthlySummary.forEach(item => {
      const monthIndex = parseInt(item.month) - 1;
      if (item.type === 'income') {
        chartData.incomeData[monthIndex] = parseFloat(item.total);
      } else if (item.type === 'expense') {
        chartData.expenseData[monthIndex] = parseFloat(item.total);
      }
    });
    
    res.render('dashboard', {
      title: 'Dashboard',
      recentTransactions,
      monthlyData,
      chartData: JSON.stringify(chartData),
      expenseSummary,
      incomeSummary,
      budgetComparison,
      currentMonth,
      currentYear,
      moment
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard data');
    res.render('dashboard', {
      title: 'Dashboard',
      error: 'Failed to load dashboard data'
    });
  }
});

module.exports = router;