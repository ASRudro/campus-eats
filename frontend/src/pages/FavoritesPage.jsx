import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import FoodCard from '../components/FoodCard';
import { Heart, ArrowRight } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      if (res.data.success) {
        setFavorites(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleFavoriteToggle = (itemId, isFav) => {
    if (!isFav) {
      setFavorites(prev => prev.filter(item => item.id !== itemId));
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={26} color="#ef4444" fill="#ef4444" /> My Favorite Dishes
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Your saved canteen meals for quick 1-click ordering.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          Loading your favorite dishes...
        </div>
      ) : favorites.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0'
        }}>
          <Heart size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No favorites added yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Click the heart icon on any food card in the menu to save it here.
          </p>
          <Link to="/menu" className="btn-primary">
            Explore Menu <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="food-grid">
          {favorites.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              isFavoriteInitial={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
