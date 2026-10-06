import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import MovimientoModal from '../components/MovimientoModal';
import Paginacion from '../components/Paginacion';
import QrScanner from '../components/QrScanner';
import { useToastStore } from '../store/useToastStore';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { usePaginacionServidor } from '../hooks/usePaginacionServidor';
import { btn } from '../utils/buttonStyles';

// El Kárdex se pagina en el servidor: el histórico crece con cada operación y
// no conviene enviarlo completo al navegador.
const TAMANIO_PAGINA = 10;

// Constante de módulo: un array literal en el render re-suscribe el WebSocket
// en cada actualización de estado.
const EVENTOS_KARDEX = [
  'MOVIMIENTO_CREADO',
  'INSUMO_CREADO',
  'INSUMO_ACTUALIZADO',
  'INSUMO_INACTIVADO',
  'INSUMO_REACTIVADO',
  'PRESENTACION_AGREGADA',
];

export default function Movimientos() {
  const [insumosList, setInsumosList] = useState([]); // Para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedPresentation, setScannedPresentation] = useState<any>(null);

  const showToast = useToastStore((s: any) => s.showToast);

  const cargarMovimientos = useCallback(async (pagina: number, size: number) => {
    const res = await api.get('/movimientos/paginado', { params: { page: pagina, size } });
    return res.data;
  }, []);

  const {
    pagina, totalPaginas, total, elementos: movimientos, cargando: loading, refrescar,
  } = usePaginacionServidor(cargarMovimientos, TAMANIO_PAGINA);

  // La página actual se lee por ref en los refrescos en vivo para no depender
  // de que la callback cambie de identidad.
  const paginaRef = useRef(pagina);
  paginaRef.current = pagina;

  const fetchInsumos = async () => {
    try {
      const res = await api.get('/insumos');
      setInsumosList(res.data);
    } catch (err) {
      console.error('Error al cargar insumos', err);
    }
  };

  useEffect(() => {
    refrescar(0);
    fetchInsumos();
  }, [refrescar]);

  // Tras registrar un movimiento se vuelve a la primera página: el listado es
  // descendente por fecha y el movimiento nuevo debe verse de inmediato.
  const handleSave = (message?: string) => {
    refrescar(0);
    fetchInsumos();
    if (message) showToast(message);
  };

  const handleQrScan = async (qrCode: string) => {
    setIsScannerOpen(false);
    try {
      const response = await api.get(`/presentations/qr/${qrCode}`);
      const presentation = response.data;
      if (presentation.activo === false) {
        showToast(`El insumo "${presentation.item}" está inactivo. Consulta con tu superior para su activación.`, 'error');
        return;
      }
      setScannedPresentation(presentation);
      setIsModalOpen(true);
      showToast(`Insumo encontrado: ${presentation.item} - ${presentation.presentation}`, 'info');
    } catch (err) {
      console.error('Error al buscar insumo por QR:', err);
      showToast('Código QR no encontrado', 'error');
    }
  };

  useEffect(() => {
    if (isModalOpen && insumosList.length === 0) fetchInsumos();
  }, [isModalOpen]);

  // Refresca el kárdex en vivo: un movimiento nuevo registrado por otro usuario
  // (o un cambio en el catálogo de insumos) se refleja sin recargar la página.
  useRealtimeSync(
    EVENTOS_KARDEX,
    () => refrescar(paginaRef.current)
  );

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const getTypeStyle = (tipo) => {
    if (tipo === 'ENTRADA' || tipo === 'AJUSTE_POSITIVO') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <div className="page-container">
      {isModalOpen && (
        <MovimientoModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setScannedPresentation(null); }}
          onSave={handleSave}
          insumos={insumosList}
          preSelectedPresentation={scannedPresentation}
        />
      )}
      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQrScan}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kárdex / Movimientos</h1>
          <p className="text-slate-500 mt-1">Registra e inspecciona el flujo de entradas y salidas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className={btn('primario', 'barra')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m4-14a6 6 0 00-8 8m8-8a6 6 0 010 8m-8-8a6 6 0 000 8" />
            </svg>
            Escanear QR
          </button>

          <button 
            onClick={() => { setScannedPresentation(null); setIsModalOpen(true); }}
            className={btn('oscuro', 'barra')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Insumo</th>
                <th className="p-4 font-semibold text-center">Tipo</th>
                <th className="p-4 font-semibold text-right">Cantidad</th>
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Cargando movimientos...</td>
                </tr>
              ) : total === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium text-slate-700">Aún no hay movimientos</p>
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(mov.createdAt)}</td>
                    <td className="p-4 font-medium text-slate-900">
                      {mov.itemName}
                      <span className="block text-xs text-slate-400 font-normal">{mov.presentationName}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${getTypeStyle(mov.type)}`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">{mov.quantity}</td>
                    <td className="p-4 text-slate-600 text-xs">{mov.usuarioName}</td>
                    <td className="p-4 text-slate-500 italic max-w-xs truncate" title={mov.detail}>
                      {mov.detail || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Paginacion
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          onCambioPagina={refrescar}
          etiqueta="movimientos"
        />
      </div>
    </div>
  );
}
