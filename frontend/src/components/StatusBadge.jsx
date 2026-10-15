import React from 'react';
import { Clock, CheckCircle2, Flame, BellRing, PackageCheck, XCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'normal' }) {
  const isSmall = size === 'small';

  switch (status) {
    case 'Ready':
      return (
        <span 
          className="badge ready-pulse"
          style={{
            fontSize: isSmall ? '0.7rem' : '0.85rem',
            padding: isSmall ? '0.3rem 0.6rem' : '0.45rem 0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            letterSpacing: '0.06em'
          }}
        >
          <BellRing size={isSmall ? 14 : 16} />
          READY FOR PICKUP
        </span>
      );

    case 'Preparing':
      return (
        <span 
          className="badge badge-purple"
          style={{
            fontSize: isSmall ? '0.7rem' : '0.8rem',
            padding: isSmall ? '0.25rem 0.55rem' : '0.35rem 0.75rem'
          }}
        >
          <Flame size={isSmall ? 12 : 14} />
          Preparing in Kitchen
        </span>
      );

    case 'Confirmed':
      return (
        <span 
          className="badge badge-blue"
          style={{
            fontSize: isSmall ? '0.7rem' : '0.8rem',
            padding: isSmall ? '0.25rem 0.55rem' : '0.35rem 0.75rem'
          }}
        >
          <CheckCircle2 size={isSmall ? 12 : 14} />
          Order Confirmed
        </span>
      );

    case 'Pending':
      return (
        <span 
          className="badge badge-amber"
          style={{
            fontSize: isSmall ? '0.7rem' : '0.8rem',
            padding: isSmall ? '0.25rem 0.55rem' : '0.35rem 0.75rem'
          }}
        >
          <Clock size={isSmall ? 12 : 14} />
          Pending
        </span>
      );

    case 'Picked Up':
      return (
        <span 
          className="badge badge-green"
          style={{
            fontSize: isSmall ? '0.7rem' : '0.8rem',
            padding: isSmall ? '0.25rem 0.55rem' : '0.35rem 0.75rem'
          }}
        >
          <PackageCheck size={isSmall ? 12 : 14} />
          Picked Up
        </span>
      );

    case 'Cancelled':
      return (
        <span 
          className="badge badge-red"
          style={{
            fontSize: isSmall ? '0.7rem' : '0.8rem',
            padding: isSmall ? '0.25rem 0.55rem' : '0.35rem 0.75rem'
          }}
        >
          <XCircle size={isSmall ? 12 : 14} />
          Cancelled
        </span>
      );

    default:
      return (
        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
          {status}
        </span>
      );
  }
}
