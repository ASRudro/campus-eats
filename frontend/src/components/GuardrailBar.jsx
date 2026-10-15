import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertTriangle, Wallet, Flame, RotateCcw } from 'lucide-react';

export default function GuardrailBar({ compact = false }) {
  const { resetDailyCounters } = useAuth();
  const {
    budgetLimit,
    calorieLimit,
    spentToday,
    caloriesToday,
    subtotal,
    totalCalories,
    projectedSpent,
    projectedCalories,
    isOverBudget,
    isOverCalories,
    budgetPercent,
    caloriePercent
  } = useCart();

  // Determine color based on threshold
  const getProgressColor = (percent, isExceeded) => {
    if (isExceeded) return '#ef4444'; // Red
    if (percent >= 80) return '#f59e0b'; // Amber warning
    return '#10b981'; // Green
  };

  const budgetColor = getProgressColor(budgetPercent, isOverBudget);
  const calorieColor = getProgressColor(caloriePercent, isOverCalories);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: isOverBudget || isOverCalories ? '1px solid #fca5a5' : '1px solid #e2e8f0',
      borderRadius: '0.875rem',
      padding: compact ? '0.75rem 1rem' : '1.25rem',
      boxShadow: isOverBudget || isOverCalories ? '0 4px 12px rgba(239, 68, 68, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            backgroundColor: isOverBudget || isOverCalories ? '#fee2e2' : '#ecfdf5',
            color: isOverBudget || isOverCalories ? '#dc2626' : '#059669',
            padding: '0.35rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isOverBudget || isOverCalories ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Daily Budget & Calorie Guardrail
            </h4>
            {!compact && (
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Monitors today's lunch expenditure & nutritional limits in real-time
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(spentToday > 0 || caloriesToday > 0) && (
            <button
              onClick={resetDailyCounters}
              className="btn-secondary"
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              title="Reset today's spent & calorie counters back to 0"
            >
              <RotateCcw size={12} /> Reset to 0
            </button>

          )}
          {isOverBudget && (
            <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
              Budget Exceeded
            </span>
          )}
          {isOverCalories && (
            <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
              Calorie Limit Exceeded
            </span>
          )}
          {!isOverBudget && !isOverCalories && (
            <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
              Within Limits
            </span>
          )}
        </div>
      </div>


      {/* Exceeded Warning Alert Banner */}
      {(isOverBudget || isOverCalories) && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '0.65rem 0.85rem',
          marginBottom: '0.85rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#991b1b',
          lineHeight: '1.4'
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Guardrail Triggered:</strong> Checkout is locked because this order would exceed your daily limits. 
            {isOverBudget && ` Spending limit is ৳${budgetLimit.toFixed(0)} (Projected: ৳${projectedSpent.toFixed(0)}).`}
            {isOverCalories && ` Calorie limit is ${calorieLimit} kcal (Projected: ${projectedCalories} kcal).`}
            <div style={{ marginTop: '0.2rem', color: '#b91c1c' }}>
              Reduce item quantities or remove items to proceed.
            </div>
          </div>
        </div>
      )}

      {/* Progress Bars Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        
        {/* Budget Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.825rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#334155' }}>
              <Wallet size={14} color="#059669" /> Daily Budget
            </span>
            <span style={{ fontWeight: 700, color: isOverBudget ? '#dc2626' : '#0f172a' }}>
              ৳{projectedSpent.toFixed(0)} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ ৳{budgetLimit.toFixed(0)}</span>
            </span>
          </div>

          <div style={{
            height: '8px',
            backgroundColor: '#f1f5f9',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, budgetPercent)}%`,
              backgroundColor: budgetColor,
              borderRadius: '9999px',
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }} />
          </div>

          {!compact && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              <span>Already Spent Today: ৳{spentToday.toFixed(0)}</span>
              <span>In Cart: ৳{subtotal.toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Calorie Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.825rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#334155' }}>
              <Flame size={14} color="#f59e0b" /> Daily Calories
            </span>
            <span style={{ fontWeight: 700, color: isOverCalories ? '#dc2626' : '#0f172a' }}>
              {projectedCalories} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ {calorieLimit} kcal</span>
            </span>
          </div>

          <div style={{
            height: '8px',
            backgroundColor: '#f1f5f9',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, caloriePercent)}%`,
              backgroundColor: calorieColor,
              borderRadius: '9999px',
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }} />
          </div>

          {!compact && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              <span>Ordered Today: {caloriesToday} kcal</span>
              <span>In Cart: {totalCalories} kcal</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
