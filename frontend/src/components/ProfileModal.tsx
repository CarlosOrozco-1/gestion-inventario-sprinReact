import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ConfirmModal from './ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

function CampoContrasena({ label, value, onChange, visible }: { label: string; value: string; onChange: (v: string) => void; visible: boolean }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        required
      />
    </div>
  );
}

export default function ProfileModal({ isOpen, onClose, user }: Props) {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const logout = useAuthStore((s: any) => s.logout);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const reset = () => {
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmacion('');
    setVisible(false);
    setError('');
    setShowConfirm(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!passwordActual) {
      setError('Ingresa tu contraseña actual.');
      return;
    }
    if (nuevaPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmacion) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    try {
      await api.put('/perfil/cambiar-password', {
        passwordActual,
        nuevaPassword,
      });
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Mi Perfil</h2>
          </div>
          <button onClick={handleClose} title="Cerrar" className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 min-h-0 flex-1 overflow-y-auto">
          {/* Datos del usuario */}
          <div className="flex items-center gap-4 mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            </div>
            <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700 uppercase shrink-0">
              {typeof user?.rol === 'string' ? user.rol : user?.rol?.name}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Cambiar contraseña</h3>
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              {visible ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 mb-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <CampoContrasena label="Contraseña actual" value={passwordActual} onChange={setPasswordActual} visible={visible} />
            <CampoContrasena label="Nueva contraseña" value={nuevaPassword} onChange={setNuevaPassword} visible={visible} />
            <CampoContrasena label="Confirmar contraseña" value={confirmacion} onChange={setConfirmacion} visible={visible} />

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-slate-600 font-medium border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-white font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirmar cambio de contraseña"
        message="Se cerrará tu sesión actual y deberás iniciar sesión con la nueva contraseña. ¿Deseas continuar?"
        confirmText="Sí, cambiar contraseña"
        tone="warning"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}