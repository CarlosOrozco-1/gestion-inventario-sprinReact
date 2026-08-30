import { useState, useEffect } from 'react';
import api from '../api/axios';
import MovimientoModal from '../components/MovimientoModal';
import QrScanner from '../components/QrScanner';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [insumosList, setInsumosList] = useState([]); // Para el modal
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedPresentation, setScannedPresentation] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async (message = null) => {
    try {
      // Cargamos movimientos e insumos en paralelo
      const [movRes, insumosRes] = await Promise.all([
        api.get('/movimientos'),
        api.get('/insumos')
      ]);
      
      setMovimientos(movRes.data);
      setInsumosList(insumosRes.data);
      
      if (message) {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al cargar datos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQrScan = async (qrCode: string) => {
    setIsScannerOpen(false);
    try {
      const response = await api.get(`/presentations/qr/${qrCode}`);
      const presentation = response.data;
      setScannedPresentation(presentation);
      setIsModalOpen(true);
      setToastMessage(`Insumo encontrado: ${presentation.item} - ${presentation.presentation}`);
    } catch (err) {
      console.error('Error al buscar insumo por QR:', err);
      setToastMessage('Código QR no encontrado');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    <div className="max-w-7xl mx-auto">
      <MovimientoModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setScannedPresentation(null); }}
        onSave={fetchData}
        insumos={insumosList}
        preSelectedPresentation={scannedPresentation}
      />
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
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Escanear QR
          </button>

          <button 
            onClick={() => { setScannedPresentation(null); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-slate-500/50"
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
                  <td colSpan="6" className="p-8 text-center text-slate-400">Cargando movimientos...</td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
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
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
