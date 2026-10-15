-- =======================================================
-- CampusEats - University Canteen Food Pre-Ordering System
-- Database Schema (MySQL Compatible)
-- =======================================================

CREATE DATABASE IF NOT EXISTS campuseats;
USE campuseats;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('student', 'kitchen', 'admin') DEFAULT 'student' NOT NULL,
    daily_budget DECIMAL(10,2) DEFAULT 300.00 NOT NULL,
    daily_calorie_limit INT DEFAULT 1800 NOT NULL,
    loyalty_points INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SHOPS TABLE (Campus Food Stalls / Canteens)
CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(255) DEFAULT NULL,
    category_type VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    rating DECIMAL(2,1) DEFAULT 4.8,
    delivery_time VARCHAR(50) DEFAULT '10-15 min',
    location VARCHAR(100) DEFAULT 'Campus Main Food Court',
    badge VARCHAR(50) DEFAULT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_shop_category (category_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL DEFAULT 1,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    price DECIMAL(10,2) NOT NULL,
    calories INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    preparation_time INT NOT NULL COMMENT 'in minutes',
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    is_special BOOLEAN DEFAULT FALSE NOT NULL,
    is_combo BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_menu_shop (shop_id),
    INDEX idx_menu_category (category_id),
    INDEX idx_menu_special (is_special),
    INDEX idx_menu_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PICKUP SLOTS TABLE
CREATE TABLE IF NOT EXISTS pickup_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_time VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    max_orders INT DEFAULT 20 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total_calories INT NOT NULL,
    estimated_wait_time INT NOT NULL COMMENT 'calculated preparation + queue wait time in minutes',
    status ENUM('Pending', 'Confirmed', 'Preparing', 'Ready', 'Picked Up', 'Cancelled') DEFAULT 'Pending' NOT NULL,
    special_instructions TEXT DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash on Pickup',
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    transaction_id VARCHAR(100) DEFAULT NULL,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_user (user_id),
    INDEX idx_order_date (pickup_date),
    INDEX idx_order_status (status),
    INDEX idx_order_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ORDER ITEMS TABLE (Snapshots price and calories at purchase time)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    calories_at_purchase INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
    INDEX idx_item_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_fav (user_id, menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RATINGS & REVIEWS TABLE
CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_rating_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. WEEKLY SCHEDULES TABLE (Saturday-Wednesday meal planner)
CREATE TABLE IF NOT EXISTS weekly_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    day_of_week ENUM('Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday') NOT NULL,

    menu_item_id INT NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    pickup_time VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_day_item (user_id, day_of_week, menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. GROUP ORDERS TABLE
CREATE TABLE IF NOT EXISTS group_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_code VARCHAR(20) NOT NULL UNIQUE,
    creator_user_id INT NOT NULL,
    title VARCHAR(100) DEFAULT 'Lunch Group' NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time VARCHAR(20) NOT NULL,
    status ENUM('Open', 'Finalized', 'Cancelled') DEFAULT 'Open' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_code (group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. GROUP ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS group_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_order_id INT NOT NULL,
    user_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    calories INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_order_id) REFERENCES group_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. LOYALTY REWARDS TABLE
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    points_cost INT NOT NULL,
    reward_type ENUM('free_item', 'discount_voucher') DEFAULT 'free_item' NOT NULL,
    menu_item_id INT DEFAULT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. LOYALTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_loyalty_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. GROUP ORDER CONTRIBUTIONS (Split the Bill Collaborative Payment)
CREATE TABLE IF NOT EXISTS group_order_contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_order_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending' NOT NULL,
    payment_method VARCHAR(50) DEFAULT NULL COMMENT 'e.g. bKash, Nagad, Canteen Wallet, Cash',
    transaction_id VARCHAR(100) DEFAULT NULL,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_order_id) REFERENCES group_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user_contribution (group_order_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
