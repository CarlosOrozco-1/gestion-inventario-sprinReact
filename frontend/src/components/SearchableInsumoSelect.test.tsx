import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SearchableInsumoSelect, { type SearchableInsumoOption } from './SearchableInsumoSelect';

const options: SearchableInsumoOption[] = [
  { value: '1', label: 'Jabón líquido', searchText: '3001' },
  { value: '2', label: 'Guantes Nitrilo', searchText: '1002' },
];

describe('SearchableInsumoSelect', () => {
  it('no muestra toda la lista al enfocar y filtra al escribir', () => {
    render(<SearchableInsumoSelect options={options} value="" onChange={vi.fn()} label="Insumo" />);

    const input = screen.getByRole('combobox', { name: 'Insumo' });
    fireEvent.focus(input);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'jabon' } });
    expect(screen.getByRole('option', { name: 'Jabón líquido' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Guantes Nitrilo' })).not.toBeInTheDocument();
  });

  it('limita los resultados visibles para evitar listas largas', () => {
    const muchasOpciones = Array.from({ length: 60 }, (_, index) => ({
      value: String(index),
      label: `Material ${index}`,
    }));
    render(<SearchableInsumoSelect options={muchasOpciones} value="" onChange={vi.fn()} label="Insumo" />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Insumo' }), { target: { value: 'Material' } });

    expect(screen.getAllByRole('option')).toHaveLength(40);
    expect(screen.getByText(/Se muestran 40 resultados/)).toBeInTheDocument();
  });

  it('permite buscar por código y seleccionar un insumo', () => {
    const onChange = vi.fn();
    render(<SearchableInsumoSelect options={options} value="" onChange={onChange} label="Insumo" />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Insumo' }), { target: { value: '1002' } });
    fireEvent.click(screen.getByRole('option', { name: 'Guantes Nitrilo' }));

    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('ofrece la opción para quitar el filtro', () => {
    const onChange = vi.fn();
    render(
      <SearchableInsumoSelect
        options={options}
        value="2"
        onChange={onChange}
        label="Insumo"
        emptyOptionLabel="Todos los insumos"
      />,
    );

    fireEvent.focus(screen.getByRole('combobox', { name: 'Insumo' }));
    fireEvent.click(screen.getByRole('option', { name: 'Todos los insumos' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
