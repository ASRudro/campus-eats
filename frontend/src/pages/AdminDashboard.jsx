import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  LayoutDashboard, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Users, 
  TrendingUp, 
  Utensils, 
  Plus, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Award, 
  CheckCircle2, 
  X 
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, menu, orders, users, reviews
  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Item Modal State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shop_id: 1,
    category_id: 1,
    description: '',
    price: '',
    calories: '',
    preparation_time: 10,
    image_url: '',
    is_available: true,
    is_special: false,
    is_combo: false
  });

  const fetchDashboardData = async () => {
    try {
      const [
        kpiRes, 
        salesRes, 
        peakRes, 
        bestRes, 
        menuRes, 
        catRes, 
        shopsRes,
        orderRes, 
        userRes, 
        revRes
      ] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/sales'),
        api.get('/admin/peak-times'),
        api.get('/admin/best-selling'),
        api.get('/menu'),
        api.get('/menu/categories'),
        api.get('/menu/shops').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/reviews/all')
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data.data);
      if (salesRes.data.success) setSalesData(salesRes.data.data);
      if (peakRes.data.success) setPeakTimes(peakRes.data.data);
      if (bestRes.data.success) setBestSellers(bestRes.data.data);
      if (menuRes.data.success) setMenuItems(menuRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (shopsRes.data?.success) setShops(shopsRes.data.data);
      if (orderRes.data.success) setAllOrders(orderRes.data.data);
      if (userRes.data.success) setAllUsers(userRes.data.data);
      if (revRes.data.success) setAllReviews(revRes.data.data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Save or Update Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, formData);
      } else {
        await api.post('/menu', formData);
      }
      setItemModalOpen(false);
      setEditingItem(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving menu item.');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update role.');
    }
  };

  // Delete review
  const handleDeleteReview = async (revId) => {
    if (!confirm('Remove this review from the system?')) return;
    try {
      await api.delete(`/reviews/${revId}`);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete review.');
    }
  };

  // Open Edit Item Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      shop_id: item.shop_id || 1,
      category_id: item.category_id,
      description: item.description || '',
      price: item.price,
      calories: item.calories,
      preparation_time: item.preparation_time,
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_special: item.is_special,
      is_combo: item.is_combo
    });
    setItemModalOpen(true);
  };

  // Open Create Item Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      shop_id: shops.length > 0 ? shops[0].id : 1,
      category_id: categories.length > 0 ? categories[0].id : 1,
      description: '',
      price: '',
      calories: '',
      preparation_time: 10,
      image_url: '',
      is_available: true,
      is_special: false,
      is_combo: false
    });
    setItemModalOpen(true);
  };

  // Chart 1: Sales by Day
  const salesChartData = {
    labels: salesData.map(d => d.day),
    datasets: [
      {
        label: 'Daily Sales (৳)',
        data: salesData.map(d => d.sales),
        backgroundColor: 'rgba(5, 150, 105, 0.75)',
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  // Chart 2: Peak Order Times
  const peakChartData = {
    labels: peakTimes.map(p => p.time),
    datasets: [
      {
        label: 'Orders Scheduled',
        data: peakTimes.map(p => p.orders),
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  // Chart 3: Best-Selling Food Items
  const bestSellersChartData = {
    labels: bestSellers.map(b => b.name),
    datasets: [
      {
        data: bestSellers.map(b => b.total_sold),
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899'
        ]
      }
    ]
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <LayoutDashboard size={22} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              CampusEats Admin Analytics
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time database aggregated analytics, menu management, user controls, and order oversight.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ fontSize: '0.85rem' }}>
          <Plus size={16} /> Add New Menu Item
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        
        {/* Today's Sales */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Today's Sales</span>
            <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.35rem', borderRadius: '0.5rem' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.5rem' }}>
            ৳{kpis ? kpis.today_sales.toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {kpis ? kpis.today_orders : 0} orders today
          </div>
        </div>

        {/* Active Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Active In Kitchen</span>
            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.35rem', borderRadius: '0.5rem' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.5rem' }}>
            {kpis ? kpis.active_orders : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Pending or cooking
          </div>
        </div>

        {/* Total Students */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Registered Students</span>
            <div style={{ backgroundColor: '#faf5ff', color: '#7e22ce', padding: '0.35rem', borderRadius: '0.5rem' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.5rem' }}>
            {kpis ? kpis.total_students : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Active campus accounts
          </div>
        </div>

        {/* Average Order Value */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Avg Order Value</span>
            <div style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '0.35rem', borderRadius: '0.5rem' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.5rem' }}>
            ৳{kpis ? kpis.average_order_value.toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Lifetime: ৳{kpis ? kpis.total_revenue.toFixed(2) : '0.00'}
          </div>
        </div>

      </div>

      {/* Admin Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        marginBottom: '2rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'analytics', label: 'Charts & Analytics' },
          { id: 'menu', label: `Menu Items (${menuItems.length})` },
          { id: 'orders', label: `Orders (${allOrders.length})` },
          { id: 'users', label: `Users (${allUsers.length})` },
          { id: 'reviews', label: `Reviews (${allReviews.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              backgroundColor: activeTab === tab.id ? '#059669' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CHARTS & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Sales Chart */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Sales Revenue by Day (৳)
              </h3>
              <div style={{ height: '240px' }}>
                <Bar 
                  data={salesChartData} 
                  options={{ responsive: true, maintainAspectRatio: false }} 
                />
              </div>
            </div>

            {/* Peak Times Chart */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Peak Order Pickup Times
              </h3>
              <div style={{ height: '240px' }}>
                <Bar 
                  data={peakChartData} 
                  options={{ responsive: true, maintainAspectRatio: false }} 
                />
              </div>
            </div>
          </div>

          {/* Best Sellers Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Top 5 Best-Selling Dishes
              </h3>
              <div style={{ height: '240px' }}>
                <Doughnut
                  data={bestSellersChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Best-Selling Food Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bestSellers.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{item.category}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>{item.total_sold} sold</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>৳{item.total_revenue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MENU ITEM MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Canteen Menu Items ({menuItems.length})
            </h3>
            <button onClick={openCreateModal} className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Add New Dish
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.75rem' }}>IMAGE & NAME</th>
                <th style={{ padding: '0.75rem' }}>SHOP / STALL</th>
                <th style={{ padding: '0.75rem' }}>CATEGORY</th>
                <th style={{ padding: '0.75rem' }}>PRICE</th>
                <th style={{ padding: '0.75rem' }}>CALORIES</th>
                <th style={{ padding: '0.75rem' }}>PREP TIME</th>
                <th style={{ padding: '0.75rem' }}>FLAGS</th>
                <th style={{ padding: '0.75rem' }}>STOCK</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img src={item.image_url} alt={item.name} style={{ width: '38px', height: '38px', borderRadius: '0.35rem', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                      {item.shop_name || `Shop #${item.shop_id}`}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#475569' }}>{item.category_name}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#059669' }}>৳{item.price}</td>
                  <td style={{ padding: '0.75rem' }}>{item.calories} kcal</td>
                  <td style={{ padding: '0.75rem' }}>{item.preparation_time}m</td>
                  <td style={{ padding: '0.75rem' }}>
                    {item.is_special ? <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Special</span> : null}
                    {item.is_combo ? <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginLeft: '0.2rem' }}>Combo</span> : null}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={item.is_available ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize: '0.65rem' }}>
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button onClick={() => openEditModal(item)} style={{ color: '#2563eb', marginRight: '0.75rem' }} title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} style={{ color: '#dc2626' }} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            All Campus Orders ({allOrders.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.75rem' }}>ORDER #</th>
                <th style={{ padding: '0.75rem' }}>STUDENT</th>
                <th style={{ padding: '0.75rem' }}>PICKUP DATE & TIME</th>
                <th style={{ padding: '0.75rem' }}>SUBTOTAL</th>
                <th style={{ padding: '0.75rem' }}>CALORIES</th>
                <th style={{ padding: '0.75rem' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{o.order_number}</td>
                  <td style={{ padding: '0.75rem' }}>{o.student_name} ({o.student_id})</td>
                  <td style={{ padding: '0.75rem' }}>{o.pickup_date} at {o.pickup_time}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#059669' }}>৳{o.subtotal.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>{o.total_calories} kcal</td>
                  <td style={{ padding: '0.75rem' }}>
                    <StatusBadge status={o.status} size="small" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Registered Users ({allUsers.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.75rem' }}>NAME</th>
                <th style={{ padding: '0.75rem' }}>STUDENT ID</th>
                <th style={{ padding: '0.75rem' }}>EMAIL</th>
                <th style={{ padding: '0.75rem' }}>ROLE</th>
                <th style={{ padding: '0.75rem' }}>BUDGET CAP</th>
                <th style={{ padding: '0.75rem' }}>CALORIE CAP</th>
                <th style={{ padding: '0.75rem' }}>POINTS</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>ROLE ACTION</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                  <td style={{ padding: '0.75rem' }}>{u.student_id}</td>
                  <td style={{ padding: '0.75rem', color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'kitchen' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>৳{u.daily_budget}</td>
                  <td style={{ padding: '0.75rem' }}>{u.daily_calorie_limit} kcal</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#059669' }}>{u.loyalty_points}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-field"
                      style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <option value="student">Student</option>
                      <option value="kitchen">Kitchen Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Review Moderation ({allReviews.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {allReviews.map((rev) => (
              <div key={rev.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    {rev.item_name} — <span style={{ color: '#f59e0b' }}>{rev.rating} ★</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    By <strong>{rev.reviewer_name}</strong> ({rev.student_id}) on {new Date(rev.created_at).toLocaleDateString()}
                  </div>
                  <p style={{ color: '#334155', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    "{rev.comment}"
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  style={{ color: '#dc2626', padding: '0.4rem', borderRadius: '0.35rem' }}
                  title="Remove inappropriate comment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {itemModalOpen && (
        <div className="modal-overlay" onClick={() => setItemModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Food Item'}
              </h3>
              <button onClick={() => setItemModalOpen(false)} style={{ color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Food Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Shop / Stall *
                  </label>
                  <select
                    className="input-field"
                    value={formData.shop_id}
                    onChange={(e) => setFormData({ ...formData, shop_id: parseInt(e.target.value) })}
                    required
                  >
                    {shops.length > 0 ? (
                      shops.map(s => (
                        <option key={s.id} value={s.id}>Shop #{s.id}: {s.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="1">Shop #1: Campus Kitchen</option>
                        <option value="2">Shop #2: Bhojon Bilash</option>
                        <option value="3">Shop #3: Varsity Bites</option>
                        <option value="4">Shop #4: Fresh Sip Juice Bar</option>
                        <option value="5">Shop #5: The Chai Break</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Category *
                  </label>
                  <select
                    className="input-field"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Price (BDT) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Calories (kcal) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Prep Time (mins) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Image URL (Cloudinary / CDN)
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  /> Available
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_special}
                    onChange={(e) => setFormData({ ...formData, is_special: e.target.checked })}
                  /> Daily Special
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_combo}
                    onChange={(e) => setFormData({ ...formData, is_combo: e.target.checked })}
                  /> Combo Deal
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingItem ? 'Update Dish' : 'Add to Menu'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
