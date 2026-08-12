import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { registrarBitacora } from '../services/bitacoraService';

export default function DeleteInsumoModal({ isOpen, insumo, onClose, onSuccess }) {
  const { user } = useAuth();
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !insumo) return null;

  const handleDelete = async () => {
    if (!justificacion || justificacion.trim().length < 10) {
      setError('Debe proporcionar una justificación de al menos 10 caracteres para eliminar este insumo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.delete(`/insumos/${insumo.id}`);

      await registrarBitacora({
        accion: 'ELIMINAR_INSUMO',
        modulo: 'INVENTARIO',
        descripcion: `Eliminado insumo "${insumo.insumo}" (Código #${insumo.numero}) del catálogo`,
        justificacion: justificacion,
        usuarioId: user?.id || 1,
        usuarioNombre: user?.nombre || 'Usuario',
        entidadId: insumo.id,
        entidadTipo: 'INSUMO',
        datosAnteriores: { insumo: insumo.insumo, stock: insumo.stock }
      });

      onSuccess();
      onClose();
      setJustificacion('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al eliminar el insumo de la base de datos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '460px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Eliminar Insumo
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '8px', lineHeight: 1.5 }}>
          ¿Estás seguro de que deseas eliminar el insumo <strong>{insumo.insumo}</strong> (Código #{insumo.numero})?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
          Esta acción quitará el insumo del catálogo de la base de datos y quedará auditada en la bitácora.
        </p>

        <div className="input-group">
          <label className="input-label">
            Justificación de Eliminación <span style={{ color: '#f43f5e' }}>*(Mínimo 10 caracteres)</span>
          </label>
          <textarea
            className="textarea-field"
            rows="3"
            placeholder="Explique obligatoriamente el motivo de eliminación de este insumo..."
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            required
          />
          <span style={{ fontSize: '0.75rem', color: justificacion.trim().length >= 10 ? '#10b981' : '#f43f5e' }}>
            {justificacion.trim().length} / 10 caracteres mínimos obligatorios
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger" disabled={loading}>
            {loading ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
