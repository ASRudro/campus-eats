import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import FoodCard from '../components/FoodCard';
import GuardrailBar from '../components/GuardrailBar';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Flame, 
  ShoppingBag, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Users,
  Utensils
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [combos, setCombos] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recentOrder, setRecentOrder] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [shopsRes, specialsRes, combosRes, popularRes] = await Promise.all([
          api.get('/menu/shops').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/menu?is_special=true&available_only=true'),
          api.get('/menu?is_combo=true&available_only=true'),
          api.get('/menu?sort=popularity&available_only=true')
        ]);

        if (shopsRes.data?.success) setShops(shopsRes.data.data);
        if (specialsRes.data?.success) setSpecials(specialsRes.data.data.slice(0, 4));
        if (combosRes.data?.success) setCombos(combosRes.data.data.slice(0, 3));
        if (popularRes.data?.success) setPopular(popularRes.data.data.slice(0, 6));

        if (isAuthenticated) {
          // Fetch favorites
          const favs = await api.get('/favorites/ids').catch(() => null);
          if (favs && favs.data.success) setFavoriteIds(favs.data.ids);

          // Fetch recent order for Quick Reorder
          const orders = await api.get('/orders/my').catch(() => null);
          if (orders && orders.data.success && orders.data.data.length > 0) {
            setRecentOrder(orders.data.data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated]);

  const handleQuickReorder = async () => {
    if (!recentOrder) return;
    try {
      const res = await api.get(`/orders/reorder/${recentOrder.id}`);
      if (res.data.success && res.data.items) {
        res.data.items.forEach(item => {
          addToCart(item, item.quantity);
        });
        navigate('/cart');
      }
    } catch (err) {
      alert('Could not reorder items. Some items may be sold out.');
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      
      {/* Hero Welcome Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        color: '#ffffff',
        padding: '3rem 0',
        borderRadius: '0 0 1.5rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(5, 150, 105, 0.15)'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content' }}>
            <Sparkles size={14} /> 5 Specialty Campus Food Stalls & Canteens
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: '1.15', letterSpacing: '-0.02em', maxWidth: '700px' }}>
            {isAuthenticated ? (
              <>Welcome back, <span style={{ color: '#a7f3d0' }}>{user?.name?.split(' ')[0]}</span>! What are you craving today?</>
            ) : (
              <>Order from 5 Campus Stalls & Skip the 30-Minute Lunch Queue.</>
            )}
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#ecfdf5', maxWidth: '620px', lineHeight: '1.5' }}>
            Choose from authentic lunch meals (Shop 1 & 2), fast food & burgers (Shop 3), fresh fruit juices (Shop 4), or hot chai & snacks (Shop 5) with scheduled pickup.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <Link to="/menu" className="btn-primary" style={{ backgroundColor: '#ffffff', color: '#064e3b', fontWeight: 700, padding: '0.75rem 1.5rem' }}>
              Explore All 5 Shops <ArrowRight size={18} />
            </Link>
            {isAuthenticated ? (
              <Link to="/schedule" className="btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', padding: '0.75rem 1.25rem' }}>
                <Calendar size={16} /> Plan Weekly Meals
              </Link>
            ) : (
              <Link to="/register" className="btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', padding: '0.75rem 1.25rem' }}>
                Create Student Account
              </Link>
            )}
          </div>

        </div>
      </section>

      <div className="container">
        
        {/* Guardrail Status Bar (For logged-in students) */}
        {isAuthenticated && user?.role === 'student' && (
          <div style={{ marginBottom: '2rem' }}>
            <GuardrailBar />
          </div>
        )}

        {/* Quick Reorder Banner (If user has past orders) */}
        {isAuthenticated && recentOrder && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.65rem', borderRadius: '0.75rem' }}>
                <RotateCcw size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Quick One-Tap Reorder
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Order Again from #{recentOrder.order_number}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {recentOrder.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')} • ৳{recentOrder.subtotal}
                </div>
              </div>
            </div>

            <button onClick={handleQuickReorder} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
              <RotateCcw size={16} /> Reorder with Current Prices
            </button>
          </div>
        )}

        {/* 🏪 5 CAMPUS SHOPS & STALLS SHOWCASE SECTION */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div>
              <div className="badge badge-green" style={{ marginBottom: '0.35rem' }}>
                <Utensils size={12} /> Campus Food Court
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                5 Campus Food Stalls & Shops
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Choose the right stall for your meal — Lunch/Dinner (1 & 2), Fast Food (3), Juices (4), or Tea & Coffee (5).
              </p>
            </div>
            <Link to="/menu" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All Menus <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {shops.length > 0 ? (
              shops.map((shop) => {
                const logoSrc = shop.logo_url || (shop.id <= 2 ? `/images/shops/shop${shop.id}_logo.jpg` : `/images/shops/shop${shop.id}_logo.svg`);
                return (
                  <div 
                    key={shop.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      position: 'relative',
                      border: '1px solid #e2e8f0',
                      borderRadius: '1rem',
                      backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(5, 150, 105, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Shop Image Header with floating Logo */}
                    <div style={{ position: 'relative', height: '150px', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                      <img 
                        src={shop.image_url || logoSrc} 
                        alt={shop.name}
                        onError={(e) => { e.target.src = logoSrc; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)'
                      }} />

                      {/* Stall Tag Top Left */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#ffffff',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.03em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        Stall #{shop.id < 10 ? `0${shop.id}` : shop.id}
                      </div>

                      {/* Rating Top Right */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#ffffff',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: '#d97706',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        ★ {shop.rating}
                      </div>

                      {/* Floating Circular Shop Logo Badge */}
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '14px',
                        width: '62px',
                        height: '62px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: '3px solid #ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      }}>
                        <img 
                          src={logoSrc} 
                          alt={`${shop.name} Logo`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.src = '/images/mutton_kacchi.jpg'; }}
                        />
                      </div>

                      {/* Category Badge Bottom Right */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: '#ffffff',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#059669',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        {shop.badge || shop.category_type}
                      </div>
                    </div>

                    {/* Shop Details */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {shop.name}
                        </h3>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {shop.tagline}
                      </div>

                      <p style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        lineHeight: '1.45',
                        marginBottom: '0.85rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {shop.description}
                      </p>

                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <Clock size={14} color="#059669" /> {shop.delivery_time}
                        </div>

                        <Link 
                          to={`/menu?shop=${shop.id}`}
                          className="btn-primary"
                          style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.8rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 700
                          }}
                        >
                          Explore Menu <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback cards if loading or offline
              [
                { id: 1, name: 'Campus Kitchen', badge: '🍛 Regular Meals', logo: '/images/shops/shop1_logo.jpg', desc: 'Rice bowls, student thalis, mutton kacchi, khichuri & chicken curry.' },
                { id: 2, name: 'Bhojon Bilash', badge: '🍲 Deshi Feast', logo: '/images/shops/shop2_logo.jpg', desc: 'Dhaka chicken bhuna khichuri, old town beef tehari & chicken chaap.' },
                { id: 3, name: 'Varsity Bites', badge: '🍔 Fast Food Hub', logo: '/images/shops/shop3_logo.svg', desc: 'Crispy chicken burgers, shawarma wraps, white sauce pasta & wings.' },
                { id: 4, name: 'Fresh Sip Juice Bar', badge: '🥤 Juice & Shakes', logo: '/images/shops/shop4_logo.svg', desc: 'Cold coffee, fresh mint lemonade, mango shorbot & strawberry shakes.' },
                { id: 5, name: 'The Chai Break', badge: '☕ Chai & Adda', logo: '/images/shops/shop5_logo.svg', desc: 'Special malai cha, brewed espresso, hot shingara, porota & brownies.' }
              ].map(shop => (
                <div key={shop.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <img src={shop.logo} alt={shop.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'contain', border: '2px solid #059669' }} />
                    <div>
                      <div className="badge badge-green">{shop.badge}</div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{shop.name}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>{shop.desc}</p>
                  <Link to={`/menu?shop=${shop.id}`} className="btn-primary" style={{ marginTop: 'auto', padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
                    View Menu <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Daily Specials Section */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="badge badge-green" style={{ marginBottom: '0.35rem' }}>
                <Sparkles size={12} /> Today's Highlights
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                Daily Specials
              </h2>
            </div>
            <Link to="/menu" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              See All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="food-grid">
            {specials.map(item => (
              <FoodCard 
                key={item.id} 
                item={item} 
                isFavoriteInitial={favoriteIds.includes(item.id)} 
              />
            ))}
          </div>
        </section>

        {/* Combo Deals Section */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>
                Best Value
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                Budget Combo Deals
              </h2>
            </div>
            <Link to="/menu" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              See All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="food-grid">
            {combos.map(item => (
              <FoodCard 
                key={item.id} 
                item={item} 
                isFavoriteInitial={favoriteIds.includes(item.id)} 
              />
            ))}
          </div>
        </section>

        {/* Popular Campus Foods */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                Popular Campus Favorites
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Most ordered items by university students this week
              </p>
            </div>
            <Link to="/menu" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View Full Menu <ArrowRight size={14} />
            </Link>
          </div>

          <div className="food-grid">
            {popular.map(item => (
              <FoodCard 
                key={item.id} 
                item={item} 
                isFavoriteInitial={favoriteIds.includes(item.id)} 
              />
            ))}
          </div>
        </section>

        {/* University Viva Feature Callouts */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: '1.5rem' }}>
            Designed Specifically For Campus Life
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Clock size={24} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>Scheduled Pickup</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Choose your 15-minute pickup window between classes so your hot food is ready the minute you arrive.</p>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <ShieldCheck size={24} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>Budget & Calorie Limits</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure daily spending and calorie caps. The guardrail prevents accidental over-ordering on both client and server.</p>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Users size={24} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>Group Ordering</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Order together with batchmates using a shareable group code while keeping individual budget limits protected.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
