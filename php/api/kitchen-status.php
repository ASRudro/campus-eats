<?php
header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

if (!isLoggedIn() || ($_SESSION['user']['role'] !== 'kitchen' && $_SESSION['user']['role'] !== 'admin')) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$orderId = (int)($_POST['order_id'] ?? 0);
$newStatus = trim($_POST['status'] ?? '');
$validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Picked Up', 'Cancelled'];

if ($orderId <= 0 || !in_array($newStatus, $validStatuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid order ID or status.']);
    exit;
}

$stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
$stmt->execute([$newStatus, $orderId]);

echo json_encode([
    'success' => true,
    'message' => "Order #{$orderId} marked as {$newStatus}.",
    'order_id' => $orderId,
    'status' => $newStatus
]);
