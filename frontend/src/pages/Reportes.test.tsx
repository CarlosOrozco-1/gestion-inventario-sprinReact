import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Reportes from './Reportes';

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));

function paginaTrazabilidad(pagina: number) {
  return Promise.resolve({
    data: {
      content: [
        {
          id: pagina + 1,
          type: 'ENTRADA',
          quantity: 12,
          balanceAfter: 45,
          detail: `Movimiento de prueba página ${pagina}`,
          createdAt: '2026-10-20T10:00:00',
          usuarioName: 'Administrador',
        },
      ],
      totalPages: 2,
      totalElements: 12,
      number: pagina,
      size: 10,
    },
  });
}

async function abrirTrazabilidad() {
  render(<Reportes />);
  fireEvent.click(screen.getByRole('button', { name: 'Trazabilidad por producto' }));
  await screen.findByRole('option', { name: 'Guantes Nitrilo' });

  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0], { target: { value: '7' } });
  await screen.findByRole('option', { name: 'Caja 100 unidades' });
  fireEvent.change(selects[1], { target: { value: '22' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar trazabilidad' }));

  expect(await screen.findByText('Movimiento de prueba página 0')).toBeInTheDocument();
}

describe('Reportes: trazabilidad por producto', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.post.mockReset();
    apiMocks.get.mockImplementation((url: string, config?: any) => {
      if (url === '/movimientos') return Promise.resolve({ data: [] });
      if (url === '/insumos') {
        return Promise.resolve({
          data: [{
            id: 7,
            item: 'Guantes Nitrilo',
            presentations: [{ id: 22, name: 'Caja', size: '100 unidades' }],
          }],
        });
      }
      if (url === '/usuarios') return Promise.resolve({ data: [] });
      if (url === '/presentations/22') return Promise.resolve({ data: { stock: 45 } });
      if (url === '/movimientos/paginado') {
        return paginaTrazabilidad(config?.params?.page ?? 0);
      }
      throw new Error(`Endpoint inesperado: ${url}`);
    });
  });

  it('muestra los movimientos, el saldo y el total sin romper el render', async () => {
    await abrirTrazabilidad();

    expect(screen.getByText(/Stock actual:/)).toHaveTextContent('45');
    expect(screen.getByText('Página 1 de 2 · 12 movimientos')).toBeInTheDocument();
    expect(screen.getByText('45', { selector: 'td' })).toBeInTheDocument();

    const request = apiMocks.get.mock.calls.find((call) => call[0] === '/movimientos/paginado');
    expect((request as any[])[1].params).toEqual({ page: 0, size: 10, presentationId: '22' });
  });

  it('vuelve a consultar al cambiar de página o tamaño', async () => {
    await abrirTrazabilidad();

    fireEvent.change(screen.getByTitle('Registros por página'), { target: { value: '50' } });
    await waitFor(() => {
      const requests = apiMocks.get.mock.calls.filter((call) => call[0] === '/movimientos/paginado');
      expect((requests.at(-1) as any[])[1].params).toEqual({ page: 0, size: 50, presentationId: '22' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Movimiento de prueba página 1')).toBeInTheDocument();
    await waitFor(() => {
      const requests = apiMocks.get.mock.calls.filter((call) => call[0] === '/movimientos/paginado');
      expect((requests.at(-1) as any[])[1].params).toEqual({ page: 1, size: 50, presentationId: '22' });
    });
  });
});
