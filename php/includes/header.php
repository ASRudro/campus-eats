<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/guardrail.php';

$user = currentUser();
$guardrail = ($user && $user['role'] === 'student') ? getDailyUsage($user['id']) : null;

// Cart total items
$cartCount = 0;
if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $qty) {
        $cartCount += (int)$qty;
    }
}

$pageTitle = isset($pageTitle) ? $pageTitle . " – CampusEats" : "CampusEats – Skip the Lunch Queue";
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= htmlspecialchars($pageTitle) ?></title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><path d='M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'/></svg>" />
  <!-- Google Fonts: Outfit & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Lucide Icons via CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<?php if ($guardrail): ?>
<!-- Live Student Guardrail Bar -->
<div class="guardrail-bar">
  <div class="container guardrail-content">
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <i data-lucide="shield-check" style="width:18px; height:18px;"></i>
      <span><strong>Student Guardrail Active:</strong> Daily Spending Cap</span>
    </div>
    <div style="display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
      <div class="guardrail-stat">
        <span>Budget: <strong>৳<?= number_format($guardrail['spent_today'], 2) ?></strong> / ৳<?= number_format($guardrail['daily_budget'], 2) ?></span>
        <div class="progress-track">
          <div class="progress-fill <?= $guardrail['budget_percentage'] > 80 ? 'danger' : ($guardrail['budget_percentage'] > 50 ? 'warning' : '') ?>" 
               style="width: <?= $guardrail['budget_percentage'] ?>%;"></div>
        </div>
      </div>
      <div class="guardrail-stat">
        <span>Calories: <strong><?= $guardrail['calories_today'] ?></strong> / <?= $guardrail['daily_calorie_limit'] ?> kcal</span>
        <div class="progress-track">
          <div class="progress-fill <?= $guardrail['calorie_percentage'] > 80 ? 'danger' : ($guardrail['calorie_percentage'] > 50 ? 'warning' : '') ?>" 
               style="width: <?= $guardrail['calorie_percentage'] ?>%;"></div>
        </div>
      </div>
      <div class="guardrail-stat">
        <a href="loyalty.php" style="color:#fef08a; display:inline-flex; align-items:center; gap:0.25rem;">
          <i data-lucide="sparkles" style="width:14px; height:14px;"></i>
          <strong><?= $guardrail['loyalty_points'] ?> Pts</strong>
        </a>
      </div>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- Top Navigation Bar -->
<header class="navbar">
  <div class="container nav-container">
    <a href="index.php" class="nav-brand">
      <div class="brand-icon">
        <i data-lucide="utensils"></i>
      </div>
      <span>CampusEats</span>
    </a>

    <ul class="nav-links">
      <li><a href="index.php" class="nav-link"><i data-lucide="home" style="width:16px; height:16px;"></i> Home</a></li>
      <li><a href="menu.php" class="nav-link"><i data-lucide="book-open" style="width:16px; height:16px;"></i> Menu</a></li>
      <li><a href="group-order.php" class="nav-link"><i data-lucide="users" style="width:16px; height:16px;"></i> Group Order</a></li>
      <li><a href="schedule.php" class="nav-link"><i data-lucide="calendar" style="width:16px; height:16px;"></i> Planner</a></li>
      <li><a href="loyalty.php" class="nav-link"><i data-lucide="award" style="width:16px; height:16px;"></i> Rewards</a></li>
      
      <?php if ($user && ($user['role'] === 'kitchen' || $user['role'] === 'admin')): ?>
        <li><a href="kitchen.php" class="nav-link" style="color:#d97706;"><i data-lucide="chef-hat" style="width:16px; height:16px;"></i> Kitchen</a></li>
      <?php endif; ?>
      <?php if ($user && $user['role'] === 'admin'): ?>
        <li><a href="admin.php" class="nav-link" style="color:#7e22ce;"><i data-lucide="layout-dashboard" style="width:16px; height:16px;"></i> Admin</a></li>
      <?php endif; ?>
    </ul>

    <div class="nav-actions">
      <a href="cart.php" class="cart-btn" title="View Shopping Cart">
        <i data-lucide="shopping-bag" style="width:18px; height:18px;"></i>
        <span>Cart</span>
        <span class="cart-count" id="cart-badge-count"><?= $cartCount ?></span>
      </a>

      <?php if ($user): ?>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <a href="orders.php" class="btn btn-secondary btn-sm" title="My Orders">
            <i data-lucide="clock" style="width:16px; height:16px;"></i>
            <span>Orders</span>
          </a>
          <a href="profile.php" class="btn btn-secondary btn-sm" title="My Profile">
            <i data-lucide="user" style="width:16px; height:16px;"></i>
            <span><?= htmlspecialchars(explode(' ', $user['name'])[0]) ?></span>
          </a>
          <a href="logout.php" class="btn btn-danger btn-sm" title="Log Out">
            <i data-lucide="log-out" style="width:14px; height:14px;"></i>
          </a>
        </div>
      <?php else: ?>
        <div style="display:flex; gap:0.5rem;">
          <a href="login.php" class="btn btn-secondary btn-sm">Login</a>
          <a href="register.php" class="btn btn-primary btn-sm">Register</a>
        </div>
      <?php endif; ?>
    </div>
  </div>
</header>

<main>
<div class="container" style="margin-top: 1.5rem;">
  <?php if (isset($_SESSION['flash_success'])): ?>
    <div class="flash-alert flash-success">
      <i data-lucide="check-circle" style="width:20px; height:20px;"></i>
      <span><?= htmlspecialchars($_SESSION['flash_success']) ?></span>
    </div>
    <?php unset($_SESSION['flash_success']); ?>
  <?php endif; ?>

  <?php if (isset($_SESSION['flash_error'])): ?>
    <div class="flash-alert flash-error">
      <i data-lucide="alert-circle" style="width:20px; height:20px;"></i>
      <span><?= htmlspecialchars($_SESSION['flash_error']) ?></span>
    </div>
    <?php unset($_SESSION['flash_error']); ?>
  <?php endif; ?>
</div>
