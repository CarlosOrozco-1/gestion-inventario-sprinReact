import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MovimientoModal({ isOpen, onClose, insumo, onSuccess }) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [detalle, setDetalle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !insumo) return null;

  const isAjuste = tipo === 'AJUSTE_POSITIVO' || tipo === 'AJUSTE_NEGATIVO';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isAjuste && detalle.length < 20) {
      setError('Para realizar un ajuste se requiere una justificación detallada de al menos 20 caracteres.');
      setLoading(false);
      return;
    }

    try {
      await API.post('/movimientos', {
        insumoId: insumo.id,
        tipo: tipo,
        usuarioId: user?.id || 1,
        cantidad: parseInt(cantidad, 10),
        detalle: detalle || undefined
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar movimiento. Verifique el stock disponible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📝 Registrar Movimiento</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Insumo: <strong style={{ color: '#fff' }}>{insumo.insumo}</strong> (Stock Actual: {insumo.stock ?? 0})
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Tipo de Movimiento</label>
            <select 
              className="select-field" 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ENTRADA">🟩 ENTRADA (Ingreso de insumos)</option>
              <option value="SALIDA">🟥 SALIDA (Egreso de insumos)</option>
              <option value="AJUSTE_POSITIVO">🟦 AJUSTE POSITIVO (Corrección +)</option>
              <option value="AJUSTE_NEGATIVO">🟨 AJUSTE NEGATIVO (Corrección -)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Cantidad</label>
            <input 
              type="number" 
              min="1" 
              className="input-field" 
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              Justificación / Detalle {isAjuste && <span style={{ color: '#f43f5e' }}>*(Mínimo 20 caracteres)</span>}
            </label>
            <textarea 
              className="textarea-field" 
              rows="3"
              placeholder={isAjuste ? "Explique detalladamente el motivo de este ajuste manual..." : "Notas u observaciones opcionales..."}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              required={isAjuste}
            />
            {isAjuste && (
              <span style={{ fontSize: '0.75rem', color: detalle.length >= 20 ? '#10b981' : 'var(--text-muted)' }}>
                {detalle.length} / 20 caracteres mínimos
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-emerald" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
