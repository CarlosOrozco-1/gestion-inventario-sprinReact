# SIGES — Sistema de Gestión de Inventario de Insumos

> **Documento de contexto técnico** para el equipo de documentación.
> Versión documentada: **v1.0.0** (rama `pro`).

---

## 1. Resumen del sistema

**SIGES** es un sistema web de gestión de inventario de insumos con control ultra-preciso de entradas, salidas y ajustes justificados. Está orientado a manejar:

- Catálogo de insumos con **múltiples presentaciones** por insumo.
- **Entradas** (ingresos de stock) y **salidas** (egresos de stock) con validación estricta: nunca se permite saldo negativo.
- **Ajustes manuales** (`AJUSTE_MANUAL`, `CORRECCION_ENTRADA`, etc.) que siempre exigen una **justificación** de al menos 20 caracteres y quedan registrados con el usuario responsable.
- **Códigos QR** por presentación para consulta y operación rápida en campo.
- **Bitácora de auditoría** con eventos de toda la operación (busca: seguridad y trazabilidad).
- **Proyecciones de requerimiento anual** (con exportación PDF/Excel).
- Autenticación por **roles** (`ADMIN`, `JEFE`, `AUXILIAR`) mediante **JWT**.

Es un sistema transaccional: el stock **nunca** se actualiza "a ciegas" con un UPDATE directo; cada movimiento se registra y el stock se deriva/incrementa mediante transacciones atómicas seguras.

---

## 2. Stack tecnológico

### Backend (Spring Boot)
| Componente | Tecnología / Versión |
|---|---|
| Framework | Spring Boot 4.1.x (Java 21 en runtime, JDK 25 admite compilar) |
| Build | Gradle (imagen Docker `gradle:9.5.1-jdk21`) |
| Persistencia | Spring Data JPA / Hibernate |
| Base de datos | PostgreSQL 16 (ocio: SQLite fue eliminado) |
| Migraciones | Flyway (`V1`…`V8`) |
| Seguridad | Spring Security + JWT (HS512) + BCrypt |
| Errores | `@RestControllerAdvice` (`GlobalExceptionHandler`) |
| Tiempo real | WebSocket (`/ws`) para la página de Auditoría |
| Precisión numérica | `BigDecimal` / `Integer` (**prohibido** `float`/`double`) |

### Frontend (React)
| Componente | Tecnología / Versión |
|---|---|
| Framework | React 19 (Functional Components + Hooks) |
| Build | Vite 8 |
| Enrutado | React Router DOM 7 |
| Estado | Zustand 5 (`useAuthStore`, `useToastStore`) |
| Peticiones | Axios (`src/api/axios.ts`) con interceptor de JWT |
| UI | Tailwind CSS 4 + componentes propios (modales, toasts) |
| Testing | Vitest + React Testing Library + jsdom |
| Sonido QR | `src/utils/sound.ts` |

### Infraestructura
- **Local/dev:** `docker-compose.yml` (backend `8080`, frontend `8081`, postgres `5432`).
- **Producción:** `docker-compose.prod.yml` + Caddy central (`caddy-central/`) con dominio **`https://gestioninventario.duckdns.org`**. El backend queda **solo interno** (no expuesto a internet); el frontend (nginx) es el único expuesto y proxya `/api` y `/ws`.
- Credenciales por variables de entorno en `.env` (ver `.env.example`).

---

## 3. Arquitectura

```
Navegador (SPA React)
        │
        │ HTTPS
        ▼
Caddy (reverse proxy / TLS)  ──→  Frontend nginx (puerto 8081)  ── /api, /ws ──→  Backend Spring Boot (8080, interno)
                                                                                        │
                                                                                        ▼
                                                                                PostgreSQL 16 (inventario)
```

- Frontend monolito SPA que consume una **API REST JSON** bajo `/api`.
- Backend **stateless**: la sesión se mantiene por token JWT en `Authorization: Bearer`.
- Canal **WebSocket** `/ws` para refresco en vivo de la bitácora de auditoría.
- El **QR** se usa para escanear presentaciones: el endpoint devuelve el detalle del insumo (incluye si está `activo`).

