/**
 * Middleware to check if user is authenticated
 */
const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
  };
  
  /**
   * Middleware to check if user is not authenticated (for login/register pages)
   */
  const forwardAuthenticated = (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    res.redirect('/dashboard');
  };
  
  module.exports = {
    ensureAuthenticated,
    forwardAuthenticated
  };