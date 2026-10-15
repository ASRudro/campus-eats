<?php
require_once __DIR__ . '/../config/db.php';

function isLoggedIn() {
    return isset($_SESSION['user']) && !empty($_SESSION['user']['id']);
}

function currentUser() {
    if (!isLoggedIn()) return null;
    return $_SESSION['user'];
}

function hasRole($role) {
    if (!isLoggedIn()) return false;
    return $_SESSION['user']['role'] === $role;
}

function requireLogin() {
    if (!isLoggedIn()) {
        $_SESSION['flash_error'] = "Please log in to access this page.";
        header("Location: login.php");
        exit;
    }
}

function requireRole($role) {
    requireLogin();
    if ($_SESSION['user']['role'] !== $role && $_SESSION['user']['role'] !== 'admin') {
        $_SESSION['flash_error'] = "Access denied: insufficient permissions.";
        header("Location: index.php");
        exit;
    }
}

function getDailyUsage($userId) {
    global $pdo;
    $today = date('Y-m-d');

    // Get User limits
    $stmt = $pdo->prepare("SELECT daily_budget, daily_calorie_limit, loyalty_points FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    $budget = $user ? (float)$user['daily_budget'] : 350.00;
    $calorieLimit = $user ? (int)$user['daily_calorie_limit'] : 1800;
    $points = $user ? (int)$user['loyalty_points'] : 0;

    // Get today's spending and calories
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(subtotal), 0) as spent_today,
            COALESCE(SUM(total_calories), 0) as calories_today
        FROM orders 
        WHERE user_id = ? AND pickup_date = ? AND status != 'Cancelled'
    ");
    $stmt->execute([$userId, $today]);
    $row = $stmt->fetch();

    $spentToday = $row ? (float)$row['spent_today'] : 0.00;
    $caloriesToday = $row ? (int)$row['calories_today'] : 0;

    $budgetPct = $budget > 0 ? min(100, round(($spentToday / $budget) * 100)) : 0;
    $caloriePct = $calorieLimit > 0 ? min(100, round(($caloriesToday / $calorieLimit) * 100)) : 0;

    return [
        'daily_budget' => $budget,
        'daily_calorie_limit' => $calorieLimit,
        'spent_today' => $spentToday,
        'calories_today' => $caloriesToday,
        'remaining_budget' => max(0, $budget - $spentToday),
        'remaining_calories' => max(0, $calorieLimit - $caloriesToday),
        'budget_percentage' => $budgetPct,
        'calorie_percentage' => $caloriePct,
        'loyalty_points' => $points
    ];
}

function loginUser($email, $password) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([trim($email)]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        unset($user['password_hash']);
        $_SESSION['user'] = $user;
        return ['success' => true, 'user' => $user];
    }
    return ['success' => false, 'message' => 'Invalid email or password.'];
}

function registerUser($name, $studentId, $email, $password, $phone = '') {
    global $pdo;
    
    // Check existing
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR student_id = ?");
    $stmt->execute([$email, $studentId]);
    if ($stmt->fetch()) {
        return ['success' => false, 'message' => 'Email or Student ID is already registered.'];
    }

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    $stmt = $pdo->prepare("
        INSERT INTO users (name, student_id, email, password_hash, phone, role, daily_budget, daily_calorie_limit, loyalty_points)
        VALUES (?, ?, ?, ?, ?, 'student', 350.00, 1800, 20)
    ");
    $stmt->execute([$name, $studentId, $email, $hash, $phone]);
    $id = $pdo->lastInsertId();

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $newUser = $stmt->fetch();
    unset($newUser['password_hash']);
    $_SESSION['user'] = $newUser;

    return ['success' => true, 'user' => $newUser];
}
