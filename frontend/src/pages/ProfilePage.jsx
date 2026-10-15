import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GuardrailBar from '../components/GuardrailBar';
import { User, Wallet, Flame, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dailyBudget, setDailyBudget] = useState(user?.daily_budget || 300);
  const [dailyCalories, setDailyCalories] = useState(user?.daily_calorie_limit || 1800);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    const res = await updateProfile({
      name,
      phone,
      daily_budget: Number(dailyBudget),
      daily_calorie_limit: Number(dailyCalories)
    });

    if (res.success) {
      setSuccessMsg('Your profile and guardrail limits have been saved successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '800px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
          Student Profile & Preferences
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Manage your personal details, daily spending guardrail, and dietary calorie limits.
        </p>
      </div>

      {/* Live Guardrail Visualizer */}
      <div style={{ marginBottom: '2rem' }}>
        <GuardrailBar />
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} style={{
        backgroundColor: '#ffffff',
        borderRadius: '1.25rem',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        
        {/* Section 1: Personal Info */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <User size={18} color="#059669" /> Account Details
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Student ID (Non-editable)
            </label>
            <input
              type="text"
              className="input-field"
              value={user?.student_id || ''}
              disabled
              style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Email Address (Non-editable)
            </label>
            <input
              type="email"
              className="input-field"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Phone Number
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="+8801..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: WOW Factor Guardrail Configurations */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <ShieldCheck size={18} color="#059669" /> Daily Guardrail Settings (WOW Factor)
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Configure your personal threshold limits. Orders exceeding these caps cannot be checked out.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Daily Budget */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              <Wallet size={16} color="#059669" /> Daily Spending Limit (BDT)
            </label>
            <input
              type="number"
              min="50"
              max="2000"
              className="input-field"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              required
            />
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
              {[200, 300, 400, 500].map(amt => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setDailyBudget(amt)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    backgroundColor: Number(dailyBudget) === amt ? '#059669' : '#ffffff',
                    color: Number(dailyBudget) === amt ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Calories */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              <Flame size={16} color="#f59e0b" /> Daily Calorie Limit (kcal)
            </label>
            <input
              type="number"
              min="500"
              max="4000"
              className="input-field"
              value={dailyCalories}
              onChange={(e) => setDailyCalories(e.target.value)}
              required
            />
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
              {[1500, 1800, 2200, 2600].map(cal => (
                <button
                  type="button"
                  key={cal}
                  onClick={() => setDailyCalories(cal)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    backgroundColor: Number(dailyCalories) === cal ? '#059669' : '#ffffff',
                    color: Number(dailyCalories) === cal ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {cal} kcal
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
          >
            <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Guardrail Preferences'}
          </button>
        </div>

      </form>

    </div>
  );
}
