import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getRol } from "../access";

export default function RequireRole({ roles }: { roles: string[] }) {
  const user = useAuthStore((state: any) => state.user);
  const rol = getRol(user);

  if (!rol || !roles.includes(rol)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
