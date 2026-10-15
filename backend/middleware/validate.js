/**
 * Validation helpers and middlewares
 */

// Email regex helper
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

// Register input validation
function validateRegister(req, res, next) {
  const { name, student_id, email, password, confirm_password } = req.body;

  if (!name || !student_id || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  if (confirm_password !== undefined && password !== confirm_password) {
    return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid university email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  next();
}

// Login input validation
function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email or password.' });
  }

  next();
}

// Menu item validation (for Admin)
function validateMenuItem(req, res, next) {
  const { name, category_id, price, calories, preparation_time } = req.body;

  if (!name || !category_id || price === undefined || calories === undefined || preparation_time === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide name, category, price, calories, and prep time.' });
  }

  if (Number(price) < 0) {
    return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
  }

  if (Number(calories) < 0) {
    return res.status(400).json({ success: false, message: 'Calories cannot be negative.' });
  }

  if (Number(preparation_time) < 1) {
    return res.status(400).json({ success: false, message: 'Preparation time must be at least 1 minute.' });
  }

  next();
}

// Rating submission validation
function validateRating(req, res, next) {
  const { rating, comment } = req.body;

  const num = Number(rating);
  if (isNaN(num) || num < 1 || num > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
  }

  if (comment !== undefined && typeof comment !== 'string') {
    return res.status(400).json({ success: false, message: 'Comment must be a valid text string.' });
  }

  next();
}

module.exports = {
  isValidEmail,
  validateRegister,
  validateLogin,
  validateMenuItem,
  validateRating
};
