import { btn } from '../utils/buttonStyles';
/**
 * Pie de paginación único para todo el sistema.
 *
 * Reemplaza las copias que cada módulo hacía por su cuenta. Todas las reglas
 * de presentación (qué se muestra, cuándo aparece, textos y estados) viven
 * acá: para cambiar el comportamiento global se edita este archivo y aplica
 * a todos los módulos, sin tocar cada página.
 *
 * Soporta las dos modalidades de paginación porque la UI es idéntica:
 *   - cliente  (usePaginacion)         → p. ej. Insumos, Ajustes, Reportes.
 *   - servidor (usePaginacionServidor) → p. ej. Kárdex, Auditoría.
 *
 * No renderiza nada cuando hay una sola página: evita el pie vacío en módulos
 * con pocos registros.
 */
interface Props {
  /** Índice 0-based de la página visible. */
  pagina: number;
  /** Total de páginas (0 mientras la primera carga no responde). */
  totalPaginas: number;
  /** Total de registros del conjunto completo, no de la página. */
  total: number;
  /** Cambia de página (0-based). */
  onCambioPagina: (pagina: number) => void;
  /** Etiqueta del contador: "movimientos", "eventos", "insumos"... */
  etiqueta?: string;
  /** Oculta el pie mientras carga una página para evitar cambios de layout. */
  cargando?: boolean;
  /**
   * `tabla` (por defecto) para pies de tabla; `tarjeta` para pies que viven
   * dentro de una tarjeta y no deben llevar el padding lateral de la tabla.
   */
  variant?: 'tabla' | 'tarjeta';
}

export default function Paginacion({
  pagina,
  totalPaginas,
  total,
  onCambioPagina,
  etiqueta,
  cargando = false,
  variant = 'tabla',
}: Props) {
  if (cargando || totalPaginas <= 1) return null;

  const primera = pagina + 1;
  const etiquetaLimpia = etiqueta?.trim();
  const clasesContenedor =
    variant === 'tabla'
      ? 'flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100'
      : 'flex items-center justify-between gap-3 py-3';

  return (
    <div className={clasesContenedor}>
      <span className="text-sm text-slate-500">
        Página {primera} de {totalPaginas} · {total} {etiquetaLimpia || 'registros'}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onCambioPagina(pagina - 1)}
          disabled={pagina === 0}
          title="Ver página anterior"
          className={btn('neutro', 'fila')}
        >
          Anterior
        </button>
        <button
          onClick={() => onCambioPagina(pagina + 1)}
          disabled={pagina >= totalPaginas - 1}
          title="Ver página siguiente"
          className={btn('neutro', 'fila')}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
