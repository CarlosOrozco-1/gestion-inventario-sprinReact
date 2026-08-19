import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { registrarBitacora } from '../services/bitacoraService';
import ResponseModal from './ResponseModal';

export default function InsumoModal({ isOpen, onClose, onSuccess, insumoToEdit, insumos = [] }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    insumo: '',
    presentacion: '',
    tamanoPresentacion: '',
    justificacion: ''
  });
  const [autoNumero, setAutoNumero] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);

  useEffect(() => {
    if (insumoToEdit) {
      setFormData({
        insumo: insumoToEdit.insumo ?? '',
        presentacion: insumoToEdit.presentacion ?? '',
        tamanoPresentacion: insumoToEdit.tamanoPresentacion ?? '',
        justificacion: ''
      });
      setAutoNumero(insumoToEdit.numero ?? 0);
    } else {
      setFormData({
        insumo: '',
        presentacion: '',
        tamanoPresentacion: '',
        justificacion: ''
      });
      const numeros = insumos.map((i) => i.numero ?? 0);
      const maxNumero = numeros.length > 0 ? Math.max(...numeros) : 0;
      setAutoNumero(maxNumero + 1);
    }
    setError('');
  }, [insumoToEdit, isOpen, insumos]);

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

    const accion = insumoToEdit ? 'EDITAR_INSUMO' : 'CREAR_INSUMO';
    const payload = {
      numero: autoNumero,
      insumo: formData.insumo,
      presentacion: formData.presentacion,
      tamanoPresentacion: formData.tamanoPresentacion,
      stock: insumoToEdit ? (insumoToEdit.stock ?? 0) : 0
    };

    try {
      let savedItem = null;
      if (insumoToEdit) {
        const response = await API.put(`/insumos/${insumoToEdit.id}`, payload);
        savedItem = response.data;
      } else {
        const response = await API.post('/insumos', payload);
        savedItem = response.data;
      }

      // Registrar en la Bitácora de Auditoría en BD
      await registrarBitacora({
        accion,
        modulo: 'INVENTARIO',
        descripcion: insumoToEdit
          ? `Actualizado insumo "${formData.insumo}" (Código #${autoNumero})`
          : `Creado nuevo insumo "${formData.insumo}" (Código #${autoNumero}) con presentación ${formData.presentacion}`,
        justificacion: formData.justificacion,
        usuarioId: user?.id || 1,
        usuarioNombre: user?.nombre || 'Usuario',
        entidadId: savedItem?.id || insumoToEdit?.id,
        entidadTipo: 'INSUMO',
        datosAnteriores: insumoToEdit ? { insumo: insumoToEdit.insumo, presentacion: insumoToEdit.presentacion } : null,
        datosNuevos: { insumo: formData.insumo, presentacion: formData.presentacion, tamanoPresentacion: formData.tamanoPresentacion }
      });

      setResponse({
        type: 'success',
        title: insumoToEdit ? 'Insumo Actualizado' : 'Insumo Creado',
        message: insumoToEdit
          ? `Los datos del insumo "${formData.insumo}" se actualizaron correctamente.`
          : `El insumo "${formData.insumo}" se registró correctamente en el catálogo.`,
        details: [
          { label: 'Código', value: `#${autoNumero}` },
          { label: 'Insumo', value: formData.insumo },
          { label: 'Presentación', value: `${formData.presentacion} (${formData.tamanoPresentacion})` }
        ]
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el insumo en la base de datos. Verifique la conexión con el servidor.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseClose = () => {
    if (response?.type === 'success') {
      onSuccess();
      onClose();
    }
    setResponse(null);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content glass-card" style={{ maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {insumoToEdit ? '✏️ Editar Insumo' : '✨ Nuevo Insumo'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {/* Código auto-generado (solo lectura) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Código Asignado:
          </span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            background: 'rgba(6, 182, 212, 0.1)',
            padding: '4px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}>
            #{autoNumero}
          </span>
          {!insumoToEdit && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginLeft: 'auto' }}>
              Generado automáticamente
            </span>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nombre del Insumo</label>
            <input 
              type="text" 
              name="insumo" 
              className="input-field" 
              placeholder="Ej. Jeringas de 5ml" 
              value={formData.insumo}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Presentación</label>
            <input 
              type="text" 
              name="presentacion" 
              className="input-field" 
              placeholder="Ej. Caja, Frasco, Paquete" 
              value={formData.presentacion}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Tamaño / Contenido</label>
            <input 
              type="text" 
              name="tamanoPresentacion" 
              className="input-field" 
              placeholder="Ej. 100 unidades, 500ml" 
              value={formData.tamanoPresentacion}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              Justificación / Comentario Obligatorio <span style={{ color: '#f43f5e' }}>*(Mínimo 10 caracteres)</span>
            </label>
            <textarea 
              name="justificacion"
              className="textarea-field" 
              rows="3"
              placeholder={insumoToEdit ? "Razón por la cual se editan los datos de este insumo..." : "Razón por la cual se agrega este nuevo insumo..."}
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
              {loading ? 'Guardando...' : (insumoToEdit ? 'Guardar Cambios' : 'Crear Insumo')}
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
