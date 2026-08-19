export default function MovimientosModule({ insumos: _insumos, onOpenMovimientoModal: _onOpenMovimientoModal, onOpenScanner }) {
  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔄</span> Módulo de Movimientos y Ajustes de Stock
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
          Registro de Entradas, Salidas, Regularización por Conteo Físico y Corrección de Digitación
        </p>
      </div>

      {/* Tarjeta para registrar movimiento directo mediante QR */}
      <div className="glass-card sharp-border-accent" style={{ padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          ⚡ Registrar Movimiento Rápido
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Escaneá el código QR del insumo con la cámara, foto o lector USB para abrir instantáneamente su formulario de operaciones.
        </p>
        
        <div>
          <button
            onClick={onOpenScanner}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>📷</span> Escanear Código QR
          </button>
        </div>
      </div>

      {/* Guía Informativa de Tipos de Movimientos */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Definición de Operaciones de Inventario</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📥</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px' }}>ENTRADA</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Incrementa el stock disponible. Registro de compras a proveedores, entregas o donaciones recibidas.
          </p>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📤</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px' }}>SALIDA</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Reduce el stock. Despacho a departamentos, consumo diario o áreas hospitalarias. Requiere stock disponible.
          </p>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>⚙️</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '6px' }}>REGULARIZACIÓN (+ / -)</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Ajuste derivado de un conteo físico o auditoría de almacén por mermas, productos vencidos o sobrantes no contabilizados. Requiere informe justificativo (min 20 caracteres).
          </p>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🛠️</div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>CORRECCIÓN (+ / -)</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Rectificación administrativa por error de digitación en una transacción previa (ej. digitó 100 en lugar de 10). Requiere justificación previa (min 15 caracteres).
          </p>
        </div>
      </div>
    </div>
  );
}
