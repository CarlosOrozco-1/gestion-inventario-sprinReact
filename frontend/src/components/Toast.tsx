import { useToastStore } from "../store/useToastStore";

const ICONS = {
  success: (
    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES = {
  success: "bg-slate-800 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-700 text-white",
};

export default function Toast() {
  const message = useToastStore((s: any) => s.message);
  const type = useToastStore((s: any) => s.type) as keyof typeof STYLES;
  const visible = useToastStore((s: any) => s.visible);
  const hideToast = useToastStore((s: any) => s.hideToast);

  if (!visible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <button
        onClick={hideToast}
        className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-xl shadow-slate-900/10 cursor-pointer ${STYLES[type]}`}
      >
        {ICONS[type]}
        <span className="font-medium text-left">{message}</span>
      </button>
    </div>
  );
}
