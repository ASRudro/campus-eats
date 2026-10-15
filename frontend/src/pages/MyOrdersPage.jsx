import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import StatusBadge from '../components/StatusBadge';
import DigitalReceipt from '../components/DigitalReceipt';
import { 
  PackageCheck, 
  RotateCcw, 
  Receipt, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Flame,
  AlertCircle,
  Check,
  X,
  CreditCard,
  Wallet
} from 'lucide-react';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [reorderNotice, setReorderNotice] = useState(null);

  // Pay existing order modal state
  const [payingOrder, setPayingOrder] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('bKash');
  const [mobileNumber, setMobileNumber] = useState('01711000003');
  const [pinOrTxn, setPinOrTxn] = useState('1234');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const { addToCart } = useCart();
  const navigate = useNavigate();


  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 15 seconds so student sees real-time status updates from kitchen!
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleReorder = async (orderId) => {
    setReorderLoading(true);
    setReorderNotice(null);
    try {
      const res = await api.get(`/orders/reorder/${orderId}`);
      if (res.data.success && res.data.items) {
        res.data.items.forEach(item => {
          addToCart(item, item.quantity);
        });

        if (res.data.warning) {
          alert(res.data.warning);
        }

        navigate('/cart');
      }
    } catch (err) {
      console.error('Reorder error:', err);
      alert(err.response?.data?.message || 'Could not reorder items.');
    } finally {
      setReorderLoading(false);
    }
  };

  const handlePayOrder = async (e) => {
    e.preventDefault();
    if (!payingOrder) return;
    setSubmittingPayment(true);
    try {
      const res = await api.post(`/orders/${payingOrder.id}/pay`, {
        payment_method: selectedPayMethod,
        mobile_number: mobileNumber,
        transaction_id: pinOrTxn ? ('TXN-' + (selectedPayMethod === 'bKash' ? 'BK' : selectedPayMethod === 'Nagad' ? 'NG' : 'CW') + '-' + pinOrTxn) : null
      });
      if (res.data.success) {
        setPayingOrder(null);
        await fetchOrders();
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const activeOrders = orders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Ready'].includes(o.status));

  const pastOrders = orders.filter(o => ['Picked Up', 'Cancelled'].includes(o.status));

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            My Lunch Orders
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Track active cafeteria orders in real-time and review previous digital receipts.
          </p>
        </div>
        <Link to="/menu" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          Order Food <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          Loading your lunch orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0'
        }}>
          <PackageCheck size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No orders placed yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Skip the long canteen lines by placing your first lunch pre-order!
          </p>
          <Link to="/menu" className="btn-primary">
            Explore Canteen Menu
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-green" style={{ width: '8px', height: '8px', borderRadius: '50%', padding: 0 }} />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  Active Orders ({activeOrders.length})
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeOrders.map((order) => (
                  <div key={order.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1.25rem',
                    border: order.status === 'Ready' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: order.status === 'Ready' ? '0 10px 25px -5px rgba(16, 185, 129, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    
                    {/* Header: Order #, Date, Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                          ORDER NUMBER
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                          {order.order_number}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} /> {order.pickup_date}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontWeight: 700 }}>
                            <Clock size={13} /> Pickup: {order.pickup_time}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <StatusBadge status={order.status} />
                        {order.payment_status === 'Paid' ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                            <Check size={12} /> Paid via {order.payment_method}
                          </span>
                        ) : (
                          <span className={order.payment_method === 'Cash on Delivery' ? 'badge badge-blue' : 'badge badge-amber'} style={{ fontSize: '0.75rem' }}>
                            {order.payment_method || 'Cash on Pickup'}
                          </span>
                        )}

                      </div>
                    </div>


                    {/* Progress Stepper for Active Order */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {['Pending', 'Confirmed', 'Preparing', 'Ready'].map((step, idx) => {
                          const stepOrder = ['Pending', 'Confirmed', 'Preparing', 'Ready'];
                          const currentIndex = stepOrder.indexOf(order.status);
                          const isComplete = idx <= currentIndex;
                          const isCurrent = order.status === step;

                          return (
                            <div key={step} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: isComplete ? '#059669' : '#e2e8f0',
                                color: isComplete ? '#ffffff' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 0.35rem auto',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                {isComplete ? '✓' : idx + 1}
                              </div>
                              <div style={{ fontSize: '0.725rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#059669' : '#64748b' }}>
                                {step}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items List */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                        ORDER ITEMS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: '#0f172a' }}>
                              <strong style={{ color: '#059669' }}>{item.quantity}x</strong> {item.item_name}
                            </span>
                            <span style={{ fontWeight: 600, color: '#475569' }}>
                              ৳{(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Price, Estimated Wait, Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Paid: </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                          ৳{order.subtotal.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                          ({order.total_calories} kcal)
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {order.payment_status !== 'Paid' && order.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setPayingOrder(order);
                              setSelectedPayMethod('bKash');
                              setPinOrTxn('1234');
                            }}
                            className="btn-primary"
                            style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', backgroundColor: '#d12053' }}
                          >
                            Pay Online (৳{order.subtotal.toFixed(0)})
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReceipt(order)}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
                        >
                          <Receipt size={14} /> View Receipt
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Previous Orders Section */}
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
              Order History ({pastOrders.length})
            </h2>

            {pastOrders.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No past completed orders yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pastOrders.map((order) => (
                  <div key={order.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                          {order.order_number}
                        </span>
                        <StatusBadge status={order.status} size="small" />
                        {order.payment_status === 'Paid' ? (
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                            Paid via {order.payment_method}
                          </span>
                        ) : (
                          <span className={order.payment_method === 'Cash on Delivery' ? 'badge badge-blue' : 'badge badge-slate'} style={{ fontSize: '0.7rem' }}>
                            {order.payment_method || 'Cash on Pickup'}
                          </span>
                        )}

                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {order.pickup_date} at {order.pickup_time} • ৳{order.subtotal.toFixed(2)} • {order.total_calories} kcal
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.35rem' }}>
                        {order.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <Receipt size={14} /> Receipt
                      </button>

                      {/* One-Tap Reorder Button */}
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderLoading}
                        className="btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                        title="Add these items to your cart with current menu prices"
                      >
                        <RotateCcw size={14} /> Reorder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}

      {/* Pay Order Online Modal */}
      {payingOrder && (
        <div className="modal-overlay" onClick={() => setPayingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Pay for Order {payingOrder.order_number}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Pickup: <strong>{payingOrder.pickup_date} at {payingOrder.pickup_time}</strong>
                </p>
              </div>
              <button onClick={() => setPayingOrder(null)} style={{ color: '#94a3b8' }}>
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
                ORDER AMOUNT PAYABLE
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
                ৳{Number(payingOrder.subtotal).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handlePayOrder}>
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
                        padding: '0.75rem 0.4rem',
                        borderRadius: '0.625rem',
                        border: selectedPayMethod === method.id ? '2px solid #059669' : '1px solid #e2e8f0',
                        backgroundColor: selectedPayMethod === method.id ? '#ecfdf5' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: selectedPayMethod === method.id ? '#065f46' : '#334155',
                        textAlign: 'center',
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
                  {/* Mobile Number */}
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
                  💵 You can pay <strong>৳{Number(payingOrder.subtotal).toFixed(2)}</strong> in cash when the delivery person arrives at your campus location.
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="btn-primary"
                  style={{ 
                    flex: 1,
                    backgroundColor: selectedPayMethod === 'bKash' ? '#d12053' : selectedPayMethod === 'Nagad' ? '#f7941d' : selectedPayMethod === 'Cash on Delivery' ? '#2563eb' : '#059669'
                  }}
                >
                  {submittingPayment ? 'Processing...' : selectedPayMethod === 'Cash on Delivery' ? 'Switch to Cash on Delivery' : `Confirm ৳${Number(payingOrder.subtotal).toFixed(0)} Payment`}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceipt && (

        <DigitalReceipt
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}
