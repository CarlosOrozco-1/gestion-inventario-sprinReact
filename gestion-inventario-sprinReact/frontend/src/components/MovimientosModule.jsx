export default function MovimientosModule({ user, onOpenOperacion, onOpenScanner }) {
  const rawRol = typeof user?.rol === 'object' ? user?.rol?.nombre : user?.rol;
  const rol = (rawRol || 'ADMIN').toString().toUpperCase().trim();
  const canAjustes = rol === 'ADMIN' || rol === 'JEFE';

  const operaciones = [
    {
      tipo: 'ENTRADA',
      icon: '📥',
      label: 'ENTRADA',
      color: 'var(--accent-emerald)',
      tooltip: 'Incrementa el stock disponible. Registro de compras a proveedores, entregas o donaciones recibidas.',
      enabled: true
    },
    {
      tipo: 'SALIDA',
      icon: '📤',
      label: 'SALIDA',
      color: 'var(--accent-rose)',
      tooltip: 'Reduce el stock. Despacho a departamentos, consumo diario o áreas hospitalarias. Requiere stock disponible.',
      enabled: true
    },
    {
      tipo: 'REGULARIZACION_POSITIVA',
      icon: '⚙️',
      label: 'REGULARIZACIÓN (+ / -)',
      color: 'var(--accent-amber)',
      tooltip: 'Ajuste derivado de un conteo físico o auditoría de almacén por mermas, productos vencidos o sobrantes no contabilizados. Requiere informe justificativo (min 20 caracteres).',
      enabled: canAjustes
    },
    {
      tipo: 'CORRECCION_POSITIVA',
      icon: '🛠️',
      label: 'CORRECCIÓN (+ / -)',
      color: 'var(--accent-cyan)',
      tooltip: 'Rectificación administrativa por error de digitación en una transacción previa (ej. digitó 100 en lugar de 10). Requiere justificación previa (min 15 caracteres).',
      enabled: canAjustes
    }
  ];

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔄</span> Módulo de Movimientos y Ajustes de Stock
        </h1>
      </div>

      {/* Tarjeta para registrar movimiento directo mediante QR (opción rápida) */}
      <div className="glass-card sharp-border-accent" style={{ padding: '28px', marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          ⚡ Registrar Movimiento Rápido
        </h2>

        <div>
          <button
            onClick={onOpenScanner}
            className="btn btn-primary"
            data-tooltip="Escaneá el código QR del insumo con la cámara, foto o lector USB para abrir instantáneamente su formulario de operaciones."
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

      {/* Selección del Tipo de Operación */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Elegir Tipo de Operación</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
        {operaciones.map((op) => (
          <div
            key={op.tipo}
            className="glass-card sharp-border module-shortcut"
            data-tooltip={op.tooltip}
            role={op.enabled ? 'button' : undefined}
            tabIndex={op.enabled ? 0 : undefined}
            onClick={op.enabled ? () => onOpenOperacion(op.tipo) : undefined}
            onKeyDown={
              op.enabled
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenOperacion(op.tipo);
                    }
                  }
                : undefined
            }
            style={op.enabled ? { cursor: 'pointer' } : { cursor: 'default', opacity: 0.55 }}
          >
            <div className="module-shortcut-icon">{op.icon}</div>
            <h3 className="module-shortcut-title" style={{ color: op.color }}>{op.label}</h3>
          </div>
        ))}
      </div>

      {!canAjustes && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '14px' }}>
          🔒 Las operaciones de Regularización y Corrección requieren rol de Administrador o Jefe.
        </p>
      )}
    </div>
  );
}
