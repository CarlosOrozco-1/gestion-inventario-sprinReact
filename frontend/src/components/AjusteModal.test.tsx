import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AjusteModal from './AjusteModal';

const insumos: any[] = [
  {
    id: 21,
    code: 20002,
    item: 'Jeringa',
    presentation: 'Caja',
    size: '5ml',
    stock: 3,
    minStock: 10,
    maxStock: 60,
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
  return { props, ...render(<AjusteModal {...props} />) };
}

async function seleccionarInsumo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('combobox'), 'jeringa');
  await user.click(screen.getByRole('option', { name: /Jeringa/i }));
}

describe('AjusteModal (sobrantes y mermas)', () => {
  it('muestra la identidad y el estado del stock seleccionado', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);

    expect(screen.getByText('Jeringa')).toBeInTheDocument();
    expect(screen.getByText('Caja · 5ml')).toBeInTheDocument();
    // stock 3 < minStock 10
    expect(screen.getByText(/Stock Bajo/i)).toBeInTheDocument();
  });

  it('suma la diferencia sobre el stock cuando el ajuste es un sobrante', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);
    await user.type(screen.getByRole('spinbutton'), '5');

    // AJUSTE_POSITIVO por defecto: 3 + 5.
    expect(screen.getByText('8 uds')).toBeInTheDocument();
  });

  it('advierte cuando la merma supera el stock disponible', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);
    await user.click(screen.getByRole('button', { name: /Merma/i }));
    await user.type(screen.getByRole('spinbutton'), '4');

    expect(screen.getByText('insuficiente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Merma/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('exige una justificación de al menos 20 caracteres', async () => {
    const user = userEvent.setup();
    renderModal();

    await seleccionarInsumo(user);
    await user.type(screen.getByRole('spinbutton'), '2');
    await user.type(screen.getByRole('textbox'), 'corto');
    await user.click(screen.getByRole('button', { name: /Continuar/i }));

    expect(screen.getByText(/al menos 20 caracteres/i)).toBeInTheDocument();
  });
});
