import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function InsumosModule({
  insumos = [],
  loading = false,
  onOpenNewInsumoModal = () => {},
  onEditInsumo = () => {},
  onDeleteInsumo = () => {},
  onOpenMovimientoModal = () => {},
  onViewQr = () => {},
  onOpenScannerForEdit = () => {},
  user
}) {
  const safeInsumos = Array.isArray(insumos) ? insumos : [];
  const filteredInsumos = safeInsumos.filter(Boolean);

  const rawRol = typeof user?.rol === 'object' ? user?.rol?.nombre : user?.rol;
  const rol = (rawRol || 'ADMIN').toString().toUpperCase().trim();
  const canCreate = rol === 'ADMIN' || rol === 'JEFE';
  const canEdit = rol === 'ADMIN' || rol === 'JEFE';
  const canDelete = rol === 'ADMIN';

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📦</span> Catálogo de Insumos e Inventario
        </h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canCreate && (
            <button onClick={onOpenNewInsumoModal} className="btn btn-primary">
              ✨ Nuevo Insumo
            </button>
          )}
          {canEdit && (
            <button
              onClick={onOpenScannerForEdit}
              className="btn"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(56, 189, 248, 0.2))',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '1.15rem' }}>📷</span> Escanear QR para Editar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th style={{ textAlign: 'center' }}>Código QR</th>
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
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Cargando catálogo de insumos...
                  </td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No se encontraron insumos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((item) => {
                  const stock = item.stock ?? 0;
                  const qrValue = item.codigoQr || `INS-QR-${item.numero || item.id}-${item.id}`;

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>#{item.numero}</td>
                      
                      {/* Columna con Miniatura de Código QR */}
                      <td style={{ textAlign: 'center' }}>
                        <div
                          onClick={() => onViewQr && onViewQr(item)}
                          title="Haga clic para ampliar, descargar o imprimir el Código QR"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.15)';
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.6)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                          }}
                        >
                          <QRCodeSVG value={qrValue} size={32} level="M" />
                        </div>
                      </td>

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
