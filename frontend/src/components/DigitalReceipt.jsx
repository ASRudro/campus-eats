import React from 'react';
import StatusBadge from './StatusBadge';
import { resolveShop } from '../context/CartContext';
import { UtensilsCrossed, Printer, X, Award, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export default function DigitalReceipt({ receipt, onClose = null }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem', position: 'relative' }}>
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              color: '#94a3b8',
              padding: '0.25rem',
              borderRadius: '0.375rem'
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* Printable Receipt Container */}
        <div id="printable-receipt">
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 800, fontSize: '1.4rem' }}>
              <UtensilsCrossed size={24} />
              Campus<span style={{ color: '#0f172a' }}>Eats</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>
              Official Digital Order Receipt
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.04em' }}>
              {receipt.order_number}
            </div>
          </div>

          {/* Student & Schedule Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: '0.825rem',
            backgroundColor: '#f8fafc',
            padding: '0.85rem',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.725rem' }}>STUDENT NAME</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.student_name}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.725rem' }}>STUDENT ID</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.student_id}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.725rem' }}>PICKUP DATE</div>
              <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={13} /> {receipt.pickup_date}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.725rem' }}>PICKUP TIME</div>
              <div style={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={13} /> {receipt.pickup_time}
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Current Status:</span>
            <StatusBadge status={receipt.status} />
          </div>

          {/* Payment Method & Status Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: receipt.payment_status === 'Paid' ? '#ecfdf5' : '#f8fafc',
            border: receipt.payment_status === 'Paid' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
            padding: '0.65rem 0.85rem',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem'
          }}>
            <div>
              <span style={{ color: '#64748b' }}>Payment Option: </span>
              <strong style={{ color: receipt.payment_status === 'Paid' ? '#065f46' : '#334155' }}>
                {receipt.payment_method || 'Cash on Pickup'}
              </strong>
              {receipt.transaction_id && (
                <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '0.1rem', fontWeight: 600 }}>
                  TrxID: {receipt.transaction_id}
                </div>
              )}
            </div>
            <span className={receipt.payment_status === 'Paid' ? 'badge badge-green' : (receipt.payment_method === 'Cash on Delivery' ? 'badge badge-blue' : 'badge badge-amber')} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {receipt.payment_status === 'Paid' ? <CheckCircle2 size={13} /> : null}
              {receipt.payment_status === 'Paid' ? 'Paid Online' : (receipt.payment_method || 'Cash on Pickup')}
            </span>

          </div>


          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.725rem' }}>
                <th style={{ paddingBottom: '0.5rem' }}>ITEM & STALL</th>
                <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>QTY</th>
                <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>PRICE</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items?.map((item, idx) => {
                const stall = resolveShop(item);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name || item.item_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '0.25rem',
                          backgroundColor: stall.bgColor,
                          color: stall.color,
                          border: `1px solid ${stall.borderColor}`
                        }}>
                          {stall.badge} {stall.name} ({stall.stall})
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          • {item.calories_at_purchase || item.calories} kcal
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'center', fontWeight: 600 }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ৳{((item.unit_price || item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#475569' }}>
              <span>Total Calories:</span>
              <span style={{ fontWeight: 600 }}>{receipt.total_calories} kcal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#475569' }}>
              <span>Estimated Wait Time:</span>
              <span style={{ fontWeight: 600 }}>{receipt.estimated_wait_time} mins</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
              <span>Total Paid:</span>
              <span style={{ color: '#059669' }}>৳{Number(receipt.subtotal).toFixed(2)}</span>
            </div>
          </div>

          {/* Loyalty Points Earned Badge */}
          {receipt.points_earned !== undefined && receipt.points_earned > 0 && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '0.5rem',
              padding: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#065f46',
              marginBottom: '1rem'
            }}>
              <Award size={18} color="#059669" />
              <span><strong>+{receipt.points_earned} Loyalty Points</strong> awarded to your student account!</span>
            </div>
          )}

          {/* Instructions */}
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
            Please show this digital receipt at the Canteen Pickup Counter when your order status shows <strong>READY FOR PICKUP</strong>.
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            onClick={handlePrint}
            className="btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Printer size={16} /> Print / Save PDF
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="btn-primary" 
              style={{ flex: 1 }}
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
