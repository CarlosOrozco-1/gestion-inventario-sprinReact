import React from 'react';

const STYLES = {
  success: {
    icon: '✅',
    color: 'var(--accent-emerald)',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  error: {
    icon: '❌',
    color: '#f87171',
    bg: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.3)'
  },
  info: {
    icon: 'ℹ️',
    color: 'var(--accent-cyan)',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.3)'
  }
};

export default function ResponseModal({
  isOpen,
  onClose,
  type = 'success',
  title,
  message,
  details = [],
  confirmLabel = 'Aceptar'
}) {
  if (!isOpen) return null;

  const style = STYLES[type] || STYLES.info;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: style.bg,
          border: `1px solid ${style.border}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          marginBottom: '16px'
        }}>
          {style.icon}
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: style.color, marginBottom: '8px' }}>
          {title}
        </h3>
        {message && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '16px' }}>
            {message}
          </p>
        )}

        {details.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'left'
          }}>
            {details.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
