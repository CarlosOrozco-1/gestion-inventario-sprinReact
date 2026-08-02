# Arquitectura y Hoja de Ruta - SIGES V2

## Siguientes Fases Acordadas

### Fase 10: Módulo Beta de Proyecciones (Smart Restock)
- **Objetivo:** Calcular presupuesto necesario para llevar el stock actual al stock óptimo (Máximo).
- **Lógica:** `Déficit = Stock Máximo - Stock Actual`. Si `Déficit > 0`, entonces `Inversión = Déficit * Costo Estimado`.

### Fase 11: Módulo de Gestión de Usuarios
- **Objetivo:** Panel de control para que el Administrador pueda realizar CRUD de empleados/usuarios del sistema.
- **Detalle:** Poder desactivar usuarios (`activo = false`) para evitar que sigan entrando sin borrar su historial de auditoría.

### Fase 12: Recuperación de Contraseña Avanzada
- **Objetivo:** Integración de seguridad perimetral para restablecimiento de claves.
- **Detalle:** Envío de un PIN de 6 dígitos o enlace seguro al correo electrónico del usuario registrado mediante `JavaMailSender` (SMTP).
