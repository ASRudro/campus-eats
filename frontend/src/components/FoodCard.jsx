import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StarRating from './StarRating';
import { Heart, Plus, Clock, Flame, Sparkles, Check, AlertCircle, Eye } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

export default function FoodCard({ item, isFavoriteInitial = false, onFavoriteToggle = null }) {
  const { addToCart, projectedSpent, budgetLimit, projectedCalories, calorieLimit } = useCart();
  const { isAuthenticated, role } = useAuth();

  const [isFav, setIsFav] = useState(isFavoriteInitial);
  const [imgSrc, setImgSrc] = useState(item.image_url || FALLBACK_IMAGE);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [warningMsg, setWarningMsg] = useState(null);

  const isStaff = role === 'admin' || role === 'kitchen';

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please log in to save your favorite dishes.');
      return;
    }

    try {
      const res = await api.post(`/favorites/${item.id}`);
      if (res.data.success) {
        setIsFav(res.data.is_favorite);
        if (onFavoriteToggle) onFavoriteToggle(item.id, res.data.is_favorite);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item.is_available) return;

    // Check guardrail warning before adding
    const newProjectedPrice = projectedSpent + item.price;
    const newProjectedCals = projectedCalories + item.calories;

    if (newProjectedPrice > budgetLimit) {
      setWarningMsg(`⚠️ Warning: Adding this item exceeds your daily budget of ৳${budgetLimit}!`);
      setTimeout(() => setWarningMsg(null), 3500);
    } else if (newProjectedCals > calorieLimit) {
      setWarningMsg(`⚠️ Warning: Adding this item exceeds your daily calorie goal of ${calorieLimit} kcal!`);
      setTimeout(() => setWarningMsg(null), 3500);
    }

    addToCart(item, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {/* Food Image Container */}
      <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
        <img 
          src={imgSrc} 
          alt={item.name}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          loading="lazy"
        />

        {/* Favorite Heart Button (Student / Guest only) */}
        {!isStaff && (
          <button
            onClick={handleFavoriteClick}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              color: isFav ? '#ef4444' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
            title={isFav ? 'Remove Favorite' : 'Save as Favorite'}
          >
            <Heart size={18} fill={isFav ? '#ef4444' : 'none'} />
          </button>
        )}

        {/* Badges Overlay */}
        <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {item.shop_name && (
            <span style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '0.375rem'
            }}>
              {item.shop_name}
            </span>
          )}
          {item.is_special && (
            <span className="badge badge-green" style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}>
              <Sparkles size={11} /> Special
            </span>
          )}
          {item.is_combo && (
            <span className="badge badge-purple" style={{ backgroundColor: '#7e22ce', color: '#ffffff', border: 'none' }}>
              Combo Deal
            </span>
          )}
          {!item.is_available && (
            <span className="badge badge-red" style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}>
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Category, Shop Badge & Rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {item.category_name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
            <StarRating rating={item.average_rating} size={13} />
            <span>{item.average_rating > 0 ? item.average_rating : 'New'}</span>
          </div>
        </div>

        {/* Name */}
        <Link to={`/menu/${item.id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '0.35rem',
            lineHeight: '1.3'
          }}>
            {item.name}
          </h3>
        </Link>

        {/* Description */}
        <p style={{
          fontSize: '0.8rem',
          color: '#64748b',
          lineHeight: '1.4',
          marginBottom: '0.85rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {item.description}
        </p>

        {/* Meta info: Calories & Prep Time */}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', marginTop: 'auto' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Flame size={13} color="#f59e0b" /> {item.calories} kcal
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={13} color="#64748b" /> {item.preparation_time} mins
          </span>
        </div>

        {/* Guardrail Warning Banner on Card */}
        {warningMsg && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.7rem',
            padding: '0.35rem 0.5rem',
            borderRadius: '0.375rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <AlertCircle size={12} /> {warningMsg}
          </div>
        )}

        {/* Price & Action: Add to Cart for Students vs Details for Admin/Kitchen */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Price</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              ৳{item.price.toFixed(0)}
            </div>
          </div>

          {!isStaff ? (
            <button
              onClick={handleAddToCart}
              disabled={!item.is_available}
              className={item.is_available ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.8rem',
                borderRadius: '0.5rem'
              }}
            >
              {addedAnimation ? (
                <>
                  <Check size={16} /> Added
                </>
              ) : (
                <>
                  <Plus size={16} /> Add to Cart
                </>
              )}
            </button>
          ) : (
            <Link
              to={`/menu/${item.id}`}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.8rem',
                fontSize: '0.8rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600
              }}
            >
              <Eye size={14} /> View Details
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
