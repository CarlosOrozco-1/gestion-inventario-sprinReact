import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar (Menú Lateral) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-black text-brand-400">SIGES</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            Inicio
          </Link>
          <Link to="/insumos" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            Insumos
          </Link>
          <Link to="/movimientos" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            Movimientos (Kárdex)
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-sm text-slate-400 mb-4 px-2">Hola, {user?.nombre}</p>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
