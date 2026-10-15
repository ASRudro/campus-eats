<?php
$pageTitle = "My Profile & Guardrails – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireLogin();
$userId = (int)$_SESSION['user']['id'];

// Handle Profile Update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $dailyBudget = (float)($_POST['daily_budget'] ?? 350.00);
    $dailyCalories = (int)($_POST['daily_calorie_limit'] ?? 1800);

    $stmt = $pdo->prepare("
        UPDATE users 
        SET name = ?, phone = ?, daily_budget = ?, daily_calorie_limit = ? 
        WHERE id = ?
    ");
    $stmt->execute([$name, $phone, $dailyBudget, $dailyCalories, $userId]);

    // Refresh session
    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['phone'] = $phone;
    $_SESSION['user']['daily_budget'] = $dailyBudget;
    $_SESSION['user']['daily_calorie_limit'] = $dailyCalories;

    $_SESSION['flash_success'] = "Profile & Guardrail settings updated successfully!";
    header("Location: profile.php");
    exit;
}

// Fetch latest user data
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();
$usage = getDailyUsage($userId);

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="max-width: 700px; padding-top: 2rem; margin-bottom: 4rem;">
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Student Profile & Guardrail Caps</h1>
    <p style="color: var(--color-text-muted);">Customize your daily meal budget and nutritional limits to stay healthy and save money.</p>
  </div>

  <div class="card" style="padding: 2.25rem;">
    <form method="POST" action="profile.php">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($user['name']) ?>" required>
        </div>

        <div class="form-group">
          <label class="form-label">Student ID</label>
          <input type="text" class="form-control" value="<?= htmlspecialchars($user['student_id']) ?>" readonly style="background: #f1f5f9; color: var(--color-text-muted);">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" value="<?= htmlspecialchars($user['email']) ?>" readonly style="background: #f1f5f9; color: var(--color-text-muted);">
        </div>

        <div class="form-group">
          <label class="form-label">Phone Number (For SMS)</label>
          <input type="tel" name="phone" class="form-control" value="<?= htmlspecialchars($user['phone'] ?? '') ?>">
        </div>
      </div>

      <!-- Guardrail Limits Section -->
      <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; margin: 1.5rem 0;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
          <i data-lucide="shield-check" style="width: 22px; height: 22px; color: #059669;"></i>
          <h3 style="font-size: 1.15rem;">Automated Guardrail Controls</h3>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
          <div class="form-group">
            <label class="form-label">Daily Spending Cap (৳)</label>
            <input type="number" step="10" name="daily_budget" class="form-control" value="<?= (float)$user['daily_budget'] ?>" required>
            <span style="font-size: 0.75rem; color: var(--color-text-muted);">Blocks orders if today's cumulative spending exceeds this limit.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Daily Calorie Target (kcal)</label>
            <input type="number" step="50" name="daily_calorie_limit" class="form-control" value="<?= (int)$user['daily_calorie_limit'] ?>" required>
            <span style="font-size: 0.75rem; color: var(--color-text-muted);">Helps maintain healthy balanced student eating habits.</span>
          </div>
        </div>
      </div>

      <button type="submit" name="update_profile" class="btn btn-primary btn-lg btn-block">
        <span>Save Profile & Guardrail Settings</span>
      </button>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
