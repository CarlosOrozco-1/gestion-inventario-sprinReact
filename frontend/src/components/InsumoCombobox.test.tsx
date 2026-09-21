import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InsumoCombobox from './InsumoCombobox';

const insumos: any[] = [
  { id: 11, code: 10001, item: 'Gasa', presentation: 'Sobre', size: '10x10', stock: 8 },
  { id: 12, code: 10002, item: 'Gasa', presentation: 'Rollo', size: '5cm', stock: 2 },
  { id: 21, code: 20002, item: 'Jeringa', presentation: 'Caja', size: '5ml', stock: 3 },
];

function renderCombobox(overrides: any = {}) {
  const props = {
    insumos,
    value: '',
    onChange: vi.fn(),
    label: 'Insumo',
    ...overrides,
  };
  return { props, ...render(<InsumoCombobox {...props} />) };
}

describe('InsumoCombobox (búsqueda de insumos)', () => {
  it('no despliega la lista hasta que se escribe algo', async () => {
    const user = userEvent.setup();
    renderCombobox();

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.type(screen.getByRole('combobox'), 'gasa');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('filtra los resultados mientras se escribe', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.type(screen.getByRole('combobox'), 'rollo');

    expect(screen.getByRole('option', { name: /Rollo/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Sobre/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Jeringa/i })).not.toBeInTheDocument();
  });

  it('muestra únicamente el nombre y la presentación, sin el código interno', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.type(screen.getByRole('combobox'), 'gasa');

    expect(screen.getByRole('option', { name: 'Gasa Sobre · 10x10' })).toBeInTheDocument();
    expect(screen.queryByText(/10001/)).not.toBeInTheDocument();
  });

  it('permite encontrar un insumo por su código interno', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.type(screen.getByRole('combobox'), '20002');

    expect(screen.getByRole('option', { name: /Jeringa/i })).toBeInTheDocument();
  });

  it('avisa cuando no hay coincidencias', async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.type(screen.getByRole('combobox'), 'zzznoexiste');

    expect(screen.getByText(/Sin coincidencias/i)).toBeInTheDocument();
  });

  it('entrega el insumo seleccionado y cierra la lista', async () => {
    const user = userEvent.setup();
    const { props } = renderCombobox();

    await user.type(screen.getByRole('combobox'), 'jeringa');
    await user.click(screen.getByRole('option', { name: /Jeringa/i }));

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 21 }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('Jeringa (Caja 5ml)');
  });

  it('limpiar la búsqueda descarta la selección', async () => {
    const user = userEvent.setup();
    const { props } = renderCombobox();

    await user.type(screen.getByRole('combobox'), 'gasa');
    await user.click(screen.getByRole('option', { name: /Sobre/i }));
    await user.click(screen.getByRole('button', { name: /Limpiar/i }));

    expect(props.onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('precarga el insumo recibido desde fuera (escaneo QR)', () => {
    renderCombobox({ value: '21' });

    expect(screen.getByRole('combobox')).toHaveValue('Jeringa (Caja 5ml)');
  });
});
