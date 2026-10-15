const db = require("../config/db");
const { calculateWaitTime } = require("../utils/waitTimeCalculator");

/**
 * Generate unique order receipt number: CE-2026-XXXXXX
 */
function generateOrderNumber() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `CE-2026-${randomNum}`;
}

/**
 * Checkout / Place an Order
 * Strict Backend Validation for:
 * 1. Stock / Availability
 * 2. Real-time DB pricing and calorie calculations
 * 3. Daily Budget Guardrail
 * 4. Daily Calorie Limit Guardrail
 * 5. Estimated wait time calculation
 * 6. Loyalty points accrual
 */
async function createOrder(req, res) {
  try {
    const {
      items,
      pickup_date,
      pickup_time,
      special_instructions,
      payment_method,
      transaction_id,
      mobile_number,
    } = req.body;
    const userId = req.user.id;

    // 1. Basic Validations
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart cannot be empty." });
    }

    if (!pickup_time || pickup_time.trim() === "") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please select a valid pickup time.",
        });
    }

    const targetDate = pickup_date || new Date().toISOString().split("T")[0];

    // Prevent past dates
    const todayStr = new Date().toISOString().split("T")[0];
    if (targetDate < todayStr) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid pickup date. You cannot select a past date.",
        });
    }

    // 2. Fetch fresh items from database to prevent price tampering
    let calculatedSubtotal = 0;
    let calculatedTotalCalories = 0;
    const prepTimes = [];
    const verifiedItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Quantity must be at least 1." });
      }

      const [menuRows] = await db.query(
        `SELECT m.*, s.name as shop_name, s.badge as shop_badge, s.location as shop_location
         FROM menu_items m
         LEFT JOIN shops s ON m.shop_id = s.id
         WHERE m.id = ?`,
        [item.menu_item_id],
      );
      if (!menuRows || menuRows.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: `Menu item with ID ${item.menu_item_id} not found.`,
          });
      }

      const menuItem = menuRows[0];

      if (!menuItem.is_available) {
        return res.status(400).json({
          success: false,
          message: `Sorry, "${menuItem.name}" is currently sold out and unavailable.`,
        });
      }

      const unitPrice = Number(menuItem.price);
      const unitCalories = Number(menuItem.calories);

      calculatedSubtotal += unitPrice * qty;
      calculatedTotalCalories += unitCalories * qty;
      prepTimes.push(Number(menuItem.preparation_time));

      verifiedItems.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: qty,
        unit_price: unitPrice,
        calories_at_purchase: unitCalories,
        total_price: unitPrice * qty,
        shop_id: menuItem.shop_id,
        shop_name: menuItem.shop_name,
        shop_badge: menuItem.shop_badge,
        shop_location: menuItem.shop_location,
      });
    }

    // 3. WOW FACTOR: Budget & Calorie Guardrail Backend Validation
    const [userRows] = await db.query(
      "SELECT daily_budget, daily_calorie_limit FROM users WHERE id = ?",
      [userId],
    );

    if (!userRows || userRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const dailyBudget = Number(userRows[0].daily_budget);
    const dailyCalorieLimit = Number(userRows[0].daily_calorie_limit);

    // Sum existing orders for the target pickup date
    const [existingUsageRows] = await db.query(
      `SELECT 
         COALESCE(SUM(subtotal), 0) as spent_on_date,
         COALESCE(SUM(total_calories), 0) as calories_on_date
       FROM orders 
       WHERE user_id = ? AND pickup_date = ? AND status != 'Cancelled'`,
      [userId, targetDate],
    );

    const spentOnDate = Number(existingUsageRows[0].spent_on_date);
    const caloriesOnDate = Number(existingUsageRows[0].calories_on_date);

    const projectedSpending = spentOnDate + calculatedSubtotal;
    const projectedCalories = caloriesOnDate + calculatedTotalCalories;

    // Strict Guardrail Enforcement
    if (projectedSpending > dailyBudget) {
      return res.status(400).json({
        success: false,
        guardrail_error: "budget",
        message: `This order exceeds your daily spending limit. (Daily Limit: ৳${dailyBudget.toFixed(2)}, Already Ordered: ৳${spentOnDate.toFixed(2)}, This Order: ৳${calculatedSubtotal.toFixed(2)}).`,
      });
    }

    if (projectedCalories > dailyCalorieLimit) {
      return res.status(400).json({
        success: false,
        guardrail_error: "calories",
        message: `This order exceeds your daily calorie limit. (Daily Limit: ${dailyCalorieLimit} kcal, Already Ordered: ${caloriesOnDate} kcal, This Order: ${calculatedTotalCalories} kcal).`,
      });
    }

    // 4. Calculate estimated wait time
    const estimatedWaitTime = await calculateWaitTime(prepTimes, targetDate);

    // 5. Generate unique order receipt number
    const orderNumber = generateOrderNumber();

    // Determine payment details
    const selectedPayMethod = payment_method || "Cash on Pickup";
    const isOnlinePayment = ["bKash", "Nagad", "Canteen Wallet"].includes(
      selectedPayMethod,
    );
    const paymentStatus = isOnlinePayment ? "Paid" : "Pending";
    const txnId = isOnlinePayment
      ? transaction_id ||
        "TXN-" +
          (selectedPayMethod === "bKash"
            ? "BK"
            : selectedPayMethod === "Nagad"
              ? "NG"
              : "CW") +
          "-" +
          Math.floor(100000 + Math.random() * 900000)
      : null;
    const paidAt = isOnlinePayment ? new Date().toISOString() : null;

    // 6. Insert Order
    const [orderResult] = await db.query(
      `INSERT INTO orders (order_number, user_id, pickup_date, pickup_time, subtotal, total_calories, estimated_wait_time, status, special_instructions, payment_method, payment_status, transaction_id, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        targetDate,
        pickup_time,
        calculatedSubtotal,
        calculatedTotalCalories,
        estimatedWaitTime,
        special_instructions || null,
        selectedPayMethod,
        paymentStatus,
        txnId,
        paidAt,
      ],
    );

    const orderId = orderResult.insertId;

    // 7. Insert Order Items (with historical price and calorie snapshots)
    for (const vItem of verifiedItems) {
      await db.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, calories_at_purchase)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          vItem.menu_item_id,
          vItem.quantity,
          vItem.unit_price,
          vItem.calories_at_purchase,
        ],
      );
    }

    // 8. Award Loyalty Points (1 point per 50 BDT spent)
    const pointsEarned = Math.floor(calculatedSubtotal / 50);
    if (pointsEarned > 0) {
      await db.query(
        "UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?",
        [pointsEarned, userId],
      );
      await db.query(
        "INSERT INTO loyalty_transactions (user_id, points, reason) VALUES (?, ?, ?)",
        [userId, pointsEarned, `Points earned for Order ${orderNumber}`],
      );
    }

    // Return Digital Receipt Data
    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      receipt: {
        order_id: orderId,
        order_number: orderNumber,
        student_name: req.user.name,
        student_id: req.user.student_id,
        pickup_date: targetDate,
        pickup_time,
        subtotal: calculatedSubtotal,
        total_calories: calculatedTotalCalories,
        estimated_wait_time: estimatedWaitTime,
        status: "Pending",
        points_earned: pointsEarned,
        items: verifiedItems,
        payment_method: selectedPayMethod,
        payment_status: paymentStatus,
        transaction_id: txnId,
        paid_at: paidAt,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process order." });
  }
}

/**
 * Get orders for authenticated student
 */
async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    const [orders] = await db.query(
      `SELECT o.*, 
        COUNT(oi.id) as total_items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId],
    );

    // Fetch items for each order
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query(
          `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.unit_price, oi.calories_at_purchase,
                  m.name as item_name, m.image_url, m.is_available,
                  m.shop_id, s.name as shop_name, s.badge as shop_badge, s.location as shop_location
           FROM order_items oi
           JOIN menu_items m ON oi.menu_item_id = m.id
           LEFT JOIN shops s ON m.shop_id = s.id
           WHERE oi.order_id = ?`,
          [order.id],
        );
        return {
          ...order,
          subtotal: Number(order.subtotal),
          total_calories: Number(order.total_calories),
          items: items.map((i) => ({
            ...i,
            unit_price: Number(i.unit_price),
            is_available: Boolean(i.is_available),
          })),
        };
      }),
    );

    return res
      .status(200)
      .json({
        success: true,
        count: detailedOrders.length,
        data: detailedOrders,
      });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch order history." });
  }
}