### Convenciones de estado del frontend
- `useAuthStore`: `user` (id, name, email, rol, nivel), `token`, `isAuthenticated`; métodos `login()` y `logout()` persisten en `localStorage`.
- `useToastStore`: toasts globales (`success`, `error`, `info`) renderizados por `<Toast />` en `Layout`.

---

## 4. Módulos y accesos por rol

Rutas protegidas (`frontend/src/App.tsx`). Roles: `ADMIN` (nivel 100), `JEFE` (nivel 80), `AUXILIAR` (nivel 50).

| Ruta | Módulo | Acceso |
|---|---|---|
| `/` | Inicio / Dashboard | Todos |
| `/insumos` | Catálogo de insumos (crear/editar, presentaciones, QR, activar/inactivar) | ADMIN, JEFE |
| `/movimientos` | Kárdex (entradas/salidas) | Todos |
| `/ajustes` | Correcciones manuales justificadas (solo eventos `AJUSTE*`) | ADMIN, JEFE |
| `/auditoria` | Bitácora de auditoría (tiempo real vía WebSocket) | ADMIN |
| `/reportes` | Reportería (PDF/Excel) | Todos |
| `/proyecciones` | Proyección de requerimiento anual | ADMIN, JEFE |
| `/usuarios` | Gestión de usuarios | ADMIN |
| `/login`, `/recuperar` | Autenticación y recuperación de contraseña | Público |
| — | **Mi Perfil** (cambiar contraseña) — modal desde el sidebar | Todos |

### Detalle del módulo Insumos
- Cada insumo (material) puede tener **varias presentaciones** (envase, unidad, etc.), con stock, min/max, costo estimado y `qrCode` propio.
- **Edición de código interno:** el campo `code` es **inmutable** (el backend lo ignora en `actualizarItem`); se muestra de solo lectura en el formulario.
- **Activar/Inactivar** (`PUT /api/items/{id}/estado`, solo ADMIN/JEFE): un insumo inactivo queda fuera de la lista de vista y **no admite movimientos**; al escanear su QR el sistema avisa "insumo inactivo, consulta con tu superior para su activación".
- El escaneo de QR captura el evento de auditoría `QR_CONSULTADO`.

### Detalle del módulo Perfil (nuevo en v1.0.0)
- Al hacer clic en el bloque del usuario (sidebar) se abre el modal **"Mi Perfil"** con los datos de la sesión y la sección **"Cambiar contraseña"**.
- 3 campos: **contraseña actual**, **nueva contraseña** (mín. 8 caracteres) y **confirmación** (debe coincidir).
- Antes de guardar se pide confirmación: "Se cerrará tu sesión actual y deberás iniciar sesión con la nueva contraseña".
- El backend **valida la contraseña actual** con BCrypt: si no coincide devuelve HTTP 400 `"La contraseña actual no coincide con la registrada"` y no modifica nada.
- Al confirmar el guardado, el frontend cierra la sesión y redirige al login (el usuario entra de nuevo con su nueva contraseña).
- Cada cambio se registra en auditoría con el evento `PASSWORD_CAMBIADO`.

---

## 5. Modelo de datos

Entidades JPA (paquete `com.gestion.inventario.model`):

