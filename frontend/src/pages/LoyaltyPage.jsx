import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, Gift, Sparkles, CheckCircle2, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemNotice, setRedeemNotice] = useState(null);

  const fetchLoyaltyData = async () => {
    try {
      const [loyaltyRes, rewardsRes] = await Promise.all([
        api.get('/loyalty/my'),
        api.get('/loyalty/rewards')
      ]);

      if (loyaltyRes.data.success) {
        setBalance(loyaltyRes.data.balance);
        setTransactions(loyaltyRes.data.transactions);
      }

      if (rewardsRes.data.success) {
        setRewards(rewardsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load loyalty details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const handleRedeem = async (reward) => {
    if (balance < reward.points_cost) {
      alert(`You need ${reward.points_cost} points to redeem this item.`);
      return;
    }

    if (!confirm(`Redeem "${reward.title}" for ${reward.points_cost} loyalty points?`)) return;

    try {
      const res = await api.post(`/loyalty/redeem/${reward.id}`);
      if (res.data.success) {
        setRedeemNotice(res.data.message);
        await fetchLoyaltyData();
      }
    } catch (err) {
      console.error('Redeem error:', err);
      alert(err.response?.data?.message || 'Failed to redeem reward.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Award size={28} color="#059669" /> CampusEats Loyalty Rewards
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Earn 1 loyalty point for every ৳50 spent on canteen lunch orders. Redeem points for free meals and vouchers.
        </p>
      </div>

      {redeemNotice && (
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
          <CheckCircle2 size={18} /> {redeemNotice}
        </div>
      )}

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        color: '#ffffff',
        borderRadius: '1.25rem',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 4px 15px rgba(5, 150, 105, 0.2)',
        marginBottom: '2.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            YOUR CURRENT BALANCE
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: '1.1', marginTop: '0.25rem' }}>
            {balance} <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ecfdf5' }}>Points</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#ecfdf5', marginTop: '0.5rem' }}>
            Student ID: <strong>{user?.student_id}</strong>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          maxWidth: '320px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            <Sparkles size={16} /> How points work
          </div>
          <p style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#ecfdf5' }}>
            Every time you checkout, points are automatically credited to your student account. Accumulate points to claim hot snacks, drinks, or discount coupons.
          </p>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gift size={20} color="#059669" /> Available Rewards Catalog
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {rewards.map((reward) => {
            const canAfford = balance >= reward.points_cost;

            return (
              <div
                key={reward.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      {reward.points_cost} Points Required
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      {reward.reward_type === 'free_item' ? 'Free Food' : 'Voucher'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                    {reward.title}
                  </h3>

                  <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: '1.4', marginBottom: '1.25rem' }}>
                    {reward.description}
                  </p>
                </div>

                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford}
                  className={canAfford ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    borderRadius: '0.5rem',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    opacity: canAfford ? 1 : 0.6
                  }}
                >
                  {canAfford ? 'Redeem Reward' : `Need ${reward.points_cost - balance} more pts`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} color="#059669" /> Points Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No point transactions recorded yet.</div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>DESCRIPTION</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>POINTS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isPositive = t.points > 0;
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(t.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {t.reason}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: isPositive ? '#059669' : '#dc2626' }}>
                        {isPositive ? `+${t.points}` : t.points} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
