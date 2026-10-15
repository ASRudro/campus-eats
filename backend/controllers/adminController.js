const db = require('../config/db');

/**
 * Get Admin Dashboard Overview KPIs
 * Non-hardcoded, dynamically computed from database records
 */
async function getDashboardKPIs(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Today's Sales & Orders
    const [todayStats] = await db.query(
      `SELECT 
         COALESCE(SUM(subtotal), 0) as today_sales,
         COUNT(id) as today_orders
       FROM orders 
       WHERE pickup_date = ? AND status != 'Cancelled'`,
      [today]
    );

    // 2. Active Orders
    const [activeStats] = await db.query(
      `SELECT COUNT(id) as active_orders 
       FROM orders 
       WHERE status IN ('Pending', 'Confirmed', 'Preparing', 'Ready')`
    );

    // 3. Total Students
    const [studentStats] = await db.query(
      `SELECT COUNT(id) as total_students 
       FROM users 
       WHERE role = 'student'`
    );

    // 4. Lifetime Sales & Total Completed Orders for AOV
    const [lifetimeStats] = await db.query(
      `SELECT 
         COALESCE(SUM(subtotal), 0) as total_revenue,
         COUNT(id) as total_orders
       FROM orders 
       WHERE status != 'Cancelled'`
    );

    const totalRevenue = Number(lifetimeStats[0].total_revenue);
    const totalOrders = Number(lifetimeStats[0].total_orders);
    const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return res.status(200).json({
      success: true,
      data: {
        today_sales: Number(todayStats[0].today_sales),
        today_orders: Number(todayStats[0].today_orders),
        active_orders: Number(activeStats[0].active_orders),
        total_students: Number(studentStats[0].total_students),
        average_order_value: Number(aov.toFixed(2)),
        total_revenue: totalRevenue,
        total_orders: totalOrders
      }
    });
  } catch (err) {
    console.error('getDashboardKPIs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute dashboard KPIs.' });
  }
}

/**
 * Get Sales Breakdown (Sales by Day)
 */
async function getSalesAnalytics(req, res) {
  try {
    const [dailySales] = await db.query(
      `SELECT 
         pickup_date as order_day,
         COALESCE(SUM(subtotal), 0) as total_sales,
         COUNT(id) as order_count
       FROM orders
       WHERE status != 'Cancelled'
       GROUP BY pickup_date
       ORDER BY pickup_date DESC
       LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      data: dailySales.map(d => ({
        day: d.order_day,
        sales: Number(d.total_sales),
        orders: Number(d.order_count)
      })).reverse()
    });
  } catch (err) {
    console.error('getSalesAnalytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch sales analytics.' });
  }
}

/**
 * Get Peak Order Pickup Times
 */
async function getPeakOrderTimes(req, res) {
  try {
    const [peakTimes] = await db.query(
      `SELECT 
         pickup_time,
         COUNT(id) as total_orders
       FROM orders
       WHERE status != 'Cancelled'
       GROUP BY pickup_time
       ORDER BY total_orders DESC`
    );

    return res.status(200).json({
      success: true,
      data: peakTimes.map(p => ({
        time: p.pickup_time,
        orders: Number(p.total_orders)
      }))
    });
  } catch (err) {
    console.error('getPeakOrderTimes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute peak times.' });
  }
}

/**
 * Get Best-Selling Items
 * Aggregates SUM(quantity) from order_items
 */
async function getBestSellingItems(req, res) {
  try {
    const [items] = await db.query(
      `SELECT 
         m.id, m.name, m.price, m.image_url,
         c.name as category_name,
         COALESCE(SUM(oi.quantity), 0) as total_sold,
         COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
       FROM menu_items m
       JOIN categories c ON m.category_id = c.id
       JOIN order_items oi ON m.id = oi.menu_item_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'Cancelled'
       GROUP BY m.id
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      data: items.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category_name,
        price: Number(i.price),
        image_url: i.image_url,
        total_sold: Number(i.total_sold),
        total_revenue: Number(i.total_revenue)
      }))
    });
  } catch (err) {
    console.error('getBestSellingItems error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch best-selling items.' });
  }
}

/**
 * Get all users for admin management
 */
async function getAllUsers(req, res) {
  try {
    const [users] = await db.query(
      `SELECT id, name, student_id, email, phone, role, daily_budget, daily_calorie_limit, loyalty_points, created_at
       FROM users ORDER BY role ASC, name ASC`
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(u => ({
        ...u,
        daily_budget: Number(u.daily_budget),
        daily_calorie_limit: Number(u.daily_calorie_limit),
        loyalty_points: Number(u.loyalty_points)
      }))
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
}

/**
 * Change user role (Admin only)
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['student', 'kitchen', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return res.status(200).json({ success: true, message: `User role updated to ${role}.` });
  } catch (err) {
    console.error('updateUserRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
}

/**
 * Get all orders across the campus (Admin view)
 */
async function getAllOrders(req, res) {
  try {
    const { status, date } = req.query;

    let query = `
      SELECT o.*, u.name as student_name, u.student_id, u.email as student_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND o.pickup_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [orders] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(o => ({
        ...o,
        subtotal: Number(o.subtotal),
        total_calories: Number(o.total_calories)
      }))
    });
  } catch (err) {
    console.error('getAllOrders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch all orders.' });
  }
}

module.exports = {
  getDashboardKPIs,
  getSalesAnalytics,
  getPeakOrderTimes,
  getBestSellingItems,
  getAllUsers,
  updateUserRole,
  getAllOrders
};
