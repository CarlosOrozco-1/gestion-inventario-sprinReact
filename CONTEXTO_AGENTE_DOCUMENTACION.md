# CONTEXTO PARA EL AGENTE DE DOCUMENTACIÓN — SIGES

> **Documento de insumo** para el agente que redactará la **documentación técnica** y el
> **manual de usuario** de SIGES.
> **Fuente de verdad del código:** `deploy-local` / `desa`. Última revisión: **2026-09-30**.
>
> Este documento describe **cómo funciona el sistema hoy** (verificado contra el código),
> para que la documentación resultante sea precisa. No sustituye al código: si algo
> no coincide con el código, **manda el código**.

---

## 1. Identidad del sistema

- **Nombre:** SIGES — Sistema de Gestión de Inventario de Insumos.
- **Propósito:** control ultra-preciso de entradas, salidas y ajustes justificados de un
  catálogo de insumos con múltiples presentaciones por material.
- **Usuarios reales:** una útiles (Gobierno de Guatemala, dominio `pdh.org.gt`). El manual
  se escribe para ellos, no para developers.
- **Roles:** `ADMIN`, `JEFE`, `AUXILIAR` (jerarquía por `nivel`: ADMIN 100, JEFE 80, AUXILIAR 50).

---

## 2. Stack (verificado)

| Capa | Tecnología | Nota para la doc |
|---|---|---|
| Frontend | React 19 + Vite 8 + React Router 7 | SPA; todo se sirve como un solo build estático |
| Estado | Zustand 5 (`useAuthStore`, `useToastStore`) | El login persiste en `localStorage` |
| Peticiones HTTP | Axios con interceptor JWT | Todas las llamadas por el cliente `api` |
| UI | Tailwind CSS 4 + componentes propios | Tono azul (`brand-*`), modales/toasts propios |
| Testing front | Vitest + React Testing Library + jsdom | `cd frontend && npm test` |
| Backend | Spring Boot 4.1.x (Java 21) | API REST JSON bajo `/api` |
| Build back | Gradle (Docker `gradle:9.5.1-jdk21`) | Tests: `./scripts/test_backend.sh` |
| Persistencia | Spring Data JPA / Hibernate | |
| Base de datos | PostgreSQL 16 | BD real: **`inventario`**, usuario por defecto `inventario` |
| Migraciones | Flyway (`V1`…`V8`) | Se aplican solas al arrancar el backend |
| Seguridad | Spring Security + JWT (HS512) + BCrypt | Sin estado (stateless) |
| Errores | `@RestControllerAdvice` (`GlobalExceptionHandler`) | Respuestas siempre JSON |
| Tiempo real | WebSocket nativo `/ws/auditoria` | Solo **señales**; el dato se re-consulta por REST |
| Sonido QR | Web Audio API (`src/utils/sound.ts`) | Sin archivos de audio |
| Escáner QR | `qr-scanner` | Decodifica a resolución nativa (migrado desde html5-qrcode) |

---

## 3. Arquitectura y despliegue (verificado)

```
Navegador (SPA React)
        │ HTTPS
        ▼
Reverse proxy (Caddy en producción / túnel Cloudflare en local)
        │
        ▼
Frontend nginx (8081)  ── /api y /ws ──▶  Backend Spring Boot (8080, interno)
                                              │
                                              ▼
                                          PostgreSQL 16 (inventario)
```

- En **producción**: dominio `https://gestioninventario.duckdns.org` (Caddy central en
  `caddy-central/`). El backend **no** se expone a internet; solo el frontend nginx
  publica y proxya `/api` y `/ws`.
- En **desarrollo/despliegue local**: backend `8080`, frontend `8081`, postgres `5432`, y
  un túnel HTTPS de Cloudflare para habilitar la **cámara QR** (los navegadores exigen
  HTTPS para la cámara; en `http://192.168...` la cámara no funciona).
- Todo se configura por **variables de entorno en `.env`** (ver §8). El build es el mismo
  en todos los ambientes; solo cambian los valores del `.env`.

---

## 4. Módulos y accesos (fuente: `frontend/src/access.ts` + `App.tsx` + `@PreAuthorize`)

Rutas protegidas. El menú lateral se filtra por rol; el backend refuerza con
`@PreAuthorize` (la UI oculta, pero la seguridad real es el backend).

| Ruta | Módulo | Quién entra | Qué hace el usuario |
|---|---|---|---|
| `/` | **Inicio / Dashboard** | Todos | Resumen de operación (ver §5). |
| `/insumos` | **Catálogo de Insumos** | ADMIN, JEFE | Ver/crear/editar **materiales** y sus **presentaciones**, ver QR, activar/inactivar, buscar, escanear QR. |
| `/movimientos` | **Kárdex (Movimientos)** | ADMIN, JEFE, AUXILIAR | Registrar **entradas** y **salidas** por presentación; ver historial con filtros. |
| `/ajustes` | **Ajustes / Correcciones** | ADMIN, JEFE | Registrar **ajustes** (sobrante/merma) con **justificación obligatoria ≥ 20 caracteres**. |
| `/reportes` | **Reportería** | Todos | Filtrar movimientos por usuario/insumo/tipo/fecha y **exportar a Excel y PDF**. |
| `/proyecciones` | **Proyecciones (Smart Restock)** | ADMIN, JEFE | Sugerencias de reposición (stock mínimo/máximo) según consumo; exportar. |
| `/auditoria` | **Auditoría (bitácora)** | ADMIN | Bitácora de **todos** los eventos del sistema; filtros y **tiempo real**; exportar. |
| `/usuarios` | **Gestión de Usuarios** | ADMIN | Crear/editar usuarios, cambiar rol, activar/suspender. |
| `/login`, `/recuperar` | Autenticación / Recuperar contraseña | Público | Login; recuperar contraseña por correo con código de 6 dígitos. |
| — | **Mi Perfil** | Todos | Modal desde el sidebar: ver mis datos y **cambiar mi contraseña**. |

### Notas de rol importantes para el manual

- El catálogo es **general/compartido**: lo crea el ADMIN (los JEFE lo consultan y lo edita,
  el ItemController exige ADMIN para crear/editar materiales y agregar presentaciones;
  JEFE sí puede activar/inactivar).
- Los movimientos y la reportería están abiertos a los **tres roles**.
- La auditoría y la gestión de usuarios son **exclusivas del ADMIN**.
- **Ajustes** (correcciones de inventario) son de ADMIN/JEFE, no del auxiliar: son acciones
  con impacto patrimonial y exigen justificación.

---

## 5. Dashboard — qué muestra

Tarjetas/resúmenes de la operación: totales de insumos, alertas de **stock bajo**,
movimientos recientes, y accesos rápidos. (Pendiente: el agente puede querer el detalle
exacto de cada tarjeta revisando `frontend/src/pages/Dashboard.tsx`.)

---

## 6. Flujos clave del usuario (para redactar el manual paso a paso)

### 6.1 Iniciar sesión
1. Entrar a la app → pantalla de Login (correo + contraseña).
2. Validar contra BD (BCrypt); sesión con **JWT**.
3. Según el rol, el menú lateral muestra solo los módulos permitidos.
4. Un **login fallido** queda registrado en la bitácora (`LOGIN_FALLIDO`) como seguridad.

### 6.2 Recuperar contraseña (si olvidó la clave)
1. Login → "¿Olvidaste tu contraseña?" → pantalla **Recuperar**.
2. Ingresar el **correo**. La respuesta es **genérica** ("si está registrado, recibirás un
   código") — nunca revela si el correo existe (anti-enumeración de correos).
3. Si el correo está registrado, el sistema envía por **correo** un **código de 6 dígitos**
   (válido **10 minutos**, máx. **5 intentos**, uso único).
4. Ingresar el código → validar → escribir la nueva contraseña (mín. 8) y confirmar.
5. La nueva contraseña queda activa de inmediato.

> La **contraseña de aplicación** de Gmail viaja por variable de entorno `MAIL_PASSWORD`
> (no se escribe en el código). El correo sale desde la casilla institucional.

### 6.3 Registrar un movimiento (entrada/salida) — Kárdex
1. `/movimientos` → **Registrar Movimiento** o **Escanear QR**.
2. Elegir la **presentación** (insumo + presentación + stock actual; el stock se colorea
   rojo = bajo / verde = óptimo).
3. Tipo: **Entrada** (suma) o **Salida** (resta). Cantidad **entera > 0**.
4. Detalle/nota.
5. Botón **Continuar** → **modal de confirmación** con el resumen (insumo, cantidad, stock
   resultante) → **Confirmar**.
6. Al confirmar se guarda y se registra en auditoría (`MOVIMIENTO_CREADO`). La pantalla se
   **actualiza en vivo** si otro usuario registra algo.

**Regla dura:** una **salida no puede exceder el stock disponible** (nunca saldo negativo);
el backend lo bloquea con un error claro si se intenta.

### 6.4 Registrar un ajuste (corrección) — Ajustes
Igual que el movimiento, pero solo tipos de **ajuste** (positivo/negativo, sobrante/merma) y
**exige justificación escrita de mínimo 20 caracteres**. Queda registrado con el usuario
responsable (trazabilidad). Solo ADMIN/JEFE.

### 6.5 Gestionar el catálogo — Insumos (ADMIN/JEFE)
- **Crear material** (Item): código interno (autogenerado y editable, **inmutable después**),
  nombre.
- **Agregar/editar presentación** (variante: ej. "1 Galón", "Unidad"): stock, mínimo, máximo,
  costo estimado; genera su **código QR**.
- **Ver QR**: clic en el QR → modal grande con **Descargar PNG** e **Imprimir cartel**.
  El modal además muestra el **string del QR** (`SIGES-PRES-{id}`) con botón **Copiar**, para
  generar/etiquetar con impresoras externas (p. ej. Brady).
- **Activar/Inactivar**: un material inactivo **no admite movimientos** ni aparece en el
  catálogo activo.
- **Buscar** (por nombre/código/presentación) y **Escanear QR** para ubicar y editar rápido.

### 6.6 Reportería (todos)
1. `/reportes` → filtrar por **Usuario, Insumo, Tipo y Rango de fechas**.
2. Previsualización de movimientos filtrados.
3. **Exportar a Excel o PDF** del subconjunto filtrado.
   > Nota: el filtro de **Usuario** requiere el endpoint resumen `/api/usuarios`
   (habilitado para los tres roles; el CRUD completo `/usuarios/admin` es solo ADMIN).

### 6.7 Auditoría (ADMIN)
Ver bitácora de eventos (login, movimientos, ajustes, cambios de usuarios, exportaciones,
QR) con filtros por evento/usuario/fecha; se actualiza **en vivo** vía WebSocket.

### 6.8 Gestión de usuarios (ADMIN)
Crear usuario (correo, nombre, contraseña inicial, **rol**), editar datos, **cambiar rol**,
**activar/suspender**. No se puede cambiar el propio rol ni auto-suspenderse.

---

## 7. Conceptos de negocio (para explicarlos en el manual)

- **Material (Item):** el producto base (p. ej. "Alcohol Etílico"). Código interno único.
- **Presentación:** una variante/medida de un material (p. ej. "1 Galón", "Unidad", "1 Litro").
  **El stock vive en la presentación**, no en el material. Un material puede tener varias
  presentaciones con stock independiente.
- **Movimiento:** entrada, salida o ajuste sobre una presentación. Todo movimiento queda en
  el kárdex y en la auditoría.
- **Código QR:** identificador **estable de la presentación** con formato **`SIGES-PRES-{id}`**
  (id inmutable). Se usa para consultar/operar rápido escaneando. El QR apunta a la
  **presentación**, no al material.
- **Ajuste:** corrección de inventario (sobrante/merma) que **siempre** requiere justificación.
- **Auditoría:** bitácora append-only (nunca se edita/borra) de toda acción relevante.
- **Proyección / Smart Restock:** sugerencia de stock mínimo/máximo calculada del consumo
  histórico (el cálculo vive en el backend; el usuario solo ve el resultado).

---

## 8. Variables de entorno (`.env`) — para el documento de despliegue

| Variable | Para qué | Ejemplo |
|---|---|---|
| `DB_USERNAME` / `DB_PASSWORD` | Conexión PostgreSQL | `inventario` / (secreto) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Correo SMTP (códigos de recuperación). Gmail requiere **contraseña de aplicación**. | `casilla@…` / `xxxx xxxx …` |
| `JWT_SECRET` | Firma de tokens (HS512, ≥64 bytes). **Cambiar por entorno.** | `openssl rand -hex 48` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (separados por comas, admite comodines). | `http://192.168.200.*:*,https://*.trycloudflare.com` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin inicial, sincronizado por el seeder en cada arranque. | — |
| `TZ` | Zona horaria | `America/Guatemala` |

> **Seguridad:** `.env` **nunca** se sube a git (está en `.gitignore`); se copia de
> `.env.example`. Cambiar el `.env` exige **recrear** el contenedor (un `restart` no re-lee).

---

## 9. Ramas y flujo de despliegue (ver `FLUJO_DESPLIEGUE.md`)

- `desa` (desarrollo) → `pre` (pruebas) → `pro` (producción). Código siempre avanza hacia adelante.
- Existe además `deploy-local` para validaciones continuas en el servidor local.
- Tests que deben pasar antes de promover: `cd frontend && npm test && npm run build` y
  `./scripts/test_backend.sh`.

---

## 10. Guia para el agente de documentación (instrucciones)

1. **Manual de usuario:** redactar por **rol** y por **pantalla**, en lenguaje claro sin
   tecnicismos. Incluir: login, recuperación de contraseña, catálogo (material vs
   presentación), kárdex (entrada/salida), ajustes con justificación, reportería + exports,
   auditoría, gestión de usuarios, mi perfil. Capturas/lugares exactos puede sacarlos de
   `frontend/src/pages/*.tsx`.
2. **Documentación técnica:** actualizar/alinear con `DOCUMENTACION_SISTEMA.md` (arquitectura,
   API REST, modelo de datos, reglas de negocio, auditoría, despliegue, variables). Si un
   endpoint cambió (p. ej. `/usuarios` resumen para los tres roles), reflejarlo.
3. **No inventar:** toda afirmación debe ser verificable contra el código citado. Si algo no
   está claro, márcalo como "pendiente de confirmar" en lugar de suponerlo.
4. **Vocabulario:** usar los términos del §7 de forma consistente; "material" y
   "presentación" no son sinónimos.

---

## 11. Archivos clave para consultar mientras se documenta

- Rutas/módulos: `frontend/src/App.tsx`, `frontend/src/access.ts`.
- Pantallas: `frontend/src/pages/*.tsx`.
- Layout/menú/perfil: `frontend/src/components/Layout.tsx`.
- Cliente HTTP/JWT: `frontend/src/api/axios.ts`, `frontend/src/store/useAuthStore.ts`.
- API (contratos): `backend/.../controller/*.java`, `backend/.../dto/*.java`.
- Reglas de negocio: `backend/.../service/{MovimientoService,ItemService,PasswordResetService,AuditService}.java`.
- Modelo/BD: `backend/.../model/*.java` + `backend/src/main/resources/db/migration/*.sql`.
- Errores: `backend/.../exception/GlobalExceptionHandler.java`.
- Tareas pendientes para la doc: detalles exactos del Dashboard (`pages/Dashboard.tsx`).