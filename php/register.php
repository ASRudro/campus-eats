<?php
$pageTitle = "Register – CampusEats";
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $studentId = trim($_POST['student_id'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $phone = trim($_POST['phone'] ?? '');

    if (empty($name) || empty($studentId) || empty($email) || empty($password)) {
        $error = "Please fill in all required fields.";
    } else {
        $res = registerUser($name, $studentId, $email, $password, $phone);
        if ($res['success']) {
            $_SESSION['flash_success'] = "Account created successfully! Welcome to CampusEats.";
            header("Location: index.php");
            exit;
        } else {
            $error = $res['message'];
        }
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="container" style="max-width: 520px; padding: 3rem 1rem 5rem;">
  <div class="card" style="padding: 2.25rem;">
    <div style="text-align: center; margin-bottom: 2rem;">
      <h1 style="font-size: 1.85rem; margin-bottom: 0.35rem;">Create Student Account</h1>
      <p style="color: var(--color-text-muted); font-size: 0.9rem;">Join CampusEats to pre-order lunch and track spending.</p>
    </div>

    <?php if ($error): ?>
      <div class="flash-alert flash-error" style="margin-bottom: 1.25rem;">
        <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i>
        <span><?= htmlspecialchars($error) ?></span>
      </div>
    <?php endif; ?>

    <form method="POST" action="register.php">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" name="name" class="form-control" placeholder="e.g. Tanvir Ahmed" required>
      </div>

      <div class="form-group">
        <label class="form-label">University Student ID</label>
        <input type="text" name="student_id" class="form-control" placeholder="e.g. 2023-1-60-042" required>
      </div>

      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" name="email" class="form-control" placeholder="student@university.edu" required>
      </div>

      <div class="form-group">
        <label class="form-label">Mobile Phone (Optional for SMS Alerts)</label>
        <input type="tel" name="phone" class="form-control" placeholder="+8801700000000">
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" placeholder="••••••••" required>
      </div>

      <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: 1.5rem;">
        <span>Create Account & Start Ordering</span>
      </button>
    </form>

    <div style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
      Already registered? <a href="login.php" style="color: var(--color-primary); font-weight: 700;">Sign In</a>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
