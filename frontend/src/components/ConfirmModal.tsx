import { btn, type Tono } from '../utils/buttonStyles';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  tone?: 'danger' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  tone = 'success',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // El color del boton sale de la fuente unica; aqui solo se traduce el tono.
  const toneStyles = {
    danger: { tono: 'peligro', icon: 'bg-rose-100 text-rose-600' },
    success: { tono: 'exito', icon: 'bg-emerald-100 text-emerald-600' },
    warning: { tono: 'aviso', icon: 'bg-amber-100 text-amber-600' },
  }[tone] as { tono: Tono; icon: string };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 text-center">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${toneStyles.icon} mb-4`}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className={`${btn('contorno', 'modal')} flex-1`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${btn(toneStyles.tono, 'modal')} flex-1`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
