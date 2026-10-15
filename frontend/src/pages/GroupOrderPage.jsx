import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveShop, SHOP_METADATA } from '../context/CartContext';
import { 
  Users, 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Trash2, 
  ArrowRight, 
  CreditCard,
  Wallet,
  AlertCircle,
  Sparkles,
  X,
  CheckCircle2,
  Store,
  MapPin
} from 'lucide-react';

export default function GroupOrderPage() {
  const { user, isAuthenticated } = useAuth();

  const [activeGroup, setActiveGroup] = useState(null);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [createTitle, setCreateTitle] = useState('Study Group Lunch');
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createTime, setCreateTime] = useState('1:00 PM');
  const [pickupSlots, setPickupSlots] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Add Item to Group state
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [addItemError, setAddItemError] = useState(null);

  // Payment Contribution Modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState('bKash');
  const [contributionAmount, setContributionAmount] = useState('');
  const [mobileNumber, setMobileNumber] = useState('01711000003');
  const [pinOrTxn, setPinOrTxn] = useState('1234');
  const [submittingPayment, setSubmittingPayment] = useState(false);


  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [slotsRes, menuRes] = await Promise.all([
          api.get('/menu/pickup-slots'),
          api.get('/menu?available_only=true')
        ]);
        if (slotsRes.data.success) {
          setPickupSlots(slotsRes.data.data);
          if (slotsRes.data.data.length > 0) setCreateTime(slotsRes.data.data[0].slot_time);
        }
        if (menuRes.data.success) {
          setMenuItems(menuRes.data.data);
          if (menuRes.data.data.length > 0) setSelectedMenuItem(menuRes.data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load group metadata:', err);
      }
    }
    loadData();
  }, []);

  const refreshGroupDetails = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      if (res.data.success) {
        setActiveGroup(res.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh group:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionNotice(null);
    try {
      const res = await api.post('/groups', {
        title: createTitle,
        pickup_date: createDate,
        pickup_time: createTime
      });

      if (res.data.success) {
        await refreshGroupDetails(res.data.group_id);
      }
    } catch (err) {
      console.error('Create group error:', err);
      alert(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!groupCodeInput.trim()) return;

    setLoading(true);
    setActionNotice(null);
    try {
      const res = await api.post('/groups/join', {
        group_code: groupCodeInput.trim().toUpperCase()
      });

      if (res.data.success) {
        await refreshGroupDetails(res.data.group_id);
      }
    } catch (err) {
      console.error('Join group error:', err);
      alert(err.response?.data?.message || 'Failed to join group. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMyItem = async (e) => {
    e.preventDefault();
    if (!activeGroup || !selectedMenuItem) return;

    setAddItemError(null);
    try {
      const res = await api.post(`/groups/${activeGroup.id}/items`, {
        menu_item_id: selectedMenuItem,
        quantity: itemQuantity
      });

      if (res.data.success) {
        setItemQuantity(1);
        await refreshGroupDetails(activeGroup.id);
      }
    } catch (err) {
      console.error('Add item error:', err);
      setAddItemError(err.response?.data?.message || 'Failed to add item to group.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await api.delete(`/groups/items/${itemId}`);
      if (res.data.success) {
        await refreshGroupDetails(activeGroup.id);
      }
    } catch (err) {
      console.error('Remove item error:', err);
      alert(err.response?.data?.message || 'Failed to remove item.');
    }
  };

  const handleOpenPayModal = (suggestedAmount = null) => {
    if (suggestedAmount !== null && suggestedAmount !== undefined && suggestedAmount > 0) {
      setContributionAmount(suggestedAmount.toString());
    } else if (myMemberData && myMemberData.subtotal > 0 && myMemberData.payment_status !== 'Paid') {
      setContributionAmount(myMemberData.subtotal.toString());
    } else if (activeGroup && (activeGroup.combined_total - (activeGroup.total_collected || 0)) > 0) {
      setContributionAmount(Math.max(0, activeGroup.combined_total - (activeGroup.total_collected || 0)).toString());
    } else {
      setContributionAmount('100');
    }
    setPayModalOpen(true);
  };

  // Submit Collaborative Payment Contribution
  const handleContributePayment = async (e) => {
    e.preventDefault();
    if (!activeGroup) return;

    const amt = parseFloat(contributionAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid contribution amount greater than ৳0.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.post(`/groups/${activeGroup.id}/pay-share`, {
        amount: amt,
        payment_method: selectedPayMethod,
        transaction_id: pinOrTxn ? `${selectedPayMethod.toUpperCase()}-${pinOrTxn}` : null
      });

      if (res.data.success) {
        setPayModalOpen(false);
        setActionNotice(res.data.message);
        await refreshGroupDetails(activeGroup.id);
      }
    } catch (err) {
      console.error('Payment contribution error:', err);
      alert(err.response?.data?.message || 'Failed to process payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };


  const handleFinalizeGroup = async () => {
    if (!activeGroup) return;
    if (!confirm('Are you sure you want to finalize this group order and send it to the kitchen?')) return;

    setLoading(true);
    try {
      const res = await api.post(`/groups/${activeGroup.id}/finalize`);
      if (res.data.success) {
        setActionNotice(`Group Order finalized successfully! Order Number: ${res.data.order_number}`);
        await refreshGroupDetails(activeGroup.id);
      }
    } catch (err) {
      console.error('Finalize error:', err);
      alert(err.response?.data?.message || 'Failed to finalize group order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (activeGroup?.group_code) {
      navigator.clipboard.writeText(activeGroup.group_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Find currently logged-in user's member object in the group
  const myMemberData = activeGroup?.members?.find(m => m.user_id === user?.id);

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={28} color="#059669" /> Collaborative Group Ordering
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Pool orders with friends, split the bill automatically, and contribute your individual shares via bKash, Nagad, Wallet, or Cash.
        </p>
      </div>

      {!activeGroup ? (
        /* Create or Join Group Forms */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          
          {/* Create New Group Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Create a Group Order
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              You will be the group host and receive a shareable code to invite your friends.
            </p>

            <form onSubmit={handleCreateGroup}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Group Name / Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. CSE 4th Year Batch Lunch"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Pickup Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={createDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCreateDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Pickup Time Slot
                </label>
                <select
                  className="input-field"
                  value={createTime}
                  onChange={(e) => setCreateTime(e.target.value)}
                  required
                >
                  {pickupSlots.map(s => (
                    <option key={s.id} value={s.slot_time}>{s.slot_time}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Creating Group...' : 'Create Group Session'}
              </button>
            </form>
          </div>

          {/* Join Existing Group Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Join With Group Code
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Have a code from a classmate? Enter it below to add your lunch selection and pay your share.
            </p>

            <form onSubmit={handleJoinGroup}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Enter Group Code
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. GRP-A8F92"
                  value={groupCodeInput}
                  onChange={(e) => setGroupCodeInput(e.target.value)}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '1.1rem' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {loading ? 'Verifying Code...' : 'Join Group Lobby'}
              </button>
            </form>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#059669" /> Personal daily budget & calorie limits apply to each member individually.
            </div>
          </div>

        </div>
      ) : (
        /* Active Group Order Lobby */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Group Header Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-green">Group Lobby</span>
                <span className={`badge ${activeGroup.status === 'Open' ? 'badge-blue' : 'badge-green'}`}>
                  {activeGroup.status}
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                {activeGroup.title}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                Host: <strong>{activeGroup.creator_name}</strong> • Scheduled Pickup: <strong>{activeGroup.pickup_date} at {activeGroup.pickup_time}</strong>
              </div>
            </div>

            {/* Shareable Group Code Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  INVITE CODE
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669', letterSpacing: '0.08em' }}>
                  {activeGroup.group_code}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                title="Copy code to clipboard"
              >
                {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Group Payment Contribution Tracker Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wallet size={20} color="#059669" /> Group Payment Contribution Tracker
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Friends contribute their individual shares before the host finalizes the order.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: activeGroup.total_collected >= activeGroup.combined_total && activeGroup.combined_total > 0 ? '#059669' : '#0f172a' }}>
                  ৳{(activeGroup.total_collected || 0).toFixed(0)}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                  {' '}/ ৳{(activeGroup.combined_total || 0).toFixed(0)} Paid
                </span>
                <span className={`badge ${activeGroup.total_collected >= activeGroup.combined_total && activeGroup.combined_total > 0 ? 'badge-green' : 'badge-amber'}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                  {activeGroup.contribution_percent || 0}% Contributed
                </span>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div style={{
              height: '10px',
              backgroundColor: '#f1f5f9',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%',
                width: `${activeGroup.contribution_percent || 0}%`,
                backgroundColor: activeGroup.contribution_percent >= 100 ? '#10b981' : '#f59e0b',
                borderRadius: '9999px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            {/* Current user action banner */}
            {activeGroup.status === 'Open' && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '0.75rem',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                    {myMemberData && myMemberData.subtotal > 0
                      ? `Your Items: ৳${myMemberData.subtotal.toFixed(2)} • You Contributed: ৳${(myMemberData.contributed_amount || 0).toFixed(2)}`
                      : `Group Total Bill: ৳${(activeGroup.combined_total || 0).toFixed(2)} • Due: ৳${Math.max(0, (activeGroup.combined_total || 0) - (activeGroup.total_collected || 0)).toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                    Enter the amount you want to pay for yourself or chip in for the group pool.
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPayModal()}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', backgroundColor: '#059669' }}
                >
                  <CreditCard size={15} /> {myMemberData && myMemberData.contributed_amount > 0 ? 'Contribute More' : 'Contribute / Pay Amount'}
                </button>
              </div>
            )}

          </div>

          {actionNotice && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1rem', borderRadius: '0.75rem', fontWeight: 600 }}>
              {actionNotice}
            </div>
          )}

          {/* Add Food Selection Form (Only if Open) */}
          {activeGroup.status === 'Open' && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '1.25rem',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                Add Food to Your Tray
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                Your personal daily budget (৳{user?.daily_budget}) and calorie limit ({user?.daily_calorie_limit} kcal) are checked individually.
              </p>

              {addItemError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.6rem', borderRadius: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={15} /> {addItemError}
                </div>
              )}

              <form onSubmit={handleAddMyItem} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 280px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Select Food (Organized by Campus Stall)
                  </label>
                  <select
                    className="input-field"
                    value={selectedMenuItem}
                    onChange={(e) => setSelectedMenuItem(e.target.value)}
                    required
                  >
                    {Object.values(SHOP_METADATA).map(stall => {
                      const stallItems = menuItems.filter(item => (item.shop_id === stall.id) || (!item.shop_id && resolveShop(item).id === stall.id));
                      if (stallItems.length === 0) return null;
                      return (
                        <optgroup key={stall.id} label={`${stall.badge} ${stall.name} (${stall.stall}) — ${stall.location}`}>
                          {stallItems.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} — ৳{item.price} ({item.calories} kcal)
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div style={{ width: '90px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input-field"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: '42px', padding: '0 1.25rem' }}
                >
                  <Plus size={16} /> Add to Group
                </button>
              </form>
            </div>
          )}

          {/* Members Items Breakdown */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
              Group Members & Shared Bill Breakdown ({activeGroup.members?.length || 0})
            </h3>

            {/* Participating Campus Stalls Breakdown */}
            {(() => {
              const groupStallsMap = {};
              activeGroup.members?.forEach(m => {
                m.items?.forEach(it => {
                  const stall = resolveShop(it);
                  if (!groupStallsMap[stall.id]) {
                    groupStallsMap[stall.id] = {
                      ...stall,
                      itemsCount: 0,
                      subtotal: 0
                    };
                  }
                  groupStallsMap[stall.id].itemsCount += it.quantity;
                  groupStallsMap[stall.id].subtotal += (it.unit_price * it.quantity);
                });
              });
              const participatingStalls = Object.values(groupStallsMap);

              if (participatingStalls.length === 0) return null;

              return (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Store size={16} color="#059669" /> Participating Campus Stalls ({participatingStalls.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {participatingStalls.map(s => (
                      <div key={s.id} style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: `1px solid ${s.borderColor}`,
                        padding: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: s.color,
                            backgroundColor: s.bgColor,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '0.35rem'
                          }}>
                            {s.stall}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                            ৳{s.subtotal.toFixed(0)}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                          {s.badge} {s.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <MapPin size={11} color="#94a3b8" /> {s.location}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                          {s.itemsCount} {s.itemsCount === 1 ? 'item' : 'items'} in group
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {activeGroup.members?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                No items have been added to this group yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeGroup.members?.map((member) => {
                  const isMe = member.user_id === user?.id;
                  const isPaid = member.payment_status === 'Paid';

                  return (
                    <div key={member.user_id} style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      border: isPaid ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                            {member.name} ({member.student_id})
                          </span>
                          {member.user_id === activeGroup.creator_user_id && (
                            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Host</span>
                          )}
                          {isMe && (
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>You</span>
                          )}
                        </div>

                        {/* Payment Status & Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                            Items: ৳{member.subtotal.toFixed(2)}
                          </span>

                          {isPaid ? (
                            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                              <Check size={12} /> Contributed ৳{(member.contributed_amount || member.subtotal).toFixed(0)} via {member.payment_method}
                            </span>
                          ) : (
                            <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                              Contribution Pending
                            </span>
                          )}

                          {/* If current student, can pay share or contribute more */}
                          {isMe && activeGroup.status === 'Open' && (
                            <button
                              onClick={() => handleOpenPayModal((member.subtotal > 0 && !isPaid) ? member.subtotal : null)}
                              className="btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#059669' }}
                            >
                              {isPaid ? 'Contribute More' : 'Pay Amount'}
                            </button>
                          )}
                        </div>

                      </div>

                      {/* Member's items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {member.items.map((it) => {
                          const stall = resolveShop(it);
                          return (
                            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ color: '#334155' }}>
                                  <strong>{it.quantity}x</strong> {it.name} <span style={{ color: '#64748b' }}>(৳{it.unit_price} each)</span>
                                </span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '9999px',
                                  backgroundColor: stall.bgColor,
                                  color: stall.color,
                                  border: `1px solid ${stall.borderColor}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}>
                                  {stall.badge} {stall.name} <span style={{ opacity: 0.8 }}>({stall.stall})</span>
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>৳{(it.unit_price * it.quantity).toFixed(2)}</span>
                                {activeGroup.status === 'Open' && (member.user_id === user?.id || activeGroup.is_creator) && !isPaid && (
                                  <button
                                    onClick={() => handleRemoveItem(it.id)}
                                    style={{ color: '#dc2626', padding: '0.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                    title="Remove item"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Combined Totals & Finalize Button */}
            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Combined Group Total:</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>
                  ৳{activeGroup.combined_total.toFixed(2)}
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, marginLeft: '0.5rem' }}>
                    ({activeGroup.combined_calories} kcal total)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {activeGroup.is_creator && activeGroup.status === 'Open' && (
                  <button
                    onClick={handleFinalizeGroup}
                    disabled={loading || activeGroup.members?.length === 0}
                    className="btn-primary"
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                  >
                    <Check size={18} /> Finalize Group Order & Dispatch to Kitchen
                  </button>
                )}

                <button
                  onClick={() => setActiveGroup(null)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Leave Lobby / Switch Group
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Split Payment Contribution Modal */}
      {payModalOpen && activeGroup && (
        <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Contribute Money to Group
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Group: <strong>{activeGroup.title}</strong> ({activeGroup.group_code})
                </p>
              </div>
              <button onClick={() => setPayModalOpen(false)} style={{ color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Live Financial Pool Overview */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Bill</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>৳{(activeGroup.combined_total || 0).toFixed(0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>Collected</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>৳{(activeGroup.total_collected || 0).toFixed(0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Remaining Due</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                  ৳{Math.max(0, (activeGroup.combined_total || 0) - (activeGroup.total_collected || 0)).toFixed(0)}
                </div>
              </div>
            </div>

            <form onSubmit={handleContributePayment}>

              {/* Amount to Pay / Contribute Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Enter Amount You Want to Pay (৳)
                  </label>
                  {myMemberData && myMemberData.subtotal > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Your Food: <strong>৳{myMemberData.subtotal.toFixed(0)}</strong>
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 800,
                    color: '#059669',
                    fontSize: '1.25rem'
                  }}>
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="input-field"
                    style={{ paddingLeft: '2.4rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 100)"
                    required
                  />
                </div>

                {/* Quick-fill helpers */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {myMemberData && myMemberData.subtotal > 0 && (
                    <button
                      type="button"
                      onClick={() => setContributionAmount(myMemberData.subtotal.toString())}
                      style={{
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '0.5rem',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Exact My Items (৳{myMemberData.subtotal.toFixed(0)})
                    </button>
                  )}
                  {Math.max(0, (activeGroup.combined_total || 0) - (activeGroup.total_collected || 0)) > 0 && (
                    <button
                      type="button"
                      onClick={() => setContributionAmount(Math.max(0, (activeGroup.combined_total || 0) - (activeGroup.total_collected || 0)).toString())}
                      style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        borderRadius: '0.5rem',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Pay Full Remaining (৳{Math.max(0, (activeGroup.combined_total || 0) - (activeGroup.total_collected || 0)).toFixed(0)})
                    </button>
                  )}
                  {activeGroup.members?.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContributionAmount(Math.round((activeGroup.combined_total || 0) / activeGroup.members.length).toString())}
                      style={{
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        borderRadius: '0.5rem',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Equal Split (৳{Math.round((activeGroup.combined_total || 0) / activeGroup.members.length)})
                    </button>
                  )}
                </div>
              </div>
              
              {/* Select Payment Method */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Choose Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  {[
                    { id: 'bKash', label: 'bKash', color: '#d12053' },
                    { id: 'Nagad', label: 'Nagad', color: '#f7941d' },
                    { id: 'Canteen Wallet', label: 'Canteen Wallet', color: '#059669' },
                    { id: 'Cash on Delivery', label: 'Cash on Delivery', color: '#2563eb' }
                  ].map(method => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setSelectedPayMethod(method.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.625rem',
                        border: selectedPayMethod === method.id ? '2px solid #059669' : '1px solid #e2e8f0',
                        backgroundColor: selectedPayMethod === method.id ? '#ecfdf5' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: selectedPayMethod === method.id ? '#065f46' : '#334155',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPayMethod !== 'Cash on Delivery' ? (
                <>
                  {/* Mobile / Account Number */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                      {selectedPayMethod} Account / Phone Number
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="017XXXXXXXX"
                      required
                    />
                  </div>

                  {/* PIN / TrxID */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        PIN / Demo TrxID
                      </label>
                      <button
                        type="button"
                        onClick={() => setPinOrTxn(Math.floor(1000 + Math.random() * 9000).toString())}
                        style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Quick-Fill Demo PIN
                      </button>
                    </div>
                    <input
                      type="password"
                      className="input-field"
                      value={pinOrTxn}
                      onChange={(e) => setPinOrTxn(e.target.value)}
                      placeholder="••••"
                      required
                    />
                  </div>
                </>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  💵 You can pay <strong>৳{parseFloat(contributionAmount || 0).toFixed(2)}</strong> in cash to the delivery person upon arrival at your campus pickup point.
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !contributionAmount || parseFloat(contributionAmount) <= 0}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    backgroundColor: selectedPayMethod === 'bKash' ? '#d12053' : selectedPayMethod === 'Nagad' ? '#f7941d' : selectedPayMethod === 'Cash on Delivery' ? '#2563eb' : '#059669'
                  }}
                >
                  {submittingPayment
                    ? 'Processing...'
                    : `Confirm ৳${parseFloat(contributionAmount || 0).toFixed(0)} Contribution (${selectedPayMethod})`}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


    </div>
  );
}
