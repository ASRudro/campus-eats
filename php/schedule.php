<?php
$pageTitle = "Weekly Meal Planner – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireLogin();
$userId = (int)$_SESSION['user']['id'];

// Handle Add Schedule
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_schedule'])) {
    $day = trim($_POST['day_of_week'] ?? 'Sunday');
    $itemId = (int)$_POST['menu_item_id'];
    $pickupTime = trim($_POST['pickup_time'] ?? '1:00 PM');
    $quantity = max(1, (int)($_POST['quantity'] ?? 1));

    $stmt = $pdo->prepare("
        INSERT INTO weekly_schedules (user_id, day_of_week, menu_item_id, quantity, pickup_time)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), pickup_time = VALUES(pickup_time)
    ");
    $stmt->execute([$userId, $day, $itemId, $quantity, $pickupTime]);

    $_SESSION['flash_success'] = "Added scheduled meal for {$day}!";
    header("Location: schedule.php");
    exit;
}

// Handle Delete Schedule
if (isset($_GET['delete_id'])) {
    $delId = (int)$_GET['delete_id'];
    $stmt = $pdo->prepare("DELETE FROM weekly_schedules WHERE id = ? AND user_id = ?");
    $stmt->execute([$delId, $userId]);
    $_SESSION['flash_success'] = "Removed meal from weekly schedule.";
    header("Location: schedule.php");
    exit;
}

// Fetch Weekly Schedule
$stmt = $pdo->prepare("
    SELECT ws.*, m.name as item_name, m.price, m.calories, m.image_url, s.name as shop_name 
    FROM weekly_schedules ws
    JOIN menu_items m ON ws.menu_item_id = m.id
    LEFT JOIN shops s ON m.shop_id = s.id
    WHERE ws.user_id = ?
    ORDER BY 
      CASE ws.day_of_week
        WHEN 'Saturday' THEN 1
        WHEN 'Sunday' THEN 2
        WHEN 'Monday' THEN 3
        WHEN 'Tuesday' THEN 4
        WHEN 'Wednesday' THEN 5
        ELSE 6
      END, ws.id ASC
");
$stmt->execute([$userId]);
$rows = $stmt->fetchAll();

$days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
$schedulesByDay = [];
foreach ($days as $d) {
    $schedulesByDay[$d] = [];
}
foreach ($rows as $r) {
    if (isset($schedulesByDay[$r['day_of_week']])) {
        $schedulesByDay[$r['day_of_week']][] = $r;
    }
}

// Fetch menu items for dropdown
$menuItems = $pdo->query("SELECT id, name, price, calories FROM menu_items WHERE is_available = 1 ORDER BY is_special DESC LIMIT 30")->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="padding-top: 2rem; margin-bottom: 4rem;">
  <div style="margin-bottom: 2rem;">
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">📅 Mon–Wed Weekly Lunch Planner</h1>
    <p style="color: var(--color-text-muted);">Never forget to eat during busy lecture breaks. Plan your meals ahead for each campus day and add them to cart with one click.</p>
  </div>

  <!-- Add Schedule Form Modal/Card -->
  <div class="card" style="padding: 1.5rem; margin-bottom: 2.5rem; background: #ffffff; border: 1px solid var(--color-border);">
    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Schedule a Meal for Your Class Day</h3>
    
    <form method="POST" action="schedule.php">
      <div style="display: grid; grid-template-columns: 1.2fr 2fr 1fr 1fr auto; gap: 1rem; align-items: center;">
        <div>
          <label class="form-label" style="font-size: 0.8rem;">Day of the Week</label>
          <select name="day_of_week" class="form-control" required>
            <?php foreach ($days as $d): ?>
              <option value="<?= $d ?>"><?= $d ?></option>
            <?php endforeach; ?>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-size: 0.8rem;">Select Dish</label>
          <select name="menu_item_id" class="form-control" required>
            <?php foreach ($menuItems as $m): ?>
              <option value="<?= $m['id'] ?>">
                <?= htmlspecialchars($m['name']) ?> (<?= formatCurrency($m['price']) ?>, <?= $m['calories'] ?> kcal)
              </option>
            <?php endforeach; ?>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-size: 0.8rem;">Pickup Time</label>
          <select name="pickup_time" class="form-control" required>
            <option value="12:00 PM">12:00 PM</option>
            <option value="12:30 PM">12:30 PM</option>
            <option value="1:00 PM" selected>1:00 PM</option>
            <option value="1:30 PM">1:30 PM</option>
            <option value="2:00 PM">2:00 PM</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-size: 0.8rem;">Qty</label>
          <input type="number" name="quantity" value="1" min="1" max="10" class="form-control" required>
        </div>

        <div style="padding-top: 1.35rem;">
          <button type="submit" name="add_schedule" class="btn btn-primary" style="height: 42px;">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            <span>Schedule</span>
          </button>
        </div>
      </div>
    </form>
  </div>

  <!-- Weekly Kanban Grid (Saturday to Wednesday) -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
    <?php foreach ($days as $day): $dayMeals = $schedulesByDay[$day]; ?>
      <div class="card" style="padding: 1.25rem; display: flex; flex-direction: column; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--color-border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <h3 style="font-size: 1.15rem; color: var(--color-text-main);"><?= $day ?></h3>
          <span class="badge badge-green" style="font-size: 0.7rem;"><?= count($dayMeals) ?> Planned</span>
        </div>

        <?php if (empty($dayMeals)): ?>
          <div style="text-align: center; padding: 2rem 0; color: var(--color-text-light); font-size: 0.85rem;">
            No meals scheduled.
          </div>
        <?php else: ?>
          <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1rem;">
            <?php foreach ($dayMeals as $meal): ?>
              <div style="background: var(--color-bg); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border-subtle); position: relative;">
                <div style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.2rem;">
                  <?= htmlspecialchars($meal['item_name']) ?> x <?= $meal['quantity'] ?>
                </div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">
                  <span><?= formatCurrency($meal['price'] * $meal['quantity']) ?></span> &bull;
                  <span>⏱️ <?= htmlspecialchars($meal['pickup_time']) ?></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <button onclick="addToCart(<?= $meal['menu_item_id'] ?>, <?= $meal['quantity'] ?>)" class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">
                    <i data-lucide="shopping-bag" style="width: 12px; height: 12px;"></i>
                    <span>Add to Cart</span>
                  </button>
                  <a href="schedule.php?delete_id=<?= $meal['id'] ?>" style="color: #ef4444; font-size: 0.75rem; font-weight: 700;">Remove</a>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </div>
    <?php endforeach; ?>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
