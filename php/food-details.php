<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    header("Location: menu.php");
    exit;
}

// Fetch item with shop details
$stmt = $pdo->prepare("
    SELECT m.*, c.name as category_name, s.name as shop_name, s.tagline as shop_tagline, s.location as shop_location, s.delivery_time as shop_delivery_time, s.badge as shop_badge
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    LEFT JOIN shops s ON m.shop_id = s.id
    WHERE m.id = ?
");
$stmt->execute([$id]);
$item = $stmt->fetch();

if (!$item) {
    header("Location: menu.php");
    exit;
}

$pageTitle = htmlspecialchars($item['name']) . " – CampusEats";
require_once __DIR__ . '/includes/header.php';

// Handle Review Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_review'])) {
    if (!isLoggedIn()) {
        $_SESSION['flash_error'] = "Please log in to submit a review.";
        header("Location: login.php");
        exit;
    }

    $rating = max(1, min(5, (int)($_POST['rating'] ?? 5)));
    $comment = trim($_POST['comment'] ?? '');
    $userId = (int)$_SESSION['user']['id'];

    // Check if user already reviewed
    $stmt = $pdo->prepare("SELECT id FROM ratings WHERE user_id = ? AND menu_item_id = ?");
    $stmt->execute([$userId, $id]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $pdo->prepare("UPDATE ratings SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$rating, $comment, $existing['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO ratings (user_id, menu_item_id, rating, comment) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $id, $rating, $comment]);
    }
    $_SESSION['flash_success'] = "Thank you! Your review has been published.";
    header("Location: food-details.php?id=$id");
    exit;
}

// Fetch Reviews
$stmt = $pdo->prepare("
    SELECT r.*, u.name as reviewer_name, u.student_id 
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.menu_item_id = ?
    ORDER BY r.created_at DESC
");
$stmt->execute([$id]);
$reviews = $stmt->fetchAll();

$avgRating = 5.0;
if (!empty($reviews)) {
    $sum = array_sum(array_column($reviews, 'rating'));
    $avgRating = round($sum / count($reviews), 1);
}

// Fetch related items from the same shop
$stmt = $pdo->prepare("
    SELECT * FROM menu_items 
    WHERE shop_id = ? AND id != ? AND is_available = 1 
    LIMIT 3
");
$stmt->execute([$item['shop_id'], $id]);
$relatedItems = $stmt->fetchAll();
?>

<div class="container" style="padding-top: 2rem;">
  <!-- Breadcrumb -->
  <div style="display:flex; gap:0.5rem; font-size:0.875rem; color:var(--color-text-muted); margin-bottom:1.5rem;">
    <a href="index.php">Home</a> &rsaquo;
    <a href="menu.php">Menu</a> &rsaquo;
    <a href="menu.php?shop_id=<?= $item['shop_id'] ?>"><?= htmlspecialchars($item['shop_name']) ?></a> &rsaquo;
    <span style="color:var(--color-text-main); font-weight:600;"><?= htmlspecialchars($item['name']) ?></span>
  </div>

  <!-- Food Hero Grid -->
  <div class="card" style="padding:2rem; margin-bottom:3rem;">
    <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:2.5rem; align-items:center;">
      <!-- Image Column -->
      <div style="border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-md); height:350px; background:#f1f5f9;">
        <img src="<?= htmlspecialchars(ltrim($item['image_url'], '/')) ?>" 
             alt="<?= htmlspecialchars($item['name']) ?>"
             style="width:100%; height:100%; object-fit:cover;"
             onerror="this.src='images/mutton_kacchi.jpg';">
      </div>

      <!-- Details Column -->
      <div>
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap;">
          <span class="badge badge-green"><?= htmlspecialchars($item['shop_name']) ?></span>
          <span class="badge badge-purple"><?= htmlspecialchars($item['category_name']) ?></span>
          <?php if ($item['is_special']): ?>
            <span class="badge badge-amber">⭐ Chef Special</span>
          <?php endif; ?>
        </div>

        <h1 style="font-size:2.25rem; margin-bottom:0.75rem;"><?= htmlspecialchars($item['name']) ?></h1>
        <p style="color:var(--color-text-muted); font-size:1.05rem; line-height:1.6; margin-bottom:1.5rem;">
          <?= htmlspecialchars($item['description']) ?>
        </p>

        <!-- Nutrition & Prep Info Badges -->
        <div style="display:flex; gap:1.5rem; margin-bottom:2rem; background:var(--color-bg); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-border);">
          <div>
            <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:700;">ENERGY</div>
            <div style="font-size:1.15rem; font-weight:800; color:#059669;"><?= (int)$item['calories'] ?> kcal</div>
          </div>
          <div style="border-left:1px solid var(--color-border); padding-left:1.5rem;">
            <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:700;">PREP TIME</div>
            <div style="font-size:1.15rem; font-weight:800; color:#d97706;">⏱️ <?= (int)$item['preparation_time'] ?> min</div>
          </div>
          <div style="border-left:1px solid var(--color-border); padding-left:1.5rem;">
            <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:700;">REVIEWS</div>
            <div style="font-size:1.15rem; font-weight:800; color:#2563eb;">⭐ <?= $avgRating ?> (<?= count($reviews) ?>)</div>
          </div>
        </div>

        <!-- Add to Tray Row -->
        <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
          <div>
            <div style="font-size:0.85rem; color:var(--color-text-muted);">Canteen Price</div>
            <div class="food-price" style="font-size:2rem;"><?= formatCurrency($item['price']) ?></div>
          </div>

          <div style="display:flex; gap:0.75rem; align-items:center;">
            <div style="display:flex; align-items:center; border:1px solid var(--color-border); border-radius:var(--radius-md); background:#fff;">
              <button onclick="let q = document.getElementById('qty'); q.value = Math.max(1, parseInt(q.value)-1);" style="padding:0.75rem 1rem; font-size:1.1rem; font-weight:700;">-</button>
              <input type="number" id="qty" value="1" min="1" max="10" style="width:45px; text-align:center; border:none; font-weight:800; font-size:1.1rem;" readonly>
              <button onclick="let q = document.getElementById('qty'); q.value = Math.min(10, parseInt(q.value)+1);" style="padding:0.75rem 1rem; font-size:1.1rem; font-weight:700;">+</button>
            </div>

            <button onclick="addToCart(<?= $item['id'] ?>, parseInt(document.getElementById('qty').value))" class="btn btn-primary btn-lg">
              <i data-lucide="shopping-bag" style="width:20px; height:20px;"></i>
              <span>Add to Tray</span>
            </button>
            
            <button onclick="toggleFavorite(<?= $item['id'] ?>, this)" class="btn btn-secondary btn-lg" title="Save to Favorites">🤍</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reviews & Ratings Section -->
  <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:2.5rem; margin-bottom:4rem;">
    <!-- Reviews List -->
    <div>
      <h3 style="font-size:1.5rem; margin-bottom:1.5rem;">Student Reviews & Feedback (<?= count($reviews) ?>)</h3>
      <?php if (empty($reviews)): ?>
        <p style="color:var(--color-text-muted);">No reviews submitted yet. Be the first student to review this meal!</p>
      <?php else: ?>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <?php foreach ($reviews as $rev): ?>
            <div class="card" style="padding:1.25rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <div>
                  <strong><?= htmlspecialchars($rev['reviewer_name']) ?></strong>
                  <span style="font-size:0.75rem; color:var(--color-text-muted); margin-left:0.5rem;"><?= htmlspecialchars($rev['student_id']) ?></span>
                </div>
                <div style="color:#d97706; font-weight:700;">
                  <?= str_repeat('★', (int)$rev['rating']) . str_repeat('☆', 5 - (int)$rev['rating']) ?>
                </div>
              </div>
              <p style="font-size:0.925rem; color:var(--color-text-main); line-height:1.4;">
                <?= htmlspecialchars($rev['comment']) ?>
              </p>
              <div style="font-size:0.75rem; color:var(--color-text-muted); margin-top:0.5rem;">
                <?= date('d M Y, h:i A', strtotime($rev['created_at'])) ?>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Review Form -->
    <div>
      <div class="card" style="padding:1.75rem;">
        <h3 style="font-size:1.35rem; margin-bottom:0.5rem;">Leave a Review</h3>
        <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:1.25rem;">Share your taste, portion size & pickup experience.</p>

        <?php if (isLoggedIn()): ?>
          <form method="POST" action="food-details.php?id=<?= $item['id'] ?>">
            <div class="form-group">
              <label class="form-label">Rating</label>
              <select name="rating" class="form-control" required>
                <option value="5">⭐⭐⭐⭐⭐ (5/5) - Outstanding Flavor</option>
                <option value="4">⭐⭐⭐⭐ (4/5) - Very Good</option>
                <option value="3">⭐⭐⭐ (3/5) - Average</option>
                <option value="2">⭐⭐ (2/5) - Below Average</option>
                <option value="1">⭐ (1/5) - Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Comment</label>
              <textarea name="comment" class="form-control" rows="3" placeholder="Tell batchmates about the food quality and taste..." required></textarea>
            </div>
            <button type="submit" name="submit_review" class="btn btn-primary btn-block">
              <span>Submit Verified Review</span>
            </button>
          </form>
        <?php else: ?>
          <div style="text-align:center; padding:1.5rem 0;">
            <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:1rem;">You must be logged in as a student to write a review.</p>
            <a href="login.php" class="btn btn-secondary btn-sm">Log In to Review</a>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
