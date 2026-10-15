import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, onChange = null, size = 16 }) {
  const isInteractive = typeof onChange === 'function';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(rating);

        return (
          <button
            type="button"
            key={i}
            disabled={!isInteractive}
            onClick={() => isInteractive && onChange(starValue)}
            style={{
              cursor: isInteractive ? 'pointer' : 'default',
              padding: isInteractive ? '2px' : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: filled ? '#f59e0b' : '#cbd5e1',
              transition: 'transform 0.1s'
            }}
          >
            <Star 
              size={size} 
              fill={filled ? '#f59e0b' : 'none'} 
              stroke={filled ? '#f59e0b' : '#cbd5e1'} 
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
