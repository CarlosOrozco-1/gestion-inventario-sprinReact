import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Movimientos from './Movimientos';

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));
vi.mock('../components/QrScanner', () => ({ default: () => null }));

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderMovimientos() {
  return render(
    <MemoryRouter initialEntries={['/movimientos']}>
      <Routes>
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/reportes" element={<div>Vista de reportes</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe('Movimientos', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.get.mockResolvedValue({ data: [] });
  });

  it('muestra las acciones disponibles para registrar movimientos y consultar el Kárdex', async () => {
    renderMovimientos();

    expect(await screen.findByRole('heading', { name: 'Movimientos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrada/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salida/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver Kárdex/ })).toBeInTheDocument();
  });

  it('navega a Reportes al seleccionar Ver Kárdex', async () => {
    renderMovimientos();

    fireEvent.click(await screen.findByRole('button', { name: /Ver Kárdex/ }));

    expect(await screen.findByText('Vista de reportes')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/reportes');
  });

  it('carga los insumos para registrar movimientos sin solicitar un Kárdex paginado desde esta pantalla', async () => {
    renderMovimientos();

    await screen.findByRole('heading', { name: 'Movimientos' });

    expect(apiMocks.get).toHaveBeenCalledWith('/insumos');
    expect(apiMocks.get.mock.calls.some(([url]) => url === '/movimientos/paginado')).toBe(false);
  });
});
