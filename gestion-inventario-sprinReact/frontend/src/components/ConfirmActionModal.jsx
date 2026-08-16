import React from 'react';

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Acción',
  icon = '❓',
  message = '¿Está seguro de que desea realizar esta acción?',
  details = [],
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: danger ? 'var(--accent-rose)' : 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {icon} {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.5 }}>
          {message}
        </p>

        {details.length > 0 && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {details.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
