<?php
$pageTitle = "Admin Management Dashboard – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/guardrail.php';

requireRole('admin');

// Handle Add / Edit Menu Item
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_item'])) {
    $shopId = (int)$_POST['shop_id'];
    $catId = (int)$_POST['category_id'];
    $name = trim($_POST['name']);
    $desc = trim($_POST['description']);
    $price = (float)$_POST['price'];
    $calories = (int)$_POST['calories'];
    $prepTime = (int)$_POST['preparation_time'];
    $imageUrl = trim($_POST['image_url'] ?: 'images/mutton_kacchi.jpg');
    $isSpecial = isset($_POST['is_special']) ? 1 : 0;
    $isCombo = isset($_POST['is_combo']) ? 1 : 0;

    $stmt = $pdo->prepare("
        INSERT INTO menu_items (shop_id, category_id, name, description, price, calories, image_url, preparation_time, is_available, is_special, is_combo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ");
    $stmt->execute([$shopId, $catId, $name, $desc, $price, $calories, $imageUrl, $prepTime, $isSpecial, $isCombo]);
    $_SESSION['flash_success'] = "New food item '{$name}' created successfully!";
    header("Location: admin.php");
    exit;
}

// Handle Toggle Availability
if (isset($_GET['toggle_item'])) {
    $itemId = (int)$_GET['toggle_item'];
    $pdo->query("UPDATE menu_items SET is_available = CASE WHEN is_available = 1 THEN 0 ELSE 1 END WHERE id = $itemId");
    $_SESSION['flash_success'] = "Food item availability updated.";
    header("Location: admin.php");
    exit;
}

// Handle User Role Change
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_role'])) {
    $targetUserId = (int)$_POST['user_id'];
    $newRole = trim($_POST['role']);
    if (in_array($newRole, ['student', 'kitchen', 'admin'])) {
        $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$newRole, $targetUserId]);
        $_SESSION['flash_success'] = "User role updated successfully.";
    }
    header("Location: admin.php");
    exit;
}

