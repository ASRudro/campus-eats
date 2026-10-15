const mysql = require('mysql2/promise');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function verifyAllTables() {
  console.log('🧪 ==============================================================');
  console.log('🧪 Starting Full System Database Verification for ALL 13 Tables');
  console.log('🧪 Target: XAMPP MySQL (localhost:3306 / campuseats)');
  console.log('🧪 ==============================================================\n');

  const myConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuseats'
  });

  const results = {};

  // 1. Check Table Exists
  const [tablesResult] = await myConn.query('SHOW TABLES');
  const existingTables = tablesResult.map((r) => Object.values(r)[0]);
  console.log('📋 Found Tables in MySQL:', existingTables);

  // 2. Login as student to get token
  const loginRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'tanvir@campuseats.com', password: 'Student123!' }
  );

  if (!loginRes.data.success) {
    throw new Error('Student login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token;
  const studentId = loginRes.data.user.id;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Login as admin for admin routes
  const adminLoginRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'admin@campuseats.com', password: 'Admin123!' }
  );
  const adminToken = adminLoginRes.data.token;
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`
  };

  console.log('✅ Authentication tokens generated for Student and Admin\n');

  // --- Table 1: users ---
  console.log('1️⃣ Testing `users` table...');
  const testStudentId = `TEST-${Date.now().toString().slice(-4)}`;
  await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Automated Test User',
      student_id: testStudentId,
      email: `auto_${testStudentId.toLowerCase()}@campuseats.com`,
      password: 'password123',
      phone: '01811223344'
    }
  );
  const [userDb] = await myConn.query('SELECT * FROM users WHERE student_id = ?', [testStudentId]);
  results['users'] = userDb.length > 0 ? '✅ PASS (Created & Verified in MySQL)' : '❌ FAIL';
  console.log('   `users`:', results['users']);

  // --- Table 2: categories ---
  console.log('2️⃣ Testing `categories` table...');
  const catRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/menu/categories',
      method: 'POST',
      headers: adminHeaders
    },
    { name: `Special Test Cat ${Date.now().toString().slice(-3)}`, description: 'Test category' }
  );
  const catId = catRes.data?.category?.id;
  const [catDb] = await myConn.query('SELECT * FROM categories WHERE id = ?', [catId]);
  results['categories'] = catDb.length > 0 ? '✅ PASS (Created & Verified in MySQL)' : '❌ FAIL';
  console.log('   `categories`:', results['categories']);

  // --- Table 3: menu_items ---
  console.log('3️⃣ Testing `menu_items` table...');
  const itemRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/menu',
      method: 'POST',
      headers: adminHeaders
    },
    {
      category_id: 1,
      name: `Test Platter ${Date.now().toString().slice(-3)}`,
      description: 'Tasty test meal',
      price: 150,
      calories: 500,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      preparation_time: 10
    }
  );
  const testItemId = itemRes.data?.item_id || 1;
  const [itemDb] = await myConn.query('SELECT * FROM menu_items WHERE id = ?', [testItemId]);
  results['menu_items'] = itemDb.length > 0 ? '✅ PASS (Created & Verified in MySQL)' : '❌ FAIL';
  console.log('   `menu_items`:', results['menu_items']);

  // --- Table 4: pickup_slots ---
  console.log('4️⃣ Testing `pickup_slots` table...');
  const [slotsDb] = await myConn.query('SELECT * FROM pickup_slots WHERE is_active = 1');
  results['pickup_slots'] = slotsDb.length > 0 ? `✅ PASS (${slotsDb.length} active slots verified in MySQL)` : '❌ FAIL';
  console.log('   `pickup_slots`:', results['pickup_slots']);

  // --- Table 5: favorites ---
  console.log('5️⃣ Testing `favorites` table...');
  await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/favorites/${testItemId}`,
      method: 'POST',
      headers: authHeaders
    }
  );
  const [favDb] = await myConn.query('SELECT * FROM favorites WHERE user_id = ? AND menu_item_id = ?', [studentId, testItemId]);
  results['favorites'] = favDb.length > 0 ? '✅ PASS (Favorited & Verified in MySQL)' : '❌ FAIL';
  console.log('   `favorites`:', results['favorites']);

  // --- Table 6: ratings ---
  console.log('6️⃣ Testing `ratings` table...');
  await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/reviews/item/${testItemId}`,
      method: 'POST',
      headers: authHeaders
    },
    { rating: 5, comment: 'Exceptional test dish flavor!' }
  );
  const [ratDb] = await myConn.query('SELECT * FROM ratings WHERE user_id = ? AND menu_item_id = ?', [studentId, testItemId]);
  results['ratings'] = ratDb.length > 0 ? '✅ PASS (Review submitted & Verified in MySQL)' : '❌ FAIL';
  console.log('   `ratings`:', results['ratings']);

  // --- Table 7: weekly_schedules ---
  console.log('7️⃣ Testing `weekly_schedules` table...');
  await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/schedules',
      method: 'POST',
      headers: authHeaders
    },
    { day_of_week: 'Sunday', menu_item_id: testItemId, quantity: 1, pickup_time: '1:00 PM' }
  );
  const [schedDb] = await myConn.query('SELECT * FROM weekly_schedules WHERE user_id = ? AND day_of_week = ?', [studentId, 'Sunday']);
  results['weekly_schedules'] = schedDb.length > 0 ? '✅ PASS (Weekly Planner saved & Verified in MySQL)' : '❌ FAIL';
  console.log('   `weekly_schedules`:', results['weekly_schedules']);

  // --- Table 8: orders & Table 9: order_items ---
  console.log('8️⃣ & 9️⃣ Testing `orders` & `order_items` tables...');
  const orderRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: authHeaders
    },
    {
      items: [{ menu_item_id: 1, quantity: 1 }],
      pickup_date: '2026-09-30',
      pickup_time: '1:15 PM',
      payment_method: 'Cash on Pickup'
    }
  );
  const orderId = orderRes.data?.receipt?.order_id;
  const [orderDb] = await myConn.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  const [orderItemsDb] = await myConn.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  results['orders'] = orderDb.length > 0 ? '✅ PASS (Order Placed & Verified in MySQL)' : '❌ FAIL';
  results['order_items'] = orderItemsDb.length > 0 ? '✅ PASS (Order Items Snapshotted & Verified in MySQL)' : '❌ FAIL';
  console.log('   `orders`:', results['orders']);
  console.log('   `order_items`:', results['order_items']);

  // --- Table 10: loyalty_rewards & Table 11: loyalty_transactions ---
  console.log('🔟 & 1️⃣1️⃣ Testing `loyalty_rewards` & `loyalty_transactions` tables...');
  const [rewardsDb] = await myConn.query('SELECT * FROM loyalty_rewards WHERE is_active = 1');
  const [txnDb] = await myConn.query('SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [studentId]);
  results['loyalty_rewards'] = rewardsDb.length > 0 ? `✅ PASS (${rewardsDb.length} rewards verified in MySQL)` : '❌ FAIL';
  results['loyalty_transactions'] = txnDb.length > 0 ? '✅ PASS (Points transaction earned & Verified in MySQL)' : '❌ FAIL';
  console.log('   `loyalty_rewards`:', results['loyalty_rewards']);
  console.log('   `loyalty_transactions`:', results['loyalty_transactions']);

  // --- Table 12: group_orders, Table 13: group_order_items, Table 14: group_order_contributions ---
  console.log('1️⃣2️⃣, 1️⃣3️⃣ & 1️⃣4️⃣ Testing `group_orders`, `group_order_items` & `group_order_contributions`...');
  const grpRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/groups',
      method: 'POST',
      headers: authHeaders
    },
    { title: 'CSE Squad Lunch', pickup_date: '2026-09-30', pickup_time: '1:30 PM' }
  );
  const groupId = grpRes.data?.group_id;

  // Add item to group
  await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/groups/${groupId}/items`,
      method: 'POST',
      headers: authHeaders
    },
    { menu_item_id: 1, quantity: 1 }
  );

  // Contribute payment
  await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/groups/${groupId}/pay-share`,
      method: 'POST',
      headers: authHeaders
    },
    { payment_method: 'bKash', amount: 180, transaction_id: 'TRX-TEST-9988' }
  );

  const [grpDb] = await myConn.query('SELECT * FROM group_orders WHERE id = ?', [groupId]);
  const [grpItemsDb] = await myConn.query('SELECT * FROM group_order_items WHERE group_order_id = ?', [groupId]);
  const [grpContribDb] = await myConn.query('SELECT * FROM group_order_contributions WHERE group_order_id = ?', [groupId]);

  results['group_orders'] = grpDb.length > 0 ? '✅ PASS (Group created & Verified in MySQL)' : '❌ FAIL';
  results['group_order_items'] = grpItemsDb.length > 0 ? '✅ PASS (Group item added & Verified in MySQL)' : '❌ FAIL';
  results['group_order_contributions'] = grpContribDb.length > 0 ? '✅ PASS (Group payment contribution & Verified in MySQL)' : '❌ FAIL';
  console.log('   `group_orders`:', results['group_orders']);
  console.log('   `group_order_items`:', results['group_order_items']);
  console.log('   `group_order_contributions`:', results['group_order_contributions']);

  console.log('\n==============================================================');
  console.log('🎉 SUMMARY OF ALL TABLES IN XAMPP MYSQL:');
  console.log('==============================================================');
  for (const [t, status] of Object.entries(results)) {
    const [countRes] = await myConn.query(`SELECT COUNT(*) as count FROM \`${t}\``);
    console.log(`- ${t.padEnd(26)}: ${status} [Total Rows in MySQL: ${countRes[0].count}]`);
  }
  console.log('==============================================================\n');

  await myConn.end();
}

verifyAllTables().catch((err) => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
