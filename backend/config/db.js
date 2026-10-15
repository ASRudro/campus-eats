const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let dbClient = null;
let dbType = 'mysql';

// Common Seed Data for both MySQL and SQLite
const SHOPS_SEED = [
  [
    1,
    'Campus Kitchen',
    'Daily Rice Bowls, Lunch Meals & Canteen Thalis',
    'Regular Meals / Lunch & Dinner',
    'Your everyday go-to campus cafeteria for fresh, hygienic and filling lunch meals, khichuri, kacchi and student thalis.',
    '/images/shops/shop1_logo.jpg',
    '/images/shops/shop1_logo.jpg',
    4.8,
    '10-15 min',
    'Canteen Building, Ground Floor (Stall #01)',
    '🍛 Regular Meals',
    1
  ],
  [
    2,
    'Bhojon Bilash',
    'Special Deshi Feasts, Biryani & Traditional Delicacies',
    'Deshi & Traditional Food',
    'Authentic Bangladeshi culinary specialty! Serving tender beef tehari, chicken bhuna khichuri, shahi morog polao and chicken chaap.',
    '/images/shops/shop2_logo.jpg',
    '/images/shops/shop2_logo.jpg',
    4.9,
    '12-15 min',
    'Canteen Building, Ground Floor (Stall #02)',
    '🍲 Deshi Feast',
    1
  ],
  [
    3,
    'Varsity Bites',
    'Juicy Burgers, Shawarma, Pasta & Loaded Fries',
    'Fast Food & Snacks',
    'The ultimate campus fast food station for quick class breaks. Crispy chicken burgers, garlic mayo shawarma, cheesy pasta and hot wings.',
    '/images/shops/shop3_logo.svg',
    '/images/shops/shop3_logo.svg',
    4.7,
    '8-12 min',
    'Student Lounge & 1st Floor Gallery (Stall #03)',
    '🍔 Fast Food Hub',
    1
  ],
  [
    4,
    'Fresh Sip Juice Bar',
    '100% Fresh Fruit Blends, Smoothies, Shakes & Lemonades',
    'Fresh Juices & Shakes',
    'Chill out with freshly squeezed seasonal juices, fruit smoothies, thick milkshakes, cold coffee and iced lemonades.',
    '/images/shops/shop4_logo.svg',
    '/images/shops/shop4_logo.svg',
    4.8,
    '3-5 min',
    'Central Courtyard Kiosk (Stall #04)',
    '🥤 Juice & Shakes',
    1
  ],
  [
    5,
    'The Chai Break',
    'Authentic Malai Cha, Hot Brewed Coffee & Crispy Snacks',
    'Tea, Coffee & Adda Snacks',
    'Campus adda is incomplete without our steaming hot Malai Cha, Masala tea, roasted espresso, hot shingara, porota-dal and brownies.',
    '/images/shops/shop5_logo.svg',
    '/images/shops/shop5_logo.svg',
    4.9,
    '2-5 min',
    'Library Courtyard / East Pavilion (Stall #05)',
    '☕ Chai & Adda',
    1
  ]
];

const CATEGORIES_SEED = [
  [1, 'Rice Meals', 'Hearty traditional and continental rice bowls', 'Bowl'],
  [2, 'Fast Food', 'Burgers, sandwiches, wraps, and quick bites', 'Utensils'],
  [3, 'Snacks', 'Crispy sides and finger foods for quick breaks', 'Cookie'],
  [4, 'Drinks', 'Chilled beverages, freshly squeezed juices, and coffee', 'Coffee'],
  [5, 'Desserts', 'Sweet treats and freshly baked pastries', 'Cake'],
  [6, 'Combo Deals', 'Budget-friendly bundled lunch deals', 'Sparkles']
];

