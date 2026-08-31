import { useState, useEffect } from 'react';
import api from '../api/axios';

const MODES = {
  'create-item': {
    title: 'Registrar Nuevo Material',
    includesPresentation: true,
    includesItem: true,
  },
  'edit-item': {
    title: 'Editar Material',
    includesPresentation: false,
    includesItem: true,
  },
  'create-presentation': {
    title: 'Agregar Presentación',
    includesPresentation: true,
    includesItem: false,
  },
  'edit-presentation': {
    title: 'Editar Presentación',
    includesPresentation: true,
    includesItem: false,
  },
};

const emptyForm = {
  code: '',
  name: '',
  presName: '',
  presSize: '',
  minStock: 5,
  maxStock: 50,
  estimatedCost: 0,
};

export default function InsumoModal({ isOpen, onClose, onSave, modalConfig, items = [] }) {
  const mode = modalConfig?.mode || 'create-item';
  const item = modalConfig?.item || null;
  const presentation = modalConfig?.presentation || null;
  const { title, includesPresentation, includesItem } = MODES[mode] || MODES['create-item'];

  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);

  // Genera un código sugerido (entero aleatorio de hasta 9 dígitos).
  const generarCodigo = () => {
    const min = 100000000; // 9 dígitos
    const max = 2000000000; // dentro del rango de Integer
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  };

  // Cargar los datos según el modo cada vez que se abre
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create-item') {
        setFormData({ ...emptyForm, code: generarCodigo() });
      } else if (mode === 'edit-item' && item) {
        setFormData({ ...emptyForm, code: item.code ?? '', name: item.name ?? '' });
      } else if (mode === 'edit-presentation' && presentation) {
        setFormData({
          ...emptyForm,
          presName: presentation.name ?? '',
          presSize: presentation.size ?? '',
          minStock: presentation.minStock ?? 5,
          maxStock: presentation.maxStock ?? 50,
          estimatedCost: presentation.estimatedCost ?? 0,
        });
      } else if (mode === 'create-presentation' && item) {
        setFormData(emptyForm);
      } else {
        setFormData(emptyForm);
      }
      setError('');
      setCodeTouched(false);
    }
  }, [isOpen, mode, item, presentation]);

  // En modo 'create-item': verifica en vivo si el código ya está en uso.
  const codeAsNumber = Number(formData.code);
  const isCodeTaken =
    mode === 'create-item' &&
    formData.code !== '' &&
    !Number.isNaN(codeAsNumber) &&
    items.some((it: any) => it.code === codeAsNumber);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'code') setCodeTouched(true);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'create-item' && isCodeTaken) {
      setError('El código que ingresaste ya está en uso. Elige otro o usa el sugerido.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'create-item') {
        await api.post('/items', {
          code: Number(formData.code),
          name: formData.name,
          presentations: [
            {
              name: formData.presName,
              size: formData.presSize,
              minStock: Number(formData.minStock),
              maxStock: Number(formData.maxStock),
              estimatedCost: Number(formData.estimatedCost),
            },
          ],
        });
        onSave('Material creado exitosamente');
      } else if (mode === 'edit-item') {
        await api.put(`/items/${item.id}`, {
          code: Number(formData.code),
          name: formData.name,
        });
        onSave('Material actualizado exitosamente');
      } else if (mode === 'create-presentation') {
        await api.post(`/items/${item.id}/presentations`, {
          name: formData.presName,
          size: formData.presSize,
          minStock: Number(formData.minStock),
          maxStock: Number(formData.maxStock),
          estimatedCost: Number(formData.estimatedCost),
        });
        onSave('Presentación agregada exitosamente');
      } else {
        await api.put(`/presentations/${presentation.id}`, {
          name: formData.presName,
          size: formData.presSize,
          minStock: Number(formData.minStock),
          maxStock: Number(formData.maxStock),
          estimatedCost: Number(formData.estimatedCost),
        });
        onSave('Presentación actualizada exitosamente');
      }
      onClose();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.details?.name ||
        'Ocurrió un error al guardar. Verifica los datos.';
      setError(backendMessage);
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
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
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
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {includesItem && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Número / Código interno
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        mode === 'create-item' && codeTouched && isCodeTaken
                          ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                      }`}
                      placeholder="Autogenerado..."
                    />
                    {mode === 'create-item' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, code: generarCodigo() }));
                          setCodeTouched(false);
                        }}
                        title="Generar otro código"
                        className="shrink-0 inline-flex items-center justify-center px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {mode === 'create-item' && (
                    <p className={`text-xs mt-1 ${isCodeTaken ? 'text-red-500' : 'text-slate-400'}`}>
                      {isCodeTaken
                        ? 'El código ya está en uso.'
                        : 'Código autogenerado. Puedes reemplazarlo o generar otro con el botón.'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nombre del Material
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="Ej. Pasta Térmica"
                  />
                </div>
              </div>
            )}

            {includesPresentation && (
              <>
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Presentación / Variante</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        name="presName"
                        value={formData.presName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        placeholder="Ej. Sobre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Tamaño / Capacidad
                      </label>
                      <input
                        type="text"
                        name="presSize"
                        value={formData.presSize}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        placeholder="Ej. 2g"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Configuración de Inventario (Proyecciones)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                      <input
                        type="number"
                        name="minStock"
                        min="1"
                        value={formData.minStock}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Máximo (Óptimo)</label>
                      <input
                        type="number"
                        name="maxStock"
                        min="1"
                        value={formData.maxStock}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Unit. Estimado (Q)</label>
                      <input
                        type="number"
                        name="estimatedCost"
                        min="0"
                        step="0.01"
                        value={formData.estimatedCost}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
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
              disabled={loading || (mode === 'create-item' && isCodeTaken)}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