// Compute Dynamic KPIs
$today = date('Y-m-d');
$todaySales = (float)$pdo->query("SELECT COALESCE(SUM(subtotal), 0) FROM orders WHERE pickup_date = '$today' AND status != 'Cancelled'")->fetchColumn();
$totalOrders = (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
$totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$activeOrders = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status IN ('Pending', 'Preparing', 'Ready')")->fetchColumn();

// Fetch Top-Selling Items
$topItems = $pdo->query("
    SELECT m.name, SUM(oi.quantity) as total_qty, SUM(oi.unit_price * oi.quantity) as total_revenue
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    GROUP BY m.id
    ORDER BY total_qty DESC
    LIMIT 5
")->fetchAll();

// Fetch All Menu Items
$allMenuItems = $pdo->query("
    SELECT m.*, s.name as shop_name, c.name as category_name 
    FROM menu_items m 
    LEFT JOIN shops s ON m.shop_id = s.id 
    JOIN categories c ON m.category_id = c.id 
    ORDER BY m.id DESC
")->fetchAll();

// Fetch All Users
$usersList = $pdo->query("SELECT id, name, student_id, email, role, daily_budget, loyalty_points FROM users ORDER BY id ASC")->fetchAll();
$shops = $pdo->query("SELECT * FROM shops ORDER BY id ASC")->fetchAll();
$categories = $pdo->query("SELECT * FROM categories ORDER BY id ASC")->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<!-- Include Chart.js for analytics -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<div class="container" style="padding-top: 2rem; margin-bottom: 5rem;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #faf5ff; color: #7e22ce; padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem;">
        <i data-lucide="shield" style="width: 16px; height: 16px;"></i>
        <span>System Administrator Panel</span>
      </div>
      <h1 style="font-size: 2.25rem;">Executive KPI & Canteen Analytics</h1>
      <p style="color: var(--color-text-muted);">Real-time monitoring of campus cafeteria revenue, stalls, inventory and student roles.</p>
    </div>
  </div>

  <!-- KPI Cards Grid -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
    <div class="card" style="padding: 1.5rem; border-left: 5px solid #059669;">
      <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Today's Revenue</span>
      <div style="font-size: 2rem; font-weight: 800; color: #059669; margin: 0.25rem 0;"><?= formatCurrency($todaySales) ?></div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted);">Cumulative live sales</span>
    </div>

    <div class="card" style="padding: 1.5rem; border-left: 5px solid #d97706;">
      <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Active Kitchen Queue</span>
      <div style="font-size: 2rem; font-weight: 800; color: #d97706; margin: 0.25rem 0;"><?= $activeOrders ?></div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted);">Orders currently in prep</span>
    </div>

    <div class="card" style="padding: 1.5rem; border-left: 5px solid #2563eb;">
      <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Total Orders Placed</span>
      <div style="font-size: 2rem; font-weight: 800; color: #2563eb; margin: 0.25rem 0;"><?= $totalOrders ?></div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted);">All-time transactions</span>
    </div>

    <div class="card" style="padding: 1.5rem; border-left: 5px solid #7e22ce;">
      <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Registered Users</span>
      <div style="font-size: 2rem; font-weight: 800; color: #7e22ce; margin: 0.25rem 0;"><?= $totalUsers ?></div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted);">Students, Kitchen & Admins</span>
    </div>
  </div>

  <!-- Interactive Charts Grid -->
  <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem; margin-bottom: 3rem;">
    <!-- Peak Ordering Hours Chart -->
    <div class="card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">🕒 Canteen Order Distribution by Slot</h3>
      <canvas id="orderSlotsChart" style="max-height: 260px;"></canvas>
    </div>

    <!-- Top Selling Dishes -->
    <div class="card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">🔥 Best Selling Dishes</h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <?php foreach ($topItems as $ti): ?>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border-subtle); font-size: 0.9rem;">
            <div>
              <strong><?= htmlspecialchars($ti['name']) ?></strong>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);"><?= (int)$ti['total_qty'] ?> plates ordered</div>
            </div>
            <div style="font-weight: 700; color: var(--color-primary);"><?= formatCurrency($ti['total_revenue']) ?></div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>

  <!-- Menu Item Creation & Management -->
  <div class="card" style="padding: 1.75rem; margin-bottom: 3rem;">
    <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Add New Food Item to Canteen Menu</h3>
    <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem;">Register new culinary dishes, combos and pricing.</p>

    <form method="POST" action="admin.php">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Campus Food Stall</label>
          <select name="shop_id" class="form-control" required>
            <?php foreach ($shops as $s): ?>
              <option value="<?= $s['id'] ?>"><?= htmlspecialchars($s['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Category</label>
          <select name="category_id" class="form-control" required>
            <?php foreach ($categories as $c): ?>
              <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Food Name</label>
          <input type="text" name="name" class="form-control" placeholder="e.g. Special Chicken Tehari" required>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Price (৳)</label>
          <input type="number" step="1" name="price" class="form-control" placeholder="150" required>
        </div>

        <div class="form-group">
          <label class="form-label">Calories (kcal)</label>
          <input type="number" name="calories" class="form-control" placeholder="650" required>
        </div>

        <div class="form-group">
          <label class="form-label">Prep Time (min)</label>
          <input type="number" name="preparation_time" class="form-control" placeholder="12" required>
        </div>

        <div class="form-group">
          <label class="form-label">Image Path</label>
          <input type="text" name="image_url" class="form-control" value="images/chicken_biryani.jpg">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" name="description" class="form-control" placeholder="Fragrant chinigura rice cooked with marinated chicken..." required>
      </div>

      <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; cursor: pointer;">
          <input type="checkbox" name="is_special" value="1">
          <span>Mark as Chef's Special</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; cursor: pointer;">
          <input type="checkbox" name="is_combo" value="1">
          <span>Mark as Combo Deal</span>
        </label>
      </div>

      <button type="submit" name="save_item" class="btn btn-primary btn-lg">
        <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
        <span>Create & Publish Food Item</span>
      </button>
    </form>
  </div>

  <!-- Menu Items Stock & Inventory Table -->
  <div class="card" style="padding: 1.75rem; margin-bottom: 3rem; overflow-x: auto;">
    <h3 style="font-size: 1.35rem; margin-bottom: 1rem;">Canteen Menu Inventory (<?= count($allMenuItems) ?> Items)</h3>
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
      <thead style="background: #f8fafc; border-bottom: 2px solid var(--color-border);">
        <tr>
          <th style="padding: 0.75rem;">Dish Name</th>
          <th style="padding: 0.75rem;">Stall</th>
          <th style="padding: 0.75rem;">Category</th>
          <th style="padding: 0.75rem;">Price</th>
          <th style="padding: 0.75rem;">Calories</th>
          <th style="padding: 0.75rem;">Status</th>
          <th style="padding: 0.75rem;">Action</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($allMenuItems as $mi): ?>
          <tr style="border-bottom: 1px solid var(--color-border-subtle);">
            <td style="padding: 0.75rem; font-weight: 700;"><?= htmlspecialchars($mi['name']) ?></td>
            <td style="padding: 0.75rem; color: var(--color-text-muted);"><?= htmlspecialchars($mi['shop_name']) ?></td>
            <td style="padding: 0.75rem;"><?= htmlspecialchars($mi['category_name']) ?></td>
            <td style="padding: 0.75rem; font-weight: 700; color: var(--color-primary);"><?= formatCurrency($mi['price']) ?></td>
            <td style="padding: 0.75rem;"><?= (int)$mi['calories'] ?> kcal</td>
            <td style="padding: 0.75rem;">
              <span class="badge <?= $mi['is_available'] ? 'badge-green' : 'badge-red' ?>">
                <?= $mi['is_available'] ? 'In Stock' : 'Out of Stock' ?>
              </span>
            </td>
            <td style="padding: 0.75rem;">
              <a href="admin.php?toggle_item=<?= $mi['id'] ?>" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">
                Toggle
              </a>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <!-- User & Role Management Table -->
  <div class="card" style="padding: 1.75rem; overflow-x: auto;">
    <h3 style="font-size: 1.35rem; margin-bottom: 1rem;">User Accounts & Role Permissions</h3>
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
      <thead style="background: #f8fafc; border-bottom: 2px solid var(--color-border);">
        <tr>
          <th style="padding: 0.75rem;">User Name</th>
          <th style="padding: 0.75rem;">Student/Staff ID</th>
          <th style="padding: 0.75rem;">Email</th>
          <th style="padding: 0.75rem;">Current Role</th>
          <th style="padding: 0.75rem;">Change Role</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($usersList as $u): ?>
          <tr style="border-bottom: 1px solid var(--color-border-subtle);">
            <td style="padding: 0.75rem; font-weight: 700;"><?= htmlspecialchars($u['name']) ?></td>
            <td style="padding: 0.75rem; color: var(--color-text-muted);"><?= htmlspecialchars($u['student_id']) ?></td>
            <td style="padding: 0.75rem;"><?= htmlspecialchars($u['email']) ?></td>
            <td style="padding: 0.75rem;">
              <span class="badge <?= $u['role'] === 'admin' ? 'badge-purple' : ($u['role'] === 'kitchen' ? 'badge-amber' : 'badge-green') ?>">
                <?= strtoupper($u['role']) ?>
              </span>
            </td>
            <td style="padding: 0.75rem;">
              <form method="POST" action="admin.php" style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                <select name="role" class="form-control" style="font-size: 0.8rem; padding: 0.25rem 0.5rem; width: 110px;">
                  <option value="student" <?= $u['role'] === 'student' ? 'selected' : '' ?>>student</option>
                  <option value="kitchen" <?= $u['role'] === 'kitchen' ? 'selected' : '' ?>>kitchen</option>
                  <option value="admin" <?= $u['role'] === 'admin' ? 'selected' : '' ?>>admin</option>
                </select>
                <button type="submit" name="update_role" class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">Update</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('orderSlotsChart');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM', '2:00 PM'],
        datasets: [{
          label: 'Orders Count',
          data: [12, 19, 25, 22, 28, 24, 18, 14, 8],
          backgroundColor: '#059669',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
