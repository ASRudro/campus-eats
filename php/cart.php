<?php
$pageTitle = "Shopping Cart & Checkout – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

// Handle Order Placement
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['place_order'])) {
    requireLogin();

    $userId = (int)$_SESSION['user']['id'];
    $pickupDate = date('Y-m-d');
    $pickupTime = trim($_POST['pickup_time'] ?? '12:30 PM');
    $paymentMethod = trim($_POST['payment_method'] ?? 'Cash on Pickup');
    $specialInstructions = trim($_POST['special_instructions'] ?? '');

    if (empty($_SESSION['cart'])) {
        $_SESSION['flash_error'] = "Your cart is empty.";
        header("Location: cart.php");
        exit;
    }

    // Fetch Cart Items from DB
    $itemIds = array_keys($_SESSION['cart']);
    $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
    $stmt = $pdo->prepare("SELECT id, name, price, calories, preparation_time FROM menu_items WHERE id IN ($placeholders)");
    $stmt->execute($itemIds);
    $cartItems = $stmt->fetchAll();

    $subtotal = 0.00;
    $totalCalories = 0;
    $prepTimes = [];

    foreach ($cartItems as $item) {
        $qty = (int)$_SESSION['cart'][$item['id']];
        $subtotal += ($item['price'] * $qty);
        $totalCalories += ($item['calories'] * $qty);
        $prepTimes[] = (int)$item['preparation_time'];
    }

    // Run Server-Side Dual-Layer Guardrail Verification
    $guardrailCheck = validateOrderGuardrail($userId, $subtotal, $totalCalories, $pickupDate);
    if (!$guardrailCheck['allowed']) {
        $_SESSION['flash_error'] = $guardrailCheck['message'];
        header("Location: cart.php");
        exit;
    }

    // Calculate Estimated Wait Time
    $estWaitTime = calculateWaitTime($prepTimes, $pickupDate);

    // Generate Unique Verifiable Order Number
    $orderNumber = 'CE-' . date('Y') . '-' . str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);

    // Insert Order
    $stmt = $pdo->prepare("
        INSERT INTO orders (order_number, user_id, pickup_date, pickup_time, subtotal, total_calories, estimated_wait_time, status, special_instructions, payment_method, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, 'Pending')
    ");
    $stmt->execute([
        $orderNumber,
        $userId,
        $pickupDate,
        $pickupTime,
        $subtotal,
        $totalCalories,
        $estWaitTime,
        $specialInstructions,
        $paymentMethod
    ]);
    $orderId = $pdo->lastInsertId();

    // Insert Order Items Snapshot
    $stmtItem = $pdo->prepare("
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, calories_at_purchase)
        VALUES (?, ?, ?, ?, ?)
    ");
    foreach ($cartItems as $item) {
        $qty = (int)$_SESSION['cart'][$item['id']];
        $stmtItem->execute([$orderId, $item['id'], $qty, $item['price'], $item['calories']]);
    }

    // Award Loyalty Points (1 point per ৳50 spent)
    $earnedPoints = max(1, (int)floor($subtotal / 50));
    $stmt = $pdo->prepare("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?");
    $stmt->execute([$earnedPoints, $userId]);

    $stmt = $pdo->prepare("INSERT INTO loyalty_transactions (user_id, points, reason) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $earnedPoints, "Points earned for Order $orderNumber"]);

    // Clear Cart & Redirect to Receipt
    $_SESSION['cart'] = [];
    $_SESSION['flash_success'] = "Order #{$orderNumber} placed successfully! You earned +{$earnedPoints} loyalty points.";
    header("Location: orders.php?order_id=$orderId");
    exit;
}

// Fetch Cart Items for Display
$cartData = [];
$subtotal = 0.00;
$totalCalories = 0;
$prepTimes = [];

if (!empty($_SESSION['cart'])) {
    $itemIds = array_keys($_SESSION['cart']);
    $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
    $stmt = $pdo->prepare("
        SELECT m.*, s.name as shop_name 
        FROM menu_items m
        LEFT JOIN shops s ON m.shop_id = s.id
        WHERE m.id IN ($placeholders)
    ");
    $stmt->execute($itemIds);
    $rows = $stmt->fetchAll();

    foreach ($rows as $r) {
        $qty = (int)$_SESSION['cart'][$r['id']];
        $lineTotal = $r['price'] * $qty;
        $lineCalories = $r['calories'] * $qty;
        $subtotal += $lineTotal;
        $totalCalories += $lineCalories;
        $prepTimes[] = (int)$r['preparation_time'];

        $cartData[] = [
            'item' => $r,
            'quantity' => $qty,
            'line_total' => $lineTotal,
            'line_calories' => $lineCalories
        ];
    }
}

$estWaitTime = calculateWaitTime($prepTimes);
$pickupSlots = $pdo->query("SELECT * FROM pickup_slots WHERE is_active = 1 ORDER BY id ASC")->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Your Pre-Order Tray</h1>
    <p style="color: var(--color-text-muted);">Review selected items, schedule your 15-minute pickup window and checkout.</p>
  </div>

  <?php if (empty($cartData)): ?>
    <div class="card" style="padding: 4rem; text-align: center;">
      <i data-lucide="shopping-bag" style="width: 56px; height: 56px; margin: 0 auto 1rem; color: #cbd5e1;"></i>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Your Food Tray is Empty</h3>
      <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Explore our delicious campus cafeteria dishes and skip the lunchtime rush!</p>
      <a href="menu.php" class="btn btn-primary btn-lg">Browse Menu & Add Food</a>
    </div>
  <?php else: ?>
    <div style="display: grid; grid-template-columns: 1.3fr 0.9fr; gap: 2rem; align-items: start;">
      <!-- Cart Items Column -->
      <div>
        <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem; margin-bottom: 1rem;">
            <h3 style="font-size: 1.25rem;">Tray Items (<?= count($cartData) ?>)</h3>
            <form method="POST" action="api/cart-actions.php" onsubmit="event.preventDefault(); fetch('api/cart-actions.php', {method:'POST', body:new URLSearchParams({action:'clear'})}).then(()=>location.reload());">
              <button type="submit" style="color: #ef4444; font-size: 0.85rem; font-weight: 700; cursor: pointer;">Clear Tray</button>
            </form>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <?php foreach ($cartData as $entry): $item = $entry['item']; ?>
              <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                  <img src="<?= htmlspecialchars(ltrim($item['image_url'], '/')) ?>" 
                       alt="<?= htmlspecialchars($item['name']) ?>"
                       style="width: 65px; height: 65px; object-fit: cover; border-radius: var(--radius-md);"
                       onerror="this.src='images/mutton_kacchi.jpg';">
                  <div>
                    <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem;"><?= htmlspecialchars($item['name']) ?></h4>
                    <div style="font-size: 0.8rem; color: var(--color-text-muted);">
                      <span><?= formatCurrency($item['price']) ?></span> &bull; 
                      <span style="color: #059669; font-weight: 600;"><?= (int)$item['calories'] ?> kcal</span> &bull;
                      <span><?= htmlspecialchars($item['shop_name']) ?></span>
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 1.25rem; align-items: center;">
                  <!-- Quantity Stepper -->
                  <div style="display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff;">
                    <button onclick="addToCart(<?= $item['id'] ?>, -1).then(()=>location.reload())" style="padding: 0.35rem 0.65rem; font-weight: 700;">-</button>
                    <span style="padding: 0.35rem 0.5rem; font-weight: 800; min-width: 25px; text-align: center;"><?= $entry['quantity'] ?></span>
                    <button onclick="addToCart(<?= $item['id'] ?>, 1).then(()=>location.reload())" style="padding: 0.35rem 0.65rem; font-weight: 700;">+</button>
                  </div>

                  <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-primary); min-width: 70px; text-align: right;">
                    <?= formatCurrency($entry['line_total']) ?>
                  </div>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        </div>

        <!-- Wait-time Algorithm Notification -->
        <div class="card" style="padding: 1.25rem; background: #fffbeb; border: 1px solid #fde68a;">
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <div style="background: #fef3c7; color: #d97706; padding: 0.5rem; border-radius: var(--radius-md);">
              <i data-lucide="clock" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <strong style="color: #92400e; font-size: 0.95rem;">Estimated Kitchen Preparation: ~<?= $estWaitTime ?> minutes</strong>
              <p style="font-size: 0.825rem; color: #b45309; margin-top: 0.15rem;">
                Calculated in real-time from maximum item cook time plus active queue delay factor.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkout Column -->
      <div>
        <div class="card" style="padding: 1.75rem;">
          <h3 style="font-size: 1.35rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
            Order Summary
          </h3>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span style="color: var(--color-text-muted);">Items Subtotal:</span>
              <span style="font-weight: 700;"><?= formatCurrency($subtotal) ?></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span style="color: var(--color-text-muted);">Total Calories:</span>
              <span style="font-weight: 700; color: #059669;"><?= $totalCalories ?> kcal</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span style="color: var(--color-text-muted);">Loyalty Points to Earn:</span>
              <span style="font-weight: 700; color: #7e22ce;">+<?= max(1, (int)floor($subtotal / 50)) ?> Points</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.35rem; font-weight: 800; border-top: 2px solid var(--color-border); padding-top: 0.75rem; color: var(--color-primary);">
              <span>Total Payable:</span>
              <span><?= formatCurrency($subtotal) ?></span>
            </div>
          </div>

          <!-- Checkout Form -->
          <form method="POST" action="cart.php">
            <!-- 15-Minute Slot Selection -->
            <div class="form-group">
              <label class="form-label">
                <i data-lucide="clock" style="width: 15px; height: 15px; display: inline-block; vertical-align: middle;"></i>
                Scheduled Pickup Slot
              </label>
              <select name="pickup_time" class="form-control" required>
                <?php foreach ($pickupSlots as $slot): ?>
                  <option value="<?= htmlspecialchars($slot['slot_time']) ?>">
                    <?= htmlspecialchars($slot['slot_time']) ?> (Max <?= $slot['max_orders'] ?> orders)
                  </option>
                <?php endforeach; ?>
              </select>
            </div>

            <!-- Payment Method -->
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select name="payment_method" class="form-control" required>
                <option value="Cash on Pickup">💵 Cash on Pickup (Counter)</option>
                <option value="bKash">📱 bKash (Online Canteen Pay)</option>
                <option value="Nagad">📱 Nagad</option>
                <option value="Student Canteen Card">💳 Student Canteen ID Card</option>
              </select>
            </div>

            <!-- Special Instructions -->
            <div class="form-group">
              <label class="form-label">Special Cooking Instructions (Optional)</label>
              <input type="text" name="special_instructions" class="form-control" placeholder="e.g. Less spicy, extra sauce, sugar-free...">
            </div>

            <?php if (isLoggedIn()): ?>
              <button type="submit" name="place_order" class="btn btn-primary btn-lg btn-block" style="padding: 1rem;">
                <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
                <span>Confirm & Place Order</span>
              </button>
            <?php else: ?>
              <a href="login.php?redirect=cart.php" class="btn btn-primary btn-lg btn-block" style="padding: 1rem;">
                <span>Log In to Confirm Order</span>
              </a>
            <?php endif; ?>
          </form>
        </div>
      </div>
    </div>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
