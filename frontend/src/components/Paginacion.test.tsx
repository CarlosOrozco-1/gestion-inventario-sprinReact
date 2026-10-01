import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Paginacion from './Paginacion';

describe('Paginacion (pie único del sistema)', () => {
  it('no renderiza nada cuando todo cabe en una sola página', () => {
    const { container } = render(
      <Paginacion pagina={0} totalPaginas={1} total={4} onCambioPagina={() => {}} etiqueta="movimientos" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada mientras carga', () => {
    const { container } = render(
      <Paginacion pagina={0} totalPaginas={5} total={50} onCambioPagina={() => {}} cargando />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el número de página y el total con la etiqueta del módulo', () => {
    render(
      <Paginacion pagina={0} totalPaginas={4} total={35} onCambioPagina={() => {}} etiqueta="movimientos" />
    );
    expect(screen.getByText('Página 1 de 4 · 35 movimientos')).toBeInTheDocument();
  });

  it('usa "registros" cuando no se pasa etiqueta', () => {
    render(<Paginacion pagina={0} totalPaginas={2} total={12} onCambioPagina={() => {}} />);
    expect(screen.getByText('Página 1 de 2 · 12 registros')).toBeInTheDocument();
  });

  it('deshabilita Anterior en la primera página y Siguiente en la última', () => {
    const { rerender } = render(
      <Paginacion pagina={0} totalPaginas={3} total={25} onCambioPagina={() => {}} />
    );
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).not.toBeDisabled();

    rerender(<Paginacion pagina={2} totalPaginas={3} total={25} onCambioPagina={() => {}} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('emite el índice 0-based de la página solicitada', () => {
    const onCambioPagina = vi.fn();
    render(<Paginacion pagina={0} totalPaginas={3} total={25} onCambioPagina={onCambioPagina} />);

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onCambioPagina).toHaveBeenCalledWith(1);
  });

  it('pide la página anterior con índice negativo corregido en 0', () => {
    const onCambioPagina = vi.fn();
    render(<Paginacion pagina={1} totalPaginas={3} total={25} onCambioPagina={onCambioPagina} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(onCambioPagina).toHaveBeenCalledWith(0);
  });

  it('expone tooltips en los botones de navegación', () => {
    render(<Paginacion pagina={0} totalPaginas={3} total={25} onCambioPagina={() => {}} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveAttribute(
      'title',
      'Ver página anterior'
    );
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveAttribute(
      'title',
      'Ver página siguiente'
    );
  });

  it('la variante tarjeta omite el padding lateral de tabla', () => {
    const { container } = render(
      <Paginacion pagina={0} totalPaginas={2} total={12} onCambioPagina={() => {}} variant="tarjeta" />
    );
    const pie = container.firstElementChild as HTMLElement;
    expect(pie.className).not.toContain('px-6');
    expect(pie.className).toContain('py-3');
  });
});
