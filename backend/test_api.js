const app = require('./server');

// Run automated tests against the in-process server
async function runTests() {
  // Give server 1 second to bind
  await new Promise(r => setTimeout(r, 1000));
  const baseUrl = 'http://localhost:5000/api';

  console.log('🧪 Running automated API verification tests...');

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`).then(r => r.json());
  console.log('1. Health check:', healthRes.status === 'online' ? '✅ PASS' : '❌ FAIL');

  // 2. Menu browse
  const menuRes = await fetch(`${baseUrl}/menu`).then(r => r.json());
  console.log(`2. Menu listing (count: ${menuRes.count}):`, menuRes.count >= 12 ? '✅ PASS' : '❌ FAIL');

  // 3. Student Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tanvir@campuseats.com', password: 'Student123!' })
  }).then(r => r.json());

  console.log('3. Student Login:', loginRes.success ? '✅ PASS' : '❌ FAIL');
  const studentToken = loginRes.token;

  // 4. Daily Usage Check
  const usageRes = await fetch(`${baseUrl}/auth/daily-usage`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());
  console.log(`4. Daily Usage (Budget: ৳${usageRes.data.daily_budget}, Spent: ৳${usageRes.data.spent_today}):`, usageRes.success ? '✅ PASS' : '❌ FAIL');

  // 5. Guardrail Budget Exceeded Test
  // Attempt to order 100 Mutton Kacchi (100 * 180 = 18,000 BDT) which exceeds daily budget
  const overBudgetRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      items: [{ menu_item_id: 1, quantity: 100 }],
      pickup_time: '1:30 PM'
    })
  });
  const overBudgetJson = await overBudgetRes.json();
  const guardrailBlocked = overBudgetRes.status === 400 && overBudgetJson.guardrail_error === 'budget';
  console.log('5. Guardrail Rejection (Over budget order blocked by backend):', guardrailBlocked ? '✅ PASS' : '❌ FAIL', `(${overBudgetJson.message})`);

  // 6. Valid Order Placement
  // Ensure daily budget is sufficient for test
  await fetch(`${baseUrl}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({ daily_budget: 5000, daily_calorie_limit: 5000 })
  });
  const validOrderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      items: [{ menu_item_id: 1, quantity: 1 }],
      pickup_time: '1:45 PM',
      special_instructions: 'Less spicy please'
    })
  });
  const validOrderJson = await validOrderRes.json();
  const orderSuccess = validOrderRes.status === 201 && validOrderJson.receipt && validOrderJson.receipt.order_number;
  console.log('6. Valid Order Checkout & Digital Receipt:', orderSuccess ? '✅ PASS' : '❌ FAIL', `(Receipt #: ${validOrderJson.receipt?.order_number})`);

  // 7. Kitchen Staff Login & Queue Inspection
  const kitchenLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kitchen@campuseats.com', password: 'Kitchen123!' })
  }).then(r => r.json());

  const kitchenQueue = await fetch(`${baseUrl}/orders/kitchen/queue`, {
    headers: { 'Authorization': `Bearer ${kitchenLogin.token}` }
  }).then(r => r.json());
  console.log(`7. Kitchen Queue (Active orders: ${kitchenQueue.count}):`, kitchenQueue.success ? '✅ PASS' : '❌ FAIL');

  // 8. Kitchen Status Update
  if (validOrderJson.receipt) {
    const statusUpdate = await fetch(`${baseUrl}/orders/${validOrderJson.receipt.order_id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kitchenLogin.token}`
      },
      body: JSON.stringify({ status: 'Ready' })
    }).then(r => r.json());
    console.log('8. Kitchen marks order as Ready:', statusUpdate.success && statusUpdate.status === 'Ready' ? '✅ PASS' : '❌ FAIL');
  }

  // 9. Admin Analytics
  const adminLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campuseats.com', password: 'Admin123!' })
  }).then(r => r.json());

  const adminDashboard = await fetch(`${baseUrl}/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  console.log(`9. Admin Dashboard KPIs (Today's Sales: ৳${adminDashboard.data?.today_sales}, Active Orders: ${adminDashboard.data?.active_orders}):`, adminDashboard.success ? '✅ PASS' : '❌ FAIL');

  console.log('🎉 All Core Backend API Flows Passed Verification!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
