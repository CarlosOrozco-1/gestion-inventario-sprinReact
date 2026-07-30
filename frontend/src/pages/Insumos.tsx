import { useState, useEffect } from 'react';
import api from '../api/axios';
import InsumoModal from '../components/InsumoModal';

export default function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para controlar el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [insumoEdit, setInsumoEdit] = useState(null);

  // Estado para el mensaje de éxito (Toast)
  const [toastMessage, setToastMessage] = useState('');

  const fetchInsumos = async (message = null) => {
    try {
      const response = await api.get('/insumos');
      setInsumos(response.data);
      setError(null);
      
      // Si recibimos un mensaje (desde el Modal), lo mostramos por 3 segundos
      if (message) {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setError('Error al cargar los insumos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleOpenModal = (insumo = null) => {
    setInsumoEdit(insumo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setInsumoEdit(null);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modal para Crear / Editar */}
      <InsumoModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={fetchInsumos}
        insumoEdit={insumoEdit}
      />

      {/* Header de la vista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Catálogo de Insumos</h1>
          <p className="text-slate-500 mt-1">Gestiona tu lista de materiales y existencias base.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Insumo
        </button>
      </div>

      {/* Manejo de estados (Carga / Error) */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Nº</th>
                <th className="p-4 font-semibold">Insumo</th>
                <th className="p-4 font-semibold">Presentación</th>
                <th className="p-4 font-semibold">Tamaño</th>
                <th className="p-4 font-semibold text-right">Stock Actual</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-brand-600 mb-2"></div>
                    <p>Cargando insumos...</p>
                  </td>
                </tr>
              ) : insumos.length === 0 ? (
                /* ==============================================================
                 * PATRÓN "EMPTY STATE" (Estado Vacío)
                 * Este es un patrón de UX/UI fundamental. Nunca debes dejar
                 * una pantalla en blanco si no hay datos. Siempre debes:
                 * 1. Mostrar un icono amable o ilustrativo (SVG).
                 * 2. Un texto claro indicando que no hay datos.
                 * 3. (Opcional pero recomendado) Un llamado a la acción (Call to action).
                 * ============================================================== */
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    {/* Icono de Empty State */}
                    <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    {/* Mensaje principal */}
                    <p className="text-lg font-medium text-slate-700">No hay insumos registrados</p>
                    {/* Llamado a la acción (Call to Action) */}
                    <p className="text-sm mt-1">Haz clic en "Nuevo Insumo" para empezar.</p>
                  </td>
                </tr>
              ) : (
                insumos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 text-slate-500 font-medium">{item.numero}</td>
                    <td className="p-4 text-slate-900 font-semibold">{item.insumo}</td>
                    <td className="p-4 text-slate-600">{item.presentacion}</td>
                    <td className="p-4 text-slate-600">{item.tamanoPresentacion}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.stock > 10 ? 'bg-green-100 text-green-700' : 
                        item.stock > 0 ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="text-slate-400 hover:text-brand-600 transition-colors p-1" 
                        title="Editar Insumo"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer de Tabla */}
        {!loading && insumos.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{insumos.length}</span> insumo(s) en total.
          </div>
        )}
      </div>

      {/* 
        ==============================================================
        COMPONENTE TOAST (Notificación flotante)
        Muestra mensajes de éxito temporalmente en la esquina inferior.
        ============================================================== 
      */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-xl shadow-slate-900/10 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
