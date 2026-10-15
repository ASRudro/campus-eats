<?php
$pageTitle = "Group Tray & Split Payment – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireLogin();
$userId = (int)$_SESSION['user']['id'];

// 1. Handle Create Group
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_group'])) {
    $title = trim($_POST['title'] ?? 'Batchmates Lunch');
    $pickupDate = trim($_POST['pickup_date'] ?? date('Y-m-d'));
    $pickupTime = trim($_POST['pickup_time'] ?? '1:15 PM');
    $groupCode = 'GRP-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

    $stmt = $pdo->prepare("
        INSERT INTO group_orders (group_code, creator_user_id, title, pickup_date, pickup_time, status)
        VALUES (?, ?, ?, ?, ?, 'Open')
    ");
    $stmt->execute([$groupCode, $userId, $title, $pickupDate, $pickupTime]);
    $groupId = $pdo->lastInsertId();

    $_SESSION['flash_success'] = "Group order created! Share code {$groupCode} with batchmates.";
    header("Location: group-order.php?code=$groupCode");
    exit;
}

// 2. Handle Join Group
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['join_group'])) {
    $code = strtoupper(trim($_POST['group_code'] ?? ''));
    $stmt = $pdo->prepare("SELECT id FROM group_orders WHERE group_code = ? AND status = 'Open'");
    $stmt->execute([$code]);
    $grp = $stmt->fetch();

    if ($grp) {
        header("Location: group-order.php?code=$code");
        exit;
    } else {
        $_SESSION['flash_error'] = "Group session not found or already finalized.";
        header("Location: group-order.php");
        exit;
    }
}

// Active Group inspection if code is passed
$activeGroup = null;
$groupItems = [];
$groupMembers = [];
$combinedTotal = 0.00;
$totalCollected = 0.00;
$userContribution = null;
$menuList = [];

