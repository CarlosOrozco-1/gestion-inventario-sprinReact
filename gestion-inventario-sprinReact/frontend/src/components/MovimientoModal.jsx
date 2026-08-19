import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmActionModal from './ConfirmActionModal';
import ResponseModal from './ResponseModal';

export default function MovimientoModal({ isOpen, onClose, insumo, onSuccess }) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [response, setResponse] = useState(null);
  const [pendingOp, setPendingOp] = useState(null);

  if (!isOpen || !insumo) return null;

  const rawRol = typeof user?.rol === 'object' ? user?.rol?.nombre : user?.rol;
  const userRol = (rawRol || 'ADMIN').toString().toUpperCase().trim();
  const isAuxiliar = userRol === 'AUXILIAR';

  const stockActual = insumo.stock ?? 0;
  const cantNum = parseInt(cantidad, 10) || 0;

  const getOperacionInfo = (opType) => {
    switch (opType) {
      case 'ENTRADA':
        return {
          minChars: 10,
          label: 'ENTRADA (Ingreso / Compra)',
          shortLabel: 'Entrada',
          icon: '🟩',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.35)',
          isPositive: true,
          desc: 'Aumenta el inventario disponible. Ingrese número de factura, orden de compra, remisión o proveedor.',
          placeholder: 'Ej. Compra realizada a Farmacéutica Central según Factura #F-45892...'
        };
      case 'SALIDA':
        return {
          minChars: 10,
          label: 'SALIDA (Despacho / Consumo)',
          shortLabel: 'Salida',
          icon: '🟥',
          color: '#f43f5e',
          bg: 'rgba(244, 63, 94, 0.12)',
          border: 'rgba(244, 63, 94, 0.35)',
          isPositive: false,
          desc: 'Disminuye el inventario disponible. Indique departamento, área o responsable del despacho.',
          placeholder: 'Ej. Despacho a Área de Urgencias para atención de turno vespertino...'
        };
      case 'REGULARIZACION_POSITIVA':
        return {
          minChars: 20,
          label: 'REGULARIZACIÓN (+) (Sobrante en Conteo)',
          shortLabel: 'Regularización (+)',
          icon: '⚙️',
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.35)',
          isPositive: true,
          desc: 'Aumenta el stock por sobrante detectado en auditoría física de almacén.',
          placeholder: 'Ej. Conteo físico de auditoría mensual realizado el 12/08 encontró 15 unidades sobrantes no registradas...'
        };
      case 'REGULARIZACION_NEGATIVA':
        return {
          minChars: 20,
          label: 'REGULARIZACIÓN (-) (Faltante / Merma)',
          shortLabel: 'Regularización (-)',
          icon: '⚙️',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          isPositive: false,
          desc: 'Disminuye el stock por roturas, averías o mermas detectadas en auditoría.',
          placeholder: 'Ej. Auditoría de inventario físico detectó rotura/vencimiento de empaque en almacén general...'
        };
      case 'CORRECCION_POSITIVA':
        return {
          minChars: 15,
          label: 'CORRECCIÓN (+) (Error de Digitación)',
          shortLabel: 'Corrección (+)',
          icon: '🛠️',
          color: '#a855f7',
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.35)',
          isPositive: true,
          desc: 'Rectificación de error tipográfico previo cuando se ingresó una cantidad menor.',
          placeholder: 'Ej. Rectificación de digitación previa del usuario: se ingresó 5 por error en lugar de 25...'
        };
      case 'CORRECCION_NEGATIVA':
        return {
          minChars: 15,
          label: 'CORRECCIÓN (-) (Error de Digitación)',
          shortLabel: 'Corrección (-)',
          icon: '🛠️',
          color: '#ec4899',
          bg: 'rgba(236, 72, 153, 0.12)',
          border: 'rgba(236, 72, 153, 0.35)',
          isPositive: false,
          desc: 'Rectificación administrativa cuando previamente se ingresó una cantidad mayor.',
          placeholder: 'Ej. Rectificación administrativa: error de digitación previo en registro de entrada del 10/08...'
        };
      default:
        return {
          minChars: 10,
          label: opType,
          shortLabel: opType,
          icon: '📝',
          color: '#60a5fa',
          bg: 'rgba(96, 165, 250, 0.12)',
          border: 'rgba(96, 165, 250, 0.35)',
          isPositive: true,
          desc: 'Operación de inventario.',
          placeholder: 'Escriba la justificación obligatoria...'
        };
    }
  };

  const currentOp = getOperacionInfo(tipo);

  // Proyección de stock
  const esAumento = currentOp.isPositive;
  const nuevoStockProyectado = esAumento ? stockActual + cantNum : stockActual - cantNum;
  const esStockInsuficiente = !esAumento && cantNum > stockActual;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cantNum <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    if (!detalle || detalle.trim().length < currentOp.minChars) {
      setError(`La justificación requiere al menos ${currentOp.minChars} caracteres obligatorios.`);
      return;
    }

    if (esStockInsuficiente) {
      setError(`Stock insuficiente. Solicitado: ${cantNum} u., Disponible: ${stockActual} u.`);
      return;
    }

    setPendingOp({
      cantNum,
      stockAnterior: stockActual,
      nuevoStock: nuevoStockProyectado
    });
    setConfirmOpen(true);
  };

  const handleConfirmOperation = async () => {
    if (!pendingOp) return;
    setConfirming(true);

    try {
      await API.post('/movimientos', {
        insumoId: insumo.id,
        tipo: tipo,
        usuarioId: parseInt(user?.id, 10) || 1,
        cantidad: pendingOp.cantNum,
        detalle: detalle.trim()
      });

      setConfirmOpen(false);
      setResponse({
        type: 'success',
        title: 'Movimiento Registrado',
        message: `La operación ${currentOp.label.split(' (')[0]} se guardó exitosamente en el sistema.`,
        details: [
          { label: 'Insumo', value: `${insumo.numero} - ${insumo.insumo}` },
          { label: 'Operación', value: currentOp.label.split(' (')[0] },
          { label: 'Cantidad', value: `${pendingOp.cantNum} unidades` },
          { label: 'Stock Anterior', value: pendingOp.stockAnterior },
          { label: 'Stock Nuevo', value: pendingOp.nuevoStock }
        ]
      });
    } catch (err) {
      setConfirmOpen(false);
      setResponse({
        type: 'error',
        title: 'Error al Registrar el Movimiento',
        message: err.response?.data?.message || 'No se pudo procesar el movimiento en la base de datos.'
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleResponseClose = () => {
    if (response?.type === 'success') {
      onSuccess();
      onClose();
    }
    setResponse(null);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <style>{`
        @keyframes movModalLandscapeIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .mov-land-close:hover {
          background: rgba(244, 63, 94, 0.18) !important;
          border-color: rgba(244, 63, 94, 0.45) !important;
          color: #f87171 !important;
          transform: rotate(90deg);
        }
        .mov-input-qty:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
        }
        @media (max-width: 960px) {
          .mov-horizontal-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>

      <div
        className="modal-content"
        style={{
          maxWidth: '1080px',
          width: '95vw',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '36px 44px',
          borderRadius: '28px',
          background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.98), rgba(9, 14, 28, 0.99))',
          border: '1px solid rgba(59, 130, 246, 0.32)',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8), 0 0 70px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          animation: 'movModalLandscapeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* ── Encabezado Superior Amplio y Elegante ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25))',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem'
            }}>
              ⚡
            </div>
            <div>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Registrar Movimiento / Ajuste de Inventario
              </h2>
              <span style={{ fontSize: '0.88rem', color: 'rgba(148, 163, 184, 0.85)', marginTop: '2px', display: 'block' }}>
                Actualización instantánea y registro auditable de existencias
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mov-land-close"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              borderRadius: '14px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.45)',
            color: '#f87171',
            padding: '12px 18px',
            borderRadius: '14px',
            fontSize: '0.88rem',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Grid Horizontal Principal Más Grande y Espacioso ── */}
        <div className="mov-horizontal-grid" style={{ display: 'grid', gridTemplateColumns: '1.02fr 1.18fr', gap: '34px', alignItems: 'start' }}>
          
          {/* ════ COLUMNA IZQUIERDA: Información del Insumo y Simulación ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tarjeta de Identidad del Insumo */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.65), rgba(15, 23, 42, 0.85))',
              border: '1px solid rgba(59, 130, 246, 0.28)',
              borderRadius: '20px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    padding: '4px 12px',
                    borderRadius: '10px',
                    letterSpacing: '0.04em'
                  }}>
                    CÓDIGO #{insumo.numero || insumo.id}
                  </span>

                  {insumo.codigoQr && (
                    <span style={{
                      fontSize: '0.74rem',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.28)',
                      padding: '3px 10px',
                      borderRadius: '8px'
                    }}>
                      📷 {insumo.codigoQr}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0', lineHeight: 1.25 }}>
                  {insumo.insumo}
                </h3>
              </div>

              {/* Atributos en Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.035)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Presentación</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: '#e2e8f0', marginTop: '3px' }}>{insumo.presentacion || 'N/A'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.035)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tamaño</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: '#e2e8f0', marginTop: '3px' }}>{insumo.tamanoPresentacion || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Simulación de Stock Proyectado */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: `1px solid ${esStockInsuficiente ? 'rgba(244, 63, 94, 0.55)' : 'rgba(59, 130, 246, 0.35)'}`,
              borderRadius: '20px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148, 163, 184, 0.75)' }}>
                📊 Proyección de Existencias
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                {/* Stock Actual */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stock Actual</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: stockActual > 0 ? '#38bdf8' : '#f87171', lineHeight: 1.1, marginTop: '2px' }}>
                    {stockActual} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>u.</span>
                  </div>
                </div>

                {/* Badge Operador */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    background: currentOp.bg,
                    color: currentOp.color,
                    border: `1px solid ${currentOp.border}`,
                    padding: '6px 14px',
                    borderRadius: '22px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {esAumento ? '+' : '-'} {cantNum}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '3px' }}>➔</div>
                </div>

                {/* Stock Resultante */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stock Resultante</div>
                  <div style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: esStockInsuficiente ? '#f43f5e' : (nuevoStockProyectado > 0 ? '#10b981' : '#f87171'),
                    lineHeight: 1.1,
                    marginTop: '2px'
                  }}>
                    {nuevoStockProyectado} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>u.</span>
                  </div>
                </div>
              </div>

              {/* Banner Guía de la Operación */}
              <div style={{
                background: currentOp.bg,
                border: `1px solid ${currentOp.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: '1.45'
              }}>
                <strong style={{ color: currentOp.color, display: 'block', marginBottom: '3px', fontSize: '0.86rem' }}>
                  {currentOp.icon} {currentOp.label}
                </strong>
                {currentOp.desc}
              </div>
            </div>

          </div>

          {/* ════ COLUMNA DERECHA: Formulario de Operación ════ */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tipo de Operación */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
                Tipo de Operación
              </label>
              <select
                className="select-field"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: `1px solid ${currentOp.border}`,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  height: '48px'
                }}
              >
                <option value="ENTRADA">🟩 ENTRADA (Ingreso por compra / proveedor)</option>
                <option value="SALIDA">🟥 SALIDA (Despacho / Consumo en áreas)</option>
                {!isAuxiliar && (
                  <option value="REGULARIZACION_POSITIVA">⚙️ REGULARIZACIÓN (+) (Sobrante en Auditoría)</option>
                )}
                {!isAuxiliar && (
                  <option value="REGULARIZACION_NEGATIVA">⚙️ REGULARIZACIÓN (-) (Faltante / Merma en Auditoría)</option>
                )}
                {!isAuxiliar && (
                  <option value="CORRECCION_POSITIVA">🛠️ CORRECCIÓN (+) (Aumento por Error de Digitación)</option>
                )}
                {!isAuxiliar && (
                  <option value="CORRECCION_NEGATIVA">🛠️ CORRECCIÓN (-) (Disminución por Error de Digitación)</option>
                )}
              </select>
            </div>

            {/* Cantidad de Unidades con Controles */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
                Cantidad de Unidades
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '48px', height: '48px', fontSize: '1.3rem', fontWeight: 800, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }}
                  onClick={() => setCantidad(Math.max(1, cantNum - 1))}
                >
                  -
                </button>

                <input
                  type="number"
                  min="1"
                  className="input-field mov-input-qty"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                  style={{
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#fff'
                  }}
                />

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '48px', height: '48px', fontSize: '1.3rem', fontWeight: 800, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }}
                  onClick={() => setCantidad(cantNum + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Justificación Obligatoria */}
            <div className="input-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Justificación / Motivo Obligatorio
                </label>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: detalle.trim().length >= currentOp.minChars ? '#34d399' : '#f43f5e',
                  background: detalle.trim().length >= currentOp.minChars ? 'rgba(52, 211, 153, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '12px'
                }}>
                  {detalle.trim().length >= currentOp.minChars ? '✓ Válido' : `Mín. ${currentOp.minChars} car.`} ({detalle.trim().length}/{currentOp.minChars})
                </span>
              </div>

              <textarea
                className="textarea-field"
                rows="4"
                placeholder={currentOp.placeholder}
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                required
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: `1px solid ${detalle.trim().length >= currentOp.minChars ? 'rgba(52, 211, 153, 0.45)' : 'rgba(255, 255, 255, 0.14)'}`,
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: '1.45',
                  resize: 'none'
                }}
              />
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '12px 22px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 600 }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn"
                disabled={confirming || esStockInsuficiente}
                style={{
                  padding: '12px 28px',
                  borderRadius: '14px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  background: esStockInsuficiente ? 'rgba(100, 116, 139, 0.4)' : 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#fff',
                  border: 'none',
                  cursor: (confirming || esStockInsuficiente) ? 'not-allowed' : 'pointer',
                  boxShadow: esStockInsuficiente ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {confirming ? '⏳ Procesando...' : '✓ Confirmar Operación'}
              </button>
            </div>

          </form>

        </div>

      </div>

      <ConfirmActionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmOperation}
        loading={confirming}
        title="Confirmar Movimiento de Inventario"
        icon="🔍"
        message="¿Está seguro de que desea realizar este movimiento? Revise el detalle antes de confirmar."
        details={pendingOp ? [
          { label: 'Insumo', value: `${insumo.numero} - ${insumo.insumo}` },
          { label: 'Presentación', value: insumo.presentacion },
          { label: 'Operación', value: currentOp.label },
          { label: 'Cantidad', value: `${pendingOp.cantNum} unidades` },
          { label: 'Stock Actual', value: pendingOp.stockAnterior },
          { label: 'Stock Resultante', value: pendingOp.nuevoStock }
        ] : []}
        confirmLabel="Sí, Confirmar Movimiento"
      />

      <ResponseModal
        isOpen={!!response}
        type={response?.type || 'success'}
        title={response?.title || ''}
        message={response?.message || ''}
        details={response?.details || []}
        onClose={handleResponseClose}
      />
    </div>
  );
}
