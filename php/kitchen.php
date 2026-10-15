<?php
$pageTitle = "Kitchen Live Queue Dashboard – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireRole('kitchen');

// Handle Status Change from Form or Direct Action
if (isset($_GET['action']) && isset($_GET['order_id'])) {
    $orderId = (int)$_GET['order_id'];
    $act = $_GET['action'];
    $newStatus = 'Pending';
    if ($act === 'prepare') $newStatus = 'Preparing';
    if ($act === 'ready') $newStatus = 'Ready';
    if ($act === 'complete') $newStatus = 'Picked Up';
    if ($act === 'cancel') $newStatus = 'Cancelled';

    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $orderId]);
    $_SESSION['flash_success'] = "Order #{$orderId} status updated to {$newStatus}.";
    header("Location: kitchen.php");
    exit;
}

$filterStatus = $_GET['status'] ?? 'all';
$today = date('Y-m-d');

// Fetch Active Kitchen Queue
$sql = "
    SELECT o.*, u.name as customer_name, u.student_id, u.phone as customer_phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.pickup_date = ?
";
$params = [$today];

if ($filterStatus !== 'all') {
    $sql .= " AND o.status = ?";
    $params[] = $filterStatus;
} else {
    $sql .= " AND o.status IN ('Pending', 'Preparing', 'Ready')";
}
$sql .= " ORDER BY CASE o.status WHEN 'Pending' THEN 1 WHEN 'Preparing' THEN 2 WHEN 'Ready' THEN 3 ELSE 4 END, o.id ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$orders = $stmt->fetchAll();

// Fetch items for all these orders
$orderItemsMap = [];
if (!empty($orders)) {
    $orderIds = array_column($orders, 'id');
    $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
    $stmt = $pdo->prepare("
        SELECT oi.*, m.name as item_name, s.name as shop_name 
        FROM order_items oi
        JOIN menu_items m ON oi.menu_item_id = m.id
        LEFT JOIN shops s ON m.shop_id = s.id
        WHERE oi.order_id IN ($placeholders)
    ");
    $stmt->execute($orderIds);
    $allOrderItems = $stmt->fetchAll();

    foreach ($allOrderItems as $it) {
        $orderItemsMap[$it['order_id']][] = $it;
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #fef3c7; color: #92400e; padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem;">
        <i data-lucide="chef-hat" style="width: 16px; height: 16px;"></i>
        <span>Cafeteria Kitchen Operations</span>
      </div>
      <h1 style="font-size: 2.25rem;">Live Order Prep Queue</h1>
      <p style="color: var(--color-text-muted);">Real-time dispatch board for cafeteria cooks and packaging staff.</p>
    </div>

    <div style="display: flex; gap: 0.5rem;">
      <button onclick="location.reload()" class="btn btn-secondary btn-sm">
        <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
        <span>Refresh Queue</span>
      </button>
    </div>
  </div>

  <!-- Status Filter Tabs -->
  <div class="filter-tabs">
    <a href="kitchen.php" class="filter-tab <?= $filterStatus === 'all' ? 'active' : '' ?>">🔥 Active Queue (<?= count($orders) ?>)</a>
    <a href="kitchen.php?status=Pending" class="filter-tab <?= $filterStatus === 'Pending' ? 'active' : '' ?>">⏳ Pending</a>
    <a href="kitchen.php?status=Preparing" class="filter-tab <?= $filterStatus === 'Preparing' ? 'active' : '' ?>">🍳 Preparing</a>
    <a href="kitchen.php?status=Ready" class="filter-tab <?= $filterStatus === 'Ready' ? 'active' : '' ?>">✅ Ready for Pickup</a>
    <a href="kitchen.php?status=Picked Up" class="filter-tab <?= $filterStatus === 'Picked Up' ? 'active' : '' ?>">📦 Completed / Picked Up</a>
  </div>

  <!-- Orders Grid -->
  <?php if (empty($orders)): ?>
    <div class="card" style="padding: 4rem; text-align: center;">
      <i data-lucide="check-circle-2" style="width: 56px; height: 56px; color: #10b981; margin: 0 auto 1rem;"></i>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Kitchen Queue is All Clear!</h3>
      <p style="color: var(--color-text-muted);">No active pending or preparing orders in this filter.</p>
    </div>
  <?php else: ?>
    <div class="kitchen-grid">
      <?php foreach ($orders as $o): $items = $orderItemsMap[$o['id']] ?? []; ?>
        <div class="card order-ticket status-<?= $o['status'] ?>" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <strong style="font-size: 1.2rem;"><?= htmlspecialchars($o['order_number']) ?></strong>
              <span class="badge <?= $o['status'] === 'Ready' ? 'badge-ready' : ($o['status'] === 'Preparing' ? 'badge-blue' : 'badge-amber') ?>">
                ● <?= htmlspecialchars($o['status']) ?>
              </span>
            </div>

            <div style="background: var(--color-bg); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.85rem;">
              <div><strong>Student:</strong> <?= htmlspecialchars($o['customer_name']) ?> (<?= htmlspecialchars($o['student_id']) ?>)</div>
              <div><strong>Pickup Slot:</strong> <span style="color: #059669; font-weight: 700;"><?= htmlspecialchars($o['pickup_time']) ?></span></div>
              <div><strong>Payment:</strong> <?= htmlspecialchars($o['payment_method']) ?> (<?= formatCurrency($o['subtotal']) ?>)</div>
            </div>

            <?php if (!empty($o['special_instructions'])): ?>
              <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 0.6rem; border-radius: var(--radius-md); font-size: 0.825rem; margin-bottom: 1rem;">
                <strong>⚠️ Instruction:</strong> <?= htmlspecialchars($o['special_instructions']) ?>
              </div>
            <?php endif; ?>

            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.35rem;">Items to Cook:</h4>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.5rem;">
              <?php foreach ($items as $it): ?>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                  <span><strong><?= $it['quantity'] ?>x</strong> <?= htmlspecialchars($it['item_name']) ?></span>
                  <span style="font-size: 0.75rem; color: var(--color-text-muted);"><?= htmlspecialchars($it['shop_name']) ?></span>
                </div>
              <?php endforeach; ?>
            </div>
          </div>

          <!-- Status Action Buttons -->
          <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--color-border); padding-top: 1rem; margin-top: auto;">
            <?php if ($o['status'] === 'Pending'): ?>
              <a href="kitchen.php?action=prepare&order_id=<?= $o['id'] ?>" class="btn btn-primary btn-block btn-sm">
                <span>🍳 Start Cooking</span>
              </a>
            <?php elseif ($o['status'] === 'Preparing'): ?>
              <a href="kitchen.php?action=ready&order_id=<?= $o['id'] ?>" class="btn btn-accent btn-block btn-sm" style="background: #10b981;">
                <span>🔔 Mark Ready for Pickup</span>
              </a>
            <?php elseif ($o['status'] === 'Ready'): ?>
              <a href="kitchen.php?action=complete&order_id=<?= $o['id'] ?>" class="btn btn-secondary btn-block btn-sm">
                <span>📦 Mark Picked Up</span>
              </a>
            <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
