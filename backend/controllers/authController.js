const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new student account
 */
async function register(req, res) {
  try {
    const { name, student_id, email, password, phone } = req.body;

    // Check if email already exists
    const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    // Check if student ID already exists
    const [existingStudentId] = await db.query('SELECT id FROM users WHERE student_id = ?', [student_id]);
    if (existingStudentId && existingStudentId.length > 0) {
      return res.status(400).json({ success: false, message: 'Student ID already exists.' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, student_id, email, password_hash, phone, role, daily_budget, daily_calorie_limit, loyalty_points)
       VALUES (?, ?, ?, ?, ?, 'student', 300.00, 1800, 0)`,
      [name.trim(), student_id.trim().toUpperCase(), email.trim().toLowerCase(), passwordHash, phone || null]
    );

    const newUserId = result.insertId;

    // Generate JWT
    const token = jwt.sign(
      { id: newUserId, email: email.trim().toLowerCase(), role: 'student', student_id, name: name.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        student_id: student_id.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        role: 'student',
        daily_budget: 300.00,
        daily_calorie_limit: 1800,
        loyalty_points: 0
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, student_id: user.student_id, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        student_id: user.student_id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        daily_budget: Number(user.daily_budget),
        daily_calorie_limit: Number(user.daily_calorie_limit),
        loyalty_points: Number(user.loyalty_points)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}

/**
 * Get profile of authenticated user
 */
async function getMe(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, name, student_id, email, phone, role, daily_budget, daily_calorie_limit, loyalty_points, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    return res.status(200).json({
      success: true,
      user: {
        ...user,
        daily_budget: Number(user.daily_budget),
        daily_calorie_limit: Number(user.daily_calorie_limit),
        loyalty_points: Number(user.loyalty_points)
      }
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
}

/**
 * Update profile (Name, Phone, Daily Budget, Daily Calorie Goal)
 */
async function updateProfile(req, res) {
  try {
    const { name, phone, daily_budget, daily_calorie_limit } = req.body;

    if (daily_budget !== undefined && Number(daily_budget) <= 0) {
      return res.status(400).json({ success: false, message: 'Daily budget must be greater than zero.' });
    }

    if (daily_calorie_limit !== undefined && Number(daily_calorie_limit) <= 0) {
      return res.status(400).json({ success: false, message: 'Daily calorie goal must be greater than zero.' });
    }

    await db.query(
      `UPDATE users 
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           daily_budget = COALESCE(?, daily_budget),
           daily_calorie_limit = COALESCE(?, daily_calorie_limit)
       WHERE id = ?`,
      [name || null, phone || null, daily_budget || null, daily_calorie_limit || null, req.user.id]
    );

    const [rows] = await db.query(
      `SELECT id, name, student_id, email, phone, role, daily_budget, daily_calorie_limit, loyalty_points 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        ...rows[0],
        daily_budget: Number(rows[0].daily_budget),
        daily_calorie_limit: Number(rows[0].daily_calorie_limit),
        loyalty_points: Number(rows[0].loyalty_points)
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

/**
 * Get Today's Order Spending & Calorie usage for the authenticated student
 * Essential for the Guardrail Bar WOW Factor!
 */
async function getDailyUsage(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Query non-cancelled orders placed for today
    const [rows] = await db.query(
      `SELECT 
         COALESCE(SUM(subtotal), 0) as spent_today,
         COALESCE(SUM(total_calories), 0) as calories_today
       FROM orders 
       WHERE user_id = ? AND pickup_date = ? AND status != 'Cancelled'`,
      [req.user.id, today]
    );

    const spentToday = Number(rows[0].spent_today);
    const caloriesToday = Number(rows[0].calories_today);

    // Get user limits
    const [userRows] = await db.query('SELECT daily_budget, daily_calorie_limit FROM users WHERE id = ?', [req.user.id]);
    const dailyBudget = Number(userRows[0].daily_budget);
    const dailyCalorieLimit = Number(userRows[0].daily_calorie_limit);

    return res.status(200).json({
      success: true,
      data: {
        today,
        spent_today: spentToday,
        calories_today: caloriesToday,
        daily_budget: dailyBudget,
        daily_calorie_limit: dailyCalorieLimit,
        remaining_budget: Math.max(0, dailyBudget - spentToday),
        remaining_calories: Math.max(0, dailyCalorieLimit - caloriesToday)
      }
    });
  } catch (err) {
    console.error('getDailyUsage error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving daily usage.' });
  }
}

/**
 * Reset today's orders/usage for demo & viva purposes
 * Shifts today's active orders to yesterday so today starts with 0 spent & 0 calories
 */
async function resetDailyUsage(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await db.query(
      'UPDATE orders SET pickup_date = ? WHERE user_id = ? AND pickup_date = ?',
      [yesterday, req.user.id, today]
    );

    const [userRows] = await db.query('SELECT daily_budget, daily_calorie_limit FROM users WHERE id = ?', [req.user.id]);
    const dailyBudget = Number(userRows[0].daily_budget);
    const dailyCalorieLimit = Number(userRows[0].daily_calorie_limit);

    return res.status(200).json({
      success: true,
      message: "Today's daily budget and calories have been reset to 0.",
      data: {
        today,
        spent_today: 0,
        calories_today: 0,
        daily_budget: dailyBudget,
        daily_calorie_limit: dailyCalorieLimit,
        remaining_budget: dailyBudget,
        remaining_calories: dailyCalorieLimit
      }
    });
  } catch (err) {
    console.error('resetDailyUsage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset daily usage.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  getDailyUsage,
  resetDailyUsage
};

