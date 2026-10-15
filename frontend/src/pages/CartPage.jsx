import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart, resolveShop, SHOP_METADATA } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import GuardrailBar from '../components/GuardrailBar';
import DigitalReceipt from '../components/DigitalReceipt';
import {
  Trash2,
  Plus,
  Minus,
  Clock,
  Calendar,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Wallet,
  Check,
  Store,
  MapPin
} from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    subtotal,
    totalCalories,
    totalItems,
    pickupSlot,
    setPickupSlot,
    pickupDate,
    setPickupDate,
    specialInstructions,
    setSpecialInstructions,
    isOverBudget,
    isOverCalories,
    budgetLimit,
    calorieLimit,
    projectedSpent,
    projectedCalories,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const { isAuthenticated, user, refreshDailyUsage } = useAuth();
  const navigate = useNavigate();

  const [pickupSlots, setPickupSlots] = useState([]);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(15);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  // Payment Option & Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState('bKash');
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '01711000003');
  const [pinOrTxn, setPinOrTxn] = useState('1234');

  // Fetch active pickup slots from backend
  useEffect(() => {
    async function loadSlots() {
      try {
        const res = await api.get('/menu/pickup-slots');
        if (res.data.success && res.data.data.length > 0) {
          setPickupSlots(res.data.data);
          if (!pickupSlot) {
            setPickupSlot(res.data.data[0].slot_time);
          }
        }
      } catch (err) {
        console.error('Failed to load pickup slots:', err);
      }
    }
    loadSlots();
  }, []);

  // Compute estimated wait time
  useEffect(() => {
    if (cart.length === 0) {
      setEstimatedWaitTime(0);
      return;
    }
    const maxPrep = Math.max(...cart.map(i => i.preparation_time || 10));
    setEstimatedWaitTime(maxPrep + 5); // Base prep + active queuing factor
  }, [cart]);

  // Group items by shop
  const groupedByShop = cart.reduce((acc, item) => {
    const shop = resolveShop(item);
    const shopId = shop.shop_id;
    if (!acc[shopId]) {
      acc[shopId] = {
        meta: shop.shop_theme || SHOP_METADATA[shopId] || SHOP_METADATA[1],
        shop_id: shopId,
        shop_name: shop.shop_name,
        stall_number: shop.stall_number,
        shop_location: shop.shop_location,
        shop_badge: shop.shop_badge,
        subtotal: 0,
        calories: 0,
        items: []
      };
    }
    acc[shopId].items.push({ ...item, shop });
    acc[shopId].subtotal += item.price * item.quantity;
    acc[shopId].calories += item.calories * item.quantity;
    return acc;
  }, {});

  const shopGroupsList = Object.values(groupedByShop);

  const handleCheckout = async (paymentDetails = null) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Your shopping cart is empty.');
      return;
    }

    // Frontend Guardrail Check
    if (isOverBudget) {
      setCheckoutError(`This order exceeds your daily spending limit. (Limit: ৳${budgetLimit}, Projected: ৳${projectedSpent.toFixed(2)})`);
      return;
    }

    if (isOverCalories) {
      setCheckoutError(`This order exceeds your daily calorie limit. (Limit: ${calorieLimit} kcal, Projected: ${projectedCalories} kcal)`);
      return;
    }

    const effectiveMethod = paymentDetails?.payment_method || selectedPayMethod;
    const isCash = effectiveMethod === 'Cash on Delivery';
    // If not cash on delivery and not called from modal submission, open modal
    if (!paymentDetails && !isCash) {
      setPayModalOpen(true);
      return;
    }



    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const isOnline = ['bKash', 'Nagad', 'Canteen Wallet'].includes(effectiveMethod);
      const generatedTxn = isOnline
        ? (paymentDetails?.transaction_id || ('TXN-' + (effectiveMethod === 'bKash' ? 'BK' : effectiveMethod === 'Nagad' ? 'NG' : 'CW') + '-' + Math.floor(100000 + Math.random() * 900000)))
        : null;

      const payload = {
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity
        })),
        pickup_date: pickupDate,
        pickup_time: pickupSlot,
        special_instructions: specialInstructions,
        payment_method: effectiveMethod,
        mobile_number: paymentDetails?.mobile_number || mobileNumber,
        transaction_id: generatedTxn
      };

      const res = await api.post('/orders', payload);

      if (res.data.success && res.data.receipt) {
        setPayModalOpen(false);
        setCompletedReceipt(res.data.receipt);
        clearCart();
        await refreshDailyUsage();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const serverMsg = err.response?.data?.message || 'Something went wrong during checkout. Please try again.';
      setCheckoutError(serverMsg);
    } finally {
      setIsCheckingOut(false);
    }
  };


  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>

      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
          Your Shopping Cart
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Review items, schedule lunch pickup, and verify daily spending & calorie limits.
        </p>
      </div>

      {/* Real-time Guardrail Indicator */}
      {isAuthenticated && (
        <div style={{ marginBottom: '1.5rem' }}>
          <GuardrailBar />
        </div>
      )}

      {/* Cart Empty State */}
      {cart.length === 0 && !completedReceipt ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <ShoppingBag size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Your cart is empty
          </h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Explore our cafeteria specials and add fresh meals for pickup!
          </p>
          <Link to="/menu" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            Browse Campus Menu
          </Link>
        </div>
      ) : (
        /* Active Cart Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>

          {/* Left Column: Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Top Bar with Clear Cart and Shop Count info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.875rem',
              padding: '0.85rem 1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                  Selected Items ({totalItems})
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                  across <strong>{shopGroupsList.length} {shopGroupsList.length === 1 ? 'Campus Stall' : 'Campus Stalls'}</strong>
                </span>
              </div>
              <button
                onClick={clearCart}
                style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Trash2 size={14} /> Clear Cart
              </button>
            </div>

            {/* Render items grouped clearly by Shop / Stall */}
            {shopGroupsList.map((group) => (
              <div
                key={group.shop_id}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1.5px solid ${group.meta.badge_border || '#e2e8f0'}`,
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                {/* Stall Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: group.meta.badge_bg || '#f8fafc',
                  borderBottom: `1px solid ${group.meta.badge_border || '#e2e8f0'}`,
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      backgroundColor: '#ffffff',
                      color: group.meta.theme_color || '#059669',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.4rem',
                      border: `1px solid ${group.meta.badge_border || '#e2e8f0'}`,
                      letterSpacing: '0.02em'
                    }}>
                      {group.stall_number}
                    </span>
                    <div>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {group.shop_name}
                      </span>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                        <MapPin size={12} color="#94a3b8" /> {group.shop_location}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: group.meta.theme_color || '#059669' }}>
                      ৳{group.subtotal.toFixed(2)}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {group.items.reduce((s, i) => s + i.quantity, 0)} items • {group.calories} kcal
                    </div>
                  </div>
                </div>

                {/* Items in this shop */}
                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '0.75rem'
                      }}
                    >
                      {/* Image & Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{ width: '52px', height: '52px', borderRadius: '0.5rem', objectFit: 'cover' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.3' }}>
                            {item.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: group.meta.theme_color,
                              backgroundColor: group.meta.badge_bg,
                              border: `1px solid ${group.meta.badge_border}`,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '0.25rem'
                            }}>
                              {group.shop_badge}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ৳{item.price.toFixed(2)} • {item.calories} kcal
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.15rem' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '0.2rem', color: '#64748b' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '0.2rem', color: '#64748b' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Total Price & Delete */}
                      <div style={{ textAlign: 'right', minWidth: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ color: '#94a3b8', marginTop: '0.25rem' }}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Special Instructions */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              padding: '1.25rem'
            }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                Special Kitchen Notes (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Extra napkins, less spicy, dressing on the side..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Pickup Scheduling & Checkout Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Pickup Slot Selection Box */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={18} color="#059669" /> Select Pickup Window
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Pickup Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Available Pickup Time Slot
                </label>
                <select
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  className="input-field"
                >
                  {pickupSlots.map(slot => (
                    <option key={slot.id} value={slot.slot_time}>
                      {slot.slot_time} ({slot.max_orders} capacity)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} /> Estimated Kitchen Wait: ~{estimatedWaitTime} minutes
              </div>
            </div>

            {/* Campus Pickup Stalls Summary */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Store size={18} color="#0284c7" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Pickup Stalls ({shopGroupsList.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {shopGroupsList.map(group => (
                  <div
                    key={group.shop_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: group.meta.badge_bg || '#f8fafc',
                      border: `1px solid ${group.meta.badge_border || '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {group.stall_number}: {group.shop_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {group.shop_location}
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 800,
                      color: group.meta.theme_color,
                      fontSize: '0.75rem',
                      backgroundColor: '#ffffff',
                      padding: '0.2rem 0.45rem',
                      borderRadius: '0.35rem',
                      border: `1px solid ${group.meta.badge_border}`
                    }}>
                      {group.items.reduce((s, i) => s + i.quantity, 0)} {group.items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary & Final Checkout Button */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                <span>Subtotal ({totalItems} items):</span>
                <span style={{ fontWeight: 600 }}>৳{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                <span>Total Nutritional Calories:</span>
                <span style={{ fontWeight: 600 }}>{totalCalories} kcal</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                <span>Estimated Loyalty Points:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>+{Math.floor(subtotal / 50)} pts</span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#059669' }}>৳{subtotal.toFixed(2)}</span>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
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
                        padding: '0.6rem 0.4rem',
                        borderRadius: '0.625rem',
                        border: selectedPayMethod === method.id ? '2px solid #059669' : '1px solid #e2e8f0',
                        backgroundColor: selectedPayMethod === method.id ? '#ecfdf5' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: selectedPayMethod === method.id ? '#065f46' : '#334155',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Error Message */}
              {checkoutError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{checkoutError}</div>
                </div>
              )}

              {/* Checkout / Pay Action Button */}
              <button
                onClick={() => handleCheckout()}
                disabled={isCheckingOut || cart.length === 0 || isOverBudget || isOverCalories}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: selectedPayMethod === 'bKash' ? '#d12053' : selectedPayMethod === 'Nagad' ? '#f7941d' : selectedPayMethod === 'Cash on Delivery' ? '#2563eb' : '#059669'
                }}
              >
                {isCheckingOut ? (
                  'Validating & Placing Order...'
                ) : isOverBudget ? (
                  'Spending Limit Exceeded'
                ) : isOverCalories ? (
                  'Calorie Limit Exceeded'
                ) : selectedPayMethod === 'Cash on Delivery' ? (
                  <>
                    Confirm & Pre-Order (Cash on Delivery) <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    Pay ৳{subtotal.toFixed(0)} via {selectedPayMethod} <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                Instant digital receipt with {selectedPayMethod} confirmation generated upon order.
              </div>




            </div>

          </div>

        </div>
      )}

      {/* Food Order Payment Modal */}
      {payModalOpen && (
        <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Complete Food Order Payment
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Items: <strong>{totalItems} items</strong> • Pickup: <strong>{pickupSlot}</strong>
                </p>
              </div>
              <button onClick={() => setPayModalOpen(false)} style={{ color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Total Amount Callout */}
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '0.75rem',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
                TOTAL MEAL AMOUNT TO PAY
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
                ৳{subtotal.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.2rem' }}>
                Accrues +{Math.floor(subtotal / 50)} CampusEats loyalty points
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleCheckout({
                payment_method: selectedPayMethod,
                mobile_number: mobileNumber,
                transaction_id: pinOrTxn ? ('TXN-' + (selectedPayMethod === 'bKash' ? 'BK' : selectedPayMethod === 'Nagad' ? 'NG' : 'CW') + '-' + pinOrTxn) : null
              });
            }}>

              {/* Select Payment Method */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Choose Payment Gateway
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
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#475569',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  💵 You can pay <strong>৳{subtotal.toFixed(2)}</strong> in cash to the delivery person upon arrival at your campus location.
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
                  disabled={isCheckingOut}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    backgroundColor: selectedPayMethod === 'bKash' ? '#d12053' : selectedPayMethod === 'Nagad' ? '#f7941d' : selectedPayMethod === 'Cash on Delivery' ? '#2563eb' : '#059669'
                  }}
                >
                  {isCheckingOut ? (
                    'Processing...'
                  ) : selectedPayMethod === 'Cash on Delivery' ? (
                    'Confirm Pre-Order (Cash on Delivery)'
                  ) : (
                    `Confirm ৳${subtotal.toFixed(0)} Payment`
                  )}
                </button>
              </div>



            </form>

          </div>
        </div>
      )}

      {/* Digital Receipt Modal (Triggered on successful checkout) */}
      {completedReceipt && (

        <DigitalReceipt
          receipt={completedReceipt}
          onClose={() => {
            setCompletedReceipt(null);
            navigate('/orders');
          }}
        />
      )}

    </div>
  );
}
