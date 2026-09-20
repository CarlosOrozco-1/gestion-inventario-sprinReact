import { useState, useEffect } from 'react';
import api from '../api/axios';
import ConfirmModal from './ConfirmModal';
import { getStockInfo } from '../utils/stockStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message?: string) => void;
  insumos: any[];
  preSelectedPresentation?: any;
}

export default function AjusteModal({ isOpen, onClose, onSave, insumos, preSelectedPresentation }: Props) {
  const [formData, setFormData] = useState({
    presentationId: '',
    type: 'AJUSTE_POSITIVO',
    quantity: '',
    detail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        presentationId: preSelectedPresentation?.id || '',
        type: 'AJUSTE_POSITIVO',
        quantity: '',
        detail: ''
      });
      setError('');
      setShowConfirm(false);
    }
  }, [isOpen, preSelectedPresentation]);

  const selected = insumos.find((i: any) => String(i.id) === String(formData.presentationId));

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = (e: any) => {
    e.preventDefault();
    setError('');
    if (!selected) {
      setError('Debes seleccionar un insumo / presentación a ajustar.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Ingresa una cantidad mayor a 0.');
      return;
    }
    if (formData.detail.trim().length < 20) {
      setError('La justificación es obligatoria y debe tener al menos 20 caracteres.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');

    const payload = {
      presentationId: formData.presentationId,
      type: formData.type,
      quantity: parseInt(formData.quantity, 10),
      detail: formData.detail.trim()
    };

    try {
      await api.post('/movimientos', payload);
      onSave('Ajuste registrado exitosamente');
      onClose();
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.details?.justificacion ||
        'Error al registrar el ajuste.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isNegativo = formData.type === 'AJUSTE_NEGATIVO';
  const stockAfter = selected ? selected.stock + (isNegativo ? -Number(formData.quantity || 0) : Number(formData.quantity || 0)) : null;
  const stockInfo = selected ? getStockInfo(selected.stock, selected.minStock) : null;

  const confirmTitle = isNegativo ? 'Confirmar Merma (ajuste negativo)' : 'Confirmar Sobrante (ajuste positivo)';
  const confirmMessage = isNegativo
    ? `Ajustarás ${formData.quantity} unidades como PÉRDIDA/MERMA en "${selected?.item} (${selected?.presentation} ${selected?.size})". El stock pasará de ${selected?.stock} a ${stockAfter}. ¿Estás seguro?`
    : `Ajustarás ${formData.quantity} unidades como SOBRANTE/APARICIÓN en "${selected?.item} (${selected?.presentation} ${selected?.size})". El stock pasará de ${selected?.stock} a ${stockAfter}. ¿Estás seguro?`;

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
            <h2 className="text-xl font-bold text-slate-800">Ajuste de Stock</h2>
            <span
              title="Todo ajuste altera el patrimonio y quedará registrado a su nombre."
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold cursor-help"
            >
              i
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleContinue} className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Seleccionar Insumo / Presentación a Ajustar</label>
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
                    {insumo.code} - {insumo.item} ({insumo.presentation} {insumo.size})
                  </option>
                ))}
              </select>
            </div>

            {selected && stockInfo && (
              <div className="border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Stock Actual
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-800">{selected.stock} uds</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${stockInfo.badgeClass}`}>
                    {stockInfo.label}
                  </span>
                </div>
                <p className={`text-xs ${stockInfo.textClass}`}>
                  Mín: {selected.minStock ?? '—'} · Máx: {selected.maxStock ?? '—'}
                </p>
              </div>
            )}

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
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Ej. 2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Justificación <span className="text-red-500">*</span>
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
              <p className={`text-xs mt-1 ${formData.detail.length < 20 ? 'text-red-500' : 'text-slate-500'}`}>
                Caracteres: {formData.detail.length}/20
              </p>
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
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-amber-500/50 flex items-center gap-2"
            >
              Continuar
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={isNegativo ? 'Sí, aplicar merma' : 'Sí, aplicar sobrante'}
        tone={isNegativo ? 'danger' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
