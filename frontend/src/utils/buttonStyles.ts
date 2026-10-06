// ============================================================
// ESTILOS DE BOTON — UNICA FUENTE DE VERDAD
// ============================================================
// Si necesitas cambiar el aspecto de un boton en TODA la app,
// edita SOLO este archivo. Ningun .tsx debe escribir clases de
// boton a mano: se importan de aqui.
//
//   import { btn, iconBtn } from '../utils/buttonStyles'
//   <button className={btn('success', 'toolbar')}>Exportar Excel</button>
//
// El color se elige por la FUNCION del boton (no por el modulo donde
// vive) y el tamano por su UBICACION. Ver AGENTS.md seccion 5.1.
// ============================================================

// Piezas comunes a todos los botones con texto.
const LAYOUT = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors';

// Botones solidos: llevan sombra y anillo de foco del color del tono.
const SOLIDO = 'shadow-sm disabled:opacity-60 disabled:cursor-not-allowed';

// Botones sin fondo (enlaces, acciones de fila): sin sombra ni anillo.
const FLACO = 'disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Colores por FUNCION. No agregar tonos nuevos sin una regla de
 * negocio que los justifique: la app tiene 8 y es suficiente.
 */
export const TONOS = {
  // La accion mas importante de la pantalla: crear, guardar, confirmar.
  primario: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-2 focus:ring-brand-500/50',
  // Exito y exportar a Excel. Tambien la confirmacion de una ENTRADA.
  exito: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500/50',
  // Peligro, exportar a PDF y la confirmacion de una SALIDA.
  peligro: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-2 focus:ring-rose-500/50',
  // Advertencia y ajustes de stock.
  aviso: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500/50',
  // Accion disponible pero no principal: buscar, limpiar, cancelar.
  neutro: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-500/50',
  // Igual que neutro pero con borde: variante "outline".
  contorno: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-2 focus:ring-slate-500/50',
  // Accion oscura de énfasis medio (registrar movimiento, imprimir).
  oscuro: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-2 focus:ring-slate-500/50',
  // Solo texto: enlaces y acciones dentro de una fila de tabla.
  fantasma: 'text-brand-600 hover:bg-brand-50',
} as const;

/**
 * Tamano por UBICACION, no por modulo.
 */
export const TAMANOS = {
  // Barra de acciones de la pagina.
  barra: 'px-5 py-2.5',
  // Pie de modal (mismo padding que la barra: la accion debe pesar igual).
  modal: 'px-5 py-2.5',
  // Boton de bloque completo (dentro de un modal, ocupa todo el ancho).
  bloque: 'w-full px-5 py-2.5',
  // Accion dentro de una fila de tabla.
  fila: 'px-3 py-1.5 text-xs',
  // Accion inline ligera junto a un texto.
  inline: 'px-2 py-1 text-xs',
  // Boton de pantalla completa (login).
  pantalla: 'w-full py-3',
} as const;

export type Tono = keyof typeof TONOS;
export type Tamano = keyof typeof TAMANOS;

/** Los tonos solidos llevan sombra y los de texto no. */
const conSombra: ReadonlySet<Tono> = new Set<Tono>([
  'primario',
  'exito',
  'peligro',
  'aviso',
  'neutro',
  'contorno',
  'oscuro',
]);

/**
 * Classes de un boton con texto.
 *
 * @param tono  Funcion del boton (ver TONOS).
 * @param tamano Ubicacion del boton (ver TAMANOS).
 *
 * @example
 * btn('exito', 'barra')     // Exportar Excel
 * btn('peligro', 'modal')   // Eliminar
 * btn('fantasma', 'fila')   // Editar, en una fila de tabla
 */
export function btn(tono: Tono, tamano: Tamano = 'barra'): string {
  const base = conSombra.has(tono) ? `${LAYOUT} ${SOLIDO}` : `${LAYOUT} ${FLACO}`;
  return `${base} ${TONOS[tono]} ${TAMANOS[tamano]}`;
}

/** Tonos para botones de SOLO ICONO (cerrar, lapiz, ojo). */
export const TONOS_ICONO = {
  neutro: 'text-slate-400 hover:text-slate-600',
  marca: 'text-slate-400 hover:text-brand-600',
} as const;

/** Tamano para botones de SOLO ICONO. */
export const TAMANOS_ICONO = {
  chico: 'p-1',
  mediano: 'p-1.5',
  grande: 'p-2',
} as const;

export type TonoIcono = keyof typeof TONOS_ICONO;
export type TamanoIcono = keyof typeof TAMANOS_ICONO;

/**
 * Classes de un boton de solo icono. Obligatorio acompañarlo de `title`
 * (regla 3 de AGENTS.md), por eso los tipos lo exigen.
 *
 * @example
 * <button className={iconBtn('neutro')} title="Cerrar" aria-label="Cerrar">
 */
export function iconBtn(
  tono: TonoIcono = 'neutro',
  tamano: TamanoIcono = 'chico',
  fondoAlHover = false
): string {
  const hover = fondoAlHover ? ' hover:bg-slate-200 rounded-lg transition-colors' : ' transition-colors';
  return `${TONOS_ICONO[tono]}${hover} ${TAMANOS_ICONO[tamano]}`;
}
