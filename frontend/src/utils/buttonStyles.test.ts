import { describe, it, expect } from 'vitest';
import { btn, iconBtn, TONOS, TAMANOS, TONOS_ICONO } from './buttonStyles';

describe('buttonStyles (fuente única de estilos de botón)', () => {
  it('arma las clases base de todo botón con texto', () => {
    const clases = btn('primario', 'barra');
    expect(clases).toContain('inline-flex');
    expect(clases).toContain('rounded-lg');
    expect(clases).toContain('font-medium');
    expect(clases).toContain('disabled:opacity-60');
    expect(clases).toContain('disabled:cursor-not-allowed');
  });

  it('el color depende de la FUNCIÓN y el padding de la UBICACIÓN', () => {
    expect(btn('exito', 'barra')).toContain(TONOS.exito);
    expect(btn('exito', 'barra')).toContain(TAMANOS.barra);

    // Misma función, otra ubicación: cambia el tamaño, nunca el color.
    expect(btn('exito', 'fila')).toContain(TONOS.exito);
    expect(btn('exito', 'fila')).toContain(TAMANOS.fila);
    expect(TAMANOS.barra).not.toBe(TAMANOS.fila);
  });

  it('usa rose para peligro y emerald para éxito (nunca red ni green)', () => {
    expect(TONOS.peligro).toContain('rose-600');
    expect(TONOS.peligro).not.toContain('red-');
    expect(TONOS.exito).toContain('emerald-600');
    expect(TONOS.exito).not.toContain('green-');
  });

  it('los tonos sólidos llevan sombra; los de texto no', () => {
    expect(btn('primario', 'barra')).toContain('shadow-sm');
    expect(btn('peligro', 'modal')).toContain('shadow-sm');
    expect(btn('fantasma', 'fila')).not.toContain('shadow-sm');
    expect(btn('fantasma', 'fila')).toContain('rounded-lg');
  });

  it('el tamaño de bloque ocupa todo el ancho', () => {
    expect(btn('primario', 'bloque')).toContain('w-full');
    expect(btn('primario', 'barra')).not.toContain('w-full');
  });

  it('todo botón tiene foco visible con anillo', () => {
    for (const tono of Object.keys(TONOS) as (keyof typeof TONOS)[]) {
      if (tono === 'fantasma') continue; // los enlaces no usan anillo de foco
      expect(btn(tono, 'barra')).toContain('focus:ring-2');
    }
  });

  it('iconBtn devuelve clases de solo icono, con hover opcional', () => {
    expect(iconBtn('neutro')).toContain(TONOS_ICONO.neutro);
    expect(iconBtn('neutro')).toContain('p-1');
    expect(iconBtn('marca', 'grande')).toContain('p-2');
    expect(iconBtn('neutro', 'chico')).not.toContain('hover:bg-slate-200');
    expect(iconBtn('neutro', 'chico', true)).toContain('hover:bg-slate-200');
  });
});
