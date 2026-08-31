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

  const toneStyles = {
    danger: { btn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500', icon: 'bg-rose-100 text-rose-600' },
    success: { btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500', icon: 'bg-emerald-100 text-emerald-600' },
    warning: { btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500', icon: 'bg-amber-100 text-amber-600' },
  }[tone];

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
            className="flex-1 px-4 py-2.5 text-slate-600 font-medium border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 ${toneStyles.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
