# Checklist de Seguridad - SIGES

**Última actualización:** 2026-10-12
**Objetivo:** Verificar la seguridad del sitio web aplicando estándares mínimos y reutilizando las skills disponibles (`deploy-docker`, `validacion-e2e`).

> **Nota:** Este checklist se apoya en el estado actual del proyecto (JWT stateless + BCrypt, CORS por patrones, Bean Validation, `@RestControllerAdvice`, `@Transactional`, separación de `.env`, HTTPS detrás de Caddy, WebSocket en `/ws/**`).

---

## 1. Pre-despliegue (Local / CI)

### 1.1 Pruebas y build
- [ ] **Tests backend:** `scripts/test_backend.sh` ejecutado y sin fallos.
- [ ] **Tests frontend:** `cd frontend && npm test` (una sola pasada) sin fallos.
- [ ] **Build frontend:** `cd frontend && npm run build` exitoso. Revisar warnings.
- [ ] **Build backend:** compila sin errores (validado por script Docker).

### 1.2 Dependencias y secretos
- [ ] **Frontend:** `npm audit --production` revisado. Registrar CVEs y plan de mitigación.
- [ ] **Backend:** revisar `build.gradle` por dependencias obsoletas si aplica.
- [ ] **Secrets fuera de git:** `.env` no versionado. Verificar `.gitignore` cubre `.env`, `*.env.bak.*`, respaldos.
- [ ] **Sin secretos hardcodeados:** buscar `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, credenciales SMTP. Solo deben vivir en `.env` / variables de entorno.
- [ ] **Revisión concreta:** validar `JwtUtil`, `DataSeeder` y `application.properties` no contienen credenciales en texto plano.
- [ ] **JWT seguro:** `JWT_SECRET` tiene longitud suficiente (>= 32 bytes) y distinto por entorno.

### 1.3 Configuración de seguridad
- [ ] **Rutas públicas:** confirmar en `SecurityConfig` que solo `/api/auth/**`, `/error` y `/ws/**` son `permitAll`. Documentar justificación si se añade alguna.
- [ ] **Endurecer WebSocket:** evaluar exigir autenticación en handshake para `/ws/auditoria` (actualmente `permitAll`). Registrar acción.
- [ ] **Métodos y CORS:** `CorsConfigurationSource` usa `allowedOriginPatterns` con dominios autorizados únicamente (`localhost:*`, `https://localhost:*`, `https://gestioninventario.duckdns.org`).
- [ ] **Stateless:** `SessionCreationPolicy.STATELESS` activo. No hay sesiones HTTP.
- [ ] **Exception handling:** `authenticationEntryPoint` devuelve JSON 401 consistente. `@RestControllerAdvice` centraliza errores.

### 1.4 Datos y transaccionalidad
- [ ] **Validación:** `@Valid` + Bean Validation en DTOs críticos (movimientos, ajustes, usuarios).
- [ ] **Transaccionalidad:** operaciones que modifican stock llevan `@Transactional`.
- [ ] **Ajustes:** justificantes obligatorios (>= 20 caracteres) cuando corresponde.
- [ ] **Inactivos:** movimientos bloqueados sobre insumos/presentaciones inactivas.

---

## 2. Despliegue / Runtime

### 2.1 Exposición de red
- [ ] **Puertos internos:** backend escucha solo en contenedor (8080). Frontend 80 interno → expuesto 8081 vía reverse proxy.
- [ ] **Sin exposición innecesaria:** PostgreSQL **NO** expuesto públicamente (sólo red interna Docker). Verificar `docker-compose.prod.yml`.
- [ ] **Reverse proxy:** Caddy/nginx fuerza HTTPS y enruta `/api/*` al backend.
- [ ] **DNS/HTTPS:** certificado válido. Redirección HTTP→HTTPS activa.

### 2.2 Headers de seguridad
- [ ] **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (si aplica detrás de proxy, asegurar que Caddy lo añade).
- [ ] **X-Content-Type-Options:** `nosniff`
- [ ] **X-Frame-Options:** `DENY` (o `SAMEORIGIN` si hay necesidad legítima). Evaluar impacto.
- [ ] **Referrer-Policy:** `strict-origin-when-cross-origin`
- [ ] **Permissions-Policy:** restringir features innecesarias (`camera=*` permitido para QR; documentar).
- [ ] **CSP:** proponer política restrictiva compatible con Vite/React + WebSocket. **No romper** escaneo QR ni `/ws/auditoria`. Documentar propuesta y validación.

### 2.3 Autenticación / Autorización
- [ ] **Tokens:** JWT con `exp` razonable. `Authorization: Bearer` utilizado.
- [ ] **Logout:** limpia `token` y `user` en `localStorage` + estado Zustand.
- [ ] **Roles:** `@PreAuthorize` aplicado donde corresponde. Validar aislamiento por rol.
- [ ] **Login:** evaluar rate limiting (ej. bucket/token bucket) ante brute force. Registrar decisión (hoy no implementado).
- [ ] **Password reset:** tokens de un solo uso, expiración, validación por email.

### 2.4 Logs y trazabilidad
- [ ] **Sin stacktraces en respuestas:** `@RestControllerAdvice` devuelve JSON sin trazas internas en producción.
- [ ] **Logs mínimos:** evitar loggear secretos/tokens. `JwtAuthenticationFilter` solo loguea errores necesarios.
- [ ] **Auditoría:** eventos críticos registrados (`PASSWORD_CAMBIADO`, movimientos, ajustes con justificación). Revisar integridad.
- [ ] **Accesos:** revisar logs backend tras despliegue (errores 401/403 esperados).

---

## 3. Validación funcional post-despliegue

### 3.1 Smoke test
- [ ] **E2E:** ejecutar `scripts/smoke_test_e2e.py` vía skill **validacion-e2e** contra entorno objetivo.
- [ ] **Endpoints críticos:** login, catálogo, movimientos, ajustes, auditoría, perfil.
- [ ] **QR:** escaneo funciona (migración a `qr-scanner` vigente). Fallback manual operativo.

### 3.2 Verificaciones técnicas
- [ ] **Scripts de verificación:** ejecutar `scripts/verify_frontend.sh`, `scripts/verify_paginacion.sh` si aplican al entorno.
- [ ] **Flyway:** historial correcto tras migraciones (`V1–V9` hasta estado actual).
- [ ] **Health/estado:** frontend carga (200), API responde con 401 sin token (esperado), 200 con token válido.
- [ ] **WebSocket:** conexión a `/ws/auditoria` estable (si autenticado) sin errores CORS/upgrade.

### 3.3 Evidencias
- [ ] **Checklist ejecutado:** marcar ítems, incluir **fecha**, **entorno** (`desa/pre/pro`), **responsable**.
- [ ] **Hallazgos:** listar issues con severidad (Crítica/Alta/Media/Baja) y acciones.
- [ ] **Decisiones:** registrar si se posterga endurecimiento de `/ws/auditoria` o rate limiting, con justificación.
- [ ] **Vinculación:** referenciar PR/commit/tag (`v1.0.1` u otro) y evidencias (logs/capturas).

---

## 4. Referencias
- `AGENTS.md` – reglas de negocio, transaccionalidad, validaciones
- `docs/despliegue/flujo_despliegue.md` – desa→pre→pro, rollback
- `docs/generales/pendientes.md` – seguimiento de deuda
- `.opencode/skills/deploy-docker` – despliegue/validación
- `.opencode/skills/validacion-e2e` – smoke test E2E
