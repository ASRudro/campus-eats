const db = require('../config/db');

/**
 * Calculates understandable estimated wait time in minutes.
 * 
 * Formula:
 * Wait Time = Max(Prep Time of Selected Items) + (Active Orders Ahead * Kitchen Delay Factor)
 * 
 * - Kitchen Delay Factor = 3 minutes per active order ahead
 * - Active orders are those currently in 'Pending' or 'Preparing' status scheduled for today
 * 
 * @param {Array} itemPrepTimes - Array of preparation times in minutes for items in current order
 * @param {string} pickupDate - Target pickup date (YYYY-MM-DD)
 * @returns {Promise<number>} - Estimated wait time in minutes
 */
async function calculateWaitTime(itemPrepTimes = [], pickupDate = null) {
  try {
    const basePrepTime = itemPrepTimes.length > 0 ? Math.max(...itemPrepTimes) : 10;
    
    // Default to today if date not passed
    const dateToCheck = pickupDate || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(
      `SELECT COUNT(*) as active_count FROM orders 
       WHERE pickup_date = ? AND status IN ('Pending', 'Preparing')`,
      [dateToCheck]
    );

    const activeOrdersAhead = rows && rows[0] ? rows[0].active_count : 0;
    const kitchenQueueDelay = activeOrdersAhead * 3; // 3 minutes per active order ahead

    const totalEstimatedWait = basePrepTime + kitchenQueueDelay;
    return Math.max(totalEstimatedWait, basePrepTime);
  } catch (err) {
    console.error('Error calculating wait time:', err);
    return 15; // Safe default 15 minutes
  }
}

module.exports = {
  calculateWaitTime
};
