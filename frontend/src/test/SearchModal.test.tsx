import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchModal from '../components/SearchModal';

const items: any[] = [
  {
    id: 1,
    code: 10001,
    name: 'Gasa',
    presentations: [
      { id: 11, name: 'Gasa estéril 10x10', size: '10x10', stock: 5 },
      { id: 12, name: 'Gasa estéril 20x20', size: '20x20', stock: 3 },
    ],
  },
  {
    id: 2,
    code: 20002,
    name: 'Jeringa',
    presentations: [{ id: 21, name: 'Jeringa 5ml', size: '5ml', stock: 0 }],
  },
];

function renderModal(overrides: any = {}) {
  const props = {
    isOpen: true,
    items,
    onClose: vi.fn(),
    onSelectItem: vi.fn(),
    onSelectPresentation: vi.fn(),
    ...overrides,
  };
  const utils = render(<SearchModal {...props} />);
  return { props, ...utils };
}

describe('SearchModal (búsqueda del catálogo)', () => {
  it('muestra el mensaje inicial cuando la búsqueda está vacía', () => {
    renderModal();
    expect(screen.getByText(/Escribe el nombre, código interno o presentación/i)).toBeInTheDocument();
  });

  it('encuentra presentaciones por el nombre', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'jeringa');

    expect(screen.getByText('Jeringa 5ml')).toBeInTheDocument();
  });

  it('encuentra presentaciones por el tamaño', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), '20x20');

    expect(screen.getByText('Gasa estéril 20x20')).toBeInTheDocument();
    expect(screen.queryByText('Gasa estéril 10x10')).not.toBeInTheDocument();
  });

  it('encuentra materiales por el código interno', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), '10001');

    // El material "Gasa" aparece como resultado editable.
    expect(screen.getByText('Editar material')).toBeInTheDocument();
    expect(screen.getByText('Gasa')).toBeInTheDocument();
  });

  it('muestra "No se encontraron" con una búsqueda sin coincidencias', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'xyznoexiste');

    expect(screen.getByText(/No se encontraron insumos/i)).toBeInTheDocument();
  });

  it('seleccionar un material invoca onSelectItem', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'jeringa');
    await user.click(screen.getByText('Jeringa 5ml'));

    expect(props.onSelectPresentation).toHaveBeenCalledTimes(1);
    expect(props.onSelectPresentation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, name: 'Jeringa' }),
      expect.objectContaining({ id: 21, name: 'Jeringa 5ml' })
    );
  });

  it('cerrar con el botón "X" invoca onClose', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    const header = screen.getByRole('heading', { name: /Buscar insumo/i }).closest('div')!;
    await user.click(within(header).getAllByRole('button')[0]);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});