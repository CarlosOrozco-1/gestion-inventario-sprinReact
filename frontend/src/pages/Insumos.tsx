import { useState, useEffect, Fragment } from 'react';
import api from '../api/axios';
import InsumoModal from '../components/InsumoModal';
import QrScanner from '../components/QrScanner';
import SearchModal from '../components/SearchModal';
import { useToastStore } from '../store/useToastStore';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export default function Insumos() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para controlar el Modal (mode: create-item | edit-item | create-presentation | edit-presentation)
  const [modalConfig, setModalConfig] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const showToast = useToastStore((s: any) => s.showToast);

  const fetchItems = async (message = null) => {
    try {
      const response = await api.get('/items');
      setItems(response.data);
      setError(null);

      if (message) {
        showToast(message);
      }
    } catch (err) {
      setError('Error al cargar el catálogo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openModal = (mode, item = null, presentation = null) => {
    setModalConfig({ mode, item, presentation });
  };

  const closeModal = () => setModalConfig(null);

  // Escanea un QR y abre la edición de la presentación encontrada.
  const handleQrScan = async (qrCode) => {
    setIsScannerOpen(false);
    try {
      const response = await api.get(`/presentations/qr/${qrCode}`);
      const scanned = response.data; // { id, code, item, presentation, size, ... }
      for (const it of items) {
        const pres = it.presentations?.find((p) => p.id === scanned.id);
        if (pres) {
          openModal('edit-presentation', it, pres);
          return;
        }
      }
      showToast('Insumo encontrado, pero no está en la lista cargada. Actualiza la página.');
    } catch (err) {
      console.error('Error al buscar insumo por QR:', err);
      showToast('Código QR no encontrado');
    }
  };

  const handleSearchSelectItem = (item) => {
    setIsSearchOpen(false);
    openModal('edit-item', item);
  };

  const handleSearchSelectPresentation = (item, pres) => {
    setIsSearchOpen(false);
    openModal('edit-presentation', item, pres);
  };

  const stockBadge = (stock) => {
    const style = stock > 10 ? 'bg-green-100 text-green-700' : stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${style}`}>
        {stock}
      </span>
    );
  };

  const totalPresentations = items.reduce((acc, it) => acc + it.presentations.length, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modal para Crear / Editar Materiales y Presentaciones */}
      <InsumoModal
        isOpen={!!modalConfig}
        onClose={closeModal}
        onSave={fetchItems}
        modalConfig={modalConfig}
        items={items}
      />

      {/* Escáner QR para localizar y editar un insumo sin buscarlo en la tabla */}
      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQrScan}
      />

      {/* Búsqueda por nombre / código / presentación cuando no se tiene el QR */}
      <SearchModal
        isOpen={isSearchOpen}
        items={items}
        onClose={() => setIsSearchOpen(false)}
        onSelectItem={handleSearchSelectItem}
        onSelectPresentation={handleSearchSelectPresentation}
      />

      {/* Header de la vista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Catálogo de Insumos</h1>
          <p className="text-slate-500 mt-1">Materiales y sus presentaciones (variantes) con stock propio.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar insumo
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m4-14a6 6 0 00-8 8m8-8a6 6 0 010 8m-8-8a6 6 0 000 8" />
            </svg>
            Escanear QR
          </button>

          <button
            onClick={() => openModal('create-item')}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Material
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Nº</th>
                <th className="p-4 font-semibold">Material</th>
                <th className="p-4 font-semibold">Presentación</th>
                <th className="p-4 font-semibold">Tamaño</th>
                <th className="p-4 font-semibold text-right">Stock Actual</th>
                <th className="p-4 font-semibold text-center">Mín / Máx</th>
                <th className="p-4 font-semibold text-center">Código QR</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-brand-600 mb-2"></div>
                    <p>Cargando catálogo...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-lg font-medium text-slate-700">No hay materiales registrados</p>
                    <p className="text-sm mt-1">Haz clic en "Nuevo Material" para empezar.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <Fragment key={item.id}>
                    {/* Fila banner del material */}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td className="p-3 pl-4 text-slate-500 font-medium">{item.code}</td>
                      <td className="p-3 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3" colSpan={2}>
                        <span className="text-xs text-slate-500">
                          {item.presentations.length} presentación(es)
                        </span>
                      </td>
                      <td className="p-3 text-right text-xs text-slate-500">
                        {item.presentations.reduce((acc: number, p: any) => acc + (p.stock || 0), 0)} uds
                      </td>
                      <td className="p-3" colSpan={3}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal('create-presentation', item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            + Presentación
                          </button>
                          <button
                            onClick={() => openModal('edit-item', item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 hover:bg-brand-50 px-2 py-1 rounded-md transition-colors"
                          >
                            Editar material
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Filas de variantes */}
                    {item.presentations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400 text-sm">
                          Este material aún no tiene presentaciones.
                        </td>
                      </tr>
                    ) : (
                      item.presentations.map((pres) => (
                        <tr key={pres.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-4 text-slate-300 font-medium">↳</td>
                          <td className="p-4 text-slate-400 text-sm">—</td>
                          <td className="p-4 text-slate-900 font-semibold">{pres.name}</td>
                          <td className="p-4 text-slate-600">{pres.size}</td>
                          <td className="p-4 text-right">{stockBadge(pres.stock)}</td>
                          <td className="p-4 text-center text-slate-500 text-sm">
                            {pres.minStock ?? '—'} / {pres.maxStock ?? '—'}
                          </td>
                          <td className="p-4 text-center">
                            {pres.qrCode && (
                              <div className="flex justify-center">
                                <QRCode value={pres.qrCode} size={64} level="M" includeMargin={true} />
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => openModal('edit-presentation', item, pres)}
                              className="text-slate-400 hover:text-brand-600 transition-colors p-1"
                              title="Editar Presentación"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Mostrando <span className="font-semibold text-slate-700">{items.length}</span> material(es) y{' '}
              <span className="font-semibold text-slate-700">{totalPresentations}</span> presentación(es) en total.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
