import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { registrarBitacora } from '../services/bitacoraService';

export default function DeleteUsuarioModal({ isOpen, userToDelete, onClose, onSuccess }) {
  const { user: currentUser } = useAuth();
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !userToDelete) return null;

  const handleDelete = async () => {
    if (!justificacion || justificacion.trim().length < 10) {
      setError('Debe proporcionar una justificación de al menos 10 caracteres para eliminar este usuario.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.delete(`/usuarios/${userToDelete.id}`);

      await registrarBitacora({
        accion: 'ELIMINAR_USUARIO',
        modulo: 'USUARIOS',
        descripcion: `Eliminado usuario "${userToDelete.nombre}" (${userToDelete.email}) - Rol ${userToDelete.rol}`,
        justificacion: justificacion,
        usuarioId: currentUser?.id || 1,
        usuarioNombre: currentUser?.nombre || 'Administrador',
        entidadId: userToDelete.id,
        entidadTipo: 'USUARIO',
        datosAnteriores: { nombre: userToDelete.nombre, email: userToDelete.email, rol: userToDelete.rol }
      });

      onSuccess(userToDelete.id);
      onClose();
      setJustificacion('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al eliminar el usuario de la base de datos.';
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
            ⚠️ Eliminar Usuario
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '8px', lineHeight: 1.5 }}>
          ¿Estás seguro de eliminar al usuario <strong>{userToDelete.nombre}</strong> ({userToDelete.email})?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
          Esta persona perderá el acceso al sistema de inmediato y la acción se registrará en bitácora.
        </p>

        <div className="input-group">
          <label className="input-label">
            Justificación de Eliminación <span style={{ color: '#f43f5e' }}>*(Mínimo 10 caracteres)</span>
          </label>
          <textarea
            className="textarea-field"
            rows="3"
            placeholder="Explique obligatoriamente el motivo de eliminación de este usuario..."
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
