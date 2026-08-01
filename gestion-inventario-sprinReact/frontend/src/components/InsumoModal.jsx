import React, { useState } from 'react';
import API from '../services/api';

export default function InsumoModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    numero: '',
    insumo: '',
    presentacion: '',
    tamanoPresentacion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.post('/insumos', {
        numero: parseInt(formData.numero, 10),
        insumo: formData.insumo,
        presentacion: formData.presentacion,
        tamanoPresentacion: formData.tamanoPresentacion
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el insumo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>✨ Nuevo Insumo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Número de Insumo (Código)</label>
            <input 
              type="number" 
              name="numero" 
              className="input-field" 
              placeholder="Ej. 101" 
              value={formData.numero}
              onChange={handleChange}
              required 
            />
          </div>

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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
