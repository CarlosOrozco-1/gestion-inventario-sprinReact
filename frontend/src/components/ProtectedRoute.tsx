import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ProtectedRoute() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Si no esta autenticado, redirige al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    // Si esta autenticado, le permitimos ver el componente hijo que le sigue (outlet)
    return <Outlet />;
}