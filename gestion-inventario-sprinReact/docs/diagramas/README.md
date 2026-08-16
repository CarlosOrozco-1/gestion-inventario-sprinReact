# Diagramas del Sistema

Carpeta de diagramas Mermaid del **Sistema de Gestión de Inventario de Insumos** (Spring Boot + React + SQLite).

## Estructura

| Archivo | Descripción |
|---------|-------------|
| [`diagrama-general-sistema.md`](diagrama-general-sistema.md) | Diagrama general del sistema: arquitectura (React → API REST → Spring Boot → SQLite), flujo principal por rol y autenticación JWT. |
| [`flujo-login.md`](flujo-login.md) | Flujo de inicio de sesión (credenciales y Google OAuth). |
| [`flujo-recuperacion-contrasena.md`](flujo-recuperacion-contrasena.md) | Flujo de recuperación de contraseña (propuesto). |
| [`flujo-ingreso-insumo.md`](flujo-ingreso-insumo.md) | Flujo de registro de un nuevo insumo en el catálogo. |
| [`flujo-movimientos.md`](flujo-movimientos.md) | Flujos de movimientos de inventario (ENTRADA, SALIDA, REGULARIZACIÓN, CORRECCIÓN). |
| [`flujo-gestion-usuarios.md`](flujo-gestion-usuarios.md) | Flujo de gestión de usuarios y roles (crear, editar, eliminar). |

## Cómo visualizar

Los diagramas están escritos en **Mermaid** (`.md`). Se renderizan automáticamente en:

- **GitHub / GitLab:** vista previa nativa de Markdown.
- **VS Code:** extensión *Markdown Preview Mermaid Support*.
- **Mermaid Live Editor:** [https://mermaid.live](https://mermaid.live)

## Convención

- `([INICIO/FIN])`: nodos de inicio y fin.
- `{decisión}`: validaciones o bifurcaciones condicionales.
- `[acción]`: procesos y operaciones.
- `/api/...`: endpoints REST del backend.
- Los flujos reflejan el comportamiento real de la aplicación; donde un flujo es **propuesto** (aún no implementado) se indica explícitamente.
