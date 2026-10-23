import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

describe('Reportes', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.post.mockReset();
    apiMocks.get.mockImplementation((url: string, config?: any) => {
      if (url === '/movimientos') return Promise.resolve({ data: [] });
      if (url === '/insumos') {
        return Promise.resolve({
          data: [{ id: 22, item: 'Guantes Nitrilo', presentation: 'Caja', size: '100 unidades', stock: 45 }],
        });
      }
      if (url === '/items') {
        return Promise.resolve({
          data: [{
            id: 7,
            name: 'Guantes Nitrilo',
            presentations: [
              { id: 22, name: 'Caja', size: '100 unidades', stock: 45, activo: true },
              { id: 23, name: 'Bolsa', size: '50 unidades', stock: 0, activo: false },
            ],
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

  it('ubica las exportaciones del histórico global en el encabezado de resultados', async () => {
    render(<Reportes />);

    const encabezado = (await screen.findByRole('heading', { name: 'Resultados' })).parentElement;
    expect(encabezado).not.toBeNull();
    expect(within(encabezado as HTMLElement).getByRole('button', { name: 'Exportar PDF' })).toBeInTheDocument();
    expect(within(encabezado as HTMLElement).getByRole('button', { name: 'Exportar Excel' })).toBeInTheDocument();
  });

  it('carga presentaciones desde el catálogo jerárquico y conserva las inactivas para trazabilidad', async () => {
    render(<Reportes />);
    fireEvent.click(screen.getByRole('button', { name: 'Trazabilidad por producto' }));
    await screen.findByRole('option', { name: 'Guantes Nitrilo' });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '7' } });

    expect(await screen.findByRole('option', { name: 'Caja 100 unidades' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bolsa 50 unidades (Inactiva)' })).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/items');
  });

  it('muestra las exportaciones en el encabezado de resultados', async () => {
    await abrirTrazabilidad();

    const encabezado = screen.getByRole('heading', { name: 'Resultados' }).parentElement;
    expect(encabezado).not.toBeNull();
    expect(within(encabezado as HTMLElement).getByRole('button', { name: 'Exportar PDF' })).toBeInTheDocument();
    expect(within(encabezado as HTMLElement).getByRole('button', { name: 'Exportar Excel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buscar trazabilidad' })).toBeInTheDocument();
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
      expect((requests[requests.length - 1] as any[])[1].params).toEqual({ page: 0, size: 50, presentationId: '22' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Movimiento de prueba página 1')).toBeInTheDocument();
    await waitFor(() => {
      const requests = apiMocks.get.mock.calls.filter((call) => call[0] === '/movimientos/paginado');
      expect((requests[requests.length - 1] as any[])[1].params).toEqual({ page: 1, size: 50, presentationId: '22' });
    });
  });

  it.each([
    ['Excel', 'excel'],
    ['PDF', 'pdf'],
  ] as const)('exporta la trazabilidad completa a %s', async (nombre, formato) => {
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apiMocks.get.mockImplementation((url: string, config?: any) => {
      if (url === `/reportes/kardex/22/${formato}`) {
        return Promise.resolve({ data: new Blob(['archivo']), config });
      }
      if (url === '/movimientos') return Promise.resolve({ data: [] });
      if (url === '/insumos') return Promise.resolve({ data: [{ id: 22, item: 'Guantes Nitrilo', stock: 45 }] });
      if (url === '/items') {
        return Promise.resolve({ data: [{ id: 7, name: 'Guantes Nitrilo', presentations: [{ id: 22, name: 'Caja', size: '100 unidades', stock: 45 }] }] });
      }
      if (url === '/usuarios') return Promise.resolve({ data: [] });
      if (url === '/presentations/22') return Promise.resolve({ data: { stock: 45 } });
      if (url === '/movimientos/paginado') return paginaTrazabilidad(config?.params?.page ?? 0);
      throw new Error(`Endpoint inesperado: ${url}`);
    });

    await abrirTrazabilidad();
    fireEvent.click(screen.getByRole('button', { name: `Exportar ${nombre}` }));

    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith(`/reportes/kardex/22/${formato}`, { responseType: 'blob' });
    });
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