const MENU_ITEMS_SEED = [
  // Shop 1: Campus Kitchen
  [1, 1, 1, 'Authentic Mutton Kacchi', 'Old Dhaka style fragrant basmati saffron rice cooked with tender marinated mutton pieces, golden fried potato, boiled egg, and crispy beresta.', 180.00, 780, '/images/mutton_kacchi.jpg', 15, 1, 1, 0],
  [2, 1, 1, 'Authentic Beef Khichuri', 'Slow-cooked roasted moong dal and chinigura rice with spiced beef chunks and green chilies.', 140.00, 720, '/images/beef_khichuri.jpg', 15, 1, 1, 0],
  [3, 1, 1, 'Vegetable Rice with Curry & Dal', 'Fluffy steamed basmati served with seasonal farm-fresh vegetable curry and spiced yellow lentils.', 60.00, 450, '/images/vegetable_rice.jpg', 10, 1, 0, 0],
  [4, 1, 1, 'Egg Fried Rice with Crispy Chicken', 'Fragrant egg fried rice served with crispy golden fried chicken, savory chili sauce, and fresh cucumber salad.', 130.00, 680, '/images/fried_chicken_rice.jpg', 12, 1, 1, 0],
  [5, 1, 1, 'Student Lunch Thali (Chicken Jhal Fry)', 'Fluffy steamed white rice served with spicy Bangladeshi chicken jhal fry in a rich red gravy, yellow dal, and aloo bhorta.', 110.00, 590, '/images/rice_chicken_curry.jpg', 10, 1, 1, 0],
  [6, 1, 1, 'Shahi morog Polao with Egg', 'Aromatic Chinigura rice polao served with succulent Shahi chicken roast leg, boiled egg, fresh onion cucumber salad, and sweet-sour plum chutney.', 120.00, 650, '/images/shahi_morog_polao.jpg', 12, 1, 1, 0],
  [34, 1, 6, 'Kacchi Fiesta Combo', 'Authentic Mutton Kacchi + Fresh Mint Lemonade + Fudgy Chocolate Cake.', 240.00, 1050, '/images/kacchi_combo.jpg', 15, 1, 1, 1],

  // Shop 2: Bhojon Bilash
  [7, 2, 1, 'Dhaka Style Chicken Bhuna Khichuri', 'Chinigura rice & roasted moong dal khichuri with spiced roasted chicken, boiled egg, and crispy fried onions.', 120.00, 640, '/images/chicken_khichuri.jpg', 12, 1, 1, 0],
  [8, 2, 1, 'Old Town Beef Tehari', 'Aromatic mustard oil cooked chinigura rice loaded with succulent cubed beef pieces and fresh green chilies.', 150.00, 750, '/images/beef_tehari.jpg', 14, 1, 1, 0],
  [9, 2, 1, 'Special Chicken Biryani Platter', 'Rich fragrant basmati rice cooked with whole spiced chicken leg quarter, aloo bukhara, and creamy borhani.', 140.00, 710, '/images/chicken_biryani.jpg', 12, 1, 1, 0],
  [10, 2, 3, 'Spicy Chicken Chaap with Butter Porota', 'Tender slow-fried spiced chicken chaap with 2 pieces of hot flaky layered porota and onion salad.', 110.00, 580, '/images/chicken_chaap.jpg', 10, 1, 1, 0],
  [11, 2, 1, 'Shahi morog Polao with Egg', 'Traditional slow-cooked Bangladeshi sweet spiced chicken roast served over buttery fragrant polao rice with a boiled egg.', 120.00, 720, '/images/shahi_morog_polao.jpg', 12, 1, 1, 0],
  [12, 2, 1, 'Special Beef Bhuna Rice Platter', 'Spicy tender beef bhuna in thick onion garlic gravy served with steamed white rice and fresh lime.', 160.00, 690, '/images/rice_chicken_curry.jpg', 12, 1, 0, 0],

  // Shop 3: Varsity Bites
  [13, 3, 2, 'Crispy Chicken Burger', 'Golden fried seasoned chicken patty with melted cheddar, crisp lettuce, and spicy mayo on a toasted brioche bun.', 85.00, 520, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', 10, 1, 1, 0],
  [14, 3, 2, 'Special Chicken Shawarma Wrap', 'Warm pita wrap stuffed with grilled spiced chicken slices, crunchy cabbage, and creamy garlic mayonnaise.', 70.00, 420, '/images/chicken_shawarma.jpg', 8, 1, 1, 0],
  [15, 3, 2, 'Creamy White Sauce Chicken Pasta', 'Al dente penne pasta tossed in garlic parmesan white sauce, topped with grilled chicken cubes and herbs.', 100.00, 600, '/images/creamy_pasta.jpg', 12, 1, 0, 0],
  [16, 3, 3, 'Golden French Fries (Large)', 'Crispy, freshly cut salted potato fries served with zesty garlic dipping mayonnaise.', 45.00, 320, '/images/french_fries.jpg', 6, 1, 0, 0],
  [17, 3, 3, 'Smoky BBQ Chicken Wings (6 pcs)', 'Six pieces of crispy chicken wings glazed in sweet & smoky barbecue sauce with sesame sprinkle.', 85.00, 480, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80', 10, 1, 0, 0],
  [18, 3, 2, 'Grilled Chicken Club Sandwich', 'Herb-marinated grilled chicken breast slices with cucumber, tomatoes, and garlic spread on whole-wheat bread.', 65.00, 410, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80', 8, 1, 0, 0],
  [19, 3, 2, 'Cheesy Loaded Chicken Fries', 'Crispy fries topped with melted mozzarella, minced seasoned chicken, jalapeños, and secret burger sauce.', 95.00, 560, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=80', 8, 1, 1, 0],
  [20, 3, 6, 'Student Rush Burger Combo', 'Crispy Chicken Burger + Golden French Fries + Chilled Cold Coffee at a special discounted campus bundle.', 150.00, 890, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&auto=format&fit=crop&q=80', 12, 1, 1, 1],

  // Shop 4: Fresh Sip Juice Bar
  [21, 4, 4, 'Chilled Cold Coffee with Ice Cream', 'Rich espresso blended with chilled milk, scoop of vanilla ice cream, and chocolate syrup drizzle.', 50.00, 150, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80', 3, 1, 1, 0],
  [22, 4, 4, 'Fresh Mint Lemonade', 'Freshly squeezed lemons with crushed garden mint leaves, Himalayan black salt, and chilled soda.', 30.00, 80, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', 3, 1, 0, 0],
  [23, 4, 4, 'Fresh Mango / Kacha Aam Shorbot', 'Seasonal raw green mango juice blended with roasted cumin, green chili, mint, and rock salt.', 40.00, 110, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80', 3, 1, 1, 0],
  [24, 4, 4, 'Sweet Shahi Dahi Lassi', 'Traditional blended sweet curd lassi topped with pistachio crush and rose cardamom essence.', 45.00, 180, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80', 4, 1, 0, 0],
  [25, 4, 4, 'Fresh Orange & Malta Juice', '100% pure cold-pressed sweet malta and orange juice with zero added artificial sugar.', 50.00, 95, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80', 3, 1, 0, 0],
  [26, 4, 4, 'Creamy Strawberry Milkshake', 'Thick fresh strawberry milkshake whipped with real dairy milk and strawberry syrup.', 65.00, 240, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80', 4, 1, 0, 0],

  // Shop 5: The Chai Break
  [27, 5, 4, 'Special Malai Matka Cha', 'Clay cup boiled creamy condensed milk tea with thick malai layer and cardamom aroma.', 25.00, 90, '/images/malai_matka_cha.jpg', 2, 1, 1, 0],
  [28, 5, 4, 'Hot Masala Ginger Lemon Tea', 'Spiced CTC black tea infused with fresh ginger, cloves, lemon juice, and rock salt.', 15.00, 30, 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80', 2, 1, 0, 0],
  [29, 5, 4, 'Hot Brewed Cappuccino / Espresso', 'Freshly ground roasted Arabica beans brewed with steamed milk foam and cocoa sprinkle.', 40.00, 70, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80', 3, 1, 0, 0],
  [30, 5, 3, 'Crispy Hot Shingara', 'Crispy golden triangular pastry shell packed with spicy potato, cauliflower florets, and roasted peanuts, served with tangy sauce (৳10 / piece).', 10.00, 130, '/images/shingara.jpg', 2, 1, 1, 0],
  [31, 5, 3, 'Crispy Porota with Dal Bhaji', 'Hot flaky layered parathas served with spiced potato-vegetable bhaji, yellow dal, and green chili.', 35.00, 380, '/images/porota_dal_bhaji.jpg', 5, 1, 1, 0],
  [32, 5, 3, 'Crispy Chicken Samucha', 'Flaky golden pastry filled with spicy minced chicken, coriander, and onion filling (৳10 / piece).', 10.00, 120, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', 3, 1, 0, 0],
  [33, 5, 5, 'Fudgy Chocolate Brownie Cake', 'Warm Dutch-cocoa chocolate sponge layered with creamy dark chocolate ganache.', 55.00, 390, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80', 3, 1, 0, 0],
  [35, 5, 4, 'Special Dudh Cha', 'Rich & creamy boiled full-cream milk tea brewed with premium CTC tea leaves and fragrant cardamom.', 15.00, 75, '/images/special_dudh_cha.jpg', 2, 1, 1, 0]
];

const USERS_SEED = [
  [1, 'System Administrator', 'ADM-001', 'admin@campuseats.com', '$2a$10$ksIkBSG2YQKfp1Qri.9PWuvCKYlNeFRzP4cE80lfkAEW5GcVV6wVS', '+8801711000001', 'admin', 500.00, 2500, 100],
  [2, 'Chief Kitchen Chef', 'KIT-001', 'kitchen@campuseats.com', '$2a$10$f21fH5BB7loB2CYCC1FSReP6X4.8KIrStuIQgdvBrVaMEwJxDnfna', '+8801711000002', 'kitchen', 400.00, 2200, 50],
  [3, 'Tanvir Ahmed', '2023-1-60-042', 'tanvir@campuseats.com', '$2a$10$DR0eX9Bqr0gY5nF5uZYFi.i4npSepEHTW9MTw9GAtXNhnVQVAvv06', '+8801711000003', 'student', 350.00, 1800, 45],
  [4, 'Nafis Rahman', '2023-1-60-118', 'nafis@campuseats.com', '$2a$10$DR0eX9Bqr0gY5nF5uZYFi.i4npSepEHTW9MTw9GAtXNhnVQVAvv06', '+8801711000004', 'student', 300.00, 1700, 20]
];

const PICKUP_SLOTS_SEED = [
  [1, '12:00 PM', 1, 25],
  [2, '12:15 PM', 1, 25],
  [3, '12:30 PM', 1, 25],
  [4, '12:45 PM', 1, 25],
  [5, '1:00 PM', 1, 25],
  [6, '1:15 PM', 1, 25],
  [7, '1:30 PM', 1, 25],
  [8, '1:45 PM', 1, 25],
  [9, '2:00 PM', 1, 25]
];

/**
 * Initialize MySQL Database
 */
async function initMysql() {
  const mysql = require('mysql2/promise');
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306');
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'campuseats';

  // 1. Ensure database exists on MySQL server
  const serverConn = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword
  });
  await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await serverConn.end();

  // 2. Create Connection Pool
  const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Verify connection
  const conn = await pool.getConnection();
  conn.release();

  dbType = 'mysql';

  const client = {
    type: 'mysql',
    pool,
    async query(sql, params = []) {
      return await pool.query(sql, params);
    },
    async execute(sql, params = []) {
      return await pool.execute(sql, params);
    }
  };

  // 3. Ensure all MySQL tables and seed data exist
  await bootstrapMysql(client);

  console.log('==============================================================');
  console.log('🟢 [CampusEats] Successfully Connected to MySQL (XAMPP)');
  console.log(`   Host: ${dbHost}:${dbPort} | Database: ${dbName} | User: ${dbUser}`);
  console.log('   All project actions will update your XAMPP phpMyAdmin database!');
  console.log('==============================================================');

  return client;
}

/**
 * Bootstraps MySQL tables & seed data
 */
async function bootstrapMysql(client) {
  // Ensure schema.sql executed if users missing
  const [tables] = await client.query("SHOW TABLES LIKE 'users'");
  if (!tables || tables.length === 0) {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const statements = schemaSql
        .split(';')
        .map((s) => s.replace(/--.*$/gm, '').trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err) {}
      }
    }
  }

  // Ensure shops table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS shops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      tagline VARCHAR(255) DEFAULT NULL,
      category_type VARCHAR(100) NOT NULL,
      description TEXT DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      logo_url VARCHAR(500) DEFAULT NULL,
      rating DECIMAL(2,1) DEFAULT 4.8,
      delivery_time VARCHAR(50) DEFAULT '10-15 min',
      location VARCHAR(100) DEFAULT 'Campus Main Food Court',
      badge VARCHAR(50) DEFAULT NULL,
      is_open BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shop_category (category_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `).catch(() => {});

  // Ensure logo_url column exists in shops
  try {
    const [cols] = await client.query("SHOW COLUMNS FROM shops LIKE 'logo_url'");
    if (!cols || cols.length === 0) {
      await client.query("ALTER TABLE shops ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL AFTER image_url;");
    }
  } catch (err) {}

  // Ensure shop_id column exists in menu_items
  try {
    const [cols] = await client.query("SHOW COLUMNS FROM menu_items LIKE 'shop_id'");
    if (!cols || cols.length === 0) {
      await client.query("ALTER TABLE menu_items ADD COLUMN shop_id INT NOT NULL DEFAULT 1 AFTER id;");
      await client.query("ALTER TABLE menu_items ADD INDEX idx_menu_shop (shop_id);");
    }
  } catch (err) {}

  // Ensure group_order_contributions table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS group_order_contributions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_order_id INT NOT NULL,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending' NOT NULL,
      payment_method VARCHAR(50) DEFAULT NULL,
      transaction_id VARCHAR(100) DEFAULT NULL,
      paid_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_order_id) REFERENCES group_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_group_user_contribution (group_order_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `).catch(() => {});

  // Seed / Update 5 Shops
  for (const shop of SHOPS_SEED) {
    await client.query(`
      INSERT INTO shops (id, name, tagline, category_type, description, image_url, logo_url, rating, delivery_time, location, badge, is_open)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), tagline=VALUES(tagline), category_type=VALUES(category_type), description=VALUES(description), image_url=VALUES(image_url), logo_url=VALUES(logo_url), rating=VALUES(rating), delivery_time=VALUES(delivery_time), location=VALUES(location), badge=VALUES(badge);
    `, shop).catch(() => {});
  }

  // Seed / Update Categories
  for (const cat of CATEGORIES_SEED) {
    await client.query(`
      INSERT INTO categories (id, name, description, icon)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon);
    `, cat).catch(() => {});
  }

  // Seed / Update 34 Menu Items
  for (const item of MENU_ITEMS_SEED) {
    await client.query(`
      INSERT INTO menu_items (id, shop_id, category_id, name, description, price, calories, image_url, preparation_time, is_available, is_special, is_combo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE shop_id=VALUES(shop_id), category_id=VALUES(category_id), name=VALUES(name), description=VALUES(description), price=VALUES(price), calories=VALUES(calories), image_url=VALUES(image_url), preparation_time=VALUES(preparation_time), is_available=VALUES(is_available), is_special=VALUES(is_special), is_combo=VALUES(is_combo);
    `, item).catch(() => {});
  }

  // Seed Users if empty
  const [usersCount] = await client.query('SELECT COUNT(*) as cnt FROM users');
  if (usersCount && usersCount[0] && usersCount[0].cnt === 0) {
    for (const u of USERS_SEED) {
      await client.query(`
        INSERT INTO users (id, name, student_id, email, password_hash, phone, role, daily_budget, daily_calorie_limit, loyalty_points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, u).catch(() => {});
    }
  }

  // Seed Pickup Slots
  for (const slot of PICKUP_SLOTS_SEED) {
    await client.query(`
      INSERT INTO pickup_slots (id, slot_time, is_active, max_orders)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE slot_time=VALUES(slot_time);
    `, slot).catch(() => {});
  }
}

/**
 * Bootstraps SQLite tables & seed data
 */
async function bootstrapSqlite(client) {
  // 1. Create all tables if missing
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      student_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT NULL,
      role TEXT DEFAULT 'student' NOT NULL,
      daily_budget REAL DEFAULT 300.00 NOT NULL,
      daily_calorie_limit INTEGER DEFAULT 1800 NOT NULL,
      loyalty_points INTEGER DEFAULT 0 NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tagline TEXT DEFAULT NULL,
      category_type TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      image_url TEXT DEFAULT NULL,
      logo_url TEXT DEFAULT NULL,
      rating REAL DEFAULT 4.8,
      delivery_time TEXT DEFAULT '10-15 min',
      location TEXT DEFAULT 'Campus Main Food Court',
      badge TEXT DEFAULT NULL,
      is_open INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT NULL,
      icon TEXT DEFAULT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL DEFAULT 1,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      price REAL NOT NULL,
      calories INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      preparation_time INTEGER NOT NULL,
      is_available INTEGER DEFAULT 1 NOT NULL,
      is_special INTEGER DEFAULT 0 NOT NULL,
      is_combo INTEGER DEFAULT 0 NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS pickup_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_time TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1 NOT NULL,
      max_orders INTEGER DEFAULT 20 NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      pickup_date TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      subtotal REAL NOT NULL,
      total_calories INTEGER NOT NULL,
      estimated_wait_time INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending' NOT NULL,
      special_instructions TEXT DEFAULT NULL,
      payment_method TEXT DEFAULT 'Cash on Pickup',
      payment_status TEXT DEFAULT 'Pending',
      transaction_id TEXT DEFAULT NULL,
      paid_at DATETIME NULL DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      calories_at_purchase INTEGER NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, menu_item_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS weekly_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL,
      pickup_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, day_of_week, menu_item_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS group_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_code TEXT NOT NULL UNIQUE,
      creator_user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'Lunch Group' NOT NULL,
      pickup_date TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      status TEXT DEFAULT 'Open' NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS group_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      calories INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      points_cost INTEGER NOT NULL,
      reward_type TEXT DEFAULT 'free_item' NOT NULL,
      menu_item_id INTEGER DEFAULT NULL,
      discount_amount REAL DEFAULT 0.00,
      is_active INTEGER DEFAULT 1 NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS group_order_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'Pending' NOT NULL,
      payment_method TEXT DEFAULT NULL,
      transaction_id TEXT DEFAULT NULL,
      paid_at DATETIME NULL DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_order_id, user_id)
    );
  `);

  // Ensure logo_url column in shops
  try {
    const [shopCols] = await client.query('PRAGMA table_info(shops)');
    const hasLogoUrl = shopCols.some((c) => c.name === 'logo_url');
    if (!hasLogoUrl) {
      await client.query('ALTER TABLE shops ADD COLUMN logo_url TEXT DEFAULT NULL;');
    }
  } catch (err) {}

  // Ensure shop_id column in menu_items
  try {
    const [cols] = await client.query('PRAGMA table_info(menu_items)');
    const hasShopId = cols.some((c) => c.name === 'shop_id');
    if (!hasShopId) {
      await client.query('ALTER TABLE menu_items ADD COLUMN shop_id INTEGER NOT NULL DEFAULT 1;');
    }
  } catch (err) {}

  // Seed 5 Shops
  for (const shop of SHOPS_SEED) {
    await client.query(`
      INSERT OR REPLACE INTO shops (id, name, tagline, category_type, description, image_url, logo_url, rating, delivery_time, location, badge, is_open)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, shop).catch(() => {});
  }

  // Seed 6 Categories
  for (const cat of CATEGORIES_SEED) {
    await client.query(`
      INSERT OR REPLACE INTO categories (id, name, description, icon)
      VALUES (?, ?, ?, ?)
    `, cat).catch(() => {});
  }

  // Seed 34 Menu Items
  for (const item of MENU_ITEMS_SEED) {
    await client.query(`
      INSERT OR REPLACE INTO menu_items (id, shop_id, category_id, name, description, price, calories, image_url, preparation_time, is_available, is_special, is_combo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, item).catch(() => {});
  }

  // Seed Users
  for (const u of USERS_SEED) {
    await client.query(`
      INSERT OR IGNORE INTO users (id, name, student_id, email, password_hash, phone, role, daily_budget, daily_calorie_limit, loyalty_points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, u).catch(() => {});
  }

  // Seed Pickup Slots
  for (const slot of PICKUP_SLOTS_SEED) {
    await client.query(`
      INSERT OR REPLACE INTO pickup_slots (id, slot_time, is_active, max_orders)
      VALUES (?, ?, ?, ?)
    `, slot).catch(() => {});
  }

  // Seed Loyalty Rewards
  const LOYALTY_REWARDS_SEED = [
    [1, 'Free Mint Lemonade', 'Redeem 15 loyalty points for a refreshing chilled Mint Lemonade.', 15, 'free_item', 22, 30.00, 1],
    [2, 'Free Golden Fries', 'Redeem 20 loyalty points for a regular hot basket of French Fries.', 20, 'free_item', 16, 45.00, 1],
    [3, 'Free Chilled Cold Coffee', 'Redeem 25 loyalty points for a rich Chilled Cold Coffee.', 25, 'free_item', 21, 50.00, 1],
    [4, '50 BDT Canteen Voucher', 'Get 50 BDT off any lunch order over 150 BDT.', 30, 'discount_voucher', null, 50.00, 1]
  ];
  for (const rew of LOYALTY_REWARDS_SEED) {
    await client.query(`
      INSERT OR REPLACE INTO loyalty_rewards (id, title, description, points_cost, reward_type, menu_item_id, discount_amount, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, rew).catch(() => {});
  }

  // Seed Sample Reviews
  const SAMPLE_REVIEWS = [
    [1, 3, 1, 5, 'Best Biryani on campus! Packed with flavor, generous mutton piece, and zero queue wait time.'],
    [2, 4, 1, 4, 'Very tasty and hot when picked up at 1:15 PM. Will order again.'],
    [3, 3, 13, 5, 'Super crispy chicken patty. The spicy mayo sauce is incredible!'],
    [4, 4, 21, 5, 'Perfect cold coffee to get through afternoon lectures.']
  ];
  for (const rev of SAMPLE_REVIEWS) {
    await client.query(`
      INSERT OR IGNORE INTO ratings (id, user_id, menu_item_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `, rev).catch(() => {});
  }
}

/**
 * Embedded SQLite Driver
 */
async function initSqlite() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '..', 'campuseats.sqlite');
  const sqliteDb = new sqlite3.Database(dbPath);

  dbType = 'sqlite';

  const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ insertId: this.lastID, affectedRows: this.changes });
      });
    });
  };

  const allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  function adaptSqlForSqlite(sql) {
    let s = sql;
    s = s.replace(/CURDATE\(\)/gi, "date('now')");
    s = s.replace(/CURRENT_DATE\s*-\s*INTERVAL\s*(\d+)\s*DAY/gi, "date('now', '-$1 day')");
    s = s.replace(/CURRENT_DATE/gi, "date('now')");
    if (/ON DUPLICATE KEY UPDATE/i.test(s)) {
      s = s.replace(/^INSERT INTO/i, 'INSERT OR REPLACE INTO');
      s = s.replace(/ON DUPLICATE KEY UPDATE.*$/gim, '');
    }
    return s;
  }

  const client = {
    type: 'sqlite',
    async query(sql, params = []) {
      const adapted = adaptSqlForSqlite(sql);
      const trimmed = adapted.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('SHOW')) {
        const rows = await allAsync(adapted, params);
        return [rows];
      } else {
        const res = await runAsync(adapted, params);
        return [res];
      }
    },
    async execute(sql, params = []) {
      return this.query(sql, params);
    }
  };

  // Run SQLite Bootstrap to guarantee tables & seed data exist
  await bootstrapSqlite(client);

  console.log('⚠️ [CampusEats] Running with embedded SQLite database at: ' + dbPath);
  return client;
}

/**
 * Main database connection entry point
 */
async function initDb() {
  if (dbClient) return dbClient;

  const driver = (process.env.DB_DRIVER || 'mysql').toLowerCase();

  if (driver === 'sqlite') {
    dbClient = await initSqlite();
    return dbClient;
  }

  // Attempt MySQL connection
  try {
    dbClient = await initMysql();
    return dbClient;
  } catch (err) {
    console.error('\n❌ ==============================================================');
    console.error('❌ [CampusEats DB Error] Failed to connect to MySQL in XAMPP!');
    console.error(`   Error details: ${err.message}`);
    console.error('   👉 Please make sure:');
    console.error('      1. XAMPP Control Panel is open.');
    console.error("      2. 'MySQL' service is started (Port: 3306).");
    console.error('      3. Database credentials in backend/.env match your XAMPP setup.');
    console.error('==============================================================\n');

    if (process.env.DB_FALLBACK !== 'false') {
      console.warn('⚠️ [CampusEats] MySQL is offline. Automatically falling back to embedded SQLite database so your app works seamlessly!');
      console.warn('   (Tip: If you want to use MySQL/phpMyAdmin, start MySQL in XAMPP Control Panel and restart the server)\n');
      dbClient = await initSqlite();
      return dbClient;
    }

    throw err;
  }
}

module.exports = {
  getDb: initDb,
  getDbType: () => dbType,
  query: async (sql, params) => {
    const db = await initDb();
    return db.query(sql, params);
  }
};
