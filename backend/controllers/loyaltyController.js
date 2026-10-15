const db = require('../config/db');

/**
 * Get student's loyalty balance and transaction history
 */
async function getMyLoyalty(req, res) {
  try {
    const userId = req.user.id;

    const [userRows] = await db.query('SELECT loyalty_points FROM users WHERE id = ?', [userId]);
    const balance = userRows && userRows.length > 0 ? Number(userRows[0].loyalty_points) : 0;

    const [transactions] = await db.query(
      'SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      balance,
      transactions
    });
  } catch (err) {
    console.error('getMyLoyalty error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch loyalty details.' });
  }
}

/**
 * Get available rewards catalogue
 */
async function getRewards(req, res) {
  try {
    const [rewards] = await db.query(`
      SELECT lr.*, m.name as item_name, m.image_url
      FROM loyalty_rewards lr
      LEFT JOIN menu_items m ON lr.menu_item_id = m.id
      WHERE lr.is_active = 1
      ORDER BY lr.points_cost ASC
    `);

    return res.status(200).json({ success: true, data: rewards });
  } catch (err) {
    console.error('getRewards error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch rewards.' });
  }
}

/**
 * Redeem a loyalty reward
 */
async function redeemReward(req, res) {
  try {
    const userId = req.user.id;
    const { rewardId } = req.params;

    const [rewards] = await db.query('SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = 1', [rewardId]);
    if (!rewards || rewards.length === 0) {
      return res.status(404).json({ success: false, message: 'Reward not found or inactive.' });
    }

    const reward = rewards[0];
    const cost = Number(reward.points_cost);

    // Check user points
    const [userRows] = await db.query('SELECT loyalty_points FROM users WHERE id = ?', [userId]);
    const currentBalance = Number(userRows[0].loyalty_points);

    if (currentBalance < cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${cost} points but currently have ${currentBalance}.`
      });
    }

    // Deduct points
    await db.query('UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?', [cost, userId]);

    // Record transaction
    await db.query(
      'INSERT INTO loyalty_transactions (user_id, points, reason) VALUES (?, ?, ?)',
      [userId, -cost, `Redeemed: ${reward.title}`]
    );

    return res.status(200).json({
      success: true,
      message: `Congratulations! You redeemed "${reward.title}". Present this at the canteen counter to claim your reward.`,
      new_balance: currentBalance - cost
    });
  } catch (err) {
    console.error('redeemReward error:', err);
    return res.status(500).json({ success: false, message: 'Failed to redeem reward.' });
  }
}

/**
 * Admin: Add new reward
 */
async function createReward(req, res) {
  try {
    const { title, description, points_cost, reward_type, menu_item_id, discount_amount } = req.body;

    if (!title || !points_cost) {
      return res.status(400).json({ success: false, message: 'Title and points cost are required.' });
    }

    await db.query(
      `INSERT INTO loyalty_rewards (title, description, points_cost, reward_type, menu_item_id, discount_amount, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [title.trim(), description || '', points_cost, reward_type || 'free_item', menu_item_id || null, discount_amount || 0]
    );

    return res.status(201).json({ success: true, message: 'Reward created successfully.' });
  } catch (err) {
    console.error('createReward error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create reward.' });
  }
}

module.exports = {
  getMyLoyalty,
  getRewards,
  redeemReward,
  createReward
};
