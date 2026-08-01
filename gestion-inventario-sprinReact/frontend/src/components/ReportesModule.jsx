import React from 'react';

export default function ReportesModule({ insumos }) {
  const totalInsumos = insumos.length;
  const insumosDisponibles = insumos.filter((i) => (i.stock ?? 0) > 10);
  const insumosBajos = insumos.filter((i) => (i.stock ?? 0) > 0 && (i.stock ?? 0) <= 10);
  const insumosAgotados = insumos.filter((i) => (i.stock ?? 0) === 0);

  const totalStock = insumos.reduce((acc, i) => acc + (i.stock ?? 0), 0);

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📈</span> Módulo de Reportes y Alertas
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
          Análisis de existencias, insumos críticos y alertas de inventario
        </p>
      </div>

      {/* Tarjetas de Métricas Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Total de Productos</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>{totalInsumos}</div>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Unidades Totales en Stock</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>{totalStock}</div>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Insumos con Stock Bajo</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '4px' }}>{insumosBajos.length}</div>
        </div>

        <div className="glass-card sharp-border" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Insumos Agotados</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '4px' }}>{insumosAgotados.length}</div>
        </div>
      </div>

      {/* Listado de Alertas de Stock Bajo / Agotados */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-rose)' }}>
        ⚠️ Insumos Críticos (Atención Requerida)
      </h2>

      <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Insumo</th>
                <th>Presentación</th>
                <th>Stock Actual</th>
                <th>Estado de Alerta</th>
              </tr>
            </thead>
            <tbody>
              {[...insumosAgotados, ...insumosBajos].length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--accent-emerald)' }}>
                    ✅ ¡Excelente! No hay insumos en nivel crítico o agotados.
                  </td>
                </tr>
              ) : (
                [...insumosAgotados, ...insumosBajos].map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>#{item.numero}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.insumo}</td>
                    <td>{item.presentacion} ({item.tamanoPresentacion})</td>
                    <td style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.stock ?? 0}</td>
                    <td>
                      {(item.stock ?? 0) === 0 ? (
                        <span className="badge badge-rose">🔴 Agotado</span>
                      ) : (
                        <span className="badge badge-amber">🟡 Reabastecer Pronto</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
