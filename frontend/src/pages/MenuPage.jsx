import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FoodCard from '../components/FoodCard';
import GuardrailBar from '../components/GuardrailBar';
import { Search, ArrowUpDown, X, Utensils, Clock, MapPin, Sparkles, Store } from 'lucide-react';

export default function MenuPage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(searchParams.get('shop') || 'All');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('popularity');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state if URL search param changes
  useEffect(() => {
    const shopParam = searchParams.get('shop');
    if (shopParam && shopParam !== selectedShopId) {
      setSelectedShopId(shopParam);
    }
  }, [searchParams]);

  // Load shops, categories, and favorites
  useEffect(() => {
    async function init() {
      try {
        const [shopsRes, catRes, favRes] = await Promise.all([
          api.get('/menu/shops').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/menu/categories'),
          isAuthenticated ? api.get('/favorites/ids').catch(() => null) : Promise.resolve(null)
        ]);

        if (shopsRes.data?.success) {
          setShops(shopsRes.data.data);
        }

        if (catRes.data?.success) {
          setCategories(catRes.data.data);
        }

        if (favRes && favRes.data?.success) {
          setFavoriteIds(favRes.data.ids);
        }
      } catch (err) {
        console.error('Failed to load menu metadata:', err);
      }
    }

    init();
  }, [isAuthenticated]);

  // Fetch items whenever shop, category, search, or sort changes
  useEffect(() => {
    async function fetchFilteredItems() {
      setLoading(true);
      try {
        let url = `/menu?sort=${sortOption}`;
        if (selectedShopId !== 'All' && selectedShopId !== 'all') {
          url += `&shop_id=${encodeURIComponent(selectedShopId)}`;
        }
        if (selectedCategory !== 'All' && selectedCategory !== 'all') {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }
        if (searchQuery.trim() !== '') {
          url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }

        const res = await api.get(url);
        if (res.data.success) {
          setItems(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchFilteredItems();
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedShopId, selectedCategory, searchQuery, sortOption]);

  const handleShopSelect = (shopId) => {
    setSelectedShopId(shopId);
    setSelectedCategory('All');
    if (shopId === 'All') {
      searchParams.delete('shop');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ shop: shopId });
    }
  };

  const handleFavoriteToggle = (itemId, isFav) => {
    setFavoriteIds(prev => isFav ? [...prev, itemId] : prev.filter(id => id !== itemId));
  };

  const activeShop = shops.find(s => String(s.id) === String(selectedShopId));

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
          Campus Food Stalls & Menus
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Select any of the 5 campus shops below to order meals, fast food, juices, and snacks.
        </p>
      </div>

      {/* Guardrail Bar (Student) */}
      {isAuthenticated && user?.role === 'student' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <GuardrailBar compact={true} />
        </div>
      )}

      {/* 🏪 5 SHOPS SELECTOR TABS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Store size={15} color="#059669" /> Select Campus Food Stall:
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.65rem'
        }}>
          {/* ALL SHOPS TAB */}
          <button
            onClick={() => handleShopSelect('All')}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.85rem',
              textAlign: 'left',
              transition: 'all 0.2s',
              backgroundColor: selectedShopId === 'All' ? '#064e3b' : '#ffffff',
              color: selectedShopId === 'All' ? '#ffffff' : '#0f172a',
              border: selectedShopId === 'All' ? '2px solid #064e3b' : '1px solid #e2e8f0',
              boxShadow: selectedShopId === 'All' ? '0 4px 12px rgba(6, 78, 59, 0.25)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: selectedShopId === 'All' ? '#047857' : '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0
            }}>
              🏪
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.7rem', color: selectedShopId === 'All' ? '#a7f3d0' : '#64748b', fontWeight: 700 }}>
                All 5 Stalls
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                Full Campus Menu
              </div>
            </div>
          </button>

          {/* SHOP TABS */}
          {shops.map((s) => {
            const isSelected = String(selectedShopId) === String(s.id);
            const logoSrc = s.logo_url || (s.id <= 2 ? `/images/shops/shop${s.id}_logo.jpg` : `/images/shops/shop${s.id}_logo.svg`);
            return (
              <button
                key={s.id}
                onClick={() => handleShopSelect(String(s.id))}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.85rem',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  backgroundColor: isSelected ? '#059669' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#0f172a',
                  border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: isSelected ? '2px solid #ffffff' : '1px solid #cbd5e1',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={logoSrc} 
                    alt={s.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = '/images/mutton_kacchi.jpg'; }}
                  />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.7rem', color: isSelected ? '#ecfdf5' : '#059669', fontWeight: 700 }}>
                    Stall #{s.id}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SHOP DETAILS BANNER */}
      {activeShop && (() => {
        const activeLogo = activeShop.logo_url || (activeShop.id <= 2 ? `/images/shops/shop${activeShop.id}_logo.jpg` : `/images/shops/shop${activeShop.id}_logo.svg`);
        return (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #bbf7d0',
            borderRadius: '1.25rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 4px 16px rgba(5, 150, 105, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '78px',
                height: '78px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '3px solid #059669',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={activeLogo} 
                  alt={activeShop.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.src = '/images/mutton_kacchi.jpg'; }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-green" style={{ backgroundColor: '#059669', color: '#ffffff', fontWeight: 800 }}>
                    Stall #{activeShop.id < 10 ? `0${activeShop.id}` : activeShop.id} • {activeShop.badge}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#d97706', backgroundColor: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>
                    ★ {activeShop.rating} Rating
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064e3b', marginBottom: '0.25rem' }}>
                  {activeShop.name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {activeShop.tagline}
                </div>
                <p style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '650px', margin: 0, lineHeight: '1.4' }}>
                  {activeShop.description}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              fontSize: '0.8rem',
              color: '#065f46',
              backgroundColor: '#f0fdf4',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #dcfce7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={15} color="#059669" /> <span>Location: <strong>{activeShop.location}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} color="#059669" /> <span>Prep & Pickup: <strong>{activeShop.delivery_time}</strong></span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Search and Sort Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder={activeShop ? `Search dishes in ${activeShop.name}...` : "Search by dish name, description, ingredients..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.5rem' : '1rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={16} color="#64748b" />
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sort by:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '0.5rem 1.8rem 0.5rem 0.75rem', fontWeight: 500 }}
          >
            <option value="popularity">Popularity / Specials</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="prep_time">Fastest Preparation</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '2rem',
        whiteSpace: 'nowrap'
      }}>
        <button
          onClick={() => setSelectedCategory('All')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            backgroundColor: selectedCategory === 'All' ? '#059669' : '#ffffff',
            color: selectedCategory === 'All' ? '#ffffff' : '#475569',
            border: selectedCategory === 'All' ? '1px solid #059669' : '1px solid #e2e8f0',
            boxShadow: selectedCategory === 'All' ? '0 2px 4px rgba(5, 150, 105, 0.2)' : 'none'
          }}
        >
          All Categories
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              backgroundColor: selectedCategory === cat.name ? '#059669' : '#ffffff',
              color: selectedCategory === cat.name ? '#ffffff' : '#475569',
              border: selectedCategory === cat.name ? '1px solid #059669' : '1px solid #e2e8f0',
              boxShadow: selectedCategory === cat.name ? '0 2px 4px rgba(5, 150, 105, 0.2)' : 'none'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Food Grid / Loading / Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#059669', marginBottom: '0.5rem' }}>
            Loading delicious campus food...
          </div>
          <p style={{ fontSize: '0.85rem' }}>Fetching live items from {activeShop ? activeShop.name : 'all 5 campus stalls'}</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0'
        }}>
          <Utensils size={40} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No food items found
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Try resetting filters or choosing another shop stall.
          </p>
          <button
            onClick={() => { setSelectedShopId('All'); setSelectedCategory('All'); setSearchQuery(''); }}
            className="btn-secondary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="food-grid">
          {items.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              isFavoriteInitial={favoriteIds.includes(item.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

    </div>
  );
}
