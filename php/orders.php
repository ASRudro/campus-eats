<?php
$pageTitle = "My Orders & Receipts – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireLogin();
$userId = (int)$_SESSION['user']['id'];

// Handle 1-Tap Reorder
if (isset($_GET['reorder_id'])) {
    $reorderId = (int)$_GET['reorder_id'];
    $stmt = $pdo->prepare("SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?");
    $stmt->execute([$reorderId]);
    $itemsToReorder = $stmt->fetchAll();

    if (!empty($itemsToReorder)) {
        if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];
        foreach ($itemsToReorder as $row) {
            $mId = (int)$row['menu_item_id'];
            $qty = (int)$row['quantity'];
            $_SESSION['cart'][$mId] = ($_SESSION['cart'][$mId] ?? 0) + $qty;
        }
        $_SESSION['flash_success'] = "Previous order items added to your cart!";
        header("Location: cart.php");
        exit;
    }
}

// Check single receipt view
$receiptOrder = null;
$receiptItems = [];
if (isset($_GET['order_id'])) {
    $orderId = (int)$_GET['order_id'];
    $stmt = $pdo->prepare("SELECT o.*, u.name as customer_name, u.student_id, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ? AND (o.user_id = ? OR ? = 'admin' OR ? = 'kitchen')");
    $stmt->execute([$orderId, $userId, $_SESSION['user']['role'], $_SESSION['user']['role']]);
    $receiptOrder = $stmt->fetch();

    if ($receiptOrder) {
        $stmt = $pdo->prepare("
            SELECT oi.*, m.name as item_name, m.image_url, s.name as shop_name 
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            LEFT JOIN shops s ON m.shop_id = s.id
            WHERE oi.order_id = ?
        ");
        $stmt->execute([$orderId]);
        $receiptItems = $stmt->fetchAll();
    }
}

// Fetch all orders for this user
$stmt = $pdo->prepare("
    SELECT o.*, COUNT(oi.id) as item_count 
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.id DESC
");
$stmt->execute([$userId]);
$myOrders = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">

  <?php if ($receiptOrder): ?>
    <!-- Verifiable Digital Receipt Card -->
    <div style="margin-bottom: 3rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; max-width: 550px; margin: 0 auto 1rem;">
        <a href="orders.php" class="btn btn-secondary btn-sm">&larr; Back to All Orders</a>
        <button onclick="window.print()" class="btn btn-primary btn-sm">
          <i data-lucide="printer" style="width: 16px; height: 16px;"></i>
          <span>Print Receipt</span>
        </button>
      </div>

      <div class="receipt-card">
        <div class="receipt-header">
          <div class="brand-icon" style="margin: 0 auto 0.5rem; width: 3rem; height: 3rem;">
            <i data-lucide="utensils"></i>
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">CampusEats Digital Receipt</h2>
          <p style="font-size: 0.8rem; color: var(--color-text-muted);">University Canteen Automated Pre-Ordering System</p>
          <div style="margin-top: 0.75rem;">
            <span class="badge <?= $receiptOrder['status'] === 'Ready' ? 'badge-ready' : ($receiptOrder['status'] === 'Picked Up' ? 'badge-green' : 'badge-amber') ?>" style="font-size: 0.85rem; padding: 0.4rem 1rem;">
              ● <?= htmlspecialchars($receiptOrder['status']) ?>
            </span>
          </div>
        </div>

        <!-- Receipt Metadata -->
        <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; font-size: 0.85rem;">
          <div class="receipt-row">
            <span style="color: var(--color-text-muted);">Order Number:</span>
            <strong><?= htmlspecialchars($receiptOrder['order_number']) ?></strong>
          </div>
          <div class="receipt-row">
            <span style="color: var(--color-text-muted);">Student Name:</span>
            <span><?= htmlspecialchars($receiptOrder['customer_name']) ?> (<?= htmlspecialchars($receiptOrder['student_id']) ?>)</span>
          </div>
          <div class="receipt-row">
            <span style="color: var(--color-text-muted);">Scheduled Pickup:</span>
            <strong style="color: var(--color-primary);"><?= htmlspecialchars($receiptOrder['pickup_date']) ?> at <?= htmlspecialchars($receiptOrder['pickup_time']) ?></strong>
          </div>
          <div class="receipt-row">
            <span style="color: var(--color-text-muted);">Payment Method:</span>
            <span><?= htmlspecialchars($receiptOrder['payment_method']) ?></span>
          </div>
          <?php if (!empty($receiptOrder['special_instructions'])): ?>
            <div class="receipt-row" style="border-top: 1px dashed #cbd5e1; padding-top: 0.5rem; margin-top: 0.5rem;">
              <span style="color: var(--color-text-muted);">Instructions:</span>
              <span><?= htmlspecialchars($receiptOrder['special_instructions']) ?></span>
            </div>
          <?php endif; ?>
        </div>

        <!-- Itemized List -->
        <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem;">Item Breakdown</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
          <?php foreach ($receiptItems as $it): ?>
            <div class="receipt-row">
              <div>
                <strong><?= htmlspecialchars($it['item_name']) ?></strong> x <?= $it['quantity'] ?>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);"><?= htmlspecialchars($it['shop_name']) ?></div>
              </div>
              <div><?= formatCurrency($it['unit_price'] * $it['quantity']) ?></div>
            </div>
          <?php endforeach; ?>
        </div>

        <!-- Total -->
        <div class="receipt-row receipt-total">
          <span>Total Paid:</span>
          <span><?= formatCurrency($receiptOrder['subtotal']) ?></span>
        </div>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.75rem; color: var(--color-text-muted);">
          Please present this digital slip at the canteen counter for instant pickup.
        </div>
      </div>
    </div>
  <?php endif; ?>

  <!-- Orders List -->
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">My Order History</h1>
    <p style="color: var(--color-text-muted);">Track your active meals and reorder your favorite canteen lunch with one click.</p>
  </div>

  <?php if (empty($myOrders)): ?>
    <div class="card" style="padding: 4rem; text-align: center;">
      <i data-lucide="clock" style="width: 48px; height: 48px; margin: 0 auto 1rem; color: #cbd5e1;"></i>
      <h3>No previous orders found.</h3>
      <p style="color: var(--color-text-muted); margin-top: 0.5rem;">Pre-order your first lunch today to skip the canteen queue!</p>
      <a href="menu.php" class="btn btn-primary" style="margin-top: 1.5rem;">Browse Menu</a>
    </div>
  <?php else: ?>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <?php foreach ($myOrders as $o): ?>
        <div class="card" style="padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
              <strong style="font-size: 1.15rem;"><?= htmlspecialchars($o['order_number']) ?></strong>
              <span class="badge <?= $o['status'] === 'Ready' ? 'badge-ready' : ($o['status'] === 'Picked Up' ? 'badge-green' : 'badge-amber') ?>">
                <?= htmlspecialchars($o['status']) ?>
              </span>
            </div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted);">
              <span>📅 <?= htmlspecialchars($o['pickup_date']) ?> at <?= htmlspecialchars($o['pickup_time']) ?></span> &bull;
              <span>🥗 <?= $o['total_calories'] ?> kcal</span> &bull;
              <span>💳 <?= htmlspecialchars($o['payment_method']) ?></span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--color-primary);">
              <?= formatCurrency($o['subtotal']) ?>
            </div>
            <a href="orders.php?order_id=<?= $o['id'] ?>" class="btn btn-secondary btn-sm">
              <i data-lucide="receipt" style="width: 15px; height: 15px;"></i>
              <span>Receipt</span>
            </a>
            <a href="orders.php?reorder_id=<?= $o['id'] ?>" class="btn btn-primary btn-sm">
              <i data-lucide="repeat" style="width: 15px; height: 15px;"></i>
              <span>1-Tap Reorder</span>
            </a>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
