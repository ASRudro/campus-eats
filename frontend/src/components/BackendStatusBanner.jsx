import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export default function BackendStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkBackend = async () => {
    setIsChecking(true);
    try {
      const res = await api.get('/health', { timeout: 3000 });
      if (res.data && res.data.status === 'online') {
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();
    // Periodically recheck every 15s if offline
    const interval = setInterval(() => {
      checkBackend();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      borderBottom: '1px solid #fecaca',
      color: '#991b1b',
      padding: '0.6rem 1rem',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <AlertTriangle size={18} color="#dc2626" />
        <span>
          <strong>Backend Offline:</strong> Cannot connect to <code>http://localhost:5000/api</code>.
          Run <code>npm run backend</code> or double-click <code>start.bat</code> to enable database, login & orders.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={checkBackend}
          disabled={isChecking}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            backgroundColor: '#ffffff',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#b91c1c',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={12} className={isChecking ? 'spin' : ''} />
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#991b1b',
            cursor: 'pointer',
            padding: '0.2rem'
          }}
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
