<?php
$pageTitle = "Login – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';

// Quick Demo Login Handler
if (isset($_GET['demo'])) {
    $demoRole = $_GET['demo'];
    if ($demoRole === 'student') {
        loginUser('tanvir@campuseats.com', 'Student123!');
    } elseif ($demoRole === 'kitchen') {
        loginUser('kitchen@campuseats.com', 'Kitchen123!');
        header("Location: kitchen.php");
        exit;
    } elseif ($demoRole === 'admin') {
        loginUser('admin@campuseats.com', 'Admin123!');
        header("Location: admin.php");
        exit;
    }
    header("Location: index.php");
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $res = loginUser($email, $password);
    if ($res['success']) {
        $_SESSION['flash_success'] = "Welcome back, " . htmlspecialchars($res['user']['name']) . "!";
        
        // Redirect based on role
        if ($res['user']['role'] === 'kitchen') {
            header("Location: kitchen.php");
        } elseif ($res['user']['role'] === 'admin') {
            header("Location: admin.php");
        } else {
            $redirect = $_GET['redirect'] ?? 'index.php';
            header("Location: $redirect");
        }
        exit;
    } else {
        $error = $res['message'];
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="max-width: 480px; padding: 3rem 1rem 5rem;">
  <div class="card" style="padding: 2.25rem;">
    <div style="text-align: center; margin-bottom: 2rem;">
      <div class="brand-icon" style="margin: 0 auto 1rem; width: 3.5rem; height: 3.5rem; font-size: 1.5rem;">
        <i data-lucide="utensils"></i>
      </div>
      <h1 style="font-size: 1.85rem; margin-bottom: 0.35rem;">Log In to CampusEats</h1>
      <p style="color: var(--color-text-muted); font-size: 0.9rem;">Skip the lunch queues & manage your student daily budget.</p>
    </div>

    <?php if ($error): ?>
      <div class="flash-alert flash-error" style="margin-bottom: 1.25rem;">
        <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i>
        <span><?= htmlspecialchars($error) ?></span>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php<?= isset($_GET['redirect']) ? '?redirect=' . urlencode($_GET['redirect']) : '' ?>">
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" name="email" class="form-control" placeholder="tanvir@campuseats.com" required>
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" placeholder="••••••••" required>
      </div>

      <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: 1.5rem;">
        <span>Sign In</span>
      </button>
    </form>

    <div style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
      Don't have an account? <a href="register.php" style="color: var(--color-primary); font-weight: 700;">Create Student Account</a>
    </div>

    <!-- Quick Demo Accounts -->
    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border); text-align: center;">
      <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 0.75rem;">
        ⚡ Instant One-Click Demo Logins
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
        <a href="login.php?demo=student" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.5rem 0.25rem;">
          🎓 Student
        </a>
        <a href="login.php?demo=kitchen" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.5rem 0.25rem; color: #d97706;">
          👨‍🍳 Kitchen
        </a>
        <a href="login.php?demo=admin" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.5rem 0.25rem; color: #7e22ce;">
          👨‍💼 Admin
        </a>
      </div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
