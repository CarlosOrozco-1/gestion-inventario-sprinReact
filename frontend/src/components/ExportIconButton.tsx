import { btn, COLORES_ICONO_EXPORTACION } from '../utils/buttonStyles';

export type FormatoExportacion = 'pdf' | 'excel';

type ExportIconButtonProps = {
  formato: FormatoExportacion;
  onClick: () => void;
  disabled?: boolean;
  cargando?: boolean;
  title?: string;
};

function IconoExportacion({ formato }: { formato: FormatoExportacion }) {
  const clases = `size-5 ${COLORES_ICONO_EXPORTACION[formato]}`;

  if (formato === 'pdf') {
    return (
      <svg aria-hidden="true" className={clases} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <text x="6" y="17" fontFamily="sans-serif" fontSize="6" fontWeight="700" fill="currentColor" stroke="none">PDF</text>
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={clases} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9z" />
      <path d="M13 2v7h7M12 12h5M12 16h5M12 19h5" />
      <path d="M2 10h8v10H2zM4 13l4 4m0-4-4 4" />
    </svg>
  );
}

export default function ExportIconButton({
  formato,
  onClick,
  disabled = false,
  cargando = false,
  title,
}: ExportIconButtonProps) {
  const nombreFormato = formato === 'pdf' ? 'PDF' : 'Excel';
  const etiqueta = cargando ? `Generando ${nombreFormato}` : `Exportar ${nombreFormato}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || cargando}
      aria-label={etiqueta}
      aria-busy={cargando}
      title={cargando ? `Generando ${nombreFormato}...` : title || `Exportar a ${nombreFormato}`}
      className={btn('contorno', 'inline')}
    >
      <IconoExportacion formato={formato} />
    </button>
  );
}
