import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Insumos from './Insumos';

const apiMocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));
vi.mock('../components/InsumoModal', () => ({ default: () => null }));
vi.mock('../components/QrScanner', () => ({ default: () => null }));

vi.mock('../components/QrModal', () => ({ default: () => null }));
vi.mock('../components/EstadoInsumoModal', () => ({ default: () => null }));
vi.mock('../hooks/useRealtimeSync', () => ({ useRealtimeSync: () => {} }));
vi.mock('../store/useToastStore', () => ({
  useToastStore: (selector: (state: { showToast: () => void }) => unknown) => selector({ showToast: () => {} }),
}));
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) => selector({ user: null }),
}));
vi.mock('../access', () => ({ getRol: () => 'AUXILIAR' }));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => null }));

describe('Insumos', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.get.mockResolvedValue({ data: [] });
  });

  it('muestra la etiqueta estandarizada para exportar el catálogo', async () => {
    render(<Insumos />);

    expect(await screen.findByRole('button', { name: 'Exportar Excel' })).toBeInTheDocument();
  });

  it('filtra el catálogo por nombre, código o presentación al escribir', async () => {
    apiMocks.get.mockResolvedValue({
      data: [
        {
          id: 1,
          code: 101,
          name: 'Guantes Nitrilo',
          activo: true,
          presentations: [{ id: 11, name: 'Caja', size: '100 unidades', stock: 15, minStock: 5, maxStock: 30, activo: true, qrCode: 'SIGES-PRES-11' }],
        },
        {
          id: 2,
          code: 202,
          name: 'Mascarilla',
          activo: true,
          presentations: [{ id: 22, name: 'Paquete', size: '50 unidades', stock: 8, minStock: 5, maxStock: 20, activo: true, qrCode: 'SIGES-PRES-22' }],
        },
      ],
    });
    render(<Insumos />);

    const buscar = await screen.findByRole('searchbox', { name: 'Buscar insumo' });
    fireEvent.change(buscar, { target: { value: 'mascarilla' } });

    expect(screen.getByText('Mascarilla')).toBeInTheDocument();
    expect(screen.queryByText('Guantes Nitrilo')).not.toBeInTheDocument();

    fireEvent.change(buscar, { target: { value: '100 unidades' } });
    expect(screen.getByText('Guantes Nitrilo')).toBeInTheDocument();
    expect(screen.queryByText('Mascarilla')).not.toBeInTheDocument();
  });
});
