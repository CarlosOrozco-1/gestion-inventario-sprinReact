export const ROLES = {
  ADMIN: "ADMIN",
  JEFE: "JEFE",
  AUXILIAR: "AUXILIAR",
} as const;

export const MODULE_ACCESS: Record<string, string[]> = {
  "/": [ROLES.ADMIN, ROLES.JEFE, ROLES.AUXILIAR],
  "/insumos": [ROLES.ADMIN, ROLES.JEFE],
  "/movimientos": [ROLES.ADMIN, ROLES.JEFE, ROLES.AUXILIAR],
  "/ajustes": [ROLES.ADMIN, ROLES.JEFE],
  "/reportes": [ROLES.ADMIN, ROLES.JEFE, ROLES.AUXILIAR],
  "/proyecciones": [ROLES.ADMIN, ROLES.JEFE],
  "/usuarios": [ROLES.ADMIN],
};

export const hasAccess = (path: string, user: any): boolean => {
  const rol = getRol(user);
  if (!rol) return false;
  const allowed = MODULE_ACCESS[path];
  return allowed ? allowed.includes(rol) : false;
};

export const getRol = (user: any): string => {
  if (!user) return "";
  const rol = typeof user.rol === "string" ? user.rol : user.rol?.nombre;
  return (rol || "").toUpperCase();
};
