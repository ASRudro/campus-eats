import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  BellRing, 
  PackageCheck, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle 
} from 'lucide-react';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All'); // All, Pending, Confirmed, Preparing, Ready
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showItemManager, setShowItemManager] = useState(false);

  const fetchKitchenOrders = async () => {
    try {
      const url = activeTab === 'All' ? '/orders/kitchen/queue' : `/orders/kitchen/queue?status=${activeTab}`;
      const [orderRes, menuRes] = await Promise.all([
        api.get(url),
        api.get('/menu')
      ]);

      if (orderRes.data.success) {
        setOrders(orderRes.data.data);
      }
      if (menuRes.data.success) {
        setMenuItems(menuRes.data.data);
      }
    } catch (err) {
      console.error('Kitchen fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        await fetchKitchenOrders();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleItemStock = async (itemId) => {
    try {
      const res = await api.patch(`/menu/${itemId}/availability`);
      if (res.data.success) {
        setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, is_available: res.data.is_available } : i));
      }
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ backgroundColor: '#059669', color: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <ChefHat size={22} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              Kitchen Order Queue
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Live incoming queue sorted by scheduled pickup time. (Auto-refreshes every 10s)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowItemManager(!showItemManager)}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            {showItemManager ? 'Hide Stock Controls' : 'Quick Stock Manager'}
          </button>
          <button
            onClick={fetchKitchenOrders}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Quick Food Stock Availability Panel */}
      {showItemManager && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Cafeteria Food Stock Status (Instant In Stock / Sold Out Toggle)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem'
          }}>
            {menuItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontWeight: 600, color: item.is_available ? '#0f172a' : '#94a3b8', textDecoration: item.is_available ? 'none' : 'line-through' }}>
                  {item.name}
                </span>
                <button
                  onClick={() => handleToggleItemStock(item.id)}
                  style={{ color: item.is_available ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center' }}
                  title="Toggle Available / Sold Out"
                >
                  {item.is_available ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem'
      }}>
        {['All', 'Pending', 'Confirmed', 'Preparing', 'Ready'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: activeTab === tab ? '#0f172a' : '#ffffff',
              color: activeTab === tab ? '#ffffff' : '#475569',
              border: activeTab === tab ? '1px solid #0f172a' : '1px solid #e2e8f0'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Queue Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          Loading kitchen queue...
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0'
        }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Kitchen queue is clear!
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            No orders currently pending under the "{activeTab}" filter.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {orders.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1.25rem',
                  border: order.status === 'Ready' ? '2px solid #10b981' : '1px solid #e2e8f0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                
                {/* Header: Order # & Scheduled Pickup Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                      <Clock size={14} /> Pickup: {order.pickup_time}
                    </div>
                  </div>

                  <StatusBadge status={order.status} size="small" />
                </div>

                {/* Student Info */}
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Student: <strong style={{ color: '#0f172a' }}>{order.student_name}</strong> ({order.student_id})
                  {order.student_phone && <div>Phone: {order.student_phone}</div>}
                  {order.special_instructions && (
                    <div style={{ color: '#b45309', backgroundColor: '#fef3c7', padding: '0.35rem 0.5rem', borderRadius: '0.35rem', marginTop: '0.35rem', fontWeight: 600 }}>
                      Note: {order.special_instructions}
                    </div>
                  )}
                </div>

                {/* Food Items */}
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.25rem', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    KITCHEN TICKET:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          <span style={{ color: '#059669', fontSize: '1.05rem', marginRight: '4px' }}>{item.quantity}x</span> {item.item_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          ~{item.preparation_time}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  
                  {order.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Confirmed')}
                      disabled={isUpdating}
                      className="btn-primary"
                      style={{ width: '100%', backgroundColor: '#2563eb', padding: '0.65rem' }}
                    >
                      <CheckCircle2 size={16} /> Confirm Order
                    </button>
                  )}

                  {order.status === 'Confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                      disabled={isUpdating}
                      className="btn-primary"
                      style={{ width: '100%', backgroundColor: '#7e22ce', padding: '0.65rem' }}
                    >
                      <Flame size={16} /> Start Cooking
                    </button>
                  )}

                  {order.status === 'Preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Ready')}
                      disabled={isUpdating}
                      className="btn-primary"
                      style={{ width: '100%', backgroundColor: '#10b981', padding: '0.65rem', fontWeight: 800 }}
                    >
                      <BellRing size={16} /> Mark READY FOR PICKUP
                    </button>
                  )}

                  {order.status === 'Ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Picked Up')}
                      disabled={isUpdating}
                      className="btn-primary"
                      style={{ width: '100%', backgroundColor: '#059669', padding: '0.65rem' }}
                    >
                      <PackageCheck size={16} /> Mark Picked Up
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
