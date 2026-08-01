import React, { useState } from 'react';

export default function MovimientosModule({ insumos, onOpenMovimientoModal }) {
  const [selectedId, setSelectedId] = useState('');

  const selectedInsumo = insumos.find((i) => i.id.toString() === selectedId.toString());

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔄</span> Módulo de Movimientos de Stock
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
          Registro estricto de Entradas, Salidas, Ajustes y Correcciones de Inventario
        </p>
      </div>

      {/* Tarjeta para registrar movimiento directo */}
      <div className="glass-card sharp-border-accent" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚡ Registrar Movimiento Rápido
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Seleccionar Insumo del Catálogo</label>
            <select
              className="select-field sharp-border"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">-- Seleccionar un artículo --</option>
              {insumos.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.numero} - {item.insumo} ({item.presentacion}) | Stock: {item.stock}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (selectedInsumo) {
                onOpenMovimientoModal(selectedInsumo);
              }
            }}
            disabled={!selectedInsumo}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            📝 Abrir Formulario de Movimiento
          </button>
        </div>
      </div>

      {/* Guía Informativa de Tipos de Movimientos */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Tipos de Operaciones Soportadas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📥</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px' }}>ENTRADA</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Incrementa el stock disponible. Registro de compras o entregas del proveedor.
          </p>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📤</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px' }}>SALIDA</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Reduce el stock. Despacho a departamentos o consumo diario. Requiere stock suficiente.
          </p>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>⚙️</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '6px' }}>AJUSTE</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Regularización por conteo físico o diferencias de auditoría periódica.
          </p>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🛠️</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>CORRECCIÓN</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Rectificación administrativa por error de digitación previo.
          </p>
        </div>
      </div>
    </div>
  );
}
