import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart, resolveShop, SHOP_METADATA } from '../context/CartContext';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Flame, 
  CheckCircle2, 
  ShoppingCart, 
  Utensils, 
  Store,
  MapPin,
  X 
} from 'lucide-react';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

export default function WeeklySchedulePage() {
  const [schedule, setSchedule] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [pickupSlots, setPickupSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for adding meal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Saturday');

  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('1:00 PM');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  const fetchSchedule = async () => {
    try {
      const [schedRes, menuRes, slotsRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/menu?available_only=true'),
        api.get('/menu/pickup-slots')
      ]);

      if (schedRes.data.success) {
        setSchedule(schedRes.data.data);
      }
      if (menuRes.data.success) {
        setMenuItems(menuRes.data.data);
        if (menuRes.data.data.length > 0) {
          setSelectedMenuItem(menuRes.data.data[0].id);
        }
      }
      if (slotsRes.data.success && slotsRes.data.data.length > 0) {
        setPickupSlots(slotsRes.data.data);
        setSelectedSlot(slotsRes.data.data[0].slot_time);
      }
    } catch (err) {
      console.error('Failed to load weekly schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOpenAddModal = (day) => {
    setSelectedDay(day);
    setQuantity(1);
    setModalOpen(true);
  };

  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem || !selectedSlot) return;

    setSubmitting(true);
    try {
      const res = await api.post('/schedules', {
        day_of_week: selectedDay,
        menu_item_id: selectedMenuItem,
        quantity,
        pickup_time: selectedSlot
      });

      if (res.data.success) {
        setModalOpen(false);
        fetchSchedule();
      }
    } catch (err) {
      console.error('Failed to save schedule:', err);
      alert(err.response?.data?.message || 'Failed to save scheduled meal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (scheduleId) => {
    try {
      const res = await api.delete(`/schedules/${scheduleId}`);
      if (res.data.success) {
        fetchSchedule();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleOrderDayMeal = (meals) => {
    if (!meals || meals.length === 0) return;
    meals.forEach(m => {
      const stall = resolveShop(m);
      addToCart({
        id: m.menu_item_id,
        name: m.name,
        price: m.price,
        calories: m.calories,
        image_url: m.image_url,
        shop_id: stall.id,
        shop_name: stall.name,
        shop_badge: stall.badge,
        shop_stall: stall.stall,
        shop_location: stall.location,
        preparation_time: 12
      }, m.quantity);
    });
    navigate('/cart');
  };

  // Get current weekday name
  const currentWeekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  // Calculate unique stalls used across the entire weekly schedule
  const weeklyStallsMap = {};
  Object.values(schedule).forEach(dayMeals => {
    dayMeals.forEach(meal => {
      const stall = resolveShop(meal);
      if (!weeklyStallsMap[stall.id]) {
        weeklyStallsMap[stall.id] = {
          ...stall,
          mealsCount: 0,
          totalCost: 0
        };
      }
      weeklyStallsMap[stall.id].mealsCount += meal.quantity;
      weeklyStallsMap[stall.id].totalCost += (meal.price * meal.quantity);
    });
  });
  const weeklyStalls = Object.values(weeklyStallsMap);

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Calendar size={28} color="#059669" /> Weekly Lunch Planner
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Pre-plan your campus lunches for Saturday through Wednesday. Every meal is tagged with its campus stall and pickup counter.
        </p>
      </div>

      {/* Weekly Stalls Summary (if any meals scheduled) */}
      {weeklyStalls.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Store size={18} color="#059669" /> Campus Stalls in Your Weekly Plan ({weeklyStalls.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {weeklyStalls.map(s => (
              <div key={s.id} style={{
                backgroundColor: '#f8fafc',
                borderRadius: '0.75rem',
                border: `1px solid ${s.borderColor}`,
                padding: '0.75rem 1rem'
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
                    ৳{s.totalCost.toFixed(0)}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                  {s.badge} {s.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={12} color="#94a3b8" /> {s.location}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                  {s.mealsCount} {s.mealsCount === 1 ? 'meal' : 'meals'} planned this week
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          Loading your weekly schedule...
        </div>
      ) : (
        /* Days Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {DAYS.map((day) => {
            const dayMeals = schedule[day] || [];
            const isToday = currentWeekday === day;
            const dayTotal = dayMeals.reduce((sum, m) => sum + m.price * m.quantity, 0);
            const dayCals = dayMeals.reduce((sum, m) => sum + m.calories * m.quantity, 0);

            return (
              <div
                key={day}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1.25rem',
                  border: isToday ? '2px solid #059669' : '1px solid #e2e8f0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isToday ? '0 10px 25px -5px rgba(5, 150, 105, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* Day Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      {day}
                    </h3>
                    {isToday && (
                      <span className="badge badge-green" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                        Today
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenAddModal(day)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
                  >
                    <Plus size={14} /> Add Meal
                  </button>
                </div>

                {/* Day Items List */}
                {dayMeals.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No meals planned for {day}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', flex: 1 }}>
                    {dayMeals.map((meal) => {
                      const stall = resolveShop(meal);
                      return (
                        <div
                          key={meal.id}
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '0.75rem',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flex: 1 }}>
                            <img
                              src={meal.image_url}
                              alt={meal.name}
                              style={{ width: '46px', height: '46px', borderRadius: '0.4rem', objectFit: 'cover', marginTop: '2px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                                {meal.quantity}x {meal.name}
                              </div>
                              <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '1px' }}>
                                ৳{(meal.price * meal.quantity).toFixed(0)} • <Clock size={11} style={{ display: 'inline' }} /> {meal.pickup_time}
                              </div>
                              <div style={{ marginTop: '0.3rem' }}>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '0.25rem',
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
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            style={{ color: '#94a3b8', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Remove from schedule"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Day Summary & Instant Order */}
                {dayMeals.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      <span>Total: <strong>৳{dayTotal.toFixed(0)}</strong></span>
                      <span>{dayCals} kcal</span>
                    </div>

                    <button
                      onClick={() => handleOrderDayMeal(dayMeals)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}
                    >
                      <ShoppingCart size={14} /> Send {day}'s Meal to Cart
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Add Meal to Day Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Plan Lunch for {selectedDay}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMeal}>
              {/* Select Food Organised by Campus Stall */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Choose Food Item (Organized by Campus Stall)
                </label>
                <select
                  value={selectedMenuItem}
                  onChange={(e) => setSelectedMenuItem(e.target.value)}
                  className="input-field"
                  required
                >
                  {Object.values(SHOP_METADATA).map(stall => {
                    const stallItems = menuItems.filter(item => (item.shop_id === stall.id) || (!item.shop_id && resolveShop(item).id === stall.id));
                    if (stallItems.length === 0) return null;
                    return (
                      <optgroup key={stall.id} label={`${stall.badge} ${stall.name} (${stall.stall}) — ${stall.location}`}>
                        {stallItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} — ৳{item.price} ({item.calories} kcal)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="input-field"
                  required
                />
              </div>

              {/* Pickup Time Slot */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Pickup Time Slot
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="input-field"
                  required
                >
                  {pickupSlots.map((slot) => (
                    <option key={slot.id} value={slot.slot_time}>
                      {slot.slot_time}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Saving...' : 'Save to Schedule'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

