import { useEffect, useState } from 'react';
import { btn, type Tono } from '../utils/buttonStyles';

type TipoEstado = 'insumo' | 'presentacion';

interface EstadoInsumoModalProps {
  isOpen: boolean;
  /** Estado ACTUAL: si es true, el modal va a inactivar. */
  activo: boolean;
  tipo: TipoEstado;
  /** Identifica que se va a cambiar: "108-01 · Harina Pan" o "... / Sobre 2g". */
  etiqueta: string;
  /** Unidades de la presentacion, o la suma del material si es un insumo. */
  unidades: number;
  /** Presentaciones del material, solo para el resumen (opcional). */
  resumenPresentaciones?: { nombre: string; unidades: number }[];
  cargando?: boolean;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}

// El backend exige 10 caracteres (ItemService.validarMotivoInactivacion) y
// audit_logs se lee en pantalla: 300 es suficiente para explicar y evita que
// alguien pegue un párrafo que nadie va a leer.
const MIN_MOTIVO = 10;
const MAX_MOTIVO = 300;

/**
 * Unico modal para inactivar y reactivar. Material y presentación comparten
 * el flujo porque la consecuencia es la misma: el stock queda retenido y no
 * admite movimientos hasta reactivar.
 *
 * Textos cortos a proposito (regla 1 del skill mejora-ux): la explicacion de
 * las consecuencias va en el tooltip del bloque de existencias.
 */
export default function EstadoInsumoModal({
  isOpen,
  activo,
  tipo,
  etiqueta,
  unidades,
  resumenPresentaciones,
  cargando = false,
  onConfirm,
  onCancel,
}: EstadoInsumoModalProps) {
  const [motivo, setMotivo] = useState('');

  // Limpiar el motivo en cada apertura evita enviar el texto del registro
  // anterior, que es la forma mas comun de escribir el motivo equivocado.
  useEffect(() => {
    if (isOpen) setMotivo('');
  }, [isOpen, tipo, etiqueta]);

  useEffect(() => {
    if (!isOpen) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !cargando) onCancel();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [isOpen, cargando, onCancel]);

  if (!isOpen) return null;

  const inactivando = activo;
  const esPresentacion = tipo === 'presentacion';
  const sinStock = unidades <= 0;
  const motivoLimpio = motivo.trim();
  const motivoValido = inactivando ? motivoLimpio.length >= MIN_MOTIVO : true;
  const puedeConfirmar = motivoValido && !cargando;

  const paleta = inactivando
    ? { tono: 'peligro' as Tono, icono: 'bg-rose-100 text-rose-600', accion: 'Inactivar' }
    : { tono: 'exito' as Tono, icono: 'bg-emerald-100 text-emerald-600', accion: 'Reactivar' };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="estado-modal-titulo"
      >
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${paleta.icono}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 id="estado-modal-titulo" className="text-lg font-bold text-slate-800">
              {inactivando ? 'Inactivar' : 'Reactivar'} {esPresentacion ? 'presentación' : 'insumo'}
            </h3>
            <p className="text-slate-500 text-sm mt-1 truncate" title={etiqueta}>{etiqueta}</p>
          </div>
        </div>

        {/* Consecuencia real de la accion. Sin stock no hay nada que retener,
            asi que el aviso solo aparece cuando existe: un modal limpio. */}
        {(inactivando ? !sinStock : true) && (
          <div className="px-6 pb-4">
            <div
              className={`rounded-xl border p-3 text-sm flex items-center justify-between gap-3 ${
                inactivando ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
              }`}
              title={
                inactivando
                  ? 'Al inactivar, el stock queda retenido: no admite entradas ni salidas hasta que alguien con permiso reactive el registro. No se pierde ni se elimina.'
                  : 'Al reactivar, el stock vuelve a estar disponible para movimientos.'
              }
            >
              <span className="text-slate-600">
                {inactivando ? (
                  <>
                    <span className="font-semibold text-slate-800">{unidades} uds</span> quedan retenidas
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800">{unidades} uds</span> vuelven a estar disponibles
                  </>
                )}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 ${inactivando ? 'text-amber-600' : 'text-emerald-600'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                title={inactivando ? 'Stock retenido' : 'Stock disponible'}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {esPresentacion === false && resumenPresentaciones && resumenPresentaciones.length > 0 && (
              <ul className="mt-2 space-y-1">
                {resumenPresentaciones.map((p) => (
                  <li key={p.nombre} className="flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate">{p.nombre}</span>
                    <span className="font-medium text-slate-600">{p.unidades} uds</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="px-6 pb-6">
          <label htmlFor="estado-modal-motivo" className="block text-sm font-medium text-slate-700">
            Motivo {inactivando ? <span className="text-rose-600">*</span> : <span className="text-slate-400 text-xs font-normal">(opcional)</span>}
          </label>
          <textarea
            id="estado-modal-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={MAX_MOTIVO}
            rows={3}
            autoFocus
            placeholder={inactivando ? 'Ej. Presentación duplicada por error de captura' : 'Ej. Reincorporado al catálogo'}
            title={
              inactivando
                ? 'Queda escrito en la auditoría. Describe qué pasó y por qué se inactiva.'
                : 'Queda escrito en la auditoría.'
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-none"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={motivoValido ? 'text-slate-400' : 'text-rose-600'}>
              {motivoValido ? 'Queda en la auditoría' : `Mínimo ${MIN_MOTIVO} caracteres`}
            </span>
            <span className="text-slate-400">
              {motivo.length}/{MAX_MOTIVO}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={cargando} className={`${btn('contorno', 'modal')} flex-1`}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivoLimpio)}
            disabled={!puedeConfirmar}
            className={`${btn(paleta.tono, 'modal')} flex-1`}
          >
            {cargando ? 'Guardando...' : paleta.accion}
          </button>
        </div>
      </div>
    </div>
  );
}