| Entidad | Tabla | Notas |
|---|---|---|
| `Usuario` | `usuarios` | `id`, `name`, `email` (único), `password_hash` (BCrypt), `rol_id`, `active`, timestamps |
| `Rol` | `roles` | `name` (ADMIN/JEFE/AUXILIAR), `level`, descripción |
| `Item` | `items` | Insumo/material; `code` **inmutable**; `activo` (BOOLEAN, default true, **V8**) |
| `Presentation` | `presentations` | Presentación de un `Item`; `stock`, `min_stock`, `max_stock`, `estimated_cost`, `qr_code` |
| `Movimiento` | `movimientos` | `presentation_id`, `type` (ENUM), `quantity` (Integer), `detail`, `usuario_id`, `created_at` |
| `Insumo` | `insumos` | Catálogo mayor (persistencia del esquema original; ver entidades de integración) |
| `MovimientoTipo` | — | ENUM: `ENTRADA`, `SALIDA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `CORRECCION_ENTRADA`, `CORRECCION_SALIDA` (verificar en `MovimientoService`) |
| `AuditLog` | `audit_logs` | Bitácora append-only: `event_type`, `description`, `entity`, `usuario_email`, `ip`, timestamps |
| `PasswordResetToken` | `password_reset_tokens` | Código (hash), expiración (10 min), intentos fallidos, usado |
| `RequerimientoAnual` / `SaldoMensual` | — | Base del módulo de Proyecciones |

### Migraciones Flyway (`backend/src/main/resources/db/migration/`)
| Migración | Contenido |
|---|---|
| `V1__esquema_inicial.sql` | Esquema base |
| `V2__password_reset_tokens.sql` | Tokens de recuperación de contraseña |
| `V3__presentaciones_multiples.sql` | Soporte de múltiples presentaciones |
| `V4__normalizar_schema_al_ingles.sql` | Normalización de nombres al inglés |
| `V5__add_qr_code_to_presentations.sql` | Columna `qr_code` |
| `V6__regenerar_qr_code_formato_estable.sql` | Formato estable de QR (`SIGES-PRES-{id}`) |
| `V7__auditoria.sql` | Tabla de auditoría |
| `V8__add_activo_items.sql` | `ALTER TABLE items ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE` |

---

## 6. API REST (resumen)

Base: `/api`. Autenticada salvo las rutas `auth/**` y `/error`.

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/auth/login` | Login con email+password → token JWT + datos del usuario | Público |
| `POST` | `/auth/recuperar` | Solicita código de recuperación (respuesta genérica) | Público |
| `POST` | `/auth/verificar-codigo` | Valida el código de 6 dígitos (10 min, máx. 5 intentos) | Público |
| `POST` | `/auth/restablecer` | Crea la nueva contraseña tras verificar el código | Público |
| `PUT` | `/perfil/cambiar-password` | **Cambio de contraseña propio** (valida contraseña actual) | Cualquier rol autenticado |
| `GET` | `/insumos` | Vista de insumos (incluye **solo activos**) con presentaciones y stock | Todos |
| `GET` | `/insumos/sugerencias-stock` | Sugerencias de reposición | — |
| `GET/POST` | `/items` | Listar / crear insumos (código interno) | — |
| `GET/PUT` | `/items/{id}` | Detalle / actualizar (código **inmutable**) | — |
| `PUT` | `/items/{id}/estado` | Activar/inactivar insumo | ADMIN, JEFE |
| `POST` | `/items/{id}/presentations` | Agregar presentación a un insumo | — |
| `GET` | `/presentations/qr/{qrCode}` | Consulta por QR → `InsumoViewDTO` (incluye `activo`) | Todos |
| `PUT` | `/presentations/{id}` | Editar presentación | — |
| `POST` | `/presentations/{id}/qr-event` | Registrar evento QR (descarga/impresión) | — |
| `GET` | `/movimientos` | Historial de movimientos | Todos |
| `POST` | `/movimientos` | Registrar movimiento (entrada/salida/ajuste) | Todos (validación por backend) |
| `GET` | `/reportes/excel`, `/reportes/pdf` | Reportes exportables | Todos |
| `POST` | `/reportes/proyecciones/excel`, `/proyecciones/pdf` | Exportación de proyecciones | — |
| `GET` | `/auditoria` (+ `/eventos`) | Bitácora páginada + catálogo de eventos | ADMIN |
| `GET/POST/PUT` | `/usuarios`, `/usuarios/admin`, `/usuarios/admin/{id}`, `.../rol`, `.../status` | CRUD de usuarios | ADMIN |

> **Nota exacta de parámetros:** los campos de los DTOs se definen en `com.gestion.inventario.dto` (`LoginRequest`, `MovimientoDTO`, `CambiarPasswordRequest`, `NuevoUsuarioDTO`, `ActualizarUsuarioDTO`, etc.).

---

## 7. Autenticación, seguridad y roles

### Flujo de login
1. `POST /auth/login` valida contra `UserDetailsServiceImpl` + BCrypt.
2. **Auditoría:** el intento fallido registra `LOGIN_FALLIDO`; el éxito registra `LOGIN`.
3. Se devuelve `{ token: <JWT HS512>, user: { id, name, email, rol, nivel } }`.
4. El frontend guarda token y user en `localStorage`; el interceptor de Axios agrega `Authorization: Bearer <token>`.

### Flujo de recuperación de contraseña
1. `POST /auth/recuperar` (email) → se envía correo HTML con código de 6 dígitos (respuesta genérica: no revela si el correo existe).
2. `POST /auth/verificar-codigo` (email + código) → valida vigencia (10 min) e intentos (máx. 5).
3. `POST /auth/restablecer` (email + código + nueva contraseña) → actualiza el hash y marca el token como usado.

### Seguridad implementada
- Passwords con **BCrypt** (`BCryptPasswordEncoder`).
- JWT firmado **HS512**, secreto desde `JWT_SECRET` (env).
- Rutas `/api/auth/**` públicas; **todo lo demás exige token** (401 JSON si no).
- `@PreAuthorize` a nivel de endpoints para gestión administrativa.
- **CORS** por patrón (`http(s)://localhost:*`, `https://gestioninventario.duckdns.org`).
- Backend **sin puerto público** en producción (solo `expose` interno; Caddy + nginx).
- Ajustes manuales exigen **justificación ≥ 20 caracteres** y registran al usuario responsable.

---

## 8. Reglas de negocio del motor transaccional

### Ecuación fundamental de inventario
```
Stock_Actual = Σ Entradas − Σ Salidas + Σ Ajustes Positivos − Σ Ajustes Negativos
```
El stock no se actualiza con UPDATE directo "a ciegas"; los movimientos se registran dentro de `@Transactional` y el stock se deriva/incrementa de forma atómica (con bloqueo pesimista según `908b076`).

### Validaciones críticas
1. **Salida (Egreso):** `Cantidad Solicitada ≤ Stock_Actual`. Si se excede → `InsufficientStockException` (HTTP 422). **Nunca** saldo negativo.
2. **Entrada (Ingreso):** cantidad entera positiva `> 0`.
3. **Ajustes justificados:** TODO ajuste (`AJUSTE_MANUAL`, `CORRECCION_ENTRADA`, …) exige `motivo/justificación` (≥ 20 caracteres) y registra `usuario_id` responsable.
4. **Insumo inactivo:** no se permiten movimientos (HTTP 400 `"El insumo está inactivo. No se pueden registrar movimientos."`).
5. **Números:** se usa estrictamente `Integer`/`BigDecimal`; nunca `float`/`double`.

### Validación Bean (DTO)
Ejemplo de contrato en DTOs:
```java
@NotNull  @Min(1)                          Integer cantidad;
@NotBlank @Size(min = 20)                  String justificacion;
```

### Manejo de errores (`GlobalExceptionHandler`)
- `InsufficientStockException` → 422.
- `IllegalArgumentException` (reglas de negocio) → 400 con `message`.
- `MethodArgumentNotValidException` → 400 con `details` por campo.
- JSON malformado / enum inválido → 400 genérico.
- Respuestas siempre **JSON** (nunca HTML).

---

## 9. Auditoría (eventos)

Bitácora append-only en `audit_logs`, activada por `AuditService` (código → etiqueta). Requiere los permiso de ADMIN para consultarla. Eventos registrados:

`LOGIN`, `LOGIN_FALLIDO`, `MOVIMIENTO_CREADO`, `USUARIO_CREADO`, `USUARIO_ACTUALIZADO`, `USUARIO_ROL_CAMBIADO`, `USUARIO_ESTADO_CAMBIADO`, `EXPORTACION_PDF`, `EXPORTACION_EXCEL`, `EXPORTACION_PROYECCIONES_PDF`, `EXPORTACION_PROYECCIONES_EXCEL`, `INSUMO_CREADO`, `INSUMO_ACTUALIZADO`, `INSUMO_INACTIVADO`, `INSUMO_REACTIVADO`, `PRESENTACION_AGREGADA`, `QR_DESCARGA`, `QR_IMPRESION`, `QR_CONSULTADO`, `PASSWORD_CAMBIADO`.

La consulta soporta filtros (evento, usuario, rango de fechas) y paginación. Los nuevos eventos se reflejan en vivo vía WebSocket (`/ws`).

---

## 10. Despliegue

### Local (desarrollo)
```bash
cp .env.example .env      # editar valores locales
docker compose up -d --build
```
- App: `http://localhost:8081` | API: `http://localhost:8080/api`
- Usuario seed: `admin@inventario.com` / `admin123` (en local; **cambiar en producción**).
- **Importante:** tras cambiar credenciales en `.env`, usar `docker compose up -d --force-recreate --no-deps backend` (`restart` NO re-lee el `.env`).

### Producción (VPS)
1. Clonar/actualizar en la VPS (`git pull origin pro`).
2. Asegurar `.env` con: `DB_USERNAME`, `DB_PASSWORD`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `JWT_SECRET`, `TZ`.
3. `./deploy.sh` → levanta Caddy central (80/443) y `docker compose -f docker-compose.prod.yml up -d --build`.
   - `db` publica `5432` (para copias/backups).
   - frontend (nginx) en `8081`; backend solo interno.
4. Dominio: `https://gestioninventario.duckdns.org` (Caddy central).

> Nota operativa (lección del despliegue): el usuario superusuario de PostgreSQL es **`inventario`** (no `postgres`); para fijar la clave usar `docker exec -i <db-container> psql -U inventario`.

---

## 11. Testing

| Capa | Framework | Cómo se corre |
|---|---|---|
| Backend | JUnit 5 + Mockito | `./scripts/test_backend.sh` (imagen Docker `gradle:9.5.1-jdk21`; son los tests de `com.gestion.inventario.service.*`; reporte en `backend/build/reports/tests/test/index.html`) |
| Frontend | Vitest + React Testing Library + jsdom | `cd frontend && npm test` (una pasada) o `npm run test:watch`; test colocalizados `src/**/*.test.{ts,tsx}` |
| E2E | Python smoke test | `scripts/smoke_test_e2e.py` + `scripts/limpiar_e2e.sql` (limpieza de datos E2E) |

---

## 12. Versionado y ramas

- Flujo: **`desa` → `pre` → `pro`** (merges fast-forward; `pro` = producción).
- Tags de versión: **`v1.0.0`** apunta al punto de liberación de producción.
- Histórico relevante hasta v1.0.0 (`d7ff37f`): auditoría/WebSocket, blindaje del motor de movimientos, despliegue VPS (Caddy+PostgreSQL+JWT por env), recuperación de contraseña con correo HTML, rediseño de modales, inactivación de insumos, perfil con cambio de contraseña, QR de insumos inactivos y toasts unificados.

---

## 13. Variables de entorno (`.env`)

| Variable | Descripción | Local |
|---|---|---|
| `DB_USERNAME` | Usuario de PostgreSQL | `inventario` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `inventario` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Correo SMTP del sistema (códigos de recuperación) | carlosorozcok@gmail.com + app password |
| `JWT_SECRET` | Clave de firma del JWT (HS512) | valor fuerte |
| `TZ` | Zona horaria | `America/Guatemala` |
| `SPRING_PROFILES_ACTIVE` | Perfil Spring (prod) | `prod` |

Ver también `frontend/.env.example` (`VITE_API_URL`).