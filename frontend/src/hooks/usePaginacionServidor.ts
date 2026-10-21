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
  tamanoPaginaInicial = 10
) {
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [elementos, setElementos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tamanoPagina, setTamanoPagina] = useState(tamanoPaginaInicial);

  const refrescar = useCallback(
    async (nuevaPagina: number, nuevoSize?: number) => {
      const size = nuevoSize ?? tamanoPagina;
      setCargando(true);
      try {
        const data = await cargar(nuevaPagina, size);
        setElementos(data.content);
        setTotalPaginas(data.totalPages);
        setTotal(data.totalElements);
        setPagina(data.number ?? nuevaPagina);
        if (nuevoSize) setTamanoPagina(nuevoSize);
      } finally {
        setCargando(false);
      }
    },
    [cargar, tamanoPagina]
  );

  const cambiarTamanio = useCallback((nuevoSize: number) => {
    setTamanoPagina(nuevoSize);
    refrescar(0, nuevoSize);
  }, [refrescar]);

  return { pagina, totalPaginas, total, elementos, cargando, refrescar, tamanoPagina, cambiarTamanio };
}
