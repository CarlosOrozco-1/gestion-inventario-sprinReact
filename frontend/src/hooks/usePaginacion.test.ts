import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaginacion } from './usePaginacion';

const lista = (n: number) => Array.from({ length: n }, (_, i) => `item-${i + 1}`);

describe('usePaginacion', () => {
  it('devuelve todo en una sola página cuando cabe en el tamaño', () => {
    const { result } = renderHook(() => usePaginacion(lista(4), 10));

    expect(result.current.pagina).toBe(0);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.total).toBe(4);
    expect(result.current.visibles).toHaveLength(4);
  });

  it('parte el conjunto en páginas del tamaño pedido', () => {
    const { result } = renderHook(() => usePaginacion(lista(25), 10));

    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.visibles).toEqual(lista(10).slice(0, 10));
  });

  it('navega entre páginas con el índice 0-based', () => {
    const { result } = renderHook(() => usePaginacion(lista(25), 10));

    act(() => result.current.setPagina(2));
    expect(result.current.pagina).toBe(2);
    expect(result.current.visibles).toEqual(['item-21', 'item-22', 'item-23', 'item-24', 'item-25']);
  });

  it('la última página puede quedar incompleta', () => {
    const { result } = renderHook(() => usePaginacion(lista(25), 10));

    act(() => result.current.setPagina(2));
    expect(result.current.visibles).toHaveLength(5);
  });

  it('acota la página si el conjunto se reduce y la actual quedaría huérfana', () => {
    const items = lista(25);
    const { result, rerender } = renderHook(({ data }) => usePaginacion(data, 10), {
      initialProps: { data: items },
    });

    act(() => result.current.setPagina(2));
    expect(result.current.pagina).toBe(2);

    // El filtro deja solo 3 registros: la página 2 ya no existe.
    rerender({ data: lista(3) });

    expect(result.current.pagina).toBe(0);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.visibles).toHaveLength(3);
  });

  it('reporta al menos una página con lista vacía', () => {
    const { result } = renderHook(() => usePaginacion([], 10));

    expect(result.current.pagina).toBe(0);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.total).toBe(0);
    expect(result.current.visibles).toEqual([]);
  });
});
