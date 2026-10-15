const db = require('../config/db');

/**
 * Get weekly scheduled lunches for authenticated student
 */
async function getWeeklySchedule(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT ws.id, ws.day_of_week, ws.quantity, ws.pickup_time, ws.created_at,
              m.id as menu_item_id, m.name as item_name, m.price, m.calories, m.image_url, m.is_available, m.shop_id,
              c.name as category_name,
              s.name as shop_name, s.badge as shop_badge, s.location as shop_location
       FROM weekly_schedules ws
       JOIN menu_items m ON ws.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       LEFT JOIN shops s ON m.shop_id = s.id
       WHERE ws.user_id = ?
       ORDER BY 
         CASE ws.day_of_week
           WHEN 'Saturday' THEN 1
           WHEN 'Sunday' THEN 2
           WHEN 'Monday' THEN 3
           WHEN 'Tuesday' THEN 4
           WHEN 'Wednesday' THEN 5
           ELSE 6
         END, ws.id ASC`,
      [userId]
    );

    // Group items by day of the week
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    const scheduleByDay = {};
    days.forEach(day => {
      scheduleByDay[day] = [];
    });

    rows.forEach(item => {
      if (scheduleByDay[item.day_of_week]) {
        scheduleByDay[item.day_of_week].push({
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: item.item_name,
          price: Number(item.price),
          calories: Number(item.calories),
          image_url: item.image_url,
          is_available: Boolean(item.is_available),
          quantity: item.quantity,
          pickup_time: item.pickup_time,
          category_name: item.category_name,
          shop_id: item.shop_id,
          shop_name: item.shop_name,
          shop_badge: item.shop_badge,
          shop_location: item.shop_location
        });
      }
    });

    return res.status(200).json({ success: true, data: scheduleByDay, raw: rows });
  } catch (err) {
    console.error('getWeeklySchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch weekly schedule.' });
  }
}

/**
 * Add or update meal in weekly schedule
 */
async function setScheduleItem(req, res) {
  try {
    const userId = req.user.id;
    const { day_of_week, menu_item_id, quantity, pickup_time } = req.body;

    const validDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    if (!validDays.includes(day_of_week)) {
      return res.status(400).json({ success: false, message: 'Day must be Saturday through Wednesday.' });
    }

    if (!menu_item_id || !pickup_time) {
      return res.status(400).json({ success: false, message: 'Please select a food item and pickup time.' });
    }

    const qty = parseInt(quantity) || 1;

    // Check if food exists
    const [item] = await db.query('SELECT id, name FROM menu_items WHERE id = ?', [menu_item_id]);
    if (!item || item.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    // Check if already in that day
    const [existing] = await db.query(
      'SELECT id FROM weekly_schedules WHERE user_id = ? AND day_of_week = ? AND menu_item_id = ?',
      [userId, day_of_week, menu_item_id]
    );

    if (existing && existing.length > 0) {
      await db.query(
        'UPDATE weekly_schedules SET quantity = ?, pickup_time = ? WHERE id = ?',
        [qty, pickup_time, existing[0].id]
      );
      return res.status(200).json({ success: true, message: `Updated ${day_of_week} meal schedule.` });
    } else {
      await db.query(
        'INSERT INTO weekly_schedules (user_id, day_of_week, menu_item_id, quantity, pickup_time) VALUES (?, ?, ?, ?, ?)',
        [userId, day_of_week, menu_item_id, qty, pickup_time]
      );
      return res.status(201).json({ success: true, message: `Added to ${day_of_week} schedule.` });
    }
  } catch (err) {
    console.error('setScheduleItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update schedule.' });
  }
}

/**
 * Remove an item from the weekly schedule
 */
async function removeScheduleItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query('DELETE FROM weekly_schedules WHERE id = ? AND user_id = ?', [id, userId]);
    return res.status(200).json({ success: true, message: 'Item removed from schedule.' });
  } catch (err) {
    console.error('removeScheduleItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove schedule item.' });
  }
}

module.exports = {
  getWeeklySchedule,
  setScheduleItem,
  removeScheduleItem
};
