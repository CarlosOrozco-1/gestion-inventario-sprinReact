export const ROLES = {
  ADMIN: "ADMIN",
  JEFE: "JEFE",
  AUXILIAR: "AUXILIAR",
} as const;

/**
 * Regla acordada: ADMIN entra a todo; JEFE entra a todo EXCEPTO la gestión de
 * usuarios; AUXILIAR solo a los módulos de su operación diaria.
 *
 * Debe coincidir con los `@PreAuthorize` del backend: si el frontend deja pasar
 * a alguien que el backend rechaza, el error le llega al usuario como un 403
 * en medio de la operación y no como un menú que nunca le apareció.
 */
export const MODULE_ACCESS: Record<string, string[]> = {
  "/": [ROLES.ADMIN, ROLES.JEFE, ROLES.AUXILIAR],
  "/insumos": [ROLES.ADMIN, ROLES.JEFE],
  "/movimientos": [ROLES.ADMIN, ROLES.JEFE, ROLES.AUXILIAR],
  "/ajustes": [ROLES.ADMIN, ROLES.JEFE],
  "/reportes": [ROLES.ADMIN, ROLES.JEFE, ROLES.AUXILIAR],
  "/proyecciones": [ROLES.ADMIN, ROLES.JEFE],
  "/usuarios": [ROLES.ADMIN],
  "/auditoria": [ROLES.ADMIN, ROLES.JEFE],
};

export const hasAccess = (path: string, user: any): boolean => {
  const rol = getRol(user);
  if (!rol) return false;
  const allowed = MODULE_ACCESS[path];
  return allowed ? allowed.includes(rol) : false;
};

export const getRol = (user: any): string => {
  if (!user) return "";
  const rol = typeof user.rol === "string" ? user.rol : user.rol?.name;
  return (rol || "").toUpperCase();
};
