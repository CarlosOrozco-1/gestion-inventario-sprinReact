import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { hasAccess } from '../access';
import Toast from './Toast';

// Versión del sistema (se muestra en el pie del menú lateral).
const APP_VERSION = '1.0.0';

export default function Layout() {
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Menú colapsado en desktop (solo iconos visibles)
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    {
      name: 'Inicio',
      path: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Insumos',
      path: '/insumos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: 'Kárdex',
      path: '/movimientos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Ajustes',
      path: '/ajustes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      name: 'Auditoría',
      path: '/auditoria',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      name: 'Reportería',
      path: '/reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'Proyecciones',
      path: '/proyecciones',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      name: 'Gestión Usuarios',
      path: '/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Top Header (Solo Móvil) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center px-4 shadow-sm">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="ml-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-bold text-slate-800 text-lg">SIGES</h1>
        </div>
      </header>

      {/* Overlay oscuro para móvil cuando el sidebar está abierto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar (Menú Lateral) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white flex flex-col transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } w-72 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`p-6 flex items-center ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-black tracking-tight text-white ${collapsed ? 'lg:hidden' : ''}`}>SIGES<span className="text-brand-400">.</span></h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón colapsar/expandir menú (Solo Desktop) */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              className="hidden lg:inline-flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {collapsed ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l5 5-5 5m-6-10l-5 5 5 5" />
                </svg>
              )}
            </button>

            {/* Botón cerrar sidebar (Solo Móvil) */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <nav className={`flex-1 px-2 lg:px-4 space-y-2 mt-4 overflow-y-auto`}>
          {navLinks
            .filter(link => hasAccess(link.path, user))
            .map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                title={link.name}
                className={`flex items-center gap-3 py-3.5 rounded-xl transition-all duration-200 ${
                  collapsed ? 'lg:justify-center lg:px-0' : 'px-4'
                } ${
                  isActive 
                    ? 'bg-brand-600/10 text-brand-400 font-semibold border border-brand-500/20 shadow-inner' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <span className="shrink-0">{link.icon}</span>
                <span className={collapsed ? 'lg:hidden' : ''}>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-6 border-t border-slate-800 ${collapsed ? 'lg:px-0 lg:flex lg:flex-col lg:items-center' : ''}`}>
          <div className={`flex items-center gap-3 mb-6 px-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`flex items-center gap-3 w-full py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 ${
              collapsed ? 'lg:justify-center lg:px-0' : 'px-4'
            }`}
          >
            <span className="shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <span className={collapsed ? 'lg:hidden' : ''}>Cerrar Sesión</span>
          </button>

          {/* Versión del sistema */}
          <p
            title={`SIGES versión ${APP_VERSION}`}
            className={`mt-4 text-[11px] tracking-wide text-slate-600 ${collapsed ? 'lg:hidden lg:block lg:truncate lg:w-full lg:text-center' : ''}`}
          >
            v{APP_VERSION}
          </p>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className={`flex-1 overflow-y-auto w-full lg:w-auto relative bg-slate-50 pt-16 lg:pt-0 ${collapsed ? 'side-collapsed' : ''}`}>
        <div className="p-4 md:p-8 min-h-full">
          <Outlet />
        </div>
      </main>

      <Toast />
    </div>
  );
}
