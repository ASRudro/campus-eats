const db = require('../config/db');

/**
 * Generate 6-char unique group code: GRP-XXXXX
 */
function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GRP-${code}`;
}

/**
 * Create a new group order session
 */
async function createGroup(req, res) {
  try {
    const userId = req.user.id;
    const { title, pickup_date, pickup_time } = req.body;

    if (!pickup_time) {
      return res.status(400).json({ success: false, message: 'Please specify a pickup time for the group.' });
    }

    const targetDate = pickup_date || new Date().toISOString().split('T')[0];
    const groupCode = generateGroupCode();

    const [result] = await db.query(
      `INSERT INTO group_orders (group_code, creator_user_id, title, pickup_date, pickup_time, status)
       VALUES (?, ?, ?, ?, ?, 'Open')`,
      [groupCode, userId, title || 'Lunch Group', targetDate, pickup_time]
    );

    return res.status(201).json({
      success: true,
      message: 'Group order created successfully.',
      group_id: result.insertId,
      group_code: groupCode
    });
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create group order.' });
  }
}

/**
 * Join an existing group order using code
 */
async function joinGroup(req, res) {
  try {
    const { group_code } = req.body;

    if (!group_code || group_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a group code.' });
    }

    const [groups] = await db.query(
      'SELECT * FROM group_orders WHERE group_code = ?',
      [group_code.trim().toUpperCase()]
    );

    if (!groups || groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group order not found. Please verify the code.' });
    }

    const group = groups[0];

    if (group.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'This group order is already finalized or closed.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Joined group successfully.',
      group_id: group.id,
      group_code: group.group_code
    });
  } catch (err) {
    console.error('joinGroup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to join group.' });
  }
}

/**
 * Get group details including all members' items and individual subtotals
 */
async function getGroupDetails(req, res) {
  try {
    const { id } = req.params;

    const [groups] = await db.query(
      `SELECT g.*, u.name as creator_name, u.student_id as creator_student_id
       FROM group_orders g
       JOIN users u ON g.creator_user_id = u.id
       WHERE g.id = ? OR g.group_code = ?`,
      [id, id]
    );

    if (!groups || groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group order not found.' });
    }

    const group = groups[0];

    // Fetch items with user, menu and shop details
    const [items] = await db.query(
      `SELECT goi.*, u.name as member_name, u.student_id as member_student_id,
              m.name as item_name, m.image_url, m.preparation_time,
              m.shop_id, s.name as shop_name, s.badge as shop_badge, s.location as shop_location
       FROM group_order_items goi
       JOIN users u ON goi.user_id = u.id
       JOIN menu_items m ON goi.menu_item_id = m.id
       LEFT JOIN shops s ON m.shop_id = s.id
       WHERE goi.group_order_id = ?
       ORDER BY goi.user_id ASC, goi.id ASC`,
      [group.id]
    );

    // Fetch existing contributions for this group
    const [contributions] = await db.query(
      'SELECT * FROM group_order_contributions WHERE group_order_id = ?',
      [group.id]
    );

    const contribMap = {};
    let totalCollected = 0;
    contributions.forEach(c => {
      contribMap[c.user_id] = c;
      if (c.payment_status === 'Paid') {
        totalCollected += Number(c.amount);
      }
    });

    // Group items by member
    const membersMap = {};
    let combinedTotal = 0;
    let combinedCalories = 0;

    items.forEach(item => {
      const uId = item.user_id;
      if (!membersMap[uId]) {
        const c = contribMap[uId];
        membersMap[uId] = {
          user_id: uId,
          name: item.member_name,
          student_id: item.member_student_id,
          subtotal: 0,
          contributed_amount: c ? Number(c.amount) : 0,
          total_calories: 0,
          payment_status: c && c.payment_status ? c.payment_status : 'Pending',
          payment_method: c ? c.payment_method : null,
          transaction_id: c ? c.transaction_id : null,
          paid_at: c ? c.paid_at : null,
          items: []
        };
      }

      const itemTotal = Number(item.unit_price) * item.quantity;
      const itemCals = Number(item.calories) * item.quantity;

      membersMap[uId].subtotal += itemTotal;
      membersMap[uId].total_calories += itemCals;
      combinedTotal += itemTotal;
      combinedCalories += itemCals;

      membersMap[uId].items.push({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.item_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        calories: Number(item.calories),
        image_url: item.image_url,
        shop_id: item.shop_id,
        shop_name: item.shop_name,
        shop_badge: item.shop_badge,
        shop_location: item.shop_location
      });
    });

    // Also include any user who contributed even if they haven't picked specific items yet
    for (const uId of Object.keys(contribMap)) {
      if (!membersMap[uId]) {
        const c = contribMap[uId];
        const [uRows] = await db.query('SELECT name, student_id FROM users WHERE id = ?', [uId]);
        const userName = uRows && uRows[0] ? uRows[0].name : `Member #${uId}`;
        const userSid = uRows && uRows[0] ? uRows[0].student_id : '';
        membersMap[uId] = {
          user_id: Number(uId),
          name: userName,
          student_id: userSid,
          subtotal: 0,
          contributed_amount: Number(c.amount) || 0,
          total_calories: 0,
          payment_status: c.payment_status || 'Paid',
          payment_method: c.payment_method,
          transaction_id: c.transaction_id,
          paid_at: c.paid_at,
          items: []
        };
      }
    }

    const percentPaid = combinedTotal > 0 ? Math.min(100, Math.round((totalCollected / combinedTotal) * 100)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...group,
        is_creator: group.creator_user_id === req.user.id,
        combined_total: combinedTotal,
        combined_calories: combinedCalories,
        total_collected: totalCollected,
        remaining_to_collect: Math.max(0, combinedTotal - totalCollected),
        contribution_percent: percentPaid,
        members: Object.values(membersMap)
      }
    });

  } catch (err) {
    console.error('getGroupDetails error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch group details.' });
  }
}

