import { useMemo, useState } from 'react';

/**
 * Paginación en cliente para listas que ya llegan completas desde la API.
 *
 * Concentra TODO el cálculo (índice seguro, corte de la lista) para que las
 * reglas se cambien en un solo lugar. Los módulos con listas acotadas
 * (Insumos, Ajustes, Reportes, Proyecciones, Usuarios) la usan en lugar de
 * repetir `slice`/`Math.ceil` en cada archivo.
 *
 * Nota: para listas que crecen sin límite (Kárdex, Auditoría) la paginación
 * debe hacerse en el servidor; ver `usePaginacionServidor`.
 *
 * Props:
 *   - items: lista completa ya filtrada por el módulo.
 *   - tamanoPagina: filas por página (10 por defecto).
 *
 * Devuelve:
 *   - pagina: índice 0-based ya acotado (nunca queda huérfano).
 *   - totalPaginas, total: para el pie de `<Paginacion />`.
 *   - visibles: solo los elementos de la página actual.
 *   - setPagina: para los botones del pie.
 */
export function usePaginacion<T>(items: T[], tamanoPagina = 10) {
  const [paginaSolicitada, setPagina] = useState(0);

  const totalPaginas = Math.max(1, Math.ceil(items.length / tamanoPagina));
  // Si el filtro baja el total y la página actual queda vacía, se vuelve al
  // último índice válido sin necesidad de un efecto que sincronice el estado.
  const pagina = Math.min(paginaSolicitada, totalPaginas - 1);

  const visibles = useMemo(
    () => items.slice(pagina * tamanoPagina, (pagina + 1) * tamanoPagina),
    [items, pagina, tamanoPagina]
  );

  return { pagina, totalPaginas, total: items.length, visibles, setPagina, tamanoPagina };
}
