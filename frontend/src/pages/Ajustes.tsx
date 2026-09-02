import { useState, useEffect } from 'react';
import api from '../api/axios';
import AjusteModal from '../components/AjusteModal';
import QrScanner from '../components/QrScanner';

export default function Ajustes() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [insumosList, setInsumosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedPresentation, setScannedPresentation] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async (message = null) => {
    try {
      const [movRes, insumosRes] = await Promise.all([
        api.get('/movimientos'),
        api.get('/insumos')
      ]);
      
      // Filtramos SOLO los ajustes para esta vista
      const soloAjustes = movRes.data.filter((m: any) => m.type.includes('AJUSTE'));
      setMovimientos(soloAjustes);
      setInsumosList(insumosRes.data);
      
      if (message) {
        setToastMessage(message as string);
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

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <AjusteModal 
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

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Ajustes</h1>
          <p className="text-slate-500 mt-1">Historial de correcciones manuales al inventario.</p>
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
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-amber-500/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Nuevo Ajuste
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/50 border-b border-amber-100 text-amber-800 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Insumo</th>
                <th className="p-4 font-semibold text-center">Impacto</th>
                <th className="p-4 font-semibold text-right">Cant.</th>
                <th className="p-4 font-semibold">Responsable</th>
                <th className="p-4 font-semibold">Justificación Obligatoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Cargando ajustes...</td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No hay ajustes registrados</p>
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(mov.createdAt)}</td>
                    <td className="p-4 font-medium text-slate-900">{mov.itemName}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        mov.type === 'AJUSTE_POSITIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {mov.type === 'AJUSTE_POSITIVO' ? '+ SOBRANTE' : '- MERMA'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">{mov.quantity}</td>
                    <td className="p-4 text-slate-600 font-medium">{mov.usuarioName}</td>
                    <td className="p-4 text-slate-700 italic max-w-sm truncate" title={mov.detail}>
                      "{mov.detail}"
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
