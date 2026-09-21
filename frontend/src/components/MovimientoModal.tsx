import { useState, useEffect } from 'react';
import api from '../api/axios';
import ConfirmModal from './ConfirmModal';
import InsumoCombobox from './InsumoCombobox';
import { getStockInfo } from '../utils/stockStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message?: string) => void;
  insumos: any[];
  preSelectedPresentation?: any;
}

export default function MovimientoModal({ isOpen, onClose, onSave, insumos, preSelectedPresentation }: Props) {
  const [formData, setFormData] = useState({
    presentationId: '',
    type: 'ENTRADA',
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
        type: 'ENTRADA',
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
      setError('Debes seleccionar un insumo / presentación.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Ingresa una cantidad mayor a 0.');
      return;
    }
    if (formData.detail.trim().length < 20) {
      setError('El detalle es obligatorio y debe tener al menos 20 caracteres.');
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
      onSave('Movimiento registrado exitosamente');
      onClose();
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.details?.quantity ||
        'Error al registrar el movimiento. Verifica los datos.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSalida = formData.type === 'SALIDA';
  const quantity = Number(formData.quantity || 0);
  const hasQuantity = quantity > 0;
  const stockAfter = selected ? selected.stock + (isSalida ? -quantity : quantity) : null;
  // El backend sigue siendo la fuente de verdad; esto sólo anticipa al usuario
  // que una salida mayor al stock será rechazada.
  const exceedsStock = !!selected && isSalida && hasQuantity && quantity > selected.stock;
  const stockInfo = selected ? getStockInfo(selected.stock, selected.minStock) : null;

  const detailValid = formData.detail.trim().length >= 20;

  const confirmTitle = isSalida ? 'Confirmar Salida' : 'Confirmar Entrada';
  const confirmMessage = isSalida
    ? `Estás a punto de realizar una SALIDA de ${formData.quantity} unidades de "${selected?.item} (${selected?.presentation} ${selected?.size})". El stock pasará de ${selected?.stock} a ${stockAfter}. ¿Estás seguro?`
    : `Estás a punto de realizar una ENTRADA de ${formData.quantity} unidades a "${selected?.item} (${selected?.presentation} ${selected?.size})". El stock pasará de ${selected?.stock} a ${stockAfter}. ¿Estás seguro?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Registrar Movimiento</h2>
          </div>
          <button onClick={onClose} title="Cerrar" className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleContinue} className="flex flex-col min-h-0 flex-1">
          <div className="p-6 min-h-0 flex-1 overflow-y-auto grid grid-cols-1 gap-5">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Insumo */}
            <InsumoCombobox
              insumos={insumos}
              value={formData.presentationId}
              onChange={(insumo) =>
                setFormData((prev) => ({ ...prev, presentationId: insumo ? String(insumo.id) : '' }))
              }
              label="Insumo"
              tone="brand"
            />

            {/* Resumen del insumo seleccionado */}
            {selected && stockInfo && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate" title={selected.item}>
                      {selected.item}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {selected.presentation} · {selected.size}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Código {selected.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock actual</p>
                    <p className="text-2xl font-bold text-slate-800 leading-tight">
                      {selected.stock}
                      <span className="ml-1 text-sm font-medium text-slate-400">uds</span>
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${stockInfo.badgeClass}`}>
                      {stockInfo.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Mín <b className="text-slate-700">{selected.minStock ?? '—'}</b> · Máx{' '}
                    <b className="text-slate-700">{selected.maxStock ?? '—'}</b>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    Resultante
                    {hasQuantity && stockAfter !== null ? (
                      <b className={exceedsStock ? 'text-rose-600' : 'text-slate-800'}>
                        {exceedsStock ? 'insuficiente' : `${stockAfter} uds`}
                      </b>
                    ) : (
                      <b className="text-slate-400">—</b>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Tipo de movimiento */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'ENTRADA' }))}
                  aria-pressed={!isSalida}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${
                    !isSalida ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'SALIDA' }))}
                  aria-pressed={isSalida}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${
                    isSalida ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Salida
                </button>
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad</label>
              <div className="relative">
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className="w-full pl-4 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Ej. 10"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-sm text-slate-400 pointer-events-none">
                  uds
                </span>
              </div>
            </div>

            {/* Detalle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Detalle <span className="text-red-500">*</span>
              </label>
              <textarea
                name="detail"
                value={formData.detail}
                onChange={handleChange}
                rows={3}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                placeholder="Explica el motivo del movimiento..."
              ></textarea>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500">Mínimo 20 caracteres</span>
                <span className={`text-xs font-semibold ${detailValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formData.detail.length}/20
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-600 font-medium border border-slate-200 hover:bg-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-white font-semibold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${
                isSalida ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
              }`}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Registrando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={isSalida ? 'Sí, realizar salida' : 'Sí, realizar entrada'}
        tone={isSalida ? 'danger' : 'success'}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
