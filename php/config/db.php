<?php
// CampusEats Database Connection Configuration (Pure MySQL / XAMPP phpMyAdmin)

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Credentials (Default for XAMPP)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'campuseats');

$pdo = null;

function getDbConnection() {
    global $pdo;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        // 1. Connect to MySQL Server
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
        $tempPdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        
        // Ensure Database Exists in XAMPP
        $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        
        // 2. Connect to campuseats database
        $dsnWithDb = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsnWithDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        // 3. Ensure tables and seed exist
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() === 0) {
            bootstrapMysql($pdo);
        }

        return $pdo;
    } catch (PDOException $e) {
        die("<div style='font-family:sans-serif; padding:2rem; max-width:600px; margin:3rem auto; background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; color:#991b1b;'>
            <h2 style='margin-top:0;'>❌ MySQL Connection Error</h2>
            <p>Could not connect to MySQL server in XAMPP on <strong>" . DB_HOST . ":" . DB_PORT . "</strong>.</p>
            <p><strong>Please ensure:</strong></p>
            <ol>
                <li>XAMPP Control Panel is open.</li>
                <li><strong>'MySQL'</strong> service is started (Port: 3306).</li>
            </ol>
            <p style='font-size:0.85rem; color:#7f1d1d;'>Error details: " . htmlspecialchars($e->getMessage()) . "</p>
        </div>");
    }
}

function bootstrapMysql($conn) {
    $schemaFile = file_exists(__DIR__ . '/../../database/schema.sql') ? __DIR__ . '/../../database/schema.sql' : __DIR__ . '/../database/schema.sql';
    $seedFile = file_exists(__DIR__ . '/../../database/seed.sql') ? __DIR__ . '/../../database/seed.sql' : __DIR__ . '/../database/seed.sql';

    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        $conn->exec($sql);
    }
    if (file_exists($seedFile)) {
        $seedSql = file_get_contents($seedFile);
        $conn->exec($seedSql);
    }
}

$pdo = getDbConnection();
