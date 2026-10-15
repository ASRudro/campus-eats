<?php
$pageTitle = "Cafeteria Menu – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/header.php';

$search = trim($_GET['search'] ?? '');
$shopId = (int)($_GET['shop_id'] ?? 0);
$categoryId = (int)($_GET['category_id'] ?? 0);
$isSpecial = isset($_GET['is_special']) ? (int)$_GET['is_special'] : null;
$isCombo = isset($_GET['is_combo']) ? (int)$_GET['is_combo'] : null;
$sort = $_GET['sort'] ?? 'popular';

// Fetch Shops & Categories
$shops = $pdo->query("SELECT * FROM shops ORDER BY id ASC")->fetchAll();
$categories = $pdo->query("SELECT * FROM categories ORDER BY id ASC")->fetchAll();

// Build Query
$sql = "
    SELECT m.*, c.name as category_name, s.name as shop_name, s.badge as shop_badge, s.delivery_time as shop_delivery_time
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    LEFT JOIN shops s ON m.shop_id = s.id
    WHERE m.is_available = 1
";
$params = [];

if ($search !== '') {
    $sql .= " AND (m.name LIKE ? OR m.description LIKE ? OR s.name LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($shopId > 0) {
    $sql .= " AND m.shop_id = ?";
    $params[] = $shopId;
}

if ($categoryId > 0) {
    $sql .= " AND m.category_id = ?";
    $params[] = $categoryId;
}

if ($isSpecial !== null) {
    $sql .= " AND m.is_special = ?";
    $params[] = $isSpecial;
}

if ($isCombo !== null) {
    $sql .= " AND m.is_combo = ?";
    $params[] = $isCombo;
}

// Sorting
if ($sort === 'price_asc') {
    $sql .= " ORDER BY m.price ASC";
} elseif ($sort === 'price_desc') {
    $sql .= " ORDER BY m.price DESC";
} elseif ($sort === 'prep_time') {
    $sql .= " ORDER BY m.preparation_time ASC";
} elseif ($sort === 'calories') {
    $sql .= " ORDER BY m.calories ASC";
} else {
    $sql .= " ORDER BY m.is_special DESC, m.id ASC";
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();
?>

<div class="container" style="padding-top: 2rem;">
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Campus Cafeteria Food Menu</h1>
    <p style="color: var(--color-text-muted);">Explore <?= count($items) ?> fresh meals, snacks & beverages across 5 campus stalls.</p>
  </div>

  <!-- Search and Stall Filters -->
  <form method="GET" action="menu.php" style="background:#ffffff; padding:1.25rem; border-radius:var(--radius-lg); border:1px solid var(--color-border); box-shadow:var(--shadow-sm); margin-bottom:2rem;">
    <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap:1rem; align-items:center;">
      <!-- Search Input -->
      <div>
        <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" class="form-control" placeholder="Search kacchi, khichuri, coffee...">
      </div>

      <!-- Shop Filter -->
      <div>
        <select name="shop_id" class="form-control">
          <option value="0">All 5 Food Stalls</option>
          <?php foreach ($shops as $s): ?>
            <option value="<?= $s['id'] ?>" <?= $shopId === (int)$s['id'] ? 'selected' : '' ?>>
              <?= htmlspecialchars($s['name']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <!-- Category Filter -->
      <div>
        <select name="category_id" class="form-control">
          <option value="0">All Categories</option>
          <?php foreach ($categories as $c): ?>
            <option value="<?= $c['id'] ?>" <?= $categoryId === (int)$c['id'] ? 'selected' : '' ?>>
              <?= htmlspecialchars($c['name']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <!-- Sort By -->
      <div>
        <select name="sort" class="form-control">
          <option value="popular" <?= $sort === 'popular' ? 'selected' : '' ?>>⭐ Popularity / Specials</option>
          <option value="price_asc" <?= $sort === 'price_asc' ? 'selected' : '' ?>>💰 Price: Low to High</option>
          <option value="price_desc" <?= $sort === 'price_desc' ? 'selected' : '' ?>>💎 Price: High to Low</option>
          <option value="prep_time" <?= $sort === 'prep_time' ? 'selected' : '' ?>>⚡ Fastest Preparation</option>
          <option value="calories" <?= $sort === 'calories' ? 'selected' : '' ?>>🥗 Lowest Calories</option>
        </select>
      </div>

      <!-- Submit Button -->
      <div>
        <button type="submit" class="btn btn-primary" style="height:100%;">
          <i data-lucide="search" style="width:16px; height:16px;"></i>
          <span>Filter</span>
        </button>
      </div>
    </div>
  </form>

  <!-- Category Pills Quick Filter -->
  <div class="filter-tabs">
    <a href="menu.php" class="filter-tab <?= ($categoryId === 0 && $isSpecial === null && $isCombo === null) ? 'active' : '' ?>">🍽️ All Items</a>
    <a href="menu.php?is_special=1" class="filter-tab <?= $isSpecial === 1 ? 'active' : '' ?>">⭐ Chef's Specials</a>
    <a href="menu.php?is_combo=1" class="filter-tab <?= $isCombo === 1 ? 'active' : '' ?>">🎁 Combo Deals</a>
    <?php foreach ($categories as $c): ?>
      <a href="menu.php?category_id=<?= $c['id'] ?>" class="filter-tab <?= $categoryId === (int)$c['id'] ? 'active' : '' ?>">
        <?= htmlspecialchars($c['name']) ?>
      </a>
    <?php endforeach; ?>
  </div>

  <!-- Food Items Grid -->
  <?php if (empty($items)): ?>
    <div class="card" style="padding:4rem; text-align:center; color:var(--color-text-muted);">
      <i data-lucide="utensils" style="width:48px; height:48px; margin:0 auto 1rem; color:#cbd5e1;"></i>
      <h3>No food items found matching your criteria.</h3>
      <p style="margin-top:0.5rem;">Try resetting your filters or searching for something else.</p>
      <a href="menu.php" class="btn btn-secondary btn-sm" style="margin-top:1.5rem;">Reset All Filters</a>
    </div>
  <?php else: ?>
    <div class="food-grid">
      <?php foreach ($items as $item): ?>
        <div class="card food-card">
          <div class="food-card-img-wrap">
            <img src="<?= htmlspecialchars(ltrim($item['image_url'], '/')) ?>" 
                 alt="<?= htmlspecialchars($item['name']) ?>"
                 onerror="this.src='images/mutton_kacchi.jpg';">
            <?php if ($item['is_special']): ?>
              <span class="badge badge-amber badge-float-left">⭐ Special</span>
            <?php elseif ($item['is_combo']): ?>
              <span class="badge badge-purple badge-float-left">🎁 Combo</span>
            <?php endif; ?>
            <span class="badge badge-green badge-float-right"><?= (int)$item['calories'] ?> kcal</span>
          </div>
          <div class="food-card-body">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span style="font-size:0.75rem; color:var(--color-primary); font-weight:700;">
                <?= htmlspecialchars($item['shop_name'] ?: 'Campus Canteen') ?>
              </span>
              <span style="font-size:0.75rem; color:var(--color-text-muted); font-weight:600;">
                ⏱️ <?= (int)$item['preparation_time'] ?> min
              </span>
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
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
