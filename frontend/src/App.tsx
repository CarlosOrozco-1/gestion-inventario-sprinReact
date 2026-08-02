import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Insumos from './pages/Insumos';
import Movimientos from './pages/Movimientos';
import Ajustes from './pages/Ajustes';
import Reportes from './pages/Reportes';
import Proyecciones from './pages/Proyecciones';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
        />

        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insumos" element={<Insumos />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/proyecciones" element={<Proyecciones />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