/**
 * Add food item to group order for the calling member
 * Checks calling student's PERSONAL budget & calorie limits
 */
async function addGroupItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { menu_item_id, quantity } = req.body;

    const [groups] = await db.query('SELECT * FROM group_orders WHERE id = ?', [id]);
    if (!groups || groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group order not found.' });
    }

    const group = groups[0];
    if (group.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'Group order is already finalized.' });
    }

    // Get menu item
    const [menuRows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [menu_item_id]);
    if (!menuRows || menuRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    const menuItem = menuRows[0];
    if (!menuItem.is_available) {
      return res.status(400).json({ success: false, message: `"${menuItem.name}" is currently unavailable.` });
    }

    const qty = parseInt(quantity) || 1;
    const unitPrice = Number(menuItem.price);
    const unitCalories = Number(menuItem.calories);
    const itemSubtotal = unitPrice * qty;
    const itemCalories = unitCalories * qty;

    // WOW FACTOR: Check member's PERSONAL budget & calorie limits
    const [userRows] = await db.query('SELECT daily_budget, daily_calorie_limit FROM users WHERE id = ?', [userId]);
    const dailyBudget = Number(userRows[0].daily_budget);
    const dailyCalorieLimit = Number(userRows[0].daily_calorie_limit);

    // Sum member's existing orders today + other group items in this group
    const [userOrdersToday] = await db.query(
      `SELECT COALESCE(SUM(subtotal), 0) as spent, COALESCE(SUM(total_calories), 0) as cals
       FROM orders WHERE user_id = ? AND pickup_date = ? AND status != 'Cancelled'`,
      [userId, group.pickup_date]
    );

    const [existingGroupItems] = await db.query(
      `SELECT COALESCE(SUM(unit_price * quantity), 0) as group_spent,
              COALESCE(SUM(calories * quantity), 0) as group_cals
       FROM group_order_items WHERE group_order_id = ? AND user_id = ?`,
      [group.id, userId]
    );

    const totalMemberSpent = Number(userOrdersToday[0].spent) + Number(existingGroupItems[0].group_spent) + itemSubtotal;
    const totalMemberCals = Number(userOrdersToday[0].cals) + Number(existingGroupItems[0].group_cals) + itemCalories;

    if (totalMemberSpent > dailyBudget) {
      return res.status(400).json({
        success: false,
        message: `Adding this item would exceed your personal daily budget of ৳${dailyBudget}.`
      });
    }

    if (totalMemberCals > dailyCalorieLimit) {
      return res.status(400).json({
        success: false,
        message: `Adding this item would exceed your personal daily calorie limit of ${dailyCalorieLimit} kcal.`
      });
    }

    // Insert into group order items
    await db.query(
      `INSERT INTO group_order_items (group_order_id, user_id, menu_item_id, quantity, unit_price, calories)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [group.id, userId, menuItem.id, qty, unitPrice, unitCalories]
    );

    return res.status(201).json({ success: true, message: `Added ${menuItem.name} to group order.` });
  } catch (err) {
    console.error('addGroupItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add item to group.' });
  }
}

/**
 * Remove an item from the group order
 */
async function removeGroupItem(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Only creator or item owner can remove
    const [items] = await db.query(
      `SELECT goi.*, g.creator_user_id
       FROM group_order_items goi
       JOIN group_orders g ON goi.group_order_id = g.id
       WHERE goi.id = ?`,
      [itemId]
    );

    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = items[0];
    if (item.user_id !== userId && item.creator_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only remove your own items.' });
    }

    await db.query('DELETE FROM group_order_items WHERE id = ?', [itemId]);
    return res.status(200).json({ success: true, message: 'Item removed from group order.' });
  } catch (err) {
    console.error('removeGroupItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
}

/**
 * Pay / Contribute individual share in a group order
 * Supports bKash, Nagad, Canteen Wallet, or Cash at Pickup
 */
async function contributePayment(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { payment_method, transaction_id, amount } = req.body;

    // Check group
    const [groups] = await db.query('SELECT * FROM group_orders WHERE id = ?', [id]);
    if (!groups || groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group order not found.' });
    }

    const group = groups[0];
    if (group.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'Cannot contribute to a finalized or closed group.' });
    }

    // Calculate this member's total share from items (if any)
    const [memberItems] = await db.query(
      `SELECT COALESCE(SUM(unit_price * quantity), 0) as share_amount
       FROM group_order_items WHERE group_order_id = ? AND user_id = ?`,
      [group.id, userId]
    );

    const memberSubtotal = Number(memberItems[0].share_amount);

    // If custom amount provided, use it. Otherwise fallback to memberSubtotal
    let shareAmount = 0;
    if (amount !== undefined && amount !== null && amount !== '') {
      shareAmount = parseFloat(amount);
    } else {
      shareAmount = memberSubtotal;
    }

    if (isNaN(shareAmount) || shareAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid contribution amount greater than ৳0.'
      });
    }

    const method = payment_method || 'bKash';
    const txn = transaction_id || `TRX-${Date.now().toString().slice(-6)}`;

    // Upsert contribution
    const [existing] = await db.query(
      'SELECT id FROM group_order_contributions WHERE group_order_id = ? AND user_id = ?',
      [group.id, userId]
    );

    if (existing && existing.length > 0) {
      await db.query(
        `UPDATE group_order_contributions
         SET amount = ?, payment_status = 'Paid', payment_method = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [shareAmount, method, txn, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO group_order_contributions (group_order_id, user_id, amount, payment_status, payment_method, transaction_id, paid_at)
         VALUES (?, ?, ?, 'Paid', ?, ?, CURRENT_TIMESTAMP)`,
        [group.id, userId, shareAmount, method, txn]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Successfully contributed ৳${shareAmount.toFixed(2)} via ${method}!`,
      share_amount: shareAmount,
      payment_method: method,
      transaction_id: txn
    });
  } catch (err) {
    console.error('contributePayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record payment contribution.' });
  }
}

/**
 * Finalize group order (Creator only)
 * Converts group items into real canteen orders
 */
async function finalizeGroup(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [groups] = await db.query('SELECT * FROM group_orders WHERE id = ?', [id]);
    if (!groups || groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group order not found.' });
    }

    const group = groups[0];
    if (group.creator_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Only the group creator can finalize the order.' });
    }

    if (group.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'This group is already finalized.' });
    }

    // Get all items in this group
    const [items] = await db.query('SELECT * FROM group_order_items WHERE group_order_id = ?', [group.id]);
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Group order has no items to finalize.' });
    }

    // Get contributions summary
    const [contribs] = await db.query(
      `SELECT goc.*, u.name as member_name
       FROM group_order_contributions goc
       JOIN users u ON goc.user_id = u.id
       WHERE goc.group_order_id = ?`,
      [group.id]
    );

    const splitSummary = contribs.map(c => `${c.member_name}: ৳${Number(c.amount).toFixed(0)} (${c.payment_method})`).join(', ');

    // Mark group as Finalized
    await db.query('UPDATE group_orders SET status = "Finalized" WHERE id = ?', [group.id]);

    // Create an order for the group
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `CE-GRP-${randomNum}`;

    let totalSubtotal = 0;
    let totalCalories = 0;
    items.forEach(i => {
      totalSubtotal += Number(i.unit_price) * i.quantity;
      totalCalories += Number(i.calories) * i.quantity;
    });

    const instructions = `Group Order (${group.group_code})${splitSummary ? ` | Split: ${splitSummary}` : ''}`;

    const totalCollected = contribs.reduce((acc, c) => acc + Number(c.amount), 0);
    const isFullPaid = totalCollected >= totalSubtotal && totalSubtotal > 0;
    const paymentStatus = isFullPaid ? 'Paid' : 'Pending';
    const paymentMethod = contribs.length > 1 ? 'Group Split' : (contribs.length === 1 ? contribs[0].payment_method : 'Cash on Delivery');
    const transactionId = `GRP-TXN-${randomNum}`;
    const paidAt = isFullPaid ? new Date().toISOString() : null;

    const [orderRes] = await db.query(
      `INSERT INTO orders (order_number, user_id, pickup_date, pickup_time, subtotal, total_calories, estimated_wait_time, status, special_instructions, payment_method, payment_status, transaction_id, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, 15, 'Pending', ?, ?, ?, ?, ?)`,
      [orderNumber, userId, group.pickup_date, group.pickup_time, totalSubtotal, totalCalories, instructions, paymentMethod, paymentStatus, transactionId, paidAt]
    );


    const orderId = orderRes.insertId;

    for (const i of items) {
      await db.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, calories_at_purchase)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, i.menu_item_id, i.quantity, i.unit_price, i.calories]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Group order finalized successfully! Kitchen has received the order.',
      order_number: orderNumber
    });
  } catch (err) {
    console.error('finalizeGroup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to finalize group order.' });
  }
}

module.exports = {
  createGroup,
  joinGroup,
  getGroupDetails,
  addGroupItem,
  removeGroupItem,
  contributePayment,
  finalizeGroup
};

