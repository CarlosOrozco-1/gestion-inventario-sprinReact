import React from 'react';

export default function InsumosModule({
  insumos,
  loading,
  search,
  setSearch,
  fetchInsumos,
  onOpenNewInsumoModal,
  onEditInsumo,
  onDeleteInsumo,
  onOpenMovimientoModal,
  user
}) {
  const filteredInsumos = insumos.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.insumo?.toLowerCase().includes(term) ||
      item.numero?.toString().includes(term) ||
      item.presentacion?.toLowerCase().includes(term)
    );
  });

  const rawRol = typeof user?.rol === 'object' ? user?.rol?.nombre : user?.rol;
  const rol = (rawRol || 'ADMIN').toString().toUpperCase().trim();
  const canCreate = rol === 'ADMIN' || rol === 'JEFE';
  const canEdit = rol === 'ADMIN' || rol === 'JEFE';
  const canDelete = rol === 'ADMIN';

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📦</span> Catálogo de Insumos e Inventario
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Gestión detallada de artículos, disponibilidades, entradas, salidas, regularizaciones y correcciones
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchInsumos} className="btn btn-secondary sharp-border" disabled={loading}>
            {loading ? '⌛ Actualizando...' : '🔄 Actualizar Datos'}
          </button>
          {canCreate && (
            <button onClick={onOpenNewInsumoModal} className="btn btn-primary">
              ✨ Nuevo Insumo
            </button>
          )}
        </div>
      </div>

      {/* Buscador de Insumos */}
      <div className="glass-card sharp-border" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.2rem', color: 'var(--accent-blue)' }}>🔍</span>
        <input
          type="text"
          className="input-field"
          placeholder="Buscar insumo por número, nombre o presentación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', padding: '6px', fontSize: '0.95rem' }}
        />
      </div>

      {/* Tabla de Insumos */}
      <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Insumo</th>
                <th>Presentación</th>
                <th>Tamaño</th>
                <th>Stock Actual</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Cargando catálogo de insumos...
                  </td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No se encontraron insumos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((item) => {
                  const stock = item.stock ?? 0;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>#{item.numero}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{item.insumo}</td>
                      <td>{item.presentacion}</td>
                      <td>{item.tamanoPresentacion}</td>
                      <td style={{ fontSize: '1.05rem', fontWeight: 700 }}>{stock}</td>
                      <td>
                        {stock > 10 ? (
                          <span className="badge badge-emerald">Disponible</span>
                        ) : stock > 0 ? (
                          <span className="badge badge-amber">Stock Bajo</span>
                        ) : (
                          <span className="badge badge-rose">Agotado</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {canEdit && (
                            <button
                              onClick={() => onEditInsumo(item)}
                              className="btn btn-secondary sharp-border"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Editar Insumo"
                            >
                              ✏️ Editar
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => onDeleteInsumo(item)}
                              className="btn btn-secondary sharp-border"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                borderColor: 'rgba(244, 63, 94, 0.4)',
                                color: '#f87171'
                              }}
                              title="Eliminar Insumo"
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
