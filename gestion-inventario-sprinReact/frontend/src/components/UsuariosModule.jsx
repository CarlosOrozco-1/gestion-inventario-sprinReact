import React from 'react';

export default function UsuariosModule({ user }) {
  const rolesMatrix = [
    { funcion: 'Gestionar usuarios y credenciales', admin: true, jefe: false, auxiliar: false },
    { funcion: 'Agregar catálogo de nuevos insumos', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Editar detalles de insumos existentes', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Eliminar insumos del catálogo', admin: true, jefe: false, auxiliar: false },
    { funcion: 'Registrar entradas de almacén', admin: true, jefe: true, auxiliar: true },
    { funcion: 'Registrar salidas de productos', admin: true, jefe: true, auxiliar: true },
    { funcion: 'Registrar ajustes y correcciones', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Visualizar tabla de inventario', admin: true, jefe: true, auxiliar: true },
    { funcion: 'Generar reportes y auditoría', admin: true, jefe: true, auxiliar: false },
  ];

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>👥</span> Módulo de Usuarios y Roles
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
          Información de la sesión activa y matriz de permisos por nivel de usuario
        </p>
      </div>

      {/* Tarjeta de Usuario Activo */}
      <div className="glass-card sharp-border-accent" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
          👤 Información de la Sesión Actual
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: true, fontWeight: 600 }}>Nombre</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{user?.nombre || 'Usuario Demo'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: true, fontWeight: 600 }}>Correo Electrónico</span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-blue)', marginTop: '2px' }}>{user?.email || 'admin@inventario.com'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: true, fontWeight: 600 }}>Rol Asignado</span>
            <div style={{ marginTop: '4px' }}>
              <span className={`badge ${user?.rol === 'ADMIN' ? 'badge-blue' : user?.rol === 'JEFE' ? 'badge-amber' : 'badge-emerald'}`}>
                {user?.rol || 'ADMIN'} (Nivel {user?.nivel || 100})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Matriz de Permisos */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Matriz de Permisos por Rol</h2>
      <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Función o Módulo</th>
                <th style={{ textAlign: 'center' }}>Admin</th>
                <th style={{ textAlign: 'center' }}>Jefe</th>
                <th style={{ textAlign: 'center' }}>Auxiliar</th>
              </tr>
            </thead>
            <tbody>
              {rolesMatrix.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500, color: '#fff' }}>{row.funcion}</td>
                  <td style={{ textAlign: 'center' }}>{row.admin ? '✅ Sí' : '❌ No'}</td>
                  <td style={{ textAlign: 'center' }}>{row.jefe ? '✅ Sí' : '❌ No'}</td>
                  <td style={{ textAlign: 'center' }}>{row.auxiliar ? '✅ Sí' : '❌ No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
