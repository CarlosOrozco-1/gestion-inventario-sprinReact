import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QrScanner from './QrScanner';

function renderScanner(overrides: any = {}) {
  const props = {
    isOpen: true,
    onScan: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const utils = render(<QrScanner {...props} />);
  return { props, ...utils };
}

describe('QrScanner', () => {
  it('cae a modo manual cuando la cámara no está disponible', async () => {
    renderScanner();
    expect(await screen.findByText(/Cámara no disponible/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Código del insumo/i)).toBeInTheDocument();
  });

  it('consultar un código manual invoca onScan', async () => {
    const user = userEvent.setup();
    const { props } = renderScanner();

    await user.type(await screen.findByPlaceholderText(/Código del insumo/i), 'SIGES-PRES-2');
    await user.click(screen.getByRole('button', { name: /Consultar/i }));

    expect(props.onScan).toHaveBeenCalledTimes(1);
    expect(props.onScan).toHaveBeenCalledWith('SIGES-PRES-2');
  });

  it('cerrar con el botón "X" invoca onClose', async () => {
    const user = userEvent.setup();
    const { props } = renderScanner();

    const header = screen.getByRole('heading', { name: /Escanear Código QR/i }).closest('div')!;
    await user.click(within(header).getAllByRole('button')[0]);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});