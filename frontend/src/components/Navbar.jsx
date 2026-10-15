import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Heart, 
  Clock, 
  Calendar, 
  Users, 
  Award, 
  User, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  ChefHat, 
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, role } = useAuth();
  const { totalItems, projectedSpent, budgetLimit, isOverBudget, isOverCalories } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Determine brand logo link based on role
  const brandLink = role === 'kitchen' ? '/kitchen' : role === 'admin' ? '/admin' : '/';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        
        {/* Logo & Brand */}
        <Link to={brandLink} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
          }}>
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Campus<span style={{ color: '#059669' }}>Eats</span>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Skip The Lunch Queue
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', gap: '1.25rem', alignItems: 'center' }} className="desktop-nav">
          
          {/* Guest / Student Navigation */}
          {(!isAuthenticated || role === 'student') && (
            <>
              <Link 
                to="/" 
                style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  color: isActive('/') ? '#059669' : '#475569',
                  transition: 'color 0.2s'
                }}
              >
                Home
              </Link>
              <Link 
                to="/menu" 
                style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  color: isActive('/menu') ? '#059669' : '#475569' 
                }}
              >
                Menu
              </Link>
            </>
          )}

          {/* Student-Only Links */}
          {isAuthenticated && role === 'student' && (
            <>
              <Link to="/orders" style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive('/orders') ? '#059669' : '#475569' }}>
                My Orders
              </Link>
              <Link to="/schedule" style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive('/schedule') ? '#059669' : '#475569' }}>
                Schedule
              </Link>
              <Link to="/group-order" style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive('/group-order') ? '#059669' : '#475569' }}>
                Group Order
              </Link>
              <Link to="/favorites" style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive('/favorites') ? '#059669' : '#475569' }}>
                Favorites
              </Link>
              <Link to="/loyalty" style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive('/loyalty') ? '#059669' : '#475569' }}>
                Loyalty
              </Link>
            </>
          )}

          {/* Kitchen Staff: ONLY Kitchen Queue */}
          {isAuthenticated && role === 'kitchen' && (
            <Link 
              to="/kitchen" 
              style={{ 
                fontWeight: 700, 
                fontSize: '0.95rem', 
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#ecfdf5',
                padding: '0.4rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #a7f3d0'
              }}
            >
              <ChefHat size={18} /> Kitchen Queue
            </Link>
          )}

          {/* Admin Navigation: Menu + Admin Dashboard (NO Home) */}
          {isAuthenticated && role === 'admin' && (
            <>
              <Link 
                to="/menu" 
                style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  color: isActive('/menu') ? '#059669' : '#475569' 
                }}
              >
                Menu
              </Link>
              <Link 
                to="/admin" 
                style={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  color: isActive('/admin') ? '#059669' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <LayoutDashboard size={16} /> Admin Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Right Section: Guardrail pill, Cart icon, User profile, Auth actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Quick Guardrail Pill (Student only) */}
          {isAuthenticated && role === 'student' && (
            <Link 
              to="/cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: isOverBudget || isOverCalories ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${isOverBudget || isOverCalories ? '#fecaca' : '#bbf7d0'}`,
                padding: '0.35rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: isOverBudget || isOverCalories ? '#dc2626' : '#15803d',
                cursor: 'pointer'
              }}
              title="Today's Spending Guardrail"
            >
              {(isOverBudget || isOverCalories) && <ShieldAlert size={14} color="#dc2626" />}
              <span>৳{projectedSpent.toFixed(0)} / ৳{budgetLimit}</span>
            </Link>
          )}

          {/* Cart Icon (Student only) */}
          {(!isAuthenticated || role === 'student') && (
            <Link 
              to="/cart"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                color: '#1e293b',
                transition: 'background 0.2s'
              }}
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {/* Authenticated User Menu */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link 
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="user-name-label" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                  {role}
                </span>
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '0.5rem',
                  color: '#94a3b8',
                  borderRadius: '0.5rem',
                  transition: 'color 0.2s'
                }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.825rem' }}>
                Log In
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.825rem' }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '0.4rem',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Guest / Student Mobile Links */}
          {(!isAuthenticated || role === 'student') && (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Home</Link>
              <Link to="/menu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Food Menu</Link>
            </>
          )}
          
          {isAuthenticated && role === 'student' && (
            <>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>My Orders</Link>
              <Link to="/schedule" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Weekly Schedule</Link>
              <Link to="/group-order" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Group Order</Link>
              <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Favorites</Link>
              <Link to="/loyalty" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Loyalty Points</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>Profile & Budget Limits</Link>
            </>
          )}

          {/* Kitchen Staff Mobile Links: ONLY Kitchen Queue */}
          {isAuthenticated && role === 'kitchen' && (
            <>
              <Link to="/kitchen" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 700, color: '#059669' }}>
                <ChefHat size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Kitchen Order Queue
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>
                Profile & Settings
              </Link>
            </>
          )}

          {/* Admin Mobile Links: Menu + Admin Dashboard (NO Home) */}
          {isAuthenticated && role === 'admin' && (
            <>
              <Link to="/menu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>
                Food Menu
              </Link>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 700, color: '#059669' }}>
                Admin Analytics & Management
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0', fontWeight: 600 }}>
                Profile & Settings
              </Link>
            </>
          )}

          {isAuthenticated && (
            <button 
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#dc2626',
                fontWeight: 600,
                padding: '0.5rem 0'
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>
      )}

      {/* Responsive CSS helper */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 859px) {
          .user-name-label { display: none; }
        }
      `}</style>
    </header>
  );
}
