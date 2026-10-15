<?php
$pageTitle = "My Favorite Meals – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireLogin();
$userId = (int)$_SESSION['user']['id'];

// Fetch Favorites
$stmt = $pdo->prepare("
    SELECT m.*, s.name as shop_name 
    FROM favorites f
    JOIN menu_items m ON f.menu_item_id = m.id
    LEFT JOIN shops s ON m.shop_id = s.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
");
$stmt->execute([$userId]);
$favs = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">❤️ My Favorite Canteen Meals</h1>
    <p style="color: var(--color-text-muted);">Quickly re-order the dishes you love most with zero search time.</p>
  </div>

  <?php if (empty($favs)): ?>
    <div class="card" style="padding: 4rem; text-align: center;">
      <i data-lucide="heart" style="width: 48px; height: 48px; margin: 0 auto 1rem; color: #cbd5e1;"></i>
      <h3>No favorite dishes saved yet.</h3>
      <p style="color: var(--color-text-muted); margin-top: 0.5rem;">Click the heart icon on any food card in the menu to save it here!</p>
      <a href="menu.php" class="btn btn-primary" style="margin-top: 1.5rem;">Explore Menu</a>
    </div>
  <?php else: ?>
    <div class="food-grid">
      <?php foreach ($favs as $item): ?>
        <div class="card food-card">
          <div class="food-card-img-wrap">
            <img src="<?= htmlspecialchars(ltrim($item['image_url'], '/')) ?>" 
                 alt="<?= htmlspecialchars($item['name']) ?>"
                 onerror="this.src='images/mutton_kacchi.jpg';">
            <span class="badge badge-green badge-float-right"><?= (int)$item['calories'] ?> kcal</span>
          </div>
          <div class="food-card-body">
            <div style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700; margin-bottom: 0.25rem;">
              <?= htmlspecialchars($item['shop_name']) ?>
            </div>
            <h3 class="food-card-title">
              <a href="food-details.php?id=<?= $item['id'] ?>"><?= htmlspecialchars($item['name']) ?></a>
            </h3>
            <p class="food-card-desc"><?= htmlspecialchars($item['description']) ?></p>
            <div class="food-card-footer">
              <div class="food-price"><?= formatCurrency($item['price']) ?></div>
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="toggleFavorite(<?= $item['id'] ?>, this).then(()=>location.reload())" class="btn btn-secondary btn-sm" title="Remove Favorite">❤️</button>
                <button onclick="addToCart(<?= $item['id'] ?>, 1)" class="btn btn-primary btn-sm">
                  <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
