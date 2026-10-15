<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';

function validateOrderGuardrail($userId, $orderTotal, $orderCalories, $pickupDate = null) {
    global $pdo;
    $targetDate = $pickupDate ?: date('Y-m-d');

    // Get user limits
    $stmt = $pdo->prepare("SELECT daily_budget, daily_calorie_limit FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        return ['allowed' => true];
    }

    $dailyBudget = (float)$user['daily_budget'];
    $dailyCalories = (int)$user['daily_calorie_limit'];

    // Get today's already ordered total
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(subtotal), 0) as total_spent,
            COALESCE(SUM(total_calories), 0) as total_calories
        FROM orders 
        WHERE user_id = ? AND pickup_date = ? AND status != 'Cancelled'
    ");
    $stmt->execute([$userId, $targetDate]);
    $spent = $stmt->fetch();

    $currentSpent = (float)$spent['total_spent'];
    $currentCalories = (int)$spent['total_calories'];

    $projectedBudget = $currentSpent + $orderTotal;
    $projectedCalories = $currentCalories + $orderCalories;

    // Check budget guardrail
    if ($dailyBudget > 0 && $projectedBudget > $dailyBudget) {
        $remaining = max(0, $dailyBudget - $currentSpent);
        return [
            'allowed' => false,
            'reason' => 'budget',
            'message' => "Order exceeds your daily spending limit of ৳" . number_format($dailyBudget, 2) . ". You have already ordered ৳" . number_format($currentSpent, 2) . " today. (Remaining budget: ৳" . number_format($remaining, 2) . ")."
        ];
    }

    // Check calorie guardrail
    if ($dailyCalories > 0 && $projectedCalories > ($dailyCalories * 1.5)) {
        return [
            'allowed' => false,
            'reason' => 'calorie',
            'message' => "Order significantly exceeds your daily calorie target of {$dailyCalories} kcal."
        ];
    }

    return [
        'allowed' => true,
        'remaining_budget' => max(0, $dailyBudget - $projectedBudget),
        'remaining_calories' => max(0, $dailyCalories - $projectedCalories)
    ];
}

function calculateWaitTime($prepTimes = [], $pickupDate = null) {
    global $pdo;
    $dateToCheck = $pickupDate ?: date('Y-m-d');
    $basePrep = !empty($prepTimes) ? max($prepTimes) : 10;

    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as active_count 
            FROM orders 
            WHERE pickup_date = ? AND status IN ('Pending', 'Preparing')
        ");
        $stmt->execute([$dateToCheck]);
        $row = $stmt->fetch();
        $activeAhead = $row ? (int)$row['active_count'] : 0;
        
        $queueDelay = $activeAhead * 3; // 3 minutes per active order ahead
        return max($basePrep, $basePrep + $queueDelay);
    } catch (Exception $e) {
        return 15;
    }
}

function formatCurrency($amount) {
    return '৳' . number_format((float)$amount, 2);
}
