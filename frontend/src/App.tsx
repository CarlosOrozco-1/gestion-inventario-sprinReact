import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Insumos from "./pages/Insumos";
import Movimientos from "./pages/Movimientos";
import Ajustes from "./pages/Ajustes";
import Reportes from "./pages/Reportes";
import Proyecciones from "./pages/Proyecciones";
import Usuarios from "./pages/Usuarios";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireRole from "./components/RequireRole";
import { ROLES } from "./access";
import { useAuthStore } from "./store/useAuthStore";

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
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route element={<RequireRole roles={[ROLES.ADMIN, ROLES.JEFE]} />}>
              <Route path="/ajustes" element={<Ajustes />} />
              <Route path="/proyecciones" element={<Proyecciones />} />
              <Route path="/insumos" element={<Insumos />} />
            </Route>
            <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
              <Route path="/usuarios" element={<Usuarios />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
