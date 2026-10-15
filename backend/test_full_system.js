const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function verifyAll() {
  console.log('🚀 ==============================================================');
  console.log('🚀 CampusEats Complete End-to-End System Verification');
  console.log('🚀 ==============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [${total.toString().padStart(2, '0')}] PASS: ${name} ${extra ? `(${extra})` : ''}`);
    } else {
      console.error(`❌ [${total.toString().padStart(2, '0')}] FAIL: ${name} ${extra ? `(${extra})` : ''}`);
    }
  }

  // 1. Frontend Server
  try {
    const feRes = await fetch(FRONTEND_URL);
    const html = await feRes.text();
    assert('Frontend Dev Server (Port 3000)', feRes.status === 200 && html.includes('id="root"'), 'Vite HTML served correctly');
  } catch (err) {
    assert('Frontend Dev Server (Port 3000)', false, err.message);
  }

  // 2. Static Asset Verification (Images & Logos)
  const sampleImages = [
    '/images/mutton_kacchi.jpg',
    '/images/beef_khichuri.jpg',
    '/images/chicken_biryani.jpg',
    '/images/chicken_shawarma.jpg',
    '/images/shops/shop1_logo.jpg',
    '/images/shops/shop3_logo.svg'
  ];
  for (const img of sampleImages) {
    try {
      const imgRes = await fetch(`${FRONTEND_URL}${img}`);
      assert(`Static Asset: ${img}`, imgRes.status === 200, `Size: ${imgRes.headers.get('content-length')} bytes`);
    } catch (err) {
      assert(`Static Asset: ${img}`, false, err.message);
    }
  }

  // 3. Backend Health & Database Connectivity
  const health = await fetchJSON(`${BACKEND_URL}/health`);
  assert('Backend Health Check (Port 5000)', health.status === 200 && health.data.status === 'online', `DB Driver: ${health.data.database.driver}`);

  // 4. Auth: Student Login
  const studentLogin = await fetchJSON(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tanvir@campuseats.com', password: 'Student123!' })
  });
  const studentToken = studentLogin.data.token;
  assert('Auth: Student Login', studentLogin.status === 200 && !!studentToken, `User: ${studentLogin.data.user?.name}`);

  // 5. Auth: Kitchen Login
  const kitchenLogin = await fetchJSON(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kitchen@campuseats.com', password: 'Kitchen123!' })
  });
  const kitchenToken = kitchenLogin.data.token;
  assert('Auth: Kitchen Staff Login', kitchenLogin.status === 200 && !!kitchenToken, `Role: ${kitchenLogin.data.user?.role}`);

  // 6. Auth: Admin Login
  const adminLogin = await fetchJSON(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campuseats.com', password: 'Admin123!' })
  });
  const adminToken = adminLogin.data.token;
  assert('Auth: Admin Administrator Login', adminLogin.status === 200 && !!adminToken, `Role: ${adminLogin.data.user?.role}`);

  const studentHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` };
  const kitchenHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${kitchenToken}` };
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };

  // 7. Menu API: Browse all items
  const menu = await fetchJSON(`${BACKEND_URL}/menu`);
  const items = menu.data?.data || [];
  assert('Menu API: Fetch all items', menu.status === 200 && Array.isArray(items) && items.length >= 30, `Total Items: ${items.length}`);

  // 8. Menu API: Browse 5 Campus Shops
  const shops = await fetchJSON(`${BACKEND_URL}/menu/shops`);
  const shopList = shops.data?.data || [];
  assert('Menu API: Fetch 5 Shops', shops.status === 200 && shopList.length === 5, `Shops: ${shopList.map(s => s.name).join(', ')}`);

  // 9. Menu API: Browse Categories
  const categories = await fetchJSON(`${BACKEND_URL}/menu/categories`);
  const catList = categories.data?.data || [];
  assert('Menu API: Fetch Categories', categories.status === 200 && catList.length >= 6, `Categories count: ${catList.length}`);

  // 10. Menu API: Single Item Details
  const singleItem = await fetchJSON(`${BACKEND_URL}/menu/1`);
  const itemData = singleItem.data?.data;
  assert('Menu API: Single Item Details (/menu/1)', singleItem.status === 200 && itemData?.name === 'Authentic Mutton Kacchi', `Price: ৳${itemData?.price}`);

  // 11. Guardrail Check: Daily Budget & Calorie Usage
  const usage = await fetchJSON(`${BACKEND_URL}/auth/daily-usage`, { headers: studentHeaders });
  assert('Guardrail API: Daily Usage', usage.status === 200 && usage.data.success, `Budget: ৳${usage.data.data?.daily_budget}, Calories Limit: ${usage.data.data?.daily_calorie_limit} kcal`);

  // 12. Guardrail Enforcement: Overbudget Block
  const overBudget = await fetchJSON(`${BACKEND_URL}/orders`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      items: [{ menu_item_id: 1, quantity: 100 }],
      pickup_time: '1:30 PM'
    })
  });
  assert('Guardrail Enforcement: Overbudget Order Blocked', overBudget.status === 400 && overBudget.data.guardrail_error === 'budget', overBudget.data.message);

  // 13. Order Placement: Checkout & Wait Time Calculation
  // Reset budget high enough to allow order
  await fetchJSON(`${BACKEND_URL}/auth/profile`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ daily_budget: 10000, daily_calorie_limit: 5000 })
  });
  const orderPlace = await fetchJSON(`${BACKEND_URL}/orders`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      items: [{ menu_item_id: 1, quantity: 1 }],
      pickup_time: '1:15 PM',
      special_instructions: 'System verification test'
    })
  });
  const orderId = orderPlace.data.receipt?.order_id;
  const orderNumber = orderPlace.data.receipt?.order_number;
  assert('Order Checkout & Digital Receipt', orderPlace.status === 201 && !!orderNumber, `Order: ${orderNumber}, Est. Wait Time: ${orderPlace.data.receipt?.estimated_wait_time} min`);

  // 14. Kitchen Queue: Active Orders
  const kQueue = await fetchJSON(`${BACKEND_URL}/orders/kitchen/queue`, { headers: kitchenHeaders });
  assert('Kitchen Queue: Active Orders Inspection', kQueue.status === 200 && kQueue.data.success, `Active Queue Count: ${kQueue.data.count}`);

  // 15. Kitchen Status Transition: Pending -> Preparing -> Ready
  if (orderId) {
    const kPrep = await fetchJSON(`${BACKEND_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: kitchenHeaders,
      body: JSON.stringify({ status: 'Preparing' })
    });
    const kReady = await fetchJSON(`${BACKEND_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: kitchenHeaders,
      body: JSON.stringify({ status: 'Ready' })
    });
    assert('Kitchen Order Status Progression (Preparing -> Ready)', kReady.status === 200 && kReady.data.status === 'Ready', `Order ID: ${orderId}`);
  }

  // 16. Favorites Feature
  const getFavBefore = await fetchJSON(`${BACKEND_URL}/favorites`, { headers: studentHeaders });
  const isFav = (getFavBefore.data?.data || []).some(f => f.id === 1);
  if (!isFav) {
    await fetchJSON(`${BACKEND_URL}/favorites/1`, { method: 'POST', headers: studentHeaders });
  }
  const getFavAfter = await fetchJSON(`${BACKEND_URL}/favorites`, { headers: studentHeaders });
  const favList = getFavAfter.data?.data || [];
  assert('Favorites Feature (Add & List)', getFavAfter.status === 200 && favList.length > 0, `Favorites count: ${favList.length}`);

  // 17. Reviews & Ratings Feature
  const getReviews = await fetchJSON(`${BACKEND_URL}/reviews/item/1`);
  const reviewList = getReviews.data?.data || [];
  assert('Reviews & Ratings Feature', getReviews.status === 200 && reviewList.length > 0, `Total Reviews: ${reviewList.length}`);

  // 18. Weekly Pre-Order Meal Planner
  await fetchJSON(`${BACKEND_URL}/schedules`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ day_of_week: 'Monday', menu_item_id: 1, quantity: 1, pickup_time: '1:00 PM' })
  });
  const getSchedule = await fetchJSON(`${BACKEND_URL}/schedules`, { headers: studentHeaders });
  assert('Weekly Pre-Order Meal Planner', getSchedule.status === 200 && typeof getSchedule.data?.data === 'object', `Scheduled Days verified`);

  // 19. Group Order & Split Payment Feature
  const createGroup = await fetchJSON(`${BACKEND_URL}/groups`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ title: 'CSE Batchmates Lunch', pickup_date: new Date().toISOString().split('T')[0], pickup_time: '1:30 PM' })
  });
  const groupId = createGroup.data.group_id;
  const groupCode = createGroup.data.group_code;
  if (groupId) {
    await fetchJSON(`${BACKEND_URL}/groups/${groupId}/items`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ menu_item_id: 2, quantity: 1 })
    });
    await fetchJSON(`${BACKEND_URL}/groups/${groupId}/pay-share`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ payment_method: 'bKash', transaction_id: 'BK994200' })
    });
    const finalizeGrp = await fetchJSON(`${BACKEND_URL}/groups/${groupId}/finalize`, {
      method: 'POST',
      headers: studentHeaders
    });
    assert('Group Order & Collaborative Payment Flow', finalizeGrp.status === 200 && !!finalizeGrp.data.order_number, `Group Code: ${groupCode}, Order: ${finalizeGrp.data.order_number}`);
  }

  // 20. Loyalty Program & Reward Redemption
  const rewards = await fetchJSON(`${BACKEND_URL}/loyalty/rewards`, { headers: studentHeaders });
  const myLoyalty = await fetchJSON(`${BACKEND_URL}/loyalty/my`, { headers: studentHeaders });
  const rewList = rewards.data?.data || [];
  assert('Loyalty Program & Points Tracking', rewards.status === 200 && myLoyalty.status === 200, `Balance: ${myLoyalty.data?.balance} pts, Available Rewards: ${rewList.length}`);

  // 21. Admin Dashboard Analytics & KPIs
  const adminDash = await fetchJSON(`${BACKEND_URL}/admin/dashboard`, { headers: adminHeaders });
  const adminUsers = await fetchJSON(`${BACKEND_URL}/admin/users`, { headers: adminHeaders });
  const dashData = adminDash.data?.data;
  const userList = adminUsers.data?.data || [];
  assert('Admin Management Dashboard & KPIs', adminDash.status === 200 && adminUsers.status === 200, `Today Sales: ৳${dashData?.today_sales}, Total Users: ${userList.length}`);

  console.log('\n==============================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('==============================================================\n');

  if (passed === total) {
    console.log('🌟 ALL SYSTEM COMPONENTS ARE RUNNING FLAWLESSLY 100%!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyAll().catch(err => {
  console.error('Test execution failure:', err);
  process.exit(1);
});
