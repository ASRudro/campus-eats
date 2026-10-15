<?php
$pageTitle = "Loyalty Points & Rewards – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireLogin();
$userId = (int)$_SESSION['user']['id'];

// Handle Reward Redemption
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['redeem_reward'])) {
    $rewardId = (int)$_POST['reward_id'];

    $stmt = $pdo->prepare("SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = 1");
    $stmt->execute([$rewardId]);
    $reward = $stmt->fetch();

    $stmtUser = $pdo->prepare("SELECT loyalty_points FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userRow = $stmtUser->fetch();
    $balance = $userRow ? (int)$userRow['loyalty_points'] : 0;

    if ($reward && $balance >= $reward['points_cost']) {
        // Deduct points
        $newBalance = $balance - $reward['points_cost'];
        $pdo->prepare("UPDATE users SET loyalty_points = ? WHERE id = ?")->execute([$newBalance, $userId]);

        // Log transaction
        $stmtTxn = $pdo->prepare("INSERT INTO loyalty_transactions (user_id, points, reason) VALUES (?, ?, ?)");
        $stmtTxn->execute([$userId, -$reward['points_cost'], "Redeemed: {$reward['title']}"]);

        $_SESSION['flash_success'] = "Reward redeemed successfully! Enjoy your {$reward['title']}.";
        header("Location: loyalty.php");
        exit;
    } else {
        $_SESSION['flash_error'] = "Insufficient loyalty points to redeem this reward.";
        header("Location: loyalty.php");
        exit;
    }
}

// Fetch balance
$stmt = $pdo->prepare("SELECT loyalty_points FROM users WHERE id = ?");
$stmt->execute([$userId]);
$balance = (int)$stmt->fetchColumn();

// Fetch Rewards Catalog
$rewards = $pdo->query("SELECT lr.*, m.name as item_name FROM loyalty_rewards lr LEFT JOIN menu_items m ON lr.menu_item_id = m.id WHERE lr.is_active = 1 ORDER BY lr.points_cost ASC")->fetchAll();

// Fetch History
$stmt = $pdo->prepare("SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 15");
$stmt->execute([$userId]);
$history = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Loyalty Rewards Program</h1>
    <p style="color: var(--color-text-muted);">Earn 1 loyalty point for every ৳50 spent at campus canteens. Redeem points for free snacks and lunch discounts.</p>
  </div>

  <!-- Points Balance Hero Card -->
  <div class="card" style="padding: 2.5rem; background: linear-gradient(135deg, #064e3b 0%, #059669 100%); color: #ffffff; border-radius: var(--radius-xl); margin-bottom: 3rem; box-shadow: var(--shadow-xl);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
      <div>
        <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #a7f3d0; letter-spacing: 0.05em;">Your Available Balance</span>
        <div style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-display); line-height: 1.1; margin-top: 0.25rem;">
          <?= $balance ?> <span style="font-size: 1.5rem; font-weight: 600; color: #a7f3d0;">Points</span>
        </div>
        <p style="font-size: 0.95rem; color: #ecfdf5; margin-top: 0.5rem;">
          Keep pre-ordering your daily meals to climb up reward tiers!
        </p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); padding: 1.5rem 2rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.2); text-align: center;">
        <div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: #fef08a;">Earning Rate</div>
        <div style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0;">1 pt / ৳50</div>
        <div style="font-size: 0.75rem; color: #e2e8f0;">Applied automatically on every order</div>
      </div>
    </div>
  </div>

  <!-- Rewards Catalog Grid -->
  <div class="section-header">
    <div>
      <h2 class="section-title">🎁 Available Rewards Catalog</h2>
      <p class="section-subtitle">Redeem your hard-earned points for free cafeteria food and vouchers</p>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; margin-bottom: 3.5rem;">
    <?php foreach ($rewards as $rew): ?>
      <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span class="badge badge-purple">
              <i data-lucide="award" style="width: 14px; height: 14px;"></i>
              <span><?= $rew['points_cost'] ?> Points</span>
            </span>
            <span style="font-size: 0.8rem; color: #059669; font-weight: 700;">Value: <?= formatCurrency($rew['discount_amount']) ?></span>
          </div>

          <h3 style="font-size: 1.2rem; margin-bottom: 0.35rem;"><?= htmlspecialchars($rew['title']) ?></h3>
          <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem; line-height: 1.4;">
            <?= htmlspecialchars($rew['description']) ?>
          </p>
        </div>

        <form method="POST" action="loyalty.php">
          <input type="hidden" name="reward_id" value="<?= $rew['id'] ?>">
          <button type="submit" name="redeem_reward" class="btn btn-primary btn-block btn-sm" <?= $balance < $rew['points_cost'] ? 'disabled' : '' ?>>
            <span><?= $balance >= $rew['points_cost'] ? 'Redeem Reward' : 'Need ' . ($rew['points_cost'] - $balance) . ' more pts' ?></span>
          </button>
        </form>
      </div>
    <?php endforeach; ?>
  </div>

  <!-- Points Transaction Log -->
  <div>
    <h3 style="font-size: 1.5rem; margin-bottom: 1.25rem;">Points Activity History</h3>
    <?php if (empty($history)): ?>
      <p style="color: var(--color-text-muted);">No points activity yet.</p>
    <?php else: ?>
      <div class="card" style="overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead style="background: #f8fafc; border-bottom: 1px solid var(--color-border); font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-muted);">
            <tr>
              <th style="padding: 1rem 1.25rem;">Date & Time</th>
              <th style="padding: 1rem 1.25rem;">Activity Reason</th>
              <th style="padding: 1rem 1.25rem; text-align: right;">Points</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($history as $h): ?>
              <tr style="border-bottom: 1px solid var(--color-border-subtle);">
                <td style="padding: 1rem 1.25rem; color: var(--color-text-muted); font-size: 0.825rem;">
                  <?= date('d M Y, h:i A', strtotime($h['created_at'])) ?>
                </td>
                <td style="padding: 1rem 1.25rem; font-weight: 600;">
                  <?= htmlspecialchars($h['reason']) ?>
                </td>
                <td style="padding: 1rem 1.25rem; text-align: right; font-weight: 800; font-size: 1.05rem; color: <?= $h['points'] > 0 ? '#059669' : '#ef4444' ?>;">
                  <?= $h['points'] > 0 ? '+' . $h['points'] : $h['points'] ?> Pts
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
