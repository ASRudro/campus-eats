import React from 'react';
import { UtensilsCrossed, Heart, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      marginTop: 'auto',
      padding: '2.5rem 0 1.5rem 0',
      color: '#64748b',
      fontSize: '0.875rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: 800, fontSize: '1.15rem' }}>
              <UtensilsCrossed size={20} color="#059669" />
              Campus<span style={{ color: '#059669' }}>Eats</span>
            </div>
            <p style={{ lineHeight: '1.6', fontSize: '0.85rem' }}>
              University cafeteria pre-ordering platform. Order ahead, skip the lunch rush, and pick up fresh hot meals on your schedule.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Core Features</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <li>• Real-time Budget & Calorie Guardrail</li>
              <li>• Scheduled Pickup Time Slots</li>
              <li>• One-Tap Instant Reordering</li>
              <li>• Group Orders with Split Carts</li>
              <li>• Mon-Fri Weekly Lunch Planner</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Demo Accounts</h4>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.6', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div><strong>Admin:</strong> admin@campuseats.com / Admin123!</div>
              <div><strong>Kitchen:</strong> kitchen@campuseats.com / Kitchen123!</div>
              <div><strong>Student 1 (Tanvir):</strong> tanvir@campuseats.com / Student123!</div>
              <div><strong>Student 2 (Nafis):</strong> nafis@campuseats.com / Student123!</div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div>
            © 2026 CampusEats – CSE Final Year Group Project. Designed for University Project Presentation.
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669' }}>
              <ShieldCheck size={14} /> Dual-Layer Guardrail Protected
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
