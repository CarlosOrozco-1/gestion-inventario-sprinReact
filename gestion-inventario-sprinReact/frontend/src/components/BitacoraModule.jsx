import React, { useState, useEffect } from 'react';
import { obtenerBitacora } from '../services/bitacoraService';

export default function BitacoraModule({ user }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduloFilter, setModuloFilter] = useState('TODOS');
  const [accionFilter, setAccionFilter] = useState('TODAS');

  const cargarBitacora = async () => {
    setLoading(true);
    try {
      const data = await obtenerBitacora();
      setRegistros(data);
    } catch (err) {
      console.error("Error al cargar la bitácora:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  const getActionBadge = (accion) => {
    switch (accion?.toUpperCase()) {
      case 'ENTRADA':
        return <span className="badge badge-emerald">📥 ENTRADA</span>;
      case 'SALIDA':
        return <span className="badge badge-rose">📤 SALIDA</span>;
      case 'REGULARIZACION_POSITIVA':
      case 'AJUSTE_POSITIVO':
        return <span className="badge badge-amber">⚙️ REGULARIZACIÓN (+)</span>;
      case 'REGULARIZACION_NEGATIVA':
      case 'AJUSTE_NEGATIVO':
        return <span className="badge badge-amber">⚙️ REGULARIZACIÓN (-)</span>;
      case 'CORRECCION_POSITIVA':
        return <span className="badge badge-blue">🛠️ CORRECCIÓN (+)</span>;
      case 'CORRECCION_NEGATIVA':
        return <span className="badge badge-blue">🛠️ CORRECCIÓN (-)</span>;
      case 'CREAR_INSUMO':
        return <span className="badge badge-emerald">✨ NUEVO INSUMO</span>;
      case 'EDITAR_INSUMO':
        return <span className="badge badge-blue">✏️ EDITAR INSUMO</span>;
      case 'ELIMINAR_INSUMO':
        return <span className="badge badge-rose">🗑️ ELIMINAR INSUMO</span>;
      case 'CREAR_USUARIO':
        return <span className="badge badge-purple">👤 NUEVO USUARIO</span>;
      case 'EDITAR_USUARIO':
        return <span className="badge badge-amber">✏️ EDITAR USUARIO</span>;
      case 'ELIMINAR_USUARIO':
        return <span className="badge badge-rose">🗑️ ELIMINAR USUARIO</span>;
      default:
        return <span className="badge badge-secondary">{accion}</span>;
    }
  };

  const getModuloBadge = (modulo) => {
    switch (modulo?.toUpperCase()) {
      case 'INVENTARIO':
        return <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>📦 Inventario</span>;
      case 'MOVIMIENTOS':
        return <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>🔄 Movimientos</span>;
      case 'USUARIOS':
        return <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>👥 Usuarios</span>;
      default:
        return <span>{modulo}</span>;
    }
  };

  const filteredRegistros = registros.filter(item => {
    const term = search.toLowerCase();
    const matchesSearch = 
      item.descripcion?.toLowerCase().includes(term) ||
      item.justificacion?.toLowerCase().includes(term) ||
      item.usuarioNombre?.toLowerCase().includes(term) ||
      item.accion?.toLowerCase().includes(term);

    const matchesModulo = moduloFilter === 'TODOS' || item.modulo === moduloFilter;
    const matchesAccion = accionFilter === 'TODAS' || item.accion === accionFilter;

    return matchesSearch && matchesModulo && matchesAccion;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📋</span> Bitácora de Registro de Cambios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Registro obligatorio e inmutable de todas las acciones, cambios y justificaciones del sistema
          </p>
        </div>
        <button onClick={cargarBitacora} className="btn btn-secondary sharp-border">
          🔄 Actualizar Registros
        </button>
      </div>

      {/* Tarjetas de Métricas de Auditoría */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card sharp-border" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Registros</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>{registros.length}</div>
        </div>
        <div className="glass-card sharp-border" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Movimientos Stock</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {registros.filter(r => r.modulo === 'MOVIMIENTOS').length}
          </div>
        </div>
        <div className="glass-card sharp-border" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cambios Catálogo</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {registros.filter(r => r.modulo === 'INVENTARIO').length}
          </div>
        </div>
        <div className="glass-card sharp-border" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Gestión Usuarios</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '4px' }}>
            {registros.filter(r => r.modulo === 'USUARIOS').length}
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="glass-card sharp-border" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem', color: 'var(--accent-blue)' }}>🔍</span>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por usuario, descripción o justificación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '6px', fontSize: '0.92rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="select-field sharp-border"
            value={moduloFilter}
            onChange={(e) => setModuloFilter(e.target.value)}
            style={{ minWidth: '160px', background: 'rgba(17, 24, 39, 0.9)', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="TODOS">📦 Todos los Módulos</option>
            <option value="MOVIMIENTOS">🔄 Movimientos</option>
            <option value="INVENTARIO">📦 Inventario</option>
            <option value="USUARIOS">👥 Usuarios</option>
          </select>

          <select
            className="select-field sharp-border"
            value={accionFilter}
            onChange={(e) => setAccionFilter(e.target.value)}
            style={{ minWidth: '160px', background: 'rgba(17, 24, 39, 0.9)', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="TODAS">⚡ Todas las Acciones</option>
            <option value="ENTRADA">📥 Entradas</option>
            <option value="SALIDA">📤 Salidas</option>
            <option value="REGULARIZACION_POSITIVA">⚙️ Regularización (+)</option>
            <option value="REGULARIZACION_NEGATIVA">⚙️ Regularización (-)</option>
            <option value="CORRECCION_POSITIVA">🛠️ Corrección (+)</option>
            <option value="CORRECCION_NEGATIVA">🛠️ Corrección (-)</option>
            <option value="CREAR_INSUMO">✨ Crear Insumo</option>
            <option value="EDITAR_INSUMO">✏️ Editar Insumo</option>
            <option value="ELIMINAR_INSUMO">🗑️ Eliminar Insumo</option>
            <option value="CREAR_USUARIO">👤 Crear Usuario</option>
            <option value="EDITAR_USUARIO">✏️ Editar Usuario</option>
            <option value="ELIMINAR_USUARIO">🗑️ Eliminar Usuario</option>
          </select>
        </div>
      </div>

      {/* Tabla de la Bitácora */}
      <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Usuario Responsable</th>
                <th>Módulo</th>
                <th>Acción Realizada</th>
                <th>Descripción del Cambio</th>
                <th style={{ minWidth: '220px' }}>Justificación / Comentario Obligatorio</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Cargando bitácora de auditoría...
                  </td>
                </tr>
              ) : filteredRegistros.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No se encontraron registros de cambios en la bitácora.
                  </td>
                </tr>
              ) : (
                filteredRegistros.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(item.created_at || item.createdAt)}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                      👤 {item.usuarioNombre || 'Usuario'}
                    </td>
                    <td>{getModuloBadge(item.modulo)}</td>
                    <td>{getActionBadge(item.accion)}</td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {item.descripcion}
                    </td>
                    <td style={{ fontSize: '0.86rem', color: '#fbbf24', fontStyle: 'italic', background: 'rgba(245, 158, 11, 0.05)', padding: '10px' }}>
                      💬 "{item.justificacion}"
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