if (isset($_GET['code'])) {
    $code = strtoupper(trim($_GET['code']));
    $stmt = $pdo->prepare("SELECT g.*, u.name as creator_name FROM group_orders g JOIN users u ON g.creator_user_id = u.id WHERE g.group_code = ?");
    $stmt->execute([$code]);
    $activeGroup = $stmt->fetch();

    if ($activeGroup) {
        $groupId = (int)$activeGroup['id'];

        // Handle Add Item to Group
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_group_item'])) {
            $itemId = (int)$_POST['menu_item_id'];
            $qty = max(1, (int)($_POST['quantity'] ?? 1));

            $stmtItem = $pdo->prepare("SELECT price, calories FROM menu_items WHERE id = ?");
            $stmtItem->execute([$itemId]);
            $item = $stmtItem->fetch();

            if ($item) {
                $stmt = $pdo->prepare("
                    INSERT INTO group_order_items (group_order_id, user_id, menu_item_id, quantity, unit_price, calories)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$groupId, $userId, $itemId, $qty, $item['price'], $item['calories']]);
                $_SESSION['flash_success'] = "Added item to group tray!";
                header("Location: group-order.php?code=$code");
                exit;
            }
        }

        // Handle Pay Share
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pay_share'])) {
            $amount = (float)$_POST['share_amount'];
            $method = trim($_POST['payment_method'] ?? 'bKash');
            $trxId = trim($_POST['transaction_id'] ?? ('BK-' . mt_rand(100000, 999999)));

            $stmt = $pdo->prepare("
                INSERT INTO group_order_contributions (group_order_id, user_id, amount, payment_status, payment_method, transaction_id, paid_at)
                VALUES (?, ?, ?, 'Paid', ?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE amount = VALUES(amount), payment_status = 'Paid', payment_method = VALUES(payment_method), transaction_id = VALUES(transaction_id), paid_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([$groupId, $userId, $amount, $method, $trxId]);
            $_SESSION['flash_success'] = "Successfully contributed " . formatCurrency($amount) . " via $method!";
            header("Location: group-order.php?code=$code");
            exit;
        }

        // Handle Host Finalize
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['finalize_order'])) {
            if ($activeGroup['creator_user_id'] != $userId) {
                $_SESSION['flash_error'] = "Only the group host can finalize this order.";
            } else {
                // Create single unified order
                $orderNumber = 'CE-GRP-' . str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
                $stmt = $pdo->prepare("
                    SELECT SUM(unit_price * quantity) as subtotal, SUM(calories * quantity) as total_cal 
                    FROM group_order_items WHERE group_order_id = ?
                ");
                $stmt->execute([$groupId]);
                $totals = $stmt->fetch();

                $stmt = $pdo->prepare("
                    INSERT INTO orders (order_number, user_id, pickup_date, pickup_time, subtotal, total_calories, estimated_wait_time, status, payment_method, payment_status)
                    VALUES (?, ?, ?, ?, ?, ?, 15, 'Pending', 'Group Split Pay (bKash/Nagad)', 'Paid')
                ");
                $stmt->execute([
                    $orderNumber,
                    $userId,
                    $activeGroup['pickup_date'],
                    $activeGroup['pickup_time'],
                    $totals['subtotal'] ?: 0,
                    $totals['total_cal'] ?: 0
                ]);
                $newOrderId = $pdo->lastInsertId();

                // Mark group as finalized
                $pdo->prepare("UPDATE group_orders SET status = 'Finalized' WHERE id = ?")->execute([$groupId]);

                $_SESSION['flash_success'] = "Group Order #{$orderNumber} finalized and sent to the kitchen!";
                header("Location: orders.php?order_id=$newOrderId");
                exit;
            }
        }

        // Fetch Group Items
        $stmt = $pdo->prepare("
            SELECT gi.*, m.name as item_name, u.name as member_name, u.student_id 
            FROM group_order_items gi
            JOIN menu_items m ON gi.menu_item_id = m.id
            JOIN users u ON gi.user_id = u.id
            WHERE gi.group_order_id = ?
            ORDER BY gi.id ASC
        ");
        $stmt->execute([$groupId]);
        $groupItems = $stmt->fetchAll();

        foreach ($groupItems as $gi) {
            $combinedTotal += ($gi['unit_price'] * $gi['quantity']);
        }

        // Fetch Group Contributions
        $stmt = $pdo->prepare("
            SELECT c.*, u.name as member_name, u.student_id 
            FROM group_order_contributions c
            JOIN users u ON c.user_id = u.id
            WHERE c.group_order_id = ?
        ");
        $stmt->execute([$groupId]);
        $groupMembers = $stmt->fetchAll();

        foreach ($groupMembers as $m) {
            if ($m['payment_status'] === 'Paid') {
                $totalCollected += (float)$m['amount'];
            }
            if ($m['user_id'] == $userId) {
                $userContribution = $m;
            }
        }

        // Menu items for quick addition
        $menuList = $pdo->query("SELECT id, name, price, calories FROM menu_items WHERE is_available = 1 ORDER BY is_special DESC LIMIT 20")->fetchAll();
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">
  <?php if (!$activeGroup): ?>
    <!-- Create or Join Group Hub -->
    <div style="text-align: center; margin-bottom: 3rem;">
      <div class="brand-icon" style="margin: 0 auto 1rem; width: 4rem; height: 4rem; font-size: 1.75rem;">
        <i data-lucide="users"></i>
      </div>
      <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Group Tray & Split Canteen Payments</h1>
      <p style="color: var(--color-text-muted); max-width: 600px; margin: 0 auto;">
        Collaborate with classmates to place a single consolidated food tray. Everyone chooses their meals and pays their individual share via bKash.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 900px; margin: 0 auto;">
      <!-- Create Group Card -->
      <div class="card" style="padding: 2rem;">
        <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Create New Group</h3>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem;">Generate a unique 6-character room code for your batchmates.</p>
        
        <form method="POST" action="group-order.php">
          <div class="form-group">
            <label class="form-label">Group Title</label>
            <input type="text" name="title" class="form-control" placeholder="e.g. CSE Section 3 Lunch" required>
          </div>
          <div class="form-group">
            <label class="form-label">Scheduled Pickup Time</label>
            <input type="text" name="pickup_time" class="form-control" value="1:15 PM" required>
          </div>
          <button type="submit" name="create_group" class="btn btn-primary btn-lg btn-block">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
            <span>Create Session & Get Code</span>
          </button>
        </form>
      </div>

      <!-- Join Group Card -->
      <div class="card" style="padding: 2rem;">
        <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Join with Code</h3>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem;">Have a room code from a classmate? Enter it below to join the tray.</p>
        
        <form method="POST" action="group-order.php">
          <div class="form-group">
            <label class="form-label">Room Code (e.g. GRP-A1B2C)</label>
            <input type="text" name="group_code" class="form-control" placeholder="GRP-XXXXX" style="text-transform: uppercase; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em;" required>
          </div>
          <button type="submit" name="join_group" class="btn btn-secondary btn-lg btn-block">
            <i data-lucide="log-in" style="width: 18px; height: 18px;"></i>
            <span>Join Group Tray</span>
          </button>
        </form>
      </div>
    </div>
  <?php else: ?>
    <!-- Active Group Room View -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <h1 style="font-size: 2rem;"><?= htmlspecialchars($activeGroup['title']) ?></h1>
          <span class="badge badge-purple" style="font-size: 0.9rem; padding: 0.35rem 0.85rem;">
            Code: <?= htmlspecialchars($activeGroup['group_code']) ?>
          </span>
        </div>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
          Host: <strong><?= htmlspecialchars($activeGroup['creator_name']) ?></strong> &bull; 
          Scheduled Pickup: <strong><?= htmlspecialchars($activeGroup['pickup_time']) ?></strong>
        </p>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <a href="group-order.php" class="btn btn-secondary btn-sm">Leave Session</a>
      </div>
    </div>

    <!-- Live Split Progress Bar -->
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; background: #ffffff; border: 2px solid var(--color-primary);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <div>
          <span style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 700;">LIVE CONTRIBUTION TRACKER</span>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary);">
            <?= formatCurrency($totalCollected) ?> / <?= formatCurrency($combinedTotal) ?> Collected
          </div>
        </div>
        <span class="badge <?= $totalCollected >= $combinedTotal && $combinedTotal > 0 ? 'badge-green' : 'badge-amber' ?>">
          <?= $totalCollected >= $combinedTotal && $combinedTotal > 0 ? '✅ Fully Funded' : '⏳ Awaiting Split Payments' ?>
        </span>
      </div>

      <div class="progress-track" style="width: 100%; height: 12px; background: #e2e8f0;">
        <div class="progress-fill" style="width: <?= $combinedTotal > 0 ? min(100, round(($totalCollected / $combinedTotal) * 100)) : 0 ?>%;"></div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem;">
      <!-- Group Items & Add Food -->
      <div>
        <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Group Tray Items (<?= count($groupItems) ?>)</h3>
          
          <?php if (empty($groupItems)): ?>
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">No dishes added to this tray yet.</p>
          <?php else: ?>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <?php foreach ($groupItems as $gi): ?>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border-subtle);">
                  <div>
                    <strong><?= htmlspecialchars($gi['item_name']) ?></strong> x <?= $gi['quantity'] ?>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                      Added by: <strong><?= htmlspecialchars($gi['member_name']) ?></strong> (<?= htmlspecialchars($gi['student_id']) ?>)
                    </div>
                  </div>
                  <div style="font-weight: 700; color: var(--color-primary);">
                    <?= formatCurrency($gi['unit_price'] * $gi['quantity']) ?>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>

        <!-- Add Item Form -->
        <div class="card" style="padding: 1.5rem;">
          <h4 style="font-size: 1.1rem; margin-bottom: 1rem;">Add Dish to Group Tray</h4>
          <form method="POST" action="group-order.php?code=<?= $activeGroup['group_code'] ?>">
            <div style="display: grid; grid-template-columns: 3fr 1fr auto; gap: 0.75rem; align-items: center;">
              <select name="menu_item_id" class="form-control" required>
                <?php foreach ($menuList as $m): ?>
                  <option value="<?= $m['id'] ?>">
                    <?= htmlspecialchars($m['name']) ?> – <?= formatCurrency($m['price']) ?>
                  </option>
                <?php endforeach; ?>
              </select>
              <input type="number" name="quantity" value="1" min="1" max="10" class="form-control" required>
              <button type="submit" name="add_group_item" class="btn btn-primary">
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Payment & Finalize Column -->
      <div>
        <!-- Pay Individual Share Card -->
        <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Pay Your Share</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.25rem;">Send your contribution directly via bKash / Nagad.</p>

          <?php if ($userContribution && $userContribution['payment_status'] === 'Paid'): ?>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
              <i data-lucide="check-circle" style="width: 28px; height: 28px; color: #059669; margin: 0 auto 0.5rem;"></i>
              <strong style="color: #064e3b; display: block;">You Have Paid Your Share!</strong>
              <span style="font-size: 0.85rem; color: #047857;"><?= formatCurrency($userContribution['amount']) ?> (Trx ID: <?= htmlspecialchars($userContribution['transaction_id']) ?>)</span>
            </div>
          <?php else: ?>
            <form method="POST" action="group-order.php?code=<?= $activeGroup['group_code'] ?>">
              <div class="form-group">
                <label class="form-label">Your Share Amount (৳)</label>
                <input type="number" step="0.01" name="share_amount" class="form-control" placeholder="e.g. 180" required>
              </div>
              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select name="payment_method" class="form-control" required>
                  <option value="bKash">bKash (Merchant: 01700-000000)</option>
                  <option value="Nagad">Nagad (Merchant: 01800-000000)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Transaction ID (TrxID)</label>
                <input type="text" name="transaction_id" class="form-control" placeholder="e.g. BK982341" required>
              </div>
              <button type="submit" name="pay_share" class="btn btn-primary btn-block">
                <span>Confirm Contribution</span>
              </button>
            </form>
          <?php endif; ?>
        </div>

        <!-- Host Finalize Card -->
        <?php if ($activeGroup['creator_user_id'] == $userId): ?>
          <div class="card" style="padding: 1.5rem; background: #faf5ff; border: 1px solid #e9d5ff;">
            <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #7e22ce;">👑 Host Controls</h4>
            <p style="font-size: 0.825rem; color: var(--color-text-muted); margin-bottom: 1rem;">
              When all batchmates have added their meals and paid, finalize the order to notify the cafeteria chefs.
            </p>
            <form method="POST" action="group-order.php?code=<?= $activeGroup['group_code'] ?>">
              <button type="submit" name="finalize_order" class="btn btn-primary btn-block" style="background: #7e22ce;">
                <i data-lucide="check" style="width: 18px; height: 18px;"></i>
                <span>Finalize & Dispatch to Kitchen</span>
              </button>
            </form>
          </div>
        <?php endif; ?>
      </div>
    </div>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
