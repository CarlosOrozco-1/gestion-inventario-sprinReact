import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { registrarBitacora } from '../services/bitacoraService';
import ResponseModal from './ResponseModal';

export default function UsuarioModal({ isOpen, onClose, onSuccess, userToEdit }) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'AUXILIAR',
    justificacion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nombre: userToEdit.nombre || '',
        email: userToEdit.email || '',
        password: '',
        rol: userToEdit.rol || 'AUXILIAR',
        justificacion: ''
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'AUXILIAR',
        justificacion: ''
      });
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.justificacion || formData.justificacion.trim().length < 10) {
      setError('La justificación es obligatoria y debe tener al menos 10 caracteres.');
      setLoading(false);
      return;
    }

    const accion = userToEdit ? 'EDITAR_USUARIO' : 'CREAR_USUARIO';
    const payload = {
      ...(userToEdit ? { id: userToEdit.id } : {}),
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol,
      ...(formData.password ? { password: formData.password } : {})
    };

    try {
      if (userToEdit) {
        await API.put(`/usuarios/${userToEdit.id}`, payload);
      } else {
        await API.post('/usuarios', payload);
      }

      await registrarBitacora({
        accion,
        modulo: 'USUARIOS',
        descripcion: userToEdit
          ? `Modificados datos/rol del usuario "${formData.nombre}" (${formData.email}) a Rol ${formData.rol}`
          : `Creado nuevo usuario "${formData.nombre}" (${formData.email}) con Rol ${formData.rol}`,
        justificacion: formData.justificacion,
        usuarioId: currentUser?.id || 1,
        usuarioNombre: currentUser?.nombre || 'Administrador',
        entidadId: userToEdit?.id || null,
        entidadTipo: 'USUARIO',
        datosAnteriores: userToEdit ? { nombre: userToEdit.nombre, email: userToEdit.email, rol: userToEdit.rol } : null,
        datosNuevos: { nombre: formData.nombre, email: formData.email, rol: formData.rol }
      });

      setResponse({
        type: 'success',
        title: userToEdit ? 'Usuario Actualizado' : 'Usuario Creado',
        message: userToEdit
          ? `Los datos y el rol del usuario "${formData.nombre}" se actualizaron correctamente.`
          : `El usuario "${formData.nombre}" se registró correctamente en el sistema.`,
        details: [
          { label: 'Nombre', value: formData.nombre },
          { label: 'Correo', value: formData.email },
          { label: 'Rol', value: formData.rol }
        ],
        savedPayload: payload
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el usuario en la base de datos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseClose = () => {
    if (response?.type === 'success') {
      onSuccess(response.savedPayload);
      onClose();
    }
    setResponse(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {userToEdit ? '✏️ Editar Usuario / Cambiar Rol' : '✨ Registrar Nuevo Usuario'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              className="input-field"
              placeholder="Ej. Eduardo César Lima"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              className="input-field"
              placeholder="Ej. limacesar39mzx@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              Contraseña {userToEdit && <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>(dejar vacía para mantener actual)</span>}
            </label>
            <input
              type="password"
              name="password"
              className="input-field"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required={!userToEdit}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Rol Asignado y Nivel de Acceso</label>
            <select
              name="rol"
              className="select-field"
              value={formData.rol}
              onChange={handleChange}
              style={{ background: 'rgba(17, 24, 39, 0.9)', color: '#fff' }}
            >
              <option value="ADMIN">ADMIN (Acceso Total + Gestión Usuarios)</option>
              <option value="JEFE">JEFE (Catálogo + Edición + Movimientos)</option>
              <option value="AUXILIAR">AUXILIAR (Solo Consulta + Registro Movimientos)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">
              Justificación / Comentario Obligatorio <span style={{ color: '#f43f5e' }}>*(Mínimo 10 caracteres)</span>
            </label>
            <textarea
              name="justificacion"
              className="textarea-field"
              rows="3"
              placeholder={userToEdit ? "Explique obligatoriamente el motivo de modificación de este usuario/rol..." : "Explique obligatoriamente el motivo de creación de este usuario..."}
              value={formData.justificacion}
              onChange={handleChange}
              required
            />
            <span style={{ fontSize: '0.75rem', color: formData.justificacion.trim().length >= 10 ? '#10b981' : '#f43f5e' }}>
              {formData.justificacion.trim().length} / 10 caracteres mínimos obligatorios
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (userToEdit ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </div>
        </form>

        <ResponseModal
          isOpen={!!response}
          type={response?.type || 'success'}
          title={response?.title || ''}
          message={response?.message || ''}
          details={response?.details || []}
          onClose={handleResponseClose}
        />
      </div>
    </div>
  );
}
