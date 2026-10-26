import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExportIconButton from './ExportIconButton';

const noop = () => {};

describe('ExportIconButton', () => {
  it.each([
    ['pdf', 'Exportar PDF', 'Exportar a PDF', 'text-rose-600'],
    ['excel', 'Exportar Excel', 'Exportar a Excel', 'text-emerald-600'],
  ] as const)('identifica la exportación %s con icono coloreado y tooltip', (formato, etiqueta, title, color) => {
    render(<ExportIconButton formato={formato} onClick={noop} />);

    const boton = screen.getByRole('button', { name: etiqueta });
    expect(boton).toHaveAttribute('title', title);
    expect(boton.querySelector('svg')).toHaveClass('size-5', color);
  });

  it('anuncia el estado de carga y deshabilita la acción', () => {
    render(<ExportIconButton formato="excel" onClick={noop} cargando />);

    expect(screen.getByRole('button', { name: 'Generando Excel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generando Excel' })).toHaveAttribute('title', 'Generando Excel...');
  });
});
