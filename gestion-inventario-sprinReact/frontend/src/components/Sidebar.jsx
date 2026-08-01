import React from 'react';

export default function Sidebar({ isCollapsed, toggleSidebar, activeTab, setActiveTab, user }) {
  const navItems = [
    { id: 'resumen', label: 'Resumen General', icon: '📊', description: 'Métricas e indicadores globales' },
    { id: 'insumos', label: 'Catálogo Insumos', icon: '📦', description: 'Gestión de productos y stock' },
    { id: 'movimientos', label: 'Movimientos Stock', icon: '🔄', description: 'Entradas, salidas y ajustes' },
    { id: 'usuarios', label: 'Usuarios y Permisos', icon: '👥', description: 'Roles y matriz de accesos' },
    { id: 'reportes', label: 'Reportes y Alertas', icon: '📈', description: 'Estadísticas e insumos bajos' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Header del Sidebar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: '18px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '68px'
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
            }}>
              📦
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                Gestión Inventario
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Módulos de Sistema</span>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          title={isCollapsed ? "Expandir Menú" : "Plegar Menú"}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          className="btn-secondary"
        >
          {isCollapsed ? '☰' : '◀'}
        </button>
      </div>

      {/* Navegación por módulos */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <div style={{
          padding: isCollapsed ? '0' : '0 16px',
          marginBottom: '8px',
          textAlign: isCollapsed ? 'center' : 'left'
        }}>
          {!isCollapsed && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-dark)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Módulos Principales
            </span>
          )}
        </div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
            {!isCollapsed && (
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>{item.label}</div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer del Sidebar con Info de Usuario */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(11, 15, 25, 0.5)'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {user?.nombre?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {user?.rol || 'ADMIN'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <span title={`${user?.nombre} (${user?.rol})`} style={{ fontSize: '1.2rem', cursor: 'pointer' }}>👤</span>
          </div>
        )}
      </div>
    </aside>
  );
}
