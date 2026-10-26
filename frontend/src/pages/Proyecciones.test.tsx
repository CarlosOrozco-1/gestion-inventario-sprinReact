import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Proyecciones from './Proyecciones';

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), showToast: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));
vi.mock('../store/useAuthStore', () => ({ useAuthStore: () => ({ user: null }) }));
vi.mock('../store/useToastStore', () => ({
  useToastStore: (selector: (state: { showToast: () => void }) => unknown) => selector({ showToast: apiMocks.showToast }),
}));
vi.mock('../access', () => ({ getRol: () => 'ADMIN' }));

describe('Proyecciones: exportaciones', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/insumos' || url === '/insumos/sugerencias-stock') {
        return Promise.resolve({ data: [] });
      }
      throw new Error(`Endpoint inesperado: ${url}`);
    });
  });

  it('muestra los iconos accesibles para exportar PDF y Excel', async () => {
    render(<Proyecciones />);

    expect(await screen.findByRole('button', { name: 'Exportar PDF' })).toHaveAttribute('title', 'Exportar a PDF');
    expect(screen.getByRole('button', { name: 'Exportar Excel' })).toHaveAttribute('title', 'Exportar a Excel');
  });
});