/**
 * Get single order receipt / details by ID
 */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT o.*, u.name as student_name, u.student_id, u.email as student_email, u.phone as student_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? OR o.order_number = ?`,
      [id, id],
    );

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const order = orders[0];

    // Authorization check: students can only see their own order
    if (req.user.role === "student" && order.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const [items] = await db.query(
      `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.unit_price, oi.calories_at_purchase,
              m.name as item_name, m.image_url, m.is_available,
              m.shop_id, s.name as shop_name, s.badge as shop_badge, s.location as shop_location
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       LEFT JOIN shops s ON m.shop_id = s.id
       WHERE oi.order_id = ?`,
      [order.id],
    );

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        total_calories: Number(order.total_calories),
        items: items.map((i) => ({
          ...i,
          unit_price: Number(i.unit_price),
          is_available: Boolean(i.is_available),
        })),
      },
    });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch order details." });
  }
}

/**
 * Update order status (Kitchen Staff & Admin)
 * Status workflow: Pending -> Confirmed -> Preparing -> Ready -> Picked Up (or Cancelled)
 */
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Ready",
      "Picked Up",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: [${validStatuses.join(", ")}]`,
      });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      status,
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update order status." });
  }
}

/**
 * Reorder Previous Order
 * Validates available items, applies current prices and calories (no stale pricing)
 */
