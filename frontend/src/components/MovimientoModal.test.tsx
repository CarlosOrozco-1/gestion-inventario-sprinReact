import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MovimientoModal from './MovimientoModal';

const insumos: any[] = [
  {
    id: 11,
    code: 10001,
    item: 'Gasa',
    presentation: 'Sobre',
    size: '10x10',
    stock: 8,
    minStock: 5,
    maxStock: 40,
  },
];

function renderModal(overrides: any = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    insumos,
    ...overrides,
  };
  return { props, ...render(<MovimientoModal {...props} />) };
}

async function seleccionarInsumo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('combobox'), 'gasa');
  await user.click(screen.getByRole('option', { name: /Gasa/i }));
}

describe('MovimientoModal (registro de entradas y salidas)', () => {
  it('no renderiza nada cuando está cerrado', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('heading', { name: /Registrar Movimiento/i })).not.toBeInTheDocument();
  });

  it('muestra la identidad y el stock del insumo seleccionado', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);

    expect(screen.getByText('Gasa')).toBeInTheDocument();
    expect(screen.getByText('Sobre · 10x10')).toBeInTheDocument();
    expect(screen.getByText('Código 10001')).toBeInTheDocument();
    expect(screen.getByText(/Stock actual/i)).toBeInTheDocument();
    expect(screen.getByText(/Stock Óptimo/i)).toBeInTheDocument();
  });

  it('proyecta el stock resultante al escribir una cantidad', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);
    await user.type(screen.getByRole('spinbutton'), '4');

    // Entrada por defecto: 8 + 4.
    expect(screen.getByText('12 uds')).toBeInTheDocument();
  });

  it('advierte cuando la salida supera el stock disponible', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);
    await user.click(screen.getByRole('button', { name: /Salida/i }));
    await user.type(screen.getByRole('spinbutton'), '10');

    expect(screen.getByText('insuficiente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salida/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Entrada/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('exige un detalle de al menos 20 caracteres antes de continuar', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);
    await user.type(screen.getByRole('spinbutton'), '4');
    await user.type(screen.getByRole('textbox'), 'corto');
    await user.click(screen.getByRole('button', { name: /Continuar/i }));

    expect(screen.getByText(/al menos 20 caracteres/i)).toBeInTheDocument();
  });
});
