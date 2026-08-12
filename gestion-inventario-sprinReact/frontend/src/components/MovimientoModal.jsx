import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { registrarBitacora } from '../services/bitacoraService';

export default function MovimientoModal({ isOpen, onClose, insumo, onSuccess }) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [detalle, setDetalle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !insumo) return null;

  const rawRol = typeof user?.rol === 'object' ? user?.rol?.nombre : user?.rol;
  const userRol = (rawRol || 'ADMIN').toString().toUpperCase().trim();
  const isAuxiliar = userRol === 'AUXILIAR';

  const getOperacionInfo = (opType) => {
    switch (opType) {
      case 'ENTRADA':
        return {
          minChars: 10,
          label: 'ENTRADA (Ingreso por compra / proveedor)',
          icon: '🟩',
          desc: 'Aumenta el stock. Ingrese el número de factura, orden de compra o proveedor.',
          placeholder: 'Ej. Compra realizada a Farmacéutica Central según Factura #F-45892...'
        };
      case 'SALIDA':
        return {
          minChars: 10,
          label: 'SALIDA (Despacho / Consumo de áreas)',
          icon: '🟥',
          desc: 'Disminuye el stock. Indique la unidad, departamento o paciente receptor.',
          placeholder: 'Ej. Despacho a Área de Urgencias para atención de turno vespertino...'
        };
      case 'REGULARIZACION_POSITIVA':
        return {
          minChars: 20,
          label: 'REGULARIZACIÓN (+) (Sobrante por Conteo Físico / Auditoría)',
          icon: '⚙️',
          desc: 'Aumenta el stock tras un conteo físico o auditoría donde se encontraron insumos no contabilizados.',
          placeholder: 'Ej. Conteo físico de auditoría mensual realizado el 12/08 encontró 15 unidades sobrantes no registradas...'
        };
      case 'REGULARIZACION_NEGATIVA':
        return {
          minChars: 20,
          label: 'REGULARIZACIÓN (-) (Faltante / Merma en Conteo Físico / Auditoría)',
          icon: '⚙️',
          desc: 'Disminuye el stock tras un conteo físico o auditoría por mermas, productos dañados o vencidos.',
          placeholder: 'Ej. Auditoría de inventario físico detectó rotura/vencimiento de empaque en almacén general...'
        };
      case 'CORRECCION_POSITIVA':
        return {
          minChars: 15,
          label: 'CORRECCIÓN (+) (Rectificación por Error de Digitación)',
          icon: '🛠️',
          desc: 'Rectificación administrativa cuando previamente se ingresó una cantidad menor por error tipográfico.',
          placeholder: 'Ej. Rectificación de digitación previa del usuario: se ingresó 5 por error en lugar de 25...'
        };
      case 'CORRECCION_NEGATIVA':
        return {
          minChars: 15,
          label: 'CORRECCIÓN (-) (Rectificación por Error de Digitación)',
          icon: '🛠️',
          desc: 'Rectificación administrativa cuando previamente se ingresó una cantidad mayor por error tipográfico.',
          placeholder: 'Ej. Rectificación administrativa: error de digitación previo en registro de entrada del 10/08...'
        };
      default:
        return {
          minChars: 10,
          label: opType,
          icon: '📝',
          desc: 'Operación de inventario.',
          placeholder: 'Escriba la justificación obligatoria...'
        };
    }
  };

  const currentOp = getOperacionInfo(tipo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!detalle || detalle.trim().length < currentOp.minChars) {
      setError(`La justificación es obligatoria para ${tipo} y requiere al menos ${currentOp.minChars} caracteres.`);
      setLoading(false);
      return;
    }

    const cantNum = parseInt(cantidad, 10);
    const stockAnterior = insumo.stock ?? 0;
    let nuevoStock = stockAnterior;

    const esAumento = tipo === 'ENTRADA' || tipo === 'REGULARIZACION_POSITIVA' || tipo === 'CORRECCION_POSITIVA' || tipo === 'AJUSTE_POSITIVO';

    if (esAumento) {
      nuevoStock = stockAnterior + cantNum;
    } else {
      if (cantNum > stockAnterior) {
        setError(`Stock insuficiente en la base de datos. Solicitado: ${cantNum}, Disponible: ${stockAnterior}`);
        setLoading(false);
        return;
      }
      nuevoStock = stockAnterior - cantNum;
    }

    try {
      await API.post('/movimientos', {
        insumoId: insumo.id,
        tipo: tipo,
        usuarioId: parseInt(user?.id, 10) || 1,
        cantidad: cantNum,
        detalle: detalle
      });

      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar el movimiento en la base de datos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>📝 Movimiento / Ajuste de Inventario</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Insumo: <strong style={{ color: '#fff' }}>{insumo.insumo}</strong> | Stock Actual: <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{insumo.stock ?? 0}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tipo de Movimiento */}
          <div className="input-group">
            <label className="input-label">Tipo de Operación de Inventario</label>
            <select 
              className="select-field" 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              style={{ background: 'rgba(17, 24, 39, 0.95)', color: '#fff', fontWeight: 600 }}
            >
              <option value="ENTRADA">🟩 ENTRADA (Ingreso por compra / proveedor)</option>
              <option value="SALIDA">🟥 SALIDA (Despacho / Consumo en áreas)</option>
              {!isAuxiliar && (
                <option value="REGULARIZACION_POSITIVA">⚙️ REGULARIZACIÓN (+) (Sobrante en Conteo Físico / Auditoría)</option>
              )}
              {!isAuxiliar && (
                <option value="REGULARIZACION_NEGATIVA">⚙️ REGULARIZACIÓN (-) (Faltante / Merma en Conteo Físico / Auditoría)</option>
              )}
              {!isAuxiliar && (
                <option value="CORRECCION_POSITIVA">🛠️ CORRECCIÓN (+) (Aumento por Error de Digitación)</option>
              )}
              {!isAuxiliar && (
                <option value="CORRECCION_NEGATIVA">🛠️ CORRECCIÓN (-) (Disminución por Error de Digitación)</option>
              )}
            </select>
          </div>

          {/* Banner Informativo Dinámico */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '18px',
            fontSize: '0.82rem',
            lineHeight: '1.45',
            color: 'var(--text-main)'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{currentOp.icon}</span> {currentOp.label}
            </div>
            <div>{currentOp.desc}</div>
          </div>

          {/* Cantidad */}
          <div className="input-group">
            <label className="input-label">Cantidad de Unidades</label>
            <input 
              type="number" 
              min="1" 
              className="input-field" 
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required 
            />
          </div>

          {/* Justificación Obligatoria */}
          <div className="input-group">
            <label className="input-label">
              Justificación / Motivo Obligatorio <span style={{ color: '#f43f5e' }}>*(Mínimo {currentOp.minChars} caracteres)</span>
            </label>
            <textarea 
              className="textarea-field" 
              rows="3"
              placeholder={currentOp.placeholder}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: detalle.trim().length >= currentOp.minChars ? '#10b981' : '#f43f5e' }}>
              {detalle.trim().length} / {currentOp.minChars} caracteres mínimos obligatorios
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-emerald" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Operación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