async function reorderItems(req, res) {
  try {
    const { id } = req.params;

    const [orderRows] = await db.query("SELECT * FROM orders WHERE id = ?", [
      id,
    ]);
    if (!orderRows || orderRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Original order not found." });
    }

    const [items] = await db.query(
      `SELECT oi.quantity, m.id as menu_item_id, m.name, m.price, m.calories, m.is_available, m.image_url
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = ?`,
      [id],
    );

    const availableItems = [];
    const unavailableItems = [];

    for (const item of items) {
      if (item.is_available) {
        availableItems.push({
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          calories: Number(item.calories),
          image_url: item.image_url,
        });
      } else {
        unavailableItems.push(item.name);
      }
    }

    if (availableItems.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "None of the items from this previous order are currently available.",
      });
    }

    let warning = null;
    if (unavailableItems.length > 0) {
      warning = `Some items are no longer available and were excluded: ${unavailableItems.join(", ")}.`;
    }

    return res.status(200).json({
      success: true,
      message: "Items loaded for reorder.",
      warning,
      items: availableItems,
    });
  } catch (err) {
    console.error("reorderItems error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reorder items." });
  }
}

/**
 * Get all active orders for Kitchen Staff
 * Sorted by pickup time priority
 */
async function getKitchenOrders(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT o.*, u.name as student_name, u.student_id, u.phone as student_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "All") {
      query += ` AND o.status = ?`;
      params.push(status);
    } else {
      // Default: Active kitchen orders
      query += ` AND o.status IN ('Pending', 'Confirmed', 'Preparing', 'Ready')`;
    }

    // Sort by pickup date and time priority
    query += ` ORDER BY o.pickup_date ASC, o.pickup_time ASC, o.created_at ASC`;

    const [orders] = await db.query(query, params);

    // Fetch items for each order
    const detailed = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query(
          `SELECT oi.quantity, m.name as item_name, m.preparation_time
           FROM order_items oi
           JOIN menu_items m ON oi.menu_item_id = m.id
           WHERE oi.order_id = ?`,
          [order.id],
        );
        return {
          ...order,
          subtotal: Number(order.subtotal),
          total_calories: Number(order.total_calories),
          items,
        };
      }),
    );

    return res
      .status(200)
      .json({ success: true, count: detailed.length, data: detailed });
  } catch (err) {
    console.error("getKitchenOrders error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch kitchen orders." });
  }
}

/**
 * Pay for an existing order (e.g., from My Orders page or post-order payment)
 */
async function payOrder(req, res) {
  try {
    const { id } = req.params;
    const { payment_method, transaction_id, mobile_number } = req.body;
    const userId = req.user.id;

    const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const order = orders[0];
    if (req.user.role === "student" && order.user_id !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const selectedMethod = payment_method || "bKash";
    const isOnline = ["bKash", "Nagad", "Canteen Wallet"].includes(
      selectedMethod,
    );
    const paymentStatus = isOnline ? "Paid" : "Pending";
    const txnId = isOnline
      ? transaction_id ||
        "TXN-" +
          (selectedMethod === "bKash"
            ? "BK"
            : selectedMethod === "Nagad"
              ? "NG"
              : "CW") +
          "-" +
          Math.floor(100000 + Math.random() * 900000)
      : null;
    const paidAt = isOnline ? new Date().toISOString() : null;

    await db.query(
      `UPDATE orders 
       SET payment_method = ?, payment_status = ?, transaction_id = ?, paid_at = ?
       WHERE id = ?`,
      [selectedMethod, paymentStatus, txnId, paidAt, id],
    );

    const message = isOnline
      ? `Payment of ৳${Number(order.subtotal).toFixed(2)} completed successfully via ${selectedMethod}!`
      : `Payment method updated to ${selectedMethod}. Pay upon delivery.`;

    return res.status(200).json({
      success: true,
      message,
      data: {
        order_id: order.id,
        payment_method: selectedMethod,
        payment_status: paymentStatus,
        transaction_id: txnId,
        paid_at: paidAt,
      },
    });
  } catch (err) {
    console.error("payOrder error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Payment processing failed." });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  reorderItems,
  getKitchenOrders,
  payOrder,
};
