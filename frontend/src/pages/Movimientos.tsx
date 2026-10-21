import { useState, useEffect } from 'react';
import api from '../api/axios';
import MovimientoModal from '../components/MovimientoModal';
import QrScanner from '../components/QrScanner';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { getRol } from '../access';
import { btn } from '../utils/buttonStyles';
import { useNavigate } from 'react-router-dom';

export default function Movimientos() {
  const [insumosList, setInsumosList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedPresentation, setScannedPresentation] = useState<any>(null);
  const [preselectedType, setPreselectedType] = useState<string | null>(null);
  const [showNoAuth, setShowNoAuth] = useState(false);

  const showToast = useToastStore((s: any) => s.showToast);
  const user = useAuthStore((s: any) => s.user);
  const navigate = useNavigate();
  const rol = getRol(user);
  const puedeAjustar = rol === 'ADMIN' || rol === 'JEFE';

  const fetchInsumos = async () => {
    try {
      const res = await api.get('/insumos');
      setInsumosList(res.data);
    } catch (err) {
      console.error('Error al cargar insumos', err);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleSave = (message?: string) => {
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
      setPreselectedType(null);
      setIsModalOpen(true);
      showToast(`Insumo encontrado: ${presentation.item} - ${presentation.presentation}`, 'info');
    } catch (err) {
      console.error('Error al buscar insumo por QR:', err);
      showToast('Código QR no encontrado', 'error');
    }
  };

  const abrirMovimiento = (tipo: string) => {
    setScannedPresentation(null);
    setPreselectedType(tipo);
    setIsModalOpen(true);
  };

  const abrirAjuste = () => {
    if (!puedeAjustar) {
      setShowNoAuth(true);
      return;
    }
    navigate('/ajustes');
  };

  return (
    <div className="page-container">
      {isModalOpen && (
        <MovimientoModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setScannedPresentation(null); setPreselectedType(null); }}
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

      {showNoAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin autorización</h3>
              <p className="text-sm text-slate-600">No tienes permisos para realizar ajustes. Solo ADMIN y JEFE pueden acceder a este módulo.</p>
              <button onClick={() => setShowNoAuth(false)} className={`${btn('neutro', 'barra')} mt-6 w-full justify-center`}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Movimientos</h1>
          <p className="text-slate-500 mt-1">Registrar entradas, salidas y ajustes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button onClick={() => abrirMovimiento('ENTRADA')} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Entrada</h3>
          <p className="text-sm text-slate-500 mt-1">Registrar ingreso de insumos</p>
        </button>

        <button onClick={() => abrirMovimiento('SALIDA')} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left">
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Salida</h3>
          <p className="text-sm text-slate-500 mt-1">Registrar egreso de insumos</p>
        </button>

        <button onClick={abrirAjuste} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Ajuste</h3>
          <p className="text-sm text-slate-500 mt-1">{puedeAjustar ? 'Ir a Ajustes' : 'Requiere permisos'}</p>
        </button>

        <button onClick={() => navigate('/reportes')} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Ver Kárdex</h3>
          <p className="text-sm text-slate-500 mt-1">Consultar trazabilidad</p>
        </button>

        <button onClick={() => setIsScannerOpen(true)} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Escanear QR</h3>
          <p className="text-sm text-slate-500 mt-1">Buscar insumo por código QR</p>
        </button>
      </div>
    </div>
  );
}
