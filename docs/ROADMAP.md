# Arquitectura y Hoja de Ruta - SIGES V2

## Estado de Fases

### Fase 10: Módulo de Proyecciones (Smart Restock) — ✅ Completada
- **Objetivo:** Calcular presupuesto necesario para llevar el stock actual al stock óptimo (Máximo).
- **Lógica:** `Déficit = Stock Máximo - Stock Actual`. Si `Déficit > 0`, entonces `Inversión = Déficit * Costo Estimado`.

### Fase 11: Módulo de Gestión de Usuarios — ✅ Completada
- **Objetivo:** Panel de control para que el Administrador pueda realizar CRUD de empleados/usuarios del sistema.
- **Detalle:** Poder desactivar usuarios (`activo = false`) para evitar que sigan entrando sin borrar su historial de auditoría.

### Fase 11.1: Control de Acceso por Roles (ACL) — ✅ Completada
- **Objetivo:** Matriz de accesos por rol (ADMIN / JEFE / AUXILIAR) centralizada en el frontend.
- **Detalle:** Filtrado del menú lateral y protección de rutas por rol. Ver `docs/ACCESOS_ROLES_MODULOS.md`.
- **Pendiente:** Reforzar endpoints del backend con `@PreAuthorize`.

## Siguientes Fases

### Fase 12: Recuperación de Contraseña (Código por Correo Electrónico)
- **Objetivo:** Integración de seguridad perimetral para restablecimiento de claves.
- **Detalle:** Envío de un código (PIN) de 6 dígitos al correo electrónico del usuario registrado mediante `JavaMailSender` (SMTP), con expiración y validación de un solo uso. Detalles en `docs/FASES_DESARROLLO.md`.
