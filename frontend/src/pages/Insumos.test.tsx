import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Insumos from './Insumos';

const apiMocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));
vi.mock('../components/InsumoModal', () => ({ default: () => null }));
vi.mock('../components/QrScanner', () => ({ default: () => null }));
vi.mock('../components/SearchModal', () => ({ default: () => null }));
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
});
