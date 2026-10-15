import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      const role = res.user.role;
      const destination = location.state?.from?.pathname || (role === 'admin' ? '/admin' : role === 'kitchen' ? '/kitchen' : '/');
      navigate(destination, { replace: true });
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="container" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
      }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#059669',
            color: '#ffffff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
          }}>
            <UtensilsCrossed size={26} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Welcome to CampusEats
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Log in to pre-order lunch and skip cafeteria queues.
          </p>
        </div>

        {/* Demo Accounts Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem',
          padding: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={13} /> Demo Quick-Fill:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('tanvir@campuseats.com', 'Student123!')}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.15rem', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Student 1: Tanvir Ahmed"
            >
              Student 1
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('nafis@campuseats.com', 'Student123!')}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.15rem', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Student 2: Nafis Rahman"
            >
              Student 2
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('kitchen@campuseats.com', 'Kitchen123!')}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.15rem', textAlign: 'center' }}
              title="Kitchen Chef"
            >
              Kitchen
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@campuseats.com', 'Admin123!')}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.15rem', textAlign: 'center' }}
              title="Administrator"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              University Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="input-field"
                placeholder="tanvir@campuseats.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Logging in...' : 'Sign In to Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          New student?{' '}
          <Link to="/register" style={{ color: '#059669', fontWeight: 700 }}>
            Create an account
          </Link>
        </div>

      </div>

    </div>
  );
}
