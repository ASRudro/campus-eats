<?php
$pageTitle = "Home – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/header.php';

// Fetch 5 Campus Food Shops
$stmt = $pdo->query("SELECT * FROM shops ORDER BY id ASC");
$shops = $stmt->fetchAll();

// Fetch Trending / Special Foods
$stmt = $pdo->query("
    SELECT m.*, s.name as shop_name, s.badge as shop_badge 
    FROM menu_items m
    JOIN shops s ON m.shop_id = s.id
    WHERE m.is_special = 1 AND m.is_available = 1
    ORDER BY m.id ASC
    LIMIT 6
");
$specialItems = $stmt->fetchAll();
?>

<!-- Hero Banner -->
<section class="hero-section">
  <div class="container hero-grid">
    <div>
      <div style="display:inline-flex; align-items:center; gap:0.5rem; background:var(--color-primary-light); color:var(--color-primary); padding:0.35rem 0.85rem; border-radius:var(--radius-full); font-weight:700; font-size:0.85rem; margin-bottom:1rem;">
        <i data-lucide="sparkles" style="width:16px; height:16px;"></i>
        <span>University Cafeteria Pre-Ordering & Queue Skipping</span>
      </div>
      <h1 class="hero-title">
        Skip the Lunch Queue. <span>Eat Fresh on Time.</span>
      </h1>
      <p class="hero-lead">
        Pre-order hot student meals from your favorite campus stalls, pick up at scheduled 15-minute windows, and keep your daily budget and calorie limits in check automatically.
      </p>
      <div class="hero-actions">
        <a href="menu.php" class="btn btn-primary btn-lg">
          <i data-lucide="utensils" style="width:20px; height:20px;"></i>
          <span>Browse Full Menu</span>
        </a>
        <a href="group-order.php" class="btn btn-secondary btn-lg">
          <i data-lucide="users" style="width:20px; height:20px;"></i>
          <span>Start Group Order</span>
        </a>
      </div>
    </div>

    <div>
      <div class="card" style="padding:1.5rem; background:linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border:2px solid #a7f3d0; box-shadow:var(--shadow-xl);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
          <span class="badge badge-green">⚡ Smart Features</span>
          <span style="font-size:0.85rem; color:var(--color-text-muted); font-weight:600;">Automated System</span>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; gap:0.75rem; align-items:flex-start;">
            <div style="background:#ecfdf5; color:#059669; padding:0.5rem; border-radius:var(--radius-md);">
              <i data-lucide="shield-check" style="width:20px; height:20px;"></i>
            </div>
            <div>
              <strong style="font-size:0.95rem; color:var(--color-text-main);">Dual-Layer Guardrail</strong>
              <p style="font-size:0.825rem; color:var(--color-text-muted);">Real-time tracking of daily spending & calories.</p>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; align-items:flex-start;">
            <div style="background:#fffbeb; color:#d97706; padding:0.5rem; border-radius:var(--radius-md);">
              <i data-lucide="clock" style="width:20px; height:20px;"></i>
            </div>
            <div>
              <strong style="font-size:0.95rem; color:var(--color-text-main);">15-Min Scheduled Pickup</strong>
              <p style="font-size:0.825rem; color:var(--color-text-muted);">Zero queue wait time. Pick up hot directly at stall.</p>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; align-items:flex-start;">
            <div style="background:#eff6ff; color:#2563eb; padding:0.5rem; border-radius:var(--radius-md);">
              <i data-lucide="split" style="width:20px; height:20px;"></i>
            </div>
            <div>
              <strong style="font-size:0.95rem; color:var(--color-text-main);">Split Group Payments</strong>
              <p style="font-size:0.825rem; color:var(--color-text-muted);">Order with squad and pay individual shares via bKash.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 5 Campus Food Stalls -->
<section class="container">
  <div class="section-header">
    <div>
      <h2 class="section-title">5 Campus Food Stalls & Cafeterias</h2>
      <p class="section-subtitle">Select a stall to browse their dedicated fresh lunch meals and snacks</p>
    </div>
    <a href="menu.php" class="btn btn-secondary btn-sm">View All Stalls &rarr;</a>
  </div>

  <div class="shop-grid">
    <?php foreach ($shops as $shop): ?>
      <a href="menu.php?shop_id=<?= $shop['id'] ?>" class="card shop-card">
        <div class="shop-logo-wrap">
          <img src="<?= htmlspecialchars($shop['logo_url'] ?: ($shop['id'] <= 2 ? "images/shops/shop{$shop['id']}_logo.jpg" : "images/shops/shop{$shop['id']}_logo.svg")) ?>" 
               alt="<?= htmlspecialchars($shop['name']) ?>"
               onerror="this.src='images/mutton_kacchi.jpg';">
        </div>
        <span class="badge badge-green" style="margin-bottom:0.5rem; font-size:0.7rem;"><?= htmlspecialchars($shop['badge'] ?: 'Food Stall') ?></span>
        <h3 style="font-size:1.1rem; margin-bottom:0.25rem;"><?= htmlspecialchars($shop['name']) ?></h3>
        <p style="font-size:0.8rem; color:var(--color-text-muted); margin-bottom:0.75rem;"><?= htmlspecialchars($shop['location']) ?></p>
        <div style="display:flex; align-items:center; gap:0.35rem; font-size:0.85rem; font-weight:700; color:#d97706; margin-top:auto;">
          <span>⭐ <?= number_format((float)$shop['rating'], 1) ?></span>
          <span style="color:var(--color-text-light);">•</span>
          <span style="color:var(--color-text-muted); font-weight:600;"><?= htmlspecialchars($shop['delivery_time']) ?></span>
        </div>
      </a>
    <?php endforeach; ?>
  </div>
</section>

<!-- Trending / Chef's Special Items -->
<section class="container">
  <div class="section-header">
    <div>
      <h2 class="section-title">🔥 Today's Chef Specials & Best Sellers</h2>
      <p class="section-subtitle">Handcrafted hot student meals ready for immediate pre-order</p>
    </div>
    <a href="menu.php?is_special=1" class="btn btn-secondary btn-sm">See All Specials &rarr;</a>
  </div>

  <div class="food-grid">
    <?php foreach ($specialItems as $item): ?>
      <div class="card food-card">
        <div class="food-card-img-wrap">
          <img src="<?= htmlspecialchars(ltrim($item['image_url'], '/')) ?>" 
               alt="<?= htmlspecialchars($item['name']) ?>"
               onerror="this.src='images/mutton_kacchi.jpg';">
          <span class="badge badge-amber badge-float-left">⭐ Special</span>
          <span class="badge badge-green badge-float-right"><?= (int)$item['calories'] ?> kcal</span>
        </div>
        <div class="food-card-body">
          <div style="font-size:0.8rem; color:var(--color-primary); font-weight:700; margin-bottom:0.25rem;">
            <?= htmlspecialchars($item['shop_name']) ?>
          </div>
          <h3 class="food-card-title">
            <a href="food-details.php?id=<?= $item['id'] ?>"><?= htmlspecialchars($item['name']) ?></a>
          </h3>
          <p class="food-card-desc"><?= htmlspecialchars($item['description']) ?></p>
          <div class="food-card-footer">
            <div class="food-price"><?= formatCurrency($item['price']) ?></div>
            <div style="display:flex; gap:0.5rem;">
              <button onclick="toggleFavorite(<?= $item['id'] ?>, this)" class="btn btn-secondary btn-sm" title="Favorite">🤍</button>
              <button onclick="addToCart(<?= $item['id'] ?>, 1)" class="btn btn-primary btn-sm">
                <i data-lucide="plus" style="width:16px; height:16px;"></i>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
