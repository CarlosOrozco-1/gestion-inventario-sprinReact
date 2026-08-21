import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ toggleSidebar, openMobileSidebar, activeTab }) {
  const { user, logout } = useAuth();

  const tabTitles = {
    resumen: '📊 Resumen General',
    insumos: '📦 Catálogo Insumos',
    movimientos: '🔄 Movimientos Stock',
    usuarios: '👥 Usuarios y Roles',
    alertas: '🚨 Alertas de Stock',
    bitacora: '📋 Bitácora'
  };

  return (
    <nav className="navbar-container" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 28px',
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Botón de Menú Hamburguesa para Móviles */}
        <button
          onClick={openMobileSidebar}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          className="btn-secondary mobile-menu-btn"
          title="Abrir Menú"
        >
          ☰
        </button>

        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            {tabTitles[activeTab] || 'Sistema de Inventario'}
          </h2>
          <span className="navbar-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Panel de Control de Insumos
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="navbar-user-details" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>{user.nombre}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <span className={`badge ${user.rol === 'ADMIN' ? 'badge-blue' : user.rol === 'JEFE' ? 'badge-amber' : 'badge-emerald'}`}>
              {user.rol || 'ADMIN'}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="btn btn-secondary sharp-border"
          style={{ padding: '8px 12px', fontSize: '0.84rem', flexShrink: 0 }}
          title="Cerrar Sesión"
        >
          <span>🔒</span> <span className="navbar-user-details">Salir</span>
        </button>
      </div>
    </nav>
  );
}
