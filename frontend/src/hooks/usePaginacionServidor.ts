import { useCallback, useState } from 'react';

/**
 * Paginación en servidor para listas que crecen sin límite (Kárdex, Auditoría).
 *
 * El backend devuelve un `Page<T>`; aquí solo se conserva el índice y se
 * encapsula la lectura de `content`/`totalPages` para que los módulos no
 * repitan la forma del JSON.
 *
 * `totalPaginas` en 0 es el valor inicial antes de la primera respuesta: la
 * vista no debe parpadear mostrando una página vacía mientras carga.
 */
export function usePaginacionServidor<T>(
  cargar: (pagina: number, size: number) => Promise<{
    content: T[];
    totalPages: number;
    totalElements: number;
    number?: number;
  }>,
  tamanoPagina = 10
) {
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [elementos, setElementos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(
    async (nuevaPagina: number) => {
      setCargando(true);
      try {
        const data = await cargar(nuevaPagina, tamanoPagina);
        setElementos(data.content);
        setTotalPaginas(data.totalPages);
        setTotal(data.totalElements);
        setPagina(data.number ?? nuevaPagina);
      } finally {
        setCargando(false);
      }
    },
    [cargar, tamanoPagina]
  );

  return { pagina, totalPaginas, total, elementos, cargando, refrescar, tamanoPagina };
}
