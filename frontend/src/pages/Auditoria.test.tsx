import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auditoria from './Auditoria';

const apiMocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../api/axios', () => ({ default: apiMocks }));

function responderPagina() {
  return Promise.resolve({
    data: {
      content: [
        {
          id: 1,
          eventType: 'LOGIN',
          description: 'Inicio de sesión exitoso',
          usuarioEmail: 'admin@inventario.com',
          ipAddress: '127.0.0.1',
          createdAt: '2026-09-01T10:00:00',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
    },
  });
}

describe('Auditoria (bitácora del sistema)', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/auditoria/eventos') {
        return Promise.resolve({
          data: { LOGIN: 'Inicio de sesión', MOVIMIENTO_CREADO: 'Movimiento registrado' },
        });
      }
      return responderPagina();
    });
  });

  it('carga el primer día de la bitácora y muestra un evento', async () => {
    render(<Auditoria />);

    expect(await screen.findByText('Inicio de sesión exitoso')).toBeInTheDocument();
    expect(screen.getByText('admin@inventario.com')).toBeInTheDocument();
    expect(screen.getByText(/1 evento registrado/i)).toBeInTheDocument();
  });

  it('aplica el filtro de usuario al pulsar Buscar', async () => {
    render(<Auditoria />);
    await screen.findByText('Inicio de sesión exitoso');

    fireEvent.change(screen.getByPlaceholderText('Correo del usuario'), {
      target: { value: 'jefe@inventario.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      const llamadas = apiMocks.get.mock.calls.filter((c) => c[0] === '/auditoria');
      const ultima = llamadas[llamadas.length - 1];
      expect(ultima).toBeTruthy();
      expect((ultima as any[])[1].params.usuario).toBe('jefe@inventario.com');
    });
  });
});