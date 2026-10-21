# Contexto de trabajo — cómo retomar el proyecto

**Última actualización:** 2026-10-12

> Este documento existe porque las sesiones de trabajo se van a perder con el
> formateo de la máquina. Resume qué es el sistema, qué se hizo, qué decisiones
> no se deben romper y cómo levantar, probar y desplegar. Los pendientes
> accionables están en [`docs/generales/pendientes.md`](PENDIENTES.md).

---

## 1. Qué es el proyecto

**SIGES V2** — Sistema de Gestión de Inventario de Insumos. Migración del sistema
viejo (SQLite) a una arquitectura **Spring Boot + React + PostgreSQL**.

Stack (detalle completo en `AGENTS.md` §1):

- **Backend:** Spring Boot 3.x (Java 17/21), Spring Data JPA/Hibernate,
  PostgreSQL con migraciones **Flyway** (ya NO se usa SQLite), Spring Security +
  JWT, errores centralizados con `@RestControllerAdvice`.
- **Precisión numérica:** cantidades/dinero siempre en `BigDecimal` o `Integer`.
  **Prohibido `float`/`double`.**
- **Frontend:** React 18 + Vite + Tailwind, React Router v6, Zustand/Redux,
  Axios con interceptores de JWT.
- **Infra:** Docker / Docker Compose.

Estado de fases (`AGENTS.md` §7): **Fases 1-9 completadas** más el ítem 10
(eliminación lógica de presentaciones con motivo obligatorio). **Fase 10
(bodegas) pendiente** (`AGENTS.md` §8, diseño en
`docs/upgrade-V2-Manejo-de-bodegas.md`).

---

## 2. Estado del repositorio y entornos

Al cierre (2026-10-12), en `origin`:

| Rama | SHA | Qué es |
|---|---|---|
| `desa` | `7626146` | Integración/desarrollo. Incluye `PENDIENTES.md` y este doc. |
| `deploy-local` | `f640fe5` | Config de despliegue local (scripts, túnel, IP en `.env`). |
| `master` | `fcfd851` | Rama histórica. |
| `pre` / `pro` | `cc0426b` | Entornos previos a Fase 9 (desactualizados). |
| `feat/inactivar-logico` | `f640fe5` | Rama de la feature (duplica `deploy-local`). |
| `integrate-desa` | `78bbef2` | Rama temporal de cherry-picks. |
| `respaldo/pre-formateo-2026-10-12` | `92e86ff` | Snapshot del worktree antes de formatear. |

- **No hay CI/CD.** El despliegue es manual (`./deploy.sh` en el servidor, que
  hace `docker compose -f docker-compose.prod.yml up -d --build`).
- **`git pull` no reconstruye imágenes:** hay que correr `./deploy.sh`.
- **Flyway solo migra al arrancar el backend**, así que un cambio de esquema
  (p. ej. `V9`) exige **reiniciar/reconstruir el backend**.

---

## 3. Qué se hizo en las sesiones recientes

### 3.1 Eliminación lógica de material y presentaciones (feature principal)

Se dejó de borrar físicamente. Ahora se **inactiva**: la fila sigue visible en el
catálogo con su badge para poder reactivarla, pero queda **oculta** de
`/api/insumos`, de los selects, del QR operativo y de los movimientos.

Reglas (documentadas en `AGENTS.md` §5.3):

- **Motivo obligatorio al inactivar** (mínimo 10 caracteres), opcional al
  reactivar. Se guarda en `AuditLog.description` junto con las unidades
  retenidas (`PRESENTACION_INACTIVADA` / `PRESENTACION_REACTIVADA`, y sus pares
  de material).
- La validación está **centralizada** en `ItemService.validarMotivoInactivacion`
  y la llaman tanto el controller como el service (defensa en profundidad).
- **Solo `ADMIN` y `JEFE`** cambian estados.
- `MovimientoService` **rechaza** movimientos hacia un material o presentación
  inactiva, aunque se llame la API directo.
- El QR usa el **estado efectivo**: `item.activo AND presentacion.activo`.
- Reporte Excel con columnas separadas: **"Estado material" (9)**, **"Estado
  presentación" (10)** y QR en la 11.

Piezas:

- **BD:** `V8__add_activo_items.sql`, `V9__add_activo_presentations.sql`
  (`presentations.activo BOOLEAN NOT NULL DEFAULT TRUE`).
- **API:** `PUT /api/items/{id}/estado` y `PUT /api/presentations/{id}/estado`,
  con `EstadoRequestDTO { activo, motivo }` y `@PreAuthorize` para `ADMIN/JEFE`.
- **Frontend:** `frontend/src/components/EstadoInsumoModal.tsx` (+ su `.test.tsx`)
  y la integración en `frontend/src/pages/Insumos.tsx` (acciones Activar/Inactivar
  por presentación, badge "Inactiva", toast al operar el QR).

### 3.2 IP del servidor centralizada en el `.env` (solo `deploy-local`)

El servidor recibe la IP por **DHCP** y cambió `.23` → `.26`. Como no hay acceso
al router para fijarla, se dejó de repetir en el código:

- `.env.example` declara `SERVER_IP`, `APP_PUERTO`, `API_PUERTO`.
- `deploy-local.sh` lee esas variables del `.env` (con `grep`/`cut`, sin ejecutar
  el archivo) e imprime las URLs; si faltan, avisa en vez de inventar una IP.
- `DESPLIEGUE_LOCAL_UBUNTU.md` ya no lleva IP hardcodeada.
- El túnel de Cloudflare (`tunnel-local/docker-compose.yml`) apunta a
  `host.docker.internal`, así que **no depende de la IP**.
- **CORS** usa el comodín `http://192.168.200.*:*` (no `${SERVER_IP}`), que cubre
  cualquier IP de la LAN sin depender de la interpolación de Compose.

Commit: `f640fe5`.

### 3.3 Estilos de botón en una fuente única (`buttonStyles`)

Commits `37660c3` (desa) y `3bc4d18` (deploy-local). `frontend/src/utils/buttonStyles.ts`
es la **única** fuente de estilos de botón (regla en `AGENTS.md` §5.1/§5.2 y en
la skill `.opencode/skills/mejora-ux/`). No reintroducir estilos inline.

---

## 4. Reglas que NO se deben romper

- `BigDecimal`/`Integer` siempre; nunca `float`/`double`.
- **Nunca borrado físico** de insumos ni presentaciones: se inactivan.
- Motivo obligatorio (≥ 10 caracteres) al inactivar.
- Los movimientos hacia material/presentación inactiva se rechazan en el backend.
- QR: nomenclatura **`SIGES-PRES-{id}`** (`presentations.qr_code`, formato estable
  desde `V6`). El **código del insumo no resuelve** el endpoint
  `GET /api/presentations/qr/{qrCode}` → da 404 (búsqueda por igualdad exacta).
- La cámara del escáner QR solo funciona en **contexto seguro** (HTTPS o
  `localhost`); por HTTP en una IP de red el navegador no expone `mediaDevices`.
- Orden de validaciones: en el **service** el permiso se evalúa antes que la regla
  de negocio, pero en la capa **HTTP** `@Valid` corre antes (p. ej. `quantity`
  con `@Min(1)`), así que un payload inválido da **400 a los tres roles**.

---

## 5. Infraestructura y entornos

- **Servidor:** Ubuntu en la LAN, con Docker. IP **por DHCP** (`192.168.200.26` al
  cierre); IP pública `129.153.104.237` (SSH por clave rechazado para `root` y
  `ubuntu` al cierre). Sin acceso al router, sin reserva de DHCP.
- **SSH:** alias `siges` en `~/.ssh/config` (`HostName` + `HostKeyAlias siges` +
  `IdentityFile`). Huella del servidor:
  `ssh-ed25519 SHA256:7l97rMSE1Qr9PvINFA7KGL2klO71D2aB4tokMXpaLsQ`. **Pendiente**
  autorizar la clave pública en el servidor (ver `PENDIENTES.md`).
- **Puertos:** app `8081`, API `8080`. En la máquina de trabajo el puerto `80` lo
  ocupa **otra** aplicación (Portal de Gestión DTI), por eso SIGES va en `8081`.
- **Túnel Cloudflare:** en `tunnel-local/` (URL `*.trycloudflare.com`, que cambia
  al reiniciar; hay un watchdog/systemd). Sirve para habilitar la cámara del QR.
- **CORS:** se configura en `CORS_ALLOWED_ORIGINS` del `.env` de la raíz. Incluye
  `http://192.168.200.*:*` y `https://*.trycloudflare.com`.
- **Secretos (NO están en git):** `.env` de la raíz del servidor (`JWT_SECRET`,
  `DB_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MAIL_USERNAME`,
  `MAIL_PASSWORD`) y `tunnel-local/.env`. Respaldarlos aparte.
- **Backups:** `scripts/backup_nas.sh` (cron diario 23:00) hacia la NAS
  `//unasserver.edph.local/compartido`.

---

## 6. Comandos útiles

**Levantar el stack local** (requiere un `.env` en la raíz con `JWT_SECRET`,
`DB_*`, `ADMIN_*`):

```bash
docker compose up -d --build
```

**Backend:**

```bash
./gradlew compileJava
./gradlew test        # contextLoads() falla si no hay PostgreSQL local (esperado)
```

**Frontend:**

```bash
cd frontend
npm ci
npm run test
npm run lint
npm run build
```

**Desplegar en el servidor:**

```bash
git pull
./deploy.sh
docker compose -f docker-compose.prod.yml logs backend | grep -i flyway   # debe decir version 9
```

**Verificación E2E:**

```bash
python scripts/smoke_test_e2e.py
```

**Aviso crítico:** `scripts/limpiar_e2e.sql` hace `DELETE FROM audit_logs`.
**Nunca** correrlo en el servidor con datos reales, solo en entornos de prueba o
tras un `pg_dump`.

---

## 7. Trampas conocidas

- `scripts/smoke_test_e2e.py` usaba contraseñas de 6 caracteres, pero el backend
  exige 8 desde el endurecimiento de permisos. Ya se corrigió a `E2eClave2026`;
  si se escriben pruebas nuevas, usar ≥ 8.
- `scripts/test_permisos.sh` necesita `jq`, que **no** está instalado en el equipo
  local; existe solo en `deploy-local`.
- `ssh-keyscan` falla en Windows (`unsupported KEX sntrup761x25519...`), aunque
  `ssh` negocia `curve25519-sha256` sin problema.
- En PowerShell `git commit -F -` no funciona: hay que pasar un **archivo** de
  mensaje. Y los worktrees fuera del repo necesitan
  `-c safe.directory=<ruta>` en cada comando.
- El worktree principal quedó con **ACLs rotas** ("Acceso denegado" al escribir
  archivos existentes, causado por un sandbox de `codex` corriendo). Al formatear
  y clonar de nuevo se resuelve.
- No escribir `${SERVER_IP}` en `CORS_ALLOWED_ORIGINS`: el comodín de la LAN ya
  cubre cualquier IP y evitar interpolar la variable en Compose.

---

## 8. Mapa de archivos clave

- `AGENTS.md` — reglas del proyecto (§1 stack, §5 UI/UX incl. §5.3 estados
  lógicos, §7 fases completadas, §8 Fase 10).
- `docs/generales/pendientes.md` — pendientes accionables.
- `docs/upgrade-V2-Manejo-de-bodegas.md` — diseño de la Fase 10.
- `backend/src/main/resources/db/migration/V9__add_activo_presentations.sql`.
- `backend/src/main/java/com/gestion/inventario/service/ItemService.java`
  (`validarMotivoInactivacion`, `cambiarActivo*`, `listarVistaInsumos`).
- `backend/src/main/java/com/gestion/inventario/service/MovimientoService.java`
  (bloqueo de movimientos a inactivos).
- `backend/.../controller/ItemController.java`,
  `PresentationController.java`, `ReporteController.java`.
- `backend/.../dto/EstadoRequestDTO.java`, `model/Presentation.java`,
  `service/AuditService.java`.
- `frontend/src/components/EstadoInsumoModal.tsx` (+ `.test.tsx`),
  `frontend/src/pages/Insumos.tsx`.
- `frontend/src/utils/buttonStyles.ts` (+ `.test.ts`).
- `scripts/smoke_test_e2e.py`, `scripts/test_permisos.sh`,
  `scripts/limpiar_e2e.sql`.
- `deploy-local.sh`, `DESPLIEGUE_LOCAL_UBUNTU.md`, `tunnel-local/`.

---

## 9. Verificaciones registradas (al cierre)

- Backend: `compileJava` OK; `gradlew test` **35/36** (el único fallo es
  `contextLoads()` por no haber PostgreSQL local; es ambiental).
- Frontend: **72** pruebas OK + `lint` + `build` en ambas ramas.
- Smoke test E2E: **93 PASS / 0 FAIL** (antes 64), con la BD de pruebas limpiada.
- Frontend local en `http://localhost:8081` validado: React monta, login vía
  nginx devuelve token, assets con `Cache-Control: no-cache` y 404 correctos.
- Migración `V9` verificada aplicada en `flyway_schema_history` (entorno local).
- **Pendiente en el servidor:** desplegar `f640fe5` y confirmar `V9` (ver
  `PENDIENTES.md`).

---

## 10. Orden sugerido para retomar

1. Clonar el repo y hacer `checkout desa`.
2. Rehacer el entorno: `.env` (copiando los secretos respaldados) y
   `~/.ssh/config` (alias `siges`).
3. Leer `docs/generales/pendientes.md`.
4. Desplegar en el servidor y verificar `V9`, frontend y túnel.
5. Seguir con `/ws/auditoria`, BOM UTF-8 y la Fase 10 de bodegas.
