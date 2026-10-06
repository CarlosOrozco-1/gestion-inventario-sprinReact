import { useState, useEffect, Fragment } from 'react';
import api from '../api/axios';
import InsumoModal from '../components/InsumoModal';
import QrScanner from '../components/QrScanner';
import SearchModal from '../components/SearchModal';
import QrModal from '../components/QrModal';
import EstadoInsumoModal from '../components/EstadoInsumoModal';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { getRol } from '../access';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { usePaginacion } from '../hooks/usePaginacion';
import Paginacion from '../components/Paginacion';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { btn, iconBtn } from '../utils/buttonStyles';

// El catálogo se pagina en cliente: son decenas de materiales, no miles.
// Se pagina por MATERIAL (no por presentación) porque cada fila de material
// despliega sus presentaciones y cortarlas en mitad se leería como dato roto.
const TAMANIO_PAGINA = 10;

export default function Insumos() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para controlar el Modal (mode: create-item | edit-item | create-presentation | edit-presentation)
  const [modalConfig, setModalConfig] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  // { tipo: 'insumo'|'presentacion', item, pres?, activo, ... }. `activo` es el
  // estado ACTUAL: si es true, el modal va a inactivar. Nombrarlo asi evita el
  // clásico `activo === false` invertido, que terminaba inactivando lo que ya
  // estaba inactivo.
  const [estadoModal, setEstadoModal] = useState(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [exportando, setExportando] = useState(false);

  const showToast = useToastStore((s: any) => s.showToast);
  const user = useAuthStore((s: any) => s.user);

  // Inactivar/activar material es exclusivo de JEFE y ADMIN.
  // Se usa getRol() y no user.rol: segun como se arma el usuario, rol puede venir
  // como texto plano o como { name }, y leerlo directo dejaba el boton oculto
  // para un JEFE que si podia operarlo.
  const puedeEditarCatalogo = ['ADMIN', 'JEFE'].includes(getRol(user));
  const canToggleEstado = puedeEditarCatalogo;

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

  // Refresca el catálogo en vivo cuando otro usuario crea/edita/desactiva un
  // insumo, agrega una presentación o registra un movimiento (cambia el stock).
  useRealtimeSync(
    [
      'INSUMO_CREADO',
      'INSUMO_ACTUALIZADO',
      'INSUMO_INACTIVADO',
      'INSUMO_REACTIVADO',
      'PRESENTACION_AGREGADA',
      'MOVIMIENTO_CREADO',
    ],
    () => fetchItems()
  );

  const openModal = (mode, item = null, presentation = null) => {
    setModalConfig({ mode, item, presentation });
  };

  // Descarga el catalogo completo en Excel. Va al backend con responseType blob
  // porque el token viaja en el header Authorization: un <a href> sin token
  // recibiria 403. El archivo lo genera el servidor con TODO el catalogo, no lo
  // que hay en pantalla, porque la tabla esta paginada y nunca showed el total.
  const exportarExcel = async () => {
    setExportando(true);
    try {
      const response = await api.get('/reportes/catalogo/excel', { responseType: 'blob' });

      const nombre = /filename="?([^";]+)"?/.exec(
        response.headers['content-disposition'] || ''
      )?.[1] || 'catalogo_insumos.xlsx';

      const url = URL.createObjectURL(new Blob([response.data]));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);

      showToast('Excel generado');
    } catch (err: any) {
      showToast(err?.mensajeUsuario || 'No se pudo generar el Excel.');
    } finally {
      setExportando(false);
    }
  };

  const closeModal = () => setModalConfig(null);

  /**
   * Inactivar o reactivar un material o una presentación. El motivo viaja al
   * backend porque queda escrito en la auditoría: al inactivar es obligatorio
   * (lo valida el modal y tambien ItemService), al reactivar es una nota.
   */
  const confirmarCambioEstado = async (motivo: string) => {
    if (!estadoModal) return;
    const { tipo, item, pres, activo } = estadoModal;
    const nuevoActivo = !activo;
    setGuardandoEstado(true);
    try {
      const url = tipo === 'presentacion' ? `/presentations/${pres.id}/estado` : `/items/${item.id}/estado`;
      await api.put(url, { activo: nuevoActivo, motivo });
      const que = tipo === 'presentacion' ? 'Presentación' : 'Material';
      const nombre = tipo === 'presentacion' ? pres.name : item.name;
      setEstadoModal(null);
      fetchItems(`${que} ${nuevoActivo ? 'activado' : 'inactivado'}: ${nombre}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cambiar el estado.', 'error');
    } finally {
      setGuardandoEstado(false);
    }
  };

  /** Abre el modal de estado. `activo` es el estado actual del registro. */
  const abrirEstado = (tipo, item, pres = null) => {
    const activo = tipo === 'presentacion' ? pres.activo !== false : item.activo !== false;
    setEstadoModal({ tipo, item, pres, activo });
  };

  // Escanea un QR y abre la edición de la presentación encontrada.
  const handleQrScan = async (qrCode) => {
    setIsScannerOpen(false);
    try {
      const response = await api.get(`/presentations/qr/${qrCode}`);
      const scanned = response.data; // { id, code, item, presentation, size, ... }
      if (scanned.activo === false) {
        // `activo` es el flag efectivo del backend: falso si el material O la
        // presentación están inactivos, y este dato no distingue cuál.
        showToast('Este insumo o su presentación están inactivos. Consulta con tu superior para su activación.', 'error');
        return;
      }
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

  // `items` es el catálogo completo; `visibles` es solo la página actual.
  const {
    pagina, totalPaginas, total, visibles: itemsVisibles, setPagina,
  } = usePaginacion(items, TAMANIO_PAGINA);

  return (
    <div className="page-container">
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

      {/* Vista ampliada del QR (descargar PNG / imprimir) */}
      <QrModal
        isOpen={!!qrModal}
        item={qrModal?.item}
        presentation={qrModal?.pres}
        onClose={() => setQrModal(null)}
      />

      {/* Inactivar / reactivar con motivo obligatorio (JEFE y ADMIN) */}
      <EstadoInsumoModal
        isOpen={!!estadoModal}
        tipo={estadoModal?.tipo || 'insumo'}
        activo={estadoModal?.activo !== false}
        etiqueta={
          estadoModal?.tipo === 'presentacion'
            ? `${estadoModal?.item?.code} · ${estadoModal?.item?.name} / ${estadoModal?.pres?.name} (${estadoModal?.pres?.size})`
            : `${estadoModal?.item?.code} · ${estadoModal?.item?.name}`
        }
        unidades={
          estadoModal?.tipo === 'presentacion'
            ? estadoModal?.pres?.stock || 0
            : (estadoModal?.item?.presentations || []).reduce((acc: number, p: any) => acc + (p.stock || 0), 0)
        }
        resumenPresentaciones={
          estadoModal?.tipo === 'insumo'
            ? (estadoModal?.item?.presentations || []).map((p: any) => ({
                nombre: p.name,
                unidades: p.stock || 0,
              }))
            : undefined
        }
        cargando={guardandoEstado}
        onConfirm={confirmarCambioEstado}
        onCancel={() => setEstadoModal(null)}
      />

      {/* Header de la vista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Catálogo de Insumos</h1>
          <p className="text-slate-500 mt-1">Materiales y sus presentaciones (variantes) con stock propio.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportarExcel}
            disabled={exportando}
            title="Descargar todo el catálogo con existencias (incluye los materiales que no están en esta página)"
            className={btn('exito', 'barra')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportando ? 'Generando...' : 'Excel'}
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className={btn('neutro', 'barra')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar insumo
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className={btn('primario', 'barra')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m4-14a6 6 0 00-8 8m8-8a6 6 0 010 8m-8-8a6 6 0 000 8" />
            </svg>
            Escanear QR
          </button>

          {puedeEditarCatalogo && (
            <button
              onClick={() => openModal('create-item')}
              className={btn('primario', 'barra')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Material
            </button>
          )}
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
              ) : total === 0 ? (
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
                itemsVisibles.map((item) => (
                  <Fragment key={item.id}>
                    {/* Fila banner del material */}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td className="p-3 pl-4 text-slate-500 font-medium">{item.code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <span className="flex items-center gap-2">
                          {item.name}
                          {item.activo === false && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                              Inactivo
                            </span>
                          )}
                        </span>
                      </td>
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
                          {canToggleEstado && (
                            <>
                              <button
                                onClick={() => abrirEstado('insumo', item)}
                                title={
                                  item.activo === false
                                    ? 'Reactivar el material: vuelve a admitir movimientos'
                                    : 'Inactivar el material: deja de admitir movimientos, sin borrar su historial'
                                }
                                className={`${btn('fantasma', 'inline')} ${
                                  item.activo === false
                                    ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                {item.activo === false ? 'Activar' : 'Inactivar'}
                              </button>
                              <button
                                onClick={() => openModal('create-presentation', item)}
                                className={btn('fantasma', 'inline')}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                + Presentación
                              </button>
                              <button
                                onClick={() => openModal('edit-item', item)}
                                className={btn('fantasma', 'inline')}
                              >
                                Editar material
                              </button>
                            </>
                          )}
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
                          <td className="p-4 text-slate-900 font-semibold">
                            <span className="flex items-center gap-2">
                              {pres.name}
                              {pres.activo === false && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600"
                                  title="Inactiva: no admite movimientos, pero conserva su stock e historial"
                                >
                                  Inactiva
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">{pres.size}</td>
                          <td className="p-4 text-right">{stockBadge(pres.stock)}</td>
                          <td className="p-4 text-center text-slate-500 text-sm">
                            {pres.minStock ?? '—'} / {pres.maxStock ?? '—'}
                          </td>
                          <td className="p-4 text-center">
                            {pres.qrCode && (
                              <button
                                type="button"
                                title="Ver QR en grande (descargar / imprimir)"
                                onClick={() => setQrModal({ item, pres })}
                                className="inline-flex rounded-lg hover:scale-105 hover:ring-2 hover:ring-brand-500/30 transition-transform"
                              >
                                <QRCode value={pres.qrCode} size={64} level="M" includeMargin={true} />
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {canToggleEstado && (
                                <button
                                  onClick={() => abrirEstado('presentacion', item, pres)}
                                  title={
                                    pres.activo === false
                                      ? 'Reactivar la presentación: vuelve a admitir movimientos'
                                      : 'Inactivar la presentación: deja de admitir movimientos, sin borrar su historial'
                                  }
                                  className={`${btn('fantasma', 'inline')} ${
                                    pres.activo === false
                                      ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                >
                                  {pres.activo === false ? 'Activar' : 'Inactivar'}
                                </button>
                              )}
                              {canToggleEstado && (
                                <button
                                  onClick={() => openModal('edit-presentation', item, pres)}
                                  className={iconBtn('marca', 'chico')}
                                  title="Editar Presentación"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                            </div>
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

        <Paginacion
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          onCambioPagina={setPagina}
          etiqueta="materiales"
        />

        {!loading && total > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              <span className="font-semibold text-slate-700">{total}</span> material(es) y{' '}
              <span className="font-semibold text-slate-700">{totalPresentations}</span> presentación(es) en total.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
