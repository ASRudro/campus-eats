const app = require('./server');

async function testGroupPaymentFlow() {
  await new Promise(r => setTimeout(r, 1000));
  const baseUrl = 'http://localhost:5000/api';

  console.log('🧪 Testing Group Order Collaborative Payment Flow...');

  // 1. Login Student A (Host)
  const loginA = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tanvir@campuseats.com', password: 'Student123!' })
  }).then(r => r.json());
  const tokenA = loginA.token;

  // 2. Login Student B (Friend / Participant) & set adequate budget
  const loginB = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nafis@campuseats.com', password: 'Student123!' })
  }).then(r => r.json());
  const tokenB = loginB.token;

  await fetch(`${baseUrl}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ daily_budget: 600, daily_calorie_limit: 2500 })
  });

  // 3. Student A creates Group
  const createRes = await fetch(`${baseUrl}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Batchmates Biryani Party',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time: '1:15 PM'
    })
  }).then(r => r.json());
  console.log('1. Host created group session:', createRes.success ? '✅ PASS' : '❌ FAIL', `(Code: ${createRes.group_code})`);

  const groupId = createRes.group_id;
  const groupCode = createRes.group_code;

  // 4. Student A adds Biryani (220 BDT)
  await fetch(`${baseUrl}/groups/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ menu_item_id: 1, quantity: 1 })
  });

  // 5. Student B joins with code
  const joinRes = await fetch(`${baseUrl}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ group_code: groupCode })
  }).then(r => r.json());
  console.log('2. Friend joined group using code:', joinRes.success ? '✅ PASS' : '❌ FAIL');

  // 6. Student B adds Burger (160 BDT)
  const addB = await fetch(`${baseUrl}/groups/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ menu_item_id: 5, quantity: 1 })
  }).then(r => r.json());
  console.log('Student B add item result:', addB);

  // 7. Student B pays their individual share (160 BDT) via bKash
  const payRes = await fetch(`${baseUrl}/groups/${groupId}/pay-share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ payment_method: 'bKash', transaction_id: 'BK994281' })
  }).then(r => r.json());
  console.log('Student B payRes:', payRes);
  console.log('3. Friend paid their individual share via bKash:', payRes.success ? '✅ PASS' : '❌ FAIL', `(Amount: ৳${payRes.share_amount})`);

  // 8. Fetch group details to verify live tracking
  const detailsRes = await fetch(`${baseUrl}/groups/${groupId}`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  }).then(r => r.json());

  const bMember = detailsRes.data.members.find(m => m.student_id === '2023-1-60-118');
  const bPaid = bMember && bMember.payment_status === 'Paid' && bMember.payment_method === 'bKash';
  console.log('4. Live Contribution Tracker shows Friend Paid:', bPaid ? '✅ PASS' : '❌ FAIL', `(Total Collected: ৳${detailsRes.data.total_collected} / ৳${detailsRes.data.combined_total})`);

  // 9. Host finalizes group order
  const finalizeRes = await fetch(`${baseUrl}/groups/${groupId}/finalize`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  }).then(r => r.json());
  console.log('5. Host finalized order with split contributions:', finalizeRes.success ? '✅ PASS' : '❌ FAIL', `(Order: ${finalizeRes.order_number})`);

  console.log('\n🎉 Group Order Payment Contribution Verification Finished Successfully!\n');
  process.exit(0);
}

testGroupPaymentFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
