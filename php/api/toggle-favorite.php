<?php
header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];
$itemId = (int)($_POST['item_id'] ?? 0);

if ($itemId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID']);
    exit;
}

// Check existing
$stmt = $pdo->prepare("SELECT id FROM favorites WHERE user_id = ? AND menu_item_id = ?");
$stmt->execute([$userId, $itemId]);
$existing = $stmt->fetch();

if ($existing) {
    $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?");
    $stmt->execute([$userId, $itemId]);
    echo json_encode(['success' => true, 'is_favorite' => false]);
} else {
    $stmt = $pdo->prepare("INSERT INTO favorites (user_id, menu_item_id) VALUES (?, ?)");
    $stmt->execute([$userId, $itemId]);
    echo json_encode(['success' => true, 'is_favorite' => true]);
}
