import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function InsumoModal({ isOpen, onClose, onSave, insumoEdit }) {
  const [formData, setFormData] = useState({
    numero: '',
    insumo: '',
    presentacion: '',
    tamanoPresentacion: '',
    stockMinimo: 5,
    stockMaximo: 50,
    costoEstimado: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Si estamos editando, cargar los datos en el formulario
  useEffect(() => {
    if (insumoEdit) {
      setFormData({
        numero: insumoEdit.numero || '',
        insumo: insumoEdit.insumo || '',
        presentacion: insumoEdit.presentacion || '',
        tamanoPresentacion: insumoEdit.tamanoPresentacion || '',
        stockMinimo: insumoEdit.stockMinimo || 5,
        stockMaximo: insumoEdit.stockMaximo || 50,
        costoEstimado: insumoEdit.costoEstimado || 0
      });
    } else {
      setFormData({
        numero: '',
        insumo: '',
        presentacion: '',
        tamanoPresentacion: '',
        stockMinimo: 5,
        stockMaximo: 50,
        costoEstimado: 0
      });
    }
    setError('');
  }, [insumoEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (insumoEdit) {
        // Ejecuta la actualización en el backend
        await api.put(`/insumos/${insumoEdit.id}`, formData);
        onSave('Insumo actualizado exitosamente'); // Pasamos el mensaje de éxito
      } else {
        await api.post('/insumos', formData);
        onSave('Insumo creado exitosamente'); // Pasamos el mensaje de éxito
      }
      onClose(); // Cerrar modal
    } catch (err) {
      setError('Ocurrió un error al guardar el insumo. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {insumoEdit ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Número / Código interno
              </label>
              <input 
                type="number" 
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="Ej. 101"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nombre del Insumo
              </label>
              <input 
                type="text" 
                name="insumo"
                value={formData.insumo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="Ej. Guantes de Látex"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Presentación
                </label>
                <input 
                  type="text" 
                  name="presentacion"
                  value={formData.presentacion}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Ej. Caja"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tamaño / Capacidad
                </label>
                <input 
                  type="text" 
                  name="tamanoPresentacion"
                  value={formData.tamanoPresentacion}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Ej. 100 uds"
                />
              </div>
            </div>

            {/* FASE 8: Configuración de Stock (Smart Stock) */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Configuración de Inventario (Proyecciones)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                  <input 
                    type="number" 
                    name="stockMinimo"
                    min="1"
                    value={formData.stockMinimo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="Alerta roja"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Máximo (Óptimo)</label>
                  <input 
                    type="number" 
                    name="stockMaximo"
                    min="1"
                    value={formData.stockMaximo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Meta de compra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Unit. Estimado (Q)</label>
                  <input 
                    type="number" 
                    name="costoEstimado"
                    min="0"
                    step="0.01"
                    value={formData.costoEstimado}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="Ej. 15.50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="mt-8 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Guardando...' : 'Guardar Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
