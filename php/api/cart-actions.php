<?php
header('Content-Type: application/json');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

$action = $_POST['action'] ?? '';
$itemId = (int)($_POST['item_id'] ?? 0);
$quantity = max(1, (int)($_POST['quantity'] ?? 1));

if ($action === 'add' && $itemId > 0) {
    // Check if food exists
    $stmt = $pdo->prepare("SELECT id, name, price, calories FROM menu_items WHERE id = ? AND is_available = 1");
    $stmt->execute([$itemId]);
    $item = $stmt->fetch();

    if ($item) {
        if (isset($_SESSION['cart'][$itemId])) {
            $_SESSION['cart'][$itemId] += $quantity;
        } else {
            $_SESSION['cart'][$itemId] = $quantity;
        }

        $totalCount = array_sum($_SESSION['cart']);
        echo json_encode([
            'success' => true,
            'message' => "Added {$item['name']} to cart!",
            'cart_count' => $totalCount
        ]);
        exit;
    } else {
        echo json_encode(['success' => false, 'message' => 'Item is currently unavailable.']);
        exit;
    }
}

if ($action === 'update' && $itemId > 0) {
    $qty = (int)($_POST['quantity'] ?? 0);
    if ($qty <= 0) {
        unset($_SESSION['cart'][$itemId]);
    } else {
        $_SESSION['cart'][$itemId] = $qty;
    }
    echo json_encode(['success' => true, 'cart_count' => array_sum($_SESSION['cart'])]);
    exit;
}

if ($action === 'remove' && $itemId > 0) {
    unset($_SESSION['cart'][$itemId]);
    echo json_encode(['success' => true, 'cart_count' => array_sum($_SESSION['cart'])]);
    exit;
}

if ($action === 'clear') {
    $_SESSION['cart'] = [];
    echo json_encode(['success' => true, 'cart_count' => 0]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
