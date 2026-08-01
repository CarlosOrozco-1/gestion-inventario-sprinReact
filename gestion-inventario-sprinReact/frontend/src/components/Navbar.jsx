import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ toggleSidebar, isCollapsed, activeTab }) {
  const { user, logout } = useAuth();

  const tabTitles = {
    resumen: '📊 Resumen General',
    insumos: '📦 Catálogo de Insumos',
    movimientos: '🔄 Movimientos de Stock',
    usuarios: '👥 Usuarios y Permisos',
    reportes: '📈 Reportes y Alertas'
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 28px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleSidebar}
          className="btn btn-secondary sharp-border"
          style={{ padding: '8px 12px', fontSize: '1.1rem' }}
          title={isCollapsed ? "Expandir Menú Plegable" : "Plegar Menú"}
        >
          ☰
        </button>

        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tabTitles[activeTab] || 'Sistema de Inventario'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Panel de Control de Inventario de Insumos</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user.nombre}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <span className={`badge ${user.rol === 'ADMIN' ? 'badge-blue' : user.rol === 'JEFE' ? 'badge-amber' : 'badge-emerald'}`}>
              {user.rol || 'ADMIN'}
            </span>
          </div>
        )}

        <button onClick={logout} className="btn btn-secondary sharp-border" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          🔒 Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
