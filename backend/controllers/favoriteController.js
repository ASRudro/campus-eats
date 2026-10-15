const db = require('../config/db');

/**
 * Get all favorited items for the student
 */
async function getFavorites(req, res) {
  try {
    const userId = req.user.id;

    const [favorites] = await db.query(
      `SELECT m.*, c.name as category_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
       FROM favorites f
       JOIN menu_items m ON f.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       LEFT JOIN ratings r ON m.id = r.menu_item_id
       WHERE f.user_id = ?
       GROUP BY m.id
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const formatted = favorites.map(item => ({
      ...item,
      price: Number(item.price),
      calories: Number(item.calories),
      preparation_time: Number(item.preparation_time),
      is_available: Boolean(item.is_available),
      is_special: Boolean(item.is_special),
      is_combo: Boolean(item.is_combo),
      average_rating: Number(Number(item.average_rating).toFixed(1)),
      review_count: Number(item.review_count)
    }));

    return res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('getFavorites error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch favorites.' });
  }
}

/**
 * Add or remove favorite
 */
async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { menuItemId } = req.params;

    const [existing] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND menu_item_id = ?',
      [userId, menuItemId]
    );

    if (existing && existing.length > 0) {
      // Remove
      await db.query('DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?', [userId, menuItemId]);
      return res.status(200).json({ success: true, is_favorite: false, message: 'Removed from favorites.' });
    } else {
      // Add
      await db.query('INSERT INTO favorites (user_id, menu_item_id) VALUES (?, ?)', [userId, menuItemId]);
      return res.status(200).json({ success: true, is_favorite: true, message: 'Added to favorites.' });
    }
  } catch (err) {
    console.error('toggleFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update favorites.' });
  }
}

/**
 * Get array of favorite item IDs for quick client-side lookup
 */
async function getFavoriteIds(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await db.query('SELECT menu_item_id FROM favorites WHERE user_id = ?', [userId]);
    const ids = rows.map(r => r.menu_item_id);
    return res.status(200).json({ success: true, ids });
  } catch (err) {
    console.error('getFavoriteIds error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch favorite IDs.' });
  }
}

module.exports = {
  getFavorites,
  toggleFavorite,
  getFavoriteIds
};
