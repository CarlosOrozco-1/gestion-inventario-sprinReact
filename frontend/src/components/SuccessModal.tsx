interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export default function SuccessModal({
  isOpen,
  title,
  message,
  buttonText = "Continuar",
  onClose,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 text-center pt-9">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-white font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/40 focus:outline-none"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}