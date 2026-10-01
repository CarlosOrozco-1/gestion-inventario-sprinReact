import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Movimientos from './Movimientos';

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));
vi.mock('../components/QrScanner', () => ({ default: () => null }));

function paginaMovimientos(numero: number, totalPaginas: number, total: number) {
  return Promise.resolve({
    data: {
      content: [
        {
          id: 100 + numero,
          type: 'ENTRADA',
          quantity: 5,
          detail: `Movimiento de la pagina ${numero}`,
          createdAt: '2026-09-01T10:00:00',
          itemName: `Papel bond ${numero}`,
          presentationName: 'Resma 500 hojas',
          usuarioName: 'admin@inventario.com',
        },
      ],
      totalPages: totalPaginas,
      totalElements: total,
      number: numero,
      size: 10,
    },
  });
}

describe('Movimientos (Kárdex con paginación en servidor)', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.get.mockImplementation((url: string, config?: any) => {
      if (url === '/insumos') return Promise.resolve({ data: [] });
      const page = config?.params?.page ?? 0;
      return paginaMovimientos(page, 3, 25);
    });
  });

  it('pide la página 0 al montar y muestra el movimiento devuelto', async () => {
    render(<Movimientos />);

    expect(await screen.findByText('Papel bond 0')).toBeInTheDocument();

    const llamada = apiMocks.get.mock.calls.find((c) => c[0] === '/movimientos/paginado');
    expect(llamada).toBeTruthy();
    expect((llamada as any[])[1].params).toEqual({ page: 0, size: 10 });
  });

  it('muestra el pie de paginación con el total real del histórico', async () => {
    render(<Movimientos />);

    expect(await screen.findByText('Papel bond 0')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3 · 25 movimientos')).toBeInTheDocument();
  });

  it('avanza a la página siguiente pidiendo el índice correcto al servidor', async () => {
    render(<Movimientos />);
    await screen.findByText('Papel bond 0');

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Papel bond 1')).toBeInTheDocument();

    const llamadas = apiMocks.get.mock.calls.filter((c) => c[0] === '/movimientos/paginado');
    const ultima = llamadas[llamadas.length - 1];
    expect((ultima as any[])[1].params.page).toBe(1);
  });

  it('deshabilita Anterior en la primera página', async () => {
    render(<Movimientos />);
    await screen.findByText('Papel bond 0');

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('no pide el listado completo de movimientos (rompería los agregados)', async () => {
    render(<Movimientos />);
    await screen.findByText('Papel bond 0');

    await waitFor(() => {
      expect(apiMocks.get.mock.calls.some((c) => c[0] === '/movimientos')).toBe(false);
    });
  });
});
