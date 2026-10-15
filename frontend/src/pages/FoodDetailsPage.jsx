import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import GuardrailBar from '../components/GuardrailBar';
import { 
  Heart, 
  Plus, 
  Minus, 
  Clock, 
  Flame, 
  Check, 
  ArrowLeft, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles,
  Send,
  Store,
  MapPin
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

export default function FoodDetailsPage() {
  const { id } = useParams();
  const { addToCart, projectedSpent, budgetLimit, projectedCalories, calorieLimit } = useCart();
  const { isAuthenticated, user, role } = useAuth();
  const isStaff = role === 'admin' || role === 'kitchen';

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [warningMsg, setWarningMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);

  useEffect(() => {
    async function fetchItemDetails() {
      try {
        const [res, favsRes] = await Promise.all([
          api.get(`/menu/${id}`),
          isAuthenticated ? api.get('/favorites/ids').catch(() => null) : Promise.resolve(null)
        ]);

        if (res.data.success) {
          setItem(res.data.data);
        }

        if (favsRes && favsRes.data.success) {
          setIsFavorite(favsRes.data.ids.includes(Number(id)));
        }
      } catch (err) {
        console.error('Error fetching food details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchItemDetails();
  }, [id, isAuthenticated]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save your favorite dishes.');
      return;
    }

    try {
      const res = await api.post(`/favorites/${id}`);
      if (res.data.success) {
        setIsFavorite(res.data.is_favorite);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleAddToCart = () => {
    if (!item || !item.is_available) return;

    // Check guardrail
    const addedPrice = item.price * quantity;
    const addedCals = item.calories * quantity;
    const newPrice = projectedSpent + addedPrice;
    const newCals = projectedCalories + addedCals;

    if (newPrice > budgetLimit) {
      setWarningMsg(`⚠️ Warning: Adding ${quantity}x ${item.name} exceeds your daily spending budget of ৳${budgetLimit}!`);
    } else if (newCals > calorieLimit) {
      setWarningMsg(`⚠️ Warning: Adding ${quantity}x ${item.name} exceeds your daily calorie goal of ${calorieLimit} kcal!`);
    } else {
      setWarningMsg(null);
    }

    addToCart(item, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit a review.');
      return;
    }

    if (!newComment.trim()) {
      alert('Please write a short comment about your experience.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post(`/reviews/item/${id}`, {
        rating: newRating,
        comment: newComment.trim()
      });

      if (res.data.success) {
        setReviewMessage('Thank you! Your review has been submitted.');
        setNewComment('');
        // Refresh item reviews
        const refreshRes = await api.get(`/menu/${id}`);
        if (refreshRes.data.success) {
          setItem(refreshRes.data.data);
        }
      }
    } catch (err) {
      console.error('Submit review error:', err);
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
        Loading food details...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Menu item not found</h2>
        <Link to="/menu" className="btn-primary" style={{ marginTop: '1rem' }}>
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Back Link */}
      <Link 
        to="/menu" 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#64748b',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          transition: 'color 0.2s'
        }}
      >
        <ArrowLeft size={16} /> Back to Full Menu
      </Link>

      {/* Main Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        marginBottom: '2.5rem'
      }}>
        
        {/* Left: Large Image */}
        <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', height: '360px', backgroundColor: '#f1f5f9' }}>
          <img 
            src={item.image_url || FALLBACK_IMAGE} 
            alt={item.name}
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {item.is_special && (
              <span className="badge badge-green" style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}>
                <Sparkles size={12} /> Daily Special
              </span>
            )}
            {item.is_combo && (
              <span className="badge badge-purple" style={{ backgroundColor: '#7e22ce', color: '#ffffff', border: 'none' }}>
                Combo Deal
              </span>
            )}
            {!item.is_available && (
              <span className="badge badge-red" style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}>
                Currently Sold Out
              </span>
            )}
          </div>

          {/* Favorite Button (Student / Guest only) */}
          {!isStaff && (
            <button
              onClick={handleFavoriteToggle}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: '#ffffff',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: isFavorite ? '#ef4444' : '#94a3b8'
              }}
            >
              <Heart size={22} fill={isFavorite ? '#ef4444' : 'none'} />
            </button>
          )}
        </div>

        {/* Right: Info & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Category & Shop Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
              {item.category_name}
            </span>
            {item.shop_name && (
              <Link 
                to={`/menu?shop=${item.shop_id}`}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Store size={13} color="#059669" /> {item.shop_name} ({item.shop_badge || `Shop #${item.shop_id}`})
              </Link>
            )}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            {item.name}
          </h1>

          {/* Shop Stall Location Bar */}
          {item.shop_location && (
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <MapPin size={14} color="#059669" />
              <span>Prepared fresh at <strong>{item.shop_location}</strong></span>
            </div>
          )}

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <StarRating rating={item.average_rating} size={18} />
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
              {item.average_rating > 0 ? item.average_rating : 'No reviews yet'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ({item.review_count} student {item.review_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {/* Description */}
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {item.description}
          </p>

          {/* Nutritional & Prep Meta Pill Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Calories</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                <Flame size={16} /> {item.calories} kcal
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Prep Time</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                <Clock size={16} /> {item.preparation_time} mins
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Availability</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.is_available ? '#059669' : '#dc2626', marginTop: '0.3rem' }}>
                {item.is_available ? 'In Stock' : 'Sold Out'}
              </div>
            </div>
          </div>

          {/* Guardrail Warning Banner */}
          {warningMsg && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldAlert size={18} />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Price & Action: Student (Add to Cart) vs Staff (Details / Admin Link) */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            {!isStaff ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unit Price</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
                      ৳{item.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.625rem', padding: '0.25rem' }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ width: '32px', height: '32px', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      style={{ width: '32px', height: '32px', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!item.is_available}
                  className={item.is_available ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    fontSize: '1rem',
                    borderRadius: '0.75rem'
                  }}
                >
                  {addedAnimation ? (
                    <>
                      <Check size={20} /> Added {quantity} to Cart!
                    </>
                  ) : (
                    <>
                      <Plus size={20} /> Add to Cart (৳{(item.price * quantity).toFixed(2)})
                    </>
                  )}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unit Price</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
                    ৳{item.price.toFixed(2)}
                  </div>
                </div>

                {role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="btn-primary"
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Manage in Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/kitchen"
                    className="btn-primary"
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Back to Kitchen Queue
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Reviews Section */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={22} color="#059669" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Student Reviews & Ratings
          </h2>
        </div>

        {/* Submit Review Box */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Rate this item
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Your Star Rating:</span>
              <StarRating rating={newRating} onChange={(val) => setNewRating(val)} size={22} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{newRating} / 5 Stars</span>
            </div>

            <textarea
              className="input-field"
              rows={3}
              placeholder="How was the taste, portion size, and temperature? Let fellow students know..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />

            {reviewMessage && (
              <div style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                {reviewMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submittingReview || !newComment.trim()}
              className="btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              <Send size={15} /> {submittingReview ? 'Submitting...' : 'Post Review'}
            </button>
          </form>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
            <Link to="/login" style={{ color: '#059669', fontWeight: 600 }}>Log in</Link> to submit a review for this dish.
          </div>
        )}

        {/* Existing Reviews List */}
        {item.reviews && item.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {item.reviews.map((rev) => (
              <div key={rev.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                      {rev.reviewer_name?.charAt(0) || 'S'}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                      {rev.reviewer_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      ({rev.student_id})
                    </span>
                  </div>
                  <StarRating rating={rev.rating} size={14} />
                </div>

                <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: '1.5', marginTop: '0.35rem' }}>
                  {rev.comment}
                </p>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            No reviews submitted yet. Be the first student to review this dish!
          </div>
        )}

      </div>

    </div>
  );
}
