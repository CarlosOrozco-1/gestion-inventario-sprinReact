import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EstadoInsumoModal from './EstadoInsumoModal';

function renderModal(overrides: any = {}) {
  const props = {
    isOpen: true,
    activo: true, // esta activo -> el modal va a inactivar
    tipo: 'insumo' as const,
    etiqueta: '108-01 · Harina Pan',
    unidades: 24,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<EstadoInsumoModal {...props} />) };
}

const MOTIVO_VALIDO = 'Presentación duplicada por error de captura';

describe('EstadoInsumoModal', () => {
  it('no se renderiza cuando está cerrado', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exige un motivo de al menos 10 caracteres para inactivar', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    // Con el motivo vacio el boton de confirmar esta deshabilitado.
    const confirmar = screen.getByRole('button', { name: /Inactivar/i });
    expect(confirmar).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'duplicada');
    expect(confirmar).toBeDisabled();
    expect(screen.getByText(/Mínimo 10 caracteres/i)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), ' otra vez');
    expect(confirmar).toBeEnabled();
    expect(screen.getByText('Queda en la auditoría')).toBeInTheDocument();
  });

  it('entrega el motivo limpio al confirmar', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.type(screen.getByRole('textbox'), `  ${MOTIVO_VALIDO}  `);
    await user.click(screen.getByRole('button', { name: /Inactivar/i }));

    expect(props.onConfirm).toHaveBeenCalledWith(MOTIVO_VALIDO);
  });

  it('advierte que el stock queda retenido y muestra el detalle por presentación', () => {
    renderModal({
      unidades: 24,
      resumenPresentaciones: [
        { nombre: 'Sobre 500g', unidades: 20 },
        { nombre: 'Bolsa 1kg', unidades: 4 },
      ],
    });

    expect(screen.getByText(/24 uds/)).toBeInTheDocument();
    expect(screen.getByText(/quedan retenidas/i)).toBeInTheDocument();
    expect(screen.getByText('Sobre 500g')).toBeInTheDocument();
    expect(screen.getByText('20 uds')).toBeInTheDocument();
  });

  it('no muestra el aviso de retención cuando no hay unidades', () => {
    renderModal({ unidades: 0, resumenPresentaciones: [{ nombre: 'Sobre 500g', unidades: 0 }] });

    expect(screen.queryByText(/quedan retenidas/i)).not.toBeInTheDocument();
    // El motivo sigue siendo obligatorio: inactivar sin stock no es menos grave.
    expect(screen.getByRole('button', { name: /Inactivar/i })).toBeDisabled();
  });

  it('al reactivar el motivo es opcional y el stock queda disponible', async () => {
    const user = userEvent.setup();
    const { props } = renderModal({ activo: false, unidades: 12 });

    expect(screen.getByRole('button', { name: /Reactivar/i })).toBeEnabled();
    expect(screen.getByText(/vuelven a estar disponibles/i)).toBeInTheDocument();
    expect(screen.getByText('Motivo')).toHaveTextContent('opcional');

    await user.click(screen.getByRole('button', { name: /Reactivar/i }));
    expect(props.onConfirm).toHaveBeenCalledWith('');
  });

  it('usa el título de presentación cuando el registro es una variante', () => {
    renderModal({ tipo: 'presentacion', etiqueta: '108-01 · Harina Pan / Sobre 2g (500g)', unidades: 3 });

    expect(screen.getByRole('heading', { name: /Inactivar presentación/i })).toBeInTheDocument();
    expect(screen.getByText('108-01 · Harina Pan / Sobre 2g (500g)')).toBeInTheDocument();
  });

  it('no muestra el desglose de presentaciones cuando el registro es una variante', () => {
    renderModal({ tipo: 'presentacion', unidades: 3, resumenPresentaciones: [{ nombre: 'Otra', unidades: 9 }] });

    expect(screen.queryByText('Otra')).not.toBeInTheDocument();
  });

  it('bloquea la acción mientras guarda', () => {
    renderModal({ cargando: true });

    expect(screen.getByRole('button', { name: /Guardando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
  });

  it('cancela con el botón y con la tecla Escape', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });

  it('limpia el motivo al reabrirse para no enviar el texto anterior', async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderModal();

    await user.type(screen.getByRole('textbox'), MOTIVO_VALIDO);
    expect(screen.getByRole('button', { name: /Inactivar/i })).toBeEnabled();

    // Cerrar y volver a abrir debe dejar el campo limpio.
    rerender(<EstadoInsumoModal {...props} isOpen={false} />);
    rerender(<EstadoInsumoModal {...props} isOpen />);

    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Inactivar/i })).toBeDisabled();
  });
});
