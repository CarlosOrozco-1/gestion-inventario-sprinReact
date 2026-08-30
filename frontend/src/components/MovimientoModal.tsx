import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function MovimientoModal({ isOpen, onClose, onSave, insumos, preSelectedPresentation }) {
  const [formData, setFormData] = useState({
    presentationId: '',
    type: 'ENTRADA',
    quantity: '',
    detail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Limpiar el formulario cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        presentationId: preSelectedPresentation?.id || '',
        type: 'ENTRADA',
        quantity: '',
        detail: ''
      });
      setError('');
    }
  }, [isOpen, preSelectedPresentation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Enviamos el usuarioId quemado como 1 por ahora, o idealmente lo sacaríamos del useAuthStore
      // Para este caso, el backend también podría sacarlo del JWT, pero como el DTO pide usuarioId, lo mandamos.
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        usuarioId: 1 // TODO: Reemplazar por el ID real del usuario autenticado si es necesario
      };
      
      await api.post('/movimientos', payload);
      onSave('Movimiento registrado exitosamente');
      onClose();
    } catch (err) {
      // Capturamos el error que viene del backend (Ej: "Stock insuficiente")
      const backendMessage = err.response?.data?.message || err.response?.data?.details?.quantity || 'Error al registrar el movimiento. Verifica los datos.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Registrar Movimiento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Insumo / Presentación</label>
              <select 
                name="presentationId"
                value={formData.presentationId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="">-- Seleccione una presentación --</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.code} - {insumo.item} ({insumo.presentation} {insumo.size}) | Stock: {insumo.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad</label>
                <input 
                  type="number" 
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Por favor, ingresa una cantidad mayor a 0')}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Ej. 10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Detalles Adicionales (Opcional)
              </label>
              <textarea 
                name="detail"
                value={formData.detail}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="Comentarios sobre el movimiento..."
              ></textarea>
            </div>
          </div>

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
              className={`px-5 py-2 text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 flex items-center gap-2 ${
                formData.type === 'SALIDA' || formData.type === 'AJUSTE_NEGATIVO' 
                  ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500' 
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Procesando...' : 'Confirmar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
