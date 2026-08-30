import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AjusteModal({ isOpen, onClose, onSave, insumos, preSelectedPresentation }) {
  const [formData, setFormData] = useState({
    presentationId: '',
    type: 'AJUSTE_POSITIVO',
    quantity: '',
    detail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        presentationId: preSelectedPresentation?.id || '',
        type: 'AJUSTE_POSITIVO',
        quantity: '',
        detail: ''
      });
      setError('');
    }
  }, [isOpen, preSelectedPresentation]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación extra en frontend para la longitud del detalle
    if (formData.detail.length < 20) {
      setError('La justificación debe tener al menos 20 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        usuarioId: 1 // TODO: Reemplazar por AuthStore cuando se conecte el ID real
      };
      
      await api.post('/movimientos', payload);
      onSave('Ajuste registrado exitosamente');
      onClose();
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.response?.data?.details?.justificacion || 'Error al registrar el ajuste.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-2 border-amber-500/20">
        
        <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Auditoría: Ajuste de Stock</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-6 border border-amber-200">
            <strong>Atención:</strong> Todo ajuste altera el patrimonio y quedará registrado a su nombre.
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Insumo / Presentación a Ajustar</label>
              <select 
                name="presentationId"
                value={formData.presentationId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="">-- Seleccione una presentación --</option>
                {insumos.map((insumo: any) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.code} - {insumo.item} ({insumo.presentation} {insumo.size}) | Stock Actual: {insumo.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Ajuste</label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="AJUSTE_POSITIVO">Sobró / Apareció (+)</option>
                  <option value="AJUSTE_NEGATIVO">Merma / Pérdida (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Diferencia (Cant.)</label>
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
                  placeholder="Ej. 2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Justificación (Obligatoria)
              </label>
              <textarea 
                name="detail"
                value={formData.detail}
                onChange={handleChange}
                rows={3}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="Mínimo 20 caracteres explicando detalladamente la razón del ajuste..."
              ></textarea>
              <p className="text-xs text-slate-500 mt-1">Caracteres: {formData.detail.length}/20</p>
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
              disabled={loading || formData.detail.length < 20}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-amber-500/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Autorizando...' : 'Autorizar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
