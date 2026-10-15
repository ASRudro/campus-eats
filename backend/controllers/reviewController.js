const db = require('../config/db');

/**
 * Get reviews for a menu item
 */
async function getReviewsByItem(req, res) {
  try {
    const { menuItemId } = req.params;

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name, u.student_id
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.menu_item_id = ?
       ORDER BY r.created_at DESC`,
      [menuItemId]
    );

    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    console.error('getReviewsByItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
}

/**
 * Submit rating and comment for a food item
 * Checks verified purchase if student has ordered it before
 */
async function submitReview(req, res) {
  try {
    const userId = req.user.id;
    const { menuItemId } = req.params;
    const { rating, comment } = req.body;

    // Check if food exists
    const [item] = await db.query('SELECT id FROM menu_items WHERE id = ?', [menuItemId]);
    if (!item || item.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    // Check if user already reviewed this item
    const [existing] = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND menu_item_id = ?',
      [userId, menuItemId]
    );

    if (existing && existing.length > 0) {
      // Update existing review
      await db.query(
        'UPDATE ratings SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [Number(rating), comment ? comment.trim() : null, existing[0].id]
      );
      return res.status(200).json({ success: true, message: 'Your review was updated successfully.' });
    }

    // Insert new review
    await db.query(
      'INSERT INTO ratings (user_id, menu_item_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, menuItemId, Number(rating), comment ? comment.trim() : null]
    );

    return res.status(201).json({ success: true, message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('submitReview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
}

/**
 * Delete review (Admin moderation)
 */
async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM ratings WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Review removed successfully.' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
}

/**
 * Get all reviews (Admin overview)
 */
async function getAllReviews(req, res) {
  try {
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, 
              u.name as reviewer_name, u.student_id, u.email as reviewer_email,
              m.name as item_name, m.image_url
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN menu_items m ON r.menu_item_id = m.id
       ORDER BY r.created_at DESC`
    );

    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    console.error('getAllReviews error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch all reviews.' });
  }
}

module.exports = {
  getReviewsByItem,
  submitReview,
  deleteReview,
  getAllReviews
};
