# Mejoras e Implementaciones del Sistema

> **Sistema:** SIGES — Sistema de Gestión de Inventarios
> **Objetivo:** Llevar el registro de las mejoras, refactors e implementaciones
> que se hacen sobre el sistema, explicando *cómo funcionan* para facilitar su
> mantenimiento y trazabilidad. Cada entrada documenta el cambio, los archivos
> involucrados y el comportamiento resultante.

Convención: anexar cada nueva mejora/implementación al final de este documento,
con fecha, descripción y archivos afectados.

---

## 1. Rediseño de los Modales de Movimiento y Ajuste

**Fecha:** 2026-08-31
**Naturaleza:** Mejora de UX y seguridad del flujo de movimientos/ajustes.

### Descripción
Se rediseñaron los modales de **Movimiento** (Kárdex) y **Ajuste** (Auditoría) para:
- Mostrar el **insumo** y el **stock actual** en campos separados (ya no en la
  misma línea del `select`).
- Colorear el stock según su nivel (rojo = bajo, verde = óptimo).
- Convertir el **detalle/justificación** en obligatorio (mínimo 20 caracteres).
- Agregar un **modal de confirmación** antes de persistir el movimiento/ajuste.

### Comportamiento
1. El usuario selecciona una presentación en el `select`.
2. Aparece una tarjeta (2 columnas) con el **insumo seleccionado** (nombre,
   presentación, tamaño, código interno) y el **stock actual** con un badge de
   color según `minStock`:
   - `stock < minStock` → badge **rojo** ("Stock Bajo").
   - `stock >= minStock` → badge **verde** ("Stock Óptimo").
3. Captura tipo, cantidad y detalle (obligatorio, `>= 20` caracteres; se muestra
   contador).
4. Al pulsar "Continuar" se abre un **ConfirmModal** que muestra el resumen
   (insumo, cantidad, stock resultante) y pregunta explícitamente si confirma
   la **entrada/salida** (o **sobrante/merma** en Auditoría).
5. Solo al confirmar se ejecuta la petición `POST /api/movimientos`.

### Archivos involucrados
- `frontend/src/components/MovimientoModal.tsx` — modal de movimiento.
- `frontend/src/components/AjusteModal.tsx` — modal de auditoría/ajuste.
- `frontend/src/components/ConfirmModal.tsx` — **nuevo**, modal de confirmación reutilizable.
- `frontend/src/utils/stockStatus.ts` — **nuevo**, helper que decide el color del stock.
- `frontend/src/store/useAuthStore.ts` — fuente del `usuarioId` real (reemplaza el valor quemado `1`).

### Notas
- `ConfirmModal` acepta un `tone` (`danger`/`success`/`warning`) para colorear el
  botón según el tipo de acción.
- La validación de detalle obligatorio (20+ chars) se aplica en el frontend; el
  backend ya exige justificación solo para los ajustes.

---

## 2. Generación Automática del Código de Insumo (Opción A)

**Fecha:** 2026-08-31
**Naturaleza:** Mejora de UX para no obligar al usuario a inventar el código.

### Descripción
En el alta de un material ("Registrar Nuevo Material") el campo **Número / Código
interno** ya no se deja vacío para que el usuario lo piense: se **autocompleta**
con una sugerencia de código. El usuario puede **editarlo** (poner su propio
código) y el sistema **valida en vivo** si ya existe.

### Decisión de diseño (Opción A — sin migración)
`items.code` es de tipo **`Integer`** en la BD (máximo 9 dígitos, `2,147,483,647`).
Para evitar una migración `Integer → String` se optó por:
- Generar la sugerencia como un **entero de 9 dígitos** elegido aleatoriamente
  dentro de un rango amplio (ej. `100,000,000` – `2,000,000,000`).
- Con ~1.9 mil millones de combinaciones y la **validación de unicidad en la BD**,
  la probabilidad de colisión es despreciable incluso creciendo a decenas de
  miles de registros.

### Comportamiento
1. Al abrir "Registrar Nuevo Material", el campo código se **autocompleta** con
   un número aleatorio válido.
2. El usuario puede **sobrescribirlo** (escribir su propio código).
3. **Validación en vivo:** al salir del campo (o al escribir) el frontend
   consulta si el código ya existe; si es así muestra **"El código ya está en
   uso"** (en rojo) y **bloquea el guardado**.
4. Como respaldo, el backend (`ItemService.crearItem`) sigue rechazando códigos
   duplicados.

### Archivos involucrados
- `frontend/src/components/InsumoModal.tsx` — generación de sugerencia y validación en vivo.
- `frontend/src/pages/Insumos.tsx` — pasa la lista de items existentes al modal.
- Backend: sin cambios (la validación de duplicados ya existe en `ItemService`).

---

## 3. Búsqueda y Edición de Insumos desde el Catálogo (QR o Buscador)

**Fecha:** 2026-08-31
**Naturaleza:** Mejora de UX para localizar y editar un producto sin recorrer la tabla.

### Descripción
En el módulo **Catálogo de Insumos** se agregaron dos vías para ubicar un insumo
y abrir su edición directamente, sin buscar fila por fila entre muchos materiales:

1. **Escáner QR:** se apunta la cámara al QR del insumo y el sistema encuentra la
   presentación y abre el modal de edición.
2. **Buscador:** modal que permite buscar por **nombre, código interno, presentación,
   tamaño o primeras letras**, y abrir la edición del material o de la presentación.

### Comportamiento
1. En el header del catálogo hay dos botones nuevos: **"Buscar insumo"** (lupa) y
   **"Escanear QR"**.
2. **Escanear QR:**
   - Usa el componente reutilizable `QrScanner`.
   - Al detectar un QR llama a `GET /api/presentations/qr/{qrCode}`.
   - Con el `id` de la presentación devuelta, busca en la lista de catálogo ya
     cargada el `Item` dueño de esa presentación y abre `edit-presentation`.
   - Si el QR no existe muestra el toast "Código QR no encontrado".
3. **Buscador (SearchModal):**
   - Campo de texto con auto-foco; filtra en vivo.
   - Coincidencias por: nombre del material, código del material (como texto),
     nombre de presentación y tamaño. Basta que estén contenidas (primeras letras).
   - Muestra dos grupos de resultados: **materiales** (abren `edit-item`) y
     **presentaciones** (abren `edit-presentation`).
   - Al hacer clic cierra el buscador y abre el modal de edición correspondiente.

### Archivos involucrados
- `frontend/src/components/SearchModal.tsx` — **nuevo**, modal de búsqueda del catálogo.
- `frontend/src/pages/Insumos.tsx` — botones "Buscar insumo" / "Escanear QR",
  `handleQrScan`, render de `SearchModal` y `QrScanner`.
- Backend: **sin cambios** (solo consumo del endpoint QR existente).

### Notas
- `InsumoModal` no se modificó para la búsqueda: la edición por QR/búsqueda
  reutiliza los modos `edit-item` y `edit-presentation` existentes.
- Como el QR devuelve el `id` de la presentación (no el `itemId`), el frontend lo
  resuelve buscándolo dentro de la lista de catálogo ya cargada.

---

## 4. Edición de Presentación con Contexto del Material + QR Estable

**Fecha:** 2026-08-31
**Naturaleza:** Corrección de UX + mejora de robustez del QR.

### 4.1 Campos de solo lectura del material en el modal de presentación

**Problema detectado:** Al editar una presentación (manualmente o vía escáner QR),
el modal solo mostraba los campos de la variante, sin indicar a qué **material**
pertenecía. Tras escanear un QR, el usuario editaba "a ciegas" sin saber qué
producto era, con riesgo de modificar por error la presentación equivocada.

**Solución:** Al editar/crear una presentación (`edit-presentation` /
`create-presentation`) el modal muestra ahora una tarjeta **"Material (solo
lectura)"** con el código interno y nombre del material en campos **no editables**
(`readOnly`, `cursor-not-allowed`). De este modo el material queda como referencia
inmutable y solo la presentación es modificable.

### 4.2 QR basado en el id de la presentación (formato estable)

**Problema detectado:** El QR usaba el formato `SIGES-ITEM-{code}-PRES-{id}`,
que dependía del **código interno del material** (editable por el usuario). Eso
presentaba tres inconvenientes:

1. **Inestabilidad:** si el usuario cambiaba el código del material, los QR ya
   impresos dejaban de resolver (el string dejaba de existir).
2. **Exposición de datos:** el QR revelaba el código interno del material a
   cualquiera que lo fotografiara.
3. **Redundancia:** el `id` de la presentación ya identifica de forma única al
   registro; duplicar el código del material era innecesario.

**Solución:** Se cambió el formato a **`SIGES-PRES-{id}`**, donde `{id}` es la clave
primaria inmutable de la presentación. El `id` nunca cambia, por lo que el QR es
estable de por vida, no expone datos y mantiene la unicidad (columna `UNIQUE`).

### Migración de datos
Se creó la migración **`V6__regenerar_qr_code_formato_estable.sql`** que regenera
los `qr_code` de todas las presentaciones existentes (`UPDATE ... SET qr_code =
'SIGES-PRES-' || id`). Aplicada automáticamente por Flyway al arrancar el backend.

### Archivos involucrados
- `frontend/src/components/InsumoModal.tsx` — tarjeta "Material (solo lectura)".
- `backend/src/main/java/com/gestion/inventario/service/ItemService.java` —
  `generarQrCode` ahora genera `SIGES-PRES-{id}`.
- `backend/src/main/resources/db/migration/V6__regenerar_qr_code_formato_estable.sql` — **nuevo**.
- `scripts/smoke_test_e2e.py` — validación del nuevo formato del QR.

### Notas
- El endpoint `GET /api/presentations/qr/{qrCode}` no cambió: sigue recibiendo el
  string completo del QR y lo busca por igualdad exacta en la BD.
- El escáner y el render del QR funcionan con el nuevo formato sin cambios en el
  frontend (usan el string que devuelve el backend).

---

## 5. Modal de Vista Ampliada del QR (Descargar PNG / Imprimir)

**Fecha:** 2026-08-31
**Naturaleza:** Mejora de utilidad del catálogo.

### Descripción
En el **Catálogo de Insumos**, cada código QR mostrado en la tabla ahora es
**clicable** y abre un modal con el QR **en grande** (al estilo de un cartel) que
incluye el nombre del insumo y su código. Ofrece dos acciones:

1. **Descargar PNG:** exporta el QR como imagen PNG descargable.
2. **Imprimir cartel:** muestra una vista previa (nombre + código + QR) e imprime.

### Comportamiento
1. Al hacer clic en un QR de la tabla se abre `QrModal` con la vista previa del
   cartel: logo **SIGES**, nombre del material, código y presentación.
2. **Descargar PNG:** toma el canvas del QR (`QRCodeCanvas` de `qrcode.react`)
   y lo descarga vía `canvas.toDataURL('image/png')`. Nombre de archivo
   `QR-{code}-{presentación}.png`.
3. **Imprimir:** serializa el QR a **SVG** (`QRCodeSVG.outerHTML`), abre una
   ventana nueva con el cartel formateado y llama a `win.print()`. Así el QR se
   imprime nítido (el SVG es vectorial, no depende del canvas).

### Archivos involucrados
- `frontend/src/components/QrModal.tsx` — **nuevo**, modal de vista ampliada del QR.
- `frontend/src/pages/Insumos.tsx` — QR clicable que abre `QrModal`.

### Notas
- Se usa el canvas del QR (del modal) para el PNG y el SVG para la impresión,
  cada uno óptimo para su medio. No se agregaron dependencias nuevas.

---

## 6. Menú Lateral Colapsable (Solo Iconos) con Tooltips

**Fecha:** 2026-08-31
**Naturaleza:** Mejora de usabilidad del menú de navegación.

### Descripción
El menú lateral (sidebar) ahora tiene un **botón para colapsarse** en desktop,
dejando **solo los iconos visibles** (ancho reducido). Cada botón del menú
(incluso colapsado) muestra un **tooltip** con el nombre del módulo al pasar el
mouse, para que el usuario sepa a dónde va a navegar.

### Comportamiento
1. En la cabecera del menú hay un botón (icono de chevron) para **colapsar /
   expandir** — solo visible en desktop (`lg`).
2. Colapsado, el menú pasa a un ancho estrecho (~`lg:w-20`) y cada enlace muestra
   **solo el icono centrado**; el texto del módulo se oculta.
3. Todos los enlaces llevan el atributo `title` (tooltip) con el nombre del
   módulo, por lo que al colapsar sigue siendo claro qué representa cada icono.
4. También se colapsan el logo/texto del usuario y el botón "Cerrar Sesión"
   (queda solo el icono con su tooltip).
5. En **móvil** el comportamiento del menú (drawer) no cambia: se sigue
   desplegando a ancho completo.

### Archivos involucrados
- `frontend/src/components/Layout.tsx` — estado `collapsed`, toggle, ancho dinámico
  del sidebar, enlaces con tooltip.

### Notas
- El colapso es solo de layout en desktop; no afecta la navegación ni la lógica
  de accesos (`hasAccess`).
- Se usa el `title` nativo como tooltip (sin dependencias extra), acorde a la
  convención de UI/UX (sección 5 de AGENTS.md).

---

## 7. Contenido Responsive al Colapsar el Menú Lateral

**Fecha:** 2026-09-01
**Naturaleza:** Mejora de layout / aprovechamiento del espacio.

### Descripción
Al colapsar el menú lateral (solo iconos, desktop), el espacio disponible para
el contenido crece, pero antes las tablas y tarjetas seguían fijas en el ancho
`max-w-7xl` centrado, dejándose **"en medio de un gran espacio"** (margen amplio
a la izquierda, junto al menú colapsado, y a la derecha).

Ahora el contenido **se expande** para aprovechar el ancho liberado cuando el
menú está colapsado, manteniéndose centrado y cómodo.

### Comportamiento
1. Nuevo contenedor reutilizable **`page-container`** (definido en `index.css`)
   usado por todas las páginas: `w-full max-w-7xl mx-auto` con transición suave
   de `max-width`.
2. El `Layout` marca el `<main>` con la clase **`side-collapsed`** cuando el
   menú está colapsado.
3. Regla CSS `main.side-collapsed .page-container`: amplía el ancho máximo a
   `96rem` (1536px) en esas páginas, eliminando el espacio muerto y haciendo las
   tablas más anchas y legibles.
4. La transición del ancho es animada (`transition-[max-width]`), acorde al
   resto de la UI.

### Archivos involucrados
- `frontend/src/index.css` — utilidad `page-container` y regla `side-collapsed`.
- `frontend/src/components/Layout.tsx` — marca `<main>` con `side-collapsed`.
- `frontend/src/pages/{Dashboard,Insumos,Movimientos,Ajustes,Reportes,Proyecciones,Usuarios}.tsx`
  — contenedor raíz pasa de `max-w-7xl mx-auto` a `page-container`.

### Notas
- El `overflow-x-auto` de las tablas se mantiene, por lo que en pantallas
  angostas el scroll horizontal sigue funcionando (responsive móvil intacto).
- Los modales son `fixed inset-0` centrados en el viewport y no dependen del
  ancho del contenido.

---

## 8. Botón de Escanear QR Unificado (Catálogo y Kárdex)

**Fecha:** 2026-09-01
**Naturaleza:** Consistencia de diseño en los módulos.

### Descripción
El botón **"Escanear QR"** tenía un diseño distinto entre el **Catálogo de
Insumos** (botón blanco/borde) y el **Kárdex/Movimientos** (botón brand sólido).
Se unificó el diseño para que sean **idénticos**, tomando como referencia el del
módulo de Kárdex.

### Comportamiento
1. En ambos módulos el botón "Escanear QR" ahora es:
   `bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg
   focus:ring-2 focus:ring-brand-500/50`.
2. Ambos usan el **mismo icono** de escaneo QR (marca de esquinas + línea
   central). En Kárdex se corrigió el icono anterior (era un "+", que parecía de
   "nuevo movimiento").

### Archivos involucrados
- `frontend/src/pages/Insumos.tsx` — botón "Escanear QR" con estilo brand sólido.
- `frontend/src/pages/Movimientos.tsx` — mismo icono de escaneo QR (sin "+").

### Notas
- El botón "Buscar insumo" (catálogo) y "Registrar Movimiento" (Kárdex)
  conservan su propio diseño funcional; solo se unificó la acción de escanear.

---

## 9. Feedback al Escanear QR: Sonido + Transición de Carga

**Fecha:** 2026-09-01
**Naturaleza:** Mejora de UX en el flujo de escaneo.

### Descripción
Antes, al escanear un QR el módulo de resultado aparecía **de forma casi
inmediata** (casi directa), sin confirmación previa. Ahora el escaneo exitoso
produce:

1. **Un sonido** de confirmación (doble beep ascendente).
2. **Una pequeña transición/modal de carga** ("Escaneo exitoso — Cargando datos
   del insumo...") que amortigua el salto al modal con la información.

### Comportamiento
1. Al detectarse un QR válido, `QrScanner` reproduce el sonido vía **Web Audio
   API** (sin archivos de audio adicionales) y muestra el overlay de carga por
   ~0.9s.
2. Pasado ese intervalo se invoca `onScan(qrCode)` y el módulo/acción resultado
   aparece de forma natural.
3. El overlay se superpone al área del video, sin alterar el contenedor
   controlado por `html5-qrcode` (evita que `clear()` borre el overlay).
4. Si el usuario cierra el escáner durante la carga, se cancela el temporizador
   y no se dispara el resultado.

### Archivos involucrados
- `frontend/src/utils/sound.ts` — **nuevo**, reproducción del beep de éxito con
  la Web Audio API.
- `frontend/src/components/QrScanner.tsx` — estado `detected`, overlay de carga,
  sonido al detectar y cancelación segura del temporizador.

### Notas
- El sonido no requiere archivos ni dependencias: se genera con
  `OscillatorNode`. Requiere interacción previa del usuario (abrir el escáner),
  por lo que cumple las políticas de autoplay de los navegadores.
- La transición beneficia tanto al Catálogo de Insumos como al Kárdex, ya que
  ambos usan el mismo componente `QrScanner`.

---

## 10. Limpieza de textos largos en modales y skill de auditoría técnica

**Fecha:** 2026-09-01
**Naturaleza:** Mantenimiento de UI + herramienta de revisión de estándares.

### Descripción
Se redujo la carga de información de la interfaz y se agregó una herramienta de
revisión técnica:

- **Proyecciones:** se retiró el párrafo que explicaba la fórmula de las
  sugerencias de stock (Mín = CPD × lead-time(7 días), Máx = CPD ×
  lead-time+cobertura; ventana de 90 días). Era información para el desarrollador,
  no para el usuario. Ahora queda como **comentario en el código** del endpoint
  (la fórmula completa vive en `SugerenciaStockService` en el backend).
- **AjusteModal:** el banner "Atención: todo ajuste altera el patrimonio..."
  pasó a un **tooltip** (`i`) junto al título del modal, dejando el formulario limpio.
- **Skill `auditoria-tecnica`**: nueva skill de opencode que audita el
  cumplimiento de estándares del stack (React + Spring Boot, endpoints,
  estructura, validaciones) y **solo reporta hallazgos** por severidad, sin
  modificar código.

### Comportamiento
1. El usuario ya no ve textos técnicos de criterios de cálculo en los modales.
2. La advertencia legal del ajuste se muestra solo al pasar el cursor por el `i`.
3. Al pedir una auditoría técnica, opencode cargará la skill y devolverá un
   checklist de hallazgos (Bloqueante/Importante/Menor) con archivos afectados.

### Archivos involucrados
- `frontend/src/pages/Proyecciones.tsx` — párrafo de fórmula de sugerencia
  reemplazado por un comentario JSX (remitente a `SugerenciaStockService`).
- `frontend/src/components/AjusteModal.tsx` — banner "Atención" → tooltip `i`.
- `.opencode/skills/auditoria-tecnica/SKILL.md` — **nuevo**, checklist de
  estándares técnicos del stack.
- `.opencode/skills/mejora-ux/SKILL.md` — regla: texto técnico va al código.
- `AGENTS.md` — sección 5.5 (texto de desarrollador en el código) y skill
  `auditoria-tecnica` en la sección 6.

### Notas
- Para que opencode cargue la skill nueva, reiniciar la sesión (la skill se
  auto-descubre desde `.opencode/skills/`).
- La fórmula en sí ya estaba documentada en el backend
  (`SugerenciaStockService`, Javadoc de clase), no había pérdida de información.

---

## 12. Módulo de Auditoría del Sistema (bitácora de eventos)

**Fecha:** 2026-09-01
**Naturaleza:** Nuevo módulo de trazabilidad (solo Administradores).

### ¿Qué problema resuelve?
Antes no existía registro de "quién hizo qué": los ajustes eran movimientos
(`AJUSTE_*`) y nada registraba accesos al sistema, cambios de usuarios o
exportaciones. El módulo **Auditoría** deja constancia **inmutable** de cada
acción relevante.

### Funcionamiento
- **Escritura automática:** las acciones del sistema notifican a
  `AuditService.registrar(...)`, que inserta una fila en `audit_logs`:
  - `auth/login` → `LOGIN` (éxito) o `LOGIN_FALLIDO` (intento fallido).
  - `movimientos` (POST) → `MOVIMIENTO_CREADO` (entrada/salida/ajuste con detalle).
  - `usuarios/admin` (crear / actualizar / rol / estado) →
    `USUARIO_CREADO / USUARIO_ACTUALIZADO / USUARIO_ROL_CAMBIADO / USUARIO_ESTADO_CAMBIADO`.
  - `reportes` (PDF / Excel / Proyecciones) → `EXPORTACION_PDF / EXPORTACION_EXCEL / EXPORTACION_PROYECCIONES_PDF / EXPORTACION_PROYECCIONES_EXCEL`.
- Cada registro guarda: `event_type`, descripción legible, entidad e id
  afectados (ej. `inventario_movimientos`, id del movimiento), correo/nombre
  del responsable, **IP origen** y `created_at`. Las filas no se editan ni
  borran (append-only).
- **Consulta:** `GET /api/auditoria` (solo ADMIN, `@PreAuthorize`) devuelve
  `Page<AuditLog>` paginada (más reciente primero) con filtros opcionales por
  evento, usuario y rango de fechas (inclusivo). `GET /api/auditoria/eventos`
  expone el catálogo código→etiqueta.

### Frontend (`/auditoria`)
- Página **Auditoría del Sistema** con diseño uniforme (`page-container`,
  tarjeta blanca, tabla con badges por tipo de evento, columna IP y
  paginación).
- Filtros: evento (select con catálogo del backend), usuario, desde/hasta
  (fechas) y botones **Buscar / Limpiar**.
- Menú y ruta **solo ADMIN** (`MODULE_ACCESS['/auditoria']` +
  `RequireRole`).

### Archivos involucrados
- `backend/.../db/migration/V7__auditoria.sql` — **nuevo**, tabla `audit_logs` + índices.
- `backend/.../model/AuditLog.java`, `repository/AuditLogRepository.java` — **nuevos**.
- `backend/.../service/AuditService.java` — **nuevo**, registrar + listar (Specification) + catálogo.
- `backend/.../controller/AuditController.java` — **nuevo**, `GET /api/auditoria`. `/eventos`.
- Hooks: `AuthController`, `MovimientoService`, `UsuarioController`, `ReporteController`, `MovimientoController` (pasa IP).
- `frontend/src/pages/Auditoria.tsx` (+ test) — **nuevo**.
- `frontend/src/App.tsx`, `access.ts`, `components/Layout.tsx` — ruta/menú solo ADMIN.
- `scripts/test_backend.sh` — carpeta de trabajo única por corrida (permisos root).
- `docs/diagramas/flujo_auditoria.md` — **nuevo** diagrama de flujo del módulo.

### Notas
- El login fallido se registra con el correo intentado (sin contraseña).
- `BackendApplicationTests` sigue excluido de la corrida Docker (requiere PostgreSQL).
- Pruebas: 14 tests JUnit (3 nuevos de `AuditService`) + 11 tests Vitest (2 nuevos).

---

## 13. WebSocket en Auditoría (tiempo real) + Eventos ampliados (QR e Insumos)

**Fecha:** 2026-09-02
**Naturaleza:** Mejora de trazabilidad: notificaciones en tiempo real y nuevos
tipos de eventos auditables.

### 13.1 WebSocket `/ws/auditoria` (refresco automático)

**Problema:** La página de Auditoría era consulta bajo demanda: si otro usuario
(o la propia sesión en otra pestaña) generaba un evento, la bitácora no se
actualizaba hasta pulsar "Buscar".

**Solución:** Se añadió un canal **WebSocket** que actúa como señal push
(`AuditEventMessage`), transportando solo un aviso (id, tipo, descripción,
fecha) — **sin datos sensibles**. El frontend, al recibirlo, **re-consulta por
REST autenticado** (`GET /api/auditoria`), de modo que la seguridad sigue
residendo en el endpoint REST.

### Comportamiento
1. `AuditService.registrar(...)` persiste la fila e **inyecta
   `ApplicationEventPublisher`** para publicar `AuditLogSavedEvent`.
2. `AuditWebSocketHandler` (escucha el evento de aplicación) hace **broadcast**
   del `AuditEventMessage` a todas las sesiones conectadas en `/ws/auditoria`.
3. `useAuditSocket` (hook): conecta con el WebSocket **nativo**, con
   **reconexión automática** cada 4s y `guard` (`typeof WebSocket ===
   'undefined'`) para no romper jsdom en los tests.
4. `Auditoria.tsx` se suscribe y, al recibir un aviso, re-ejecuta la consulta de
   la bitácora (con los filtros activos). Así, hacer login o un movimiento en
   otra pestaña refresca la tabla en vivo.

### Archivos involucrados (WebSocket)
- `backend/build.gradle` — `spring-boot-starter-websocket` + `jackson-datatype-jsr310`.
- `backend/.../config/WebSocketConfig.java` — **nuevo**, registra `/ws/auditoria`.
- `backend/.../websocket/AuditWebSocketHandler.java` — **nuevo**, broadcast.
- `backend/.../websocket/AuditEventMessage.java` — **nuevo**, payload del aviso.
- `backend/.../websocket/AuditLogSavedEvent.java` — **nuevo**, evento de aplicación.
- `backend/.../service/AuditService.java` — publica `AuditLogSavedEvent`.
- `backend/.../config/SecurityConfig.java` — permite `/ws/**`.
- `frontend/nginx.conf` — `location /ws/` con `Upgrade`/`Connection` y timeouts 3600s.
- `frontend/src/hooks/useAuditSocket.ts` — **nuevo**, hook de conexión WS.
- `frontend/src/pages/Auditoria.tsx` — se suscribe y re-consulta.

### 13.2 Auditoría de acciones sobre el QR

Cada vez que se genera/usar el QR de una presentación (descarga o impresión
desde `QrModal`) se deja constancia:

- `POST /api/presentations/{id}/qr-event` (body `{"accion":"DESCARGA"|"IMPRESION"|"CONSULTA"}`, roles ADMIN/JEFE/AUXILIAR).
- Registra `QR_DESCARGA` / `QR_IMPRESION` / `QR_CONSULTADO`.
- Se agregó `ItemService.findPresentationById` y `QrModal.tsx` llama al endpoint
  (importando `api` de `../api/axios`) en `handleDownloadPng` y `handlePrint`.

### 13.3 Eventos de insumo

`ItemController` registra `INSUMO_CREADO`, `INSUMO_ACTUALIZADO` y
`PRESENTACION_AGREGADA` (inyectando `AuditService`, `Authentication` y
`HttpServletRequest`). Con esto el catálogo de `catalogoEventos()` pasa a
**17 eventos**.

### Notas
- `AuditServiceTest` se ajustó al constructor (añade `ApplicationEventPublisher`)
  y al catálogo de 17 eventos.
- Archivos nuevos de insumo: `ItemController`, `ItemService`, `AuditService`.
- Validación E2E de roles: `GET /api/auditoria` → ADMIN 200, JEFE/AUXILIAR 403.

---

## 14. QR impreso externamente: nomenclatura `SIGES-PRES-{id}` y flujo de etiquetado

**Fecha:** 2026-09-30
**Naturaleza:** Aclaración de uso del QR en etiquetado físico/impresoras externas.

### Problema detectado en producción
Un usuario imprimió códigos QR desde una **impresora de etiquetas externa**
(tipeando el **código interno del insumo**, ej. `1775273783` para Alcohol Etílico)
y al escanearlos el sistema respondía **404** (`GET /api/presentations/qr/177527378`).
La causa: el QR del sistema **no contiene el código del insumo**, sino el
**`qr_code` de la presentación**, generado como `SIGES-PRES-{id}`
(`ItemService.generarQrCode`). Ante `177527378` el repositorio busca una
presentación con `qr_code` igual a ese string y no existe ninguna.

### Nomenclatura vigente (única válida)
```text
QR válido = SIGES-PRES-{id_presentación}   (ej. SIGES-PRES-2)
```
- `{id}` es la clave primaria **inmutable** de la presentación
  (`presentations.qr_code`, columna `UNIQUE`, formato estable desde la
  migración `V6__regenerar_qr_code_formato_estable.sql`).
- El **código del insumo** (`items.code`) **no forma parte del QR** y NO sirve
  para resolver el endpoint `GET /api/presentations/qr/{qrCode}` (búsqueda por
  igualdad exacta de `qr_code`).

### Cómo imprimir correctamente desde una impresora externa
Para etiquetar debe usarse el **string exacto** que expone el sistema:
1. Abrir el insumo en el **Catálogo → clic en el QR** → `QrModal`.
2. Usar **"Descargar PNG"** o **"Imprimir cartel"** (imprime el QR con el
   `qr_code` correcto en su interior, renderizado con `qrcode.react`).
3. Si se necesita el string puro para una impresora de códigos de barras/
   etiquetas, escribir **literalmente** `SIGES-PRES-{id}` (el `{id}` puede
   consultarse en la BD o devolverse por la API; el frontend no lo muestra en
   claro, solo lo codifica dentro del QR).

### Decisión de diseño validada (2026-09-30)
Se evaluó aceptar también el **código del insumo** al escanear (para que
sirviera un QR impreso con el código). **Se decide NO aceptar el código del
insumo como alias del QR**, por lo siguiente:
- El QR apunta a una **presentación** específica (el stock y min/max viven en la
  presentación, no en el insumo). Un insumo puede tener **varias presentaciones**
  (ej. en la BD actual, Pasta Térmica y Restaurador de Plásticos tienen 2 cada
  una): el código del insumo es ambiguo (no dice qué tamaño/variante).
- El motivo original del formato sin el código del insumo fue la **estabilidad**:
  si el usuario editaba el código de un insumo, los QR ya impresos seguían
  resolviendo. Ese riesgo **ya no existe**: `items.code` es **inmutable** desde
  la creación (`ItemService.actualizarItem` no lo modifica y el campo es
  `readOnly` en `InsumoModal` en modo edición).
- Mantener un **único formato canónico** (`SIGES-PRES-{id}`) evita doble fuente
  de verdad y mantiene la validación de stock estricta del proyecto.

**Flujo recomendado:** imprimir siempre desde el sistema (descarga/imprime el
`QrModal`), para producción usar el PNG/cartel del sistema; NO tipear el código
del insumo en la impresora externa como reemplazo del QR.

### Archivos involucrados
- `backend/.../service/ItemService.java` — `generarQrCode` y búsqueda por `qr_code`.
- `frontend/src/components/QrModal.tsx` — descarga PNG / impresión del QR correcto.
- Endpoint `GET /api/presentations/qr/{qrCode}`: sin cambios.

---

## 15. Tiempo real en Catálogo, Kárdex y Ajustes (no solo Auditoría)

**Fecha:** 2026-09-30
**Naturaleza:** Mejora de consistencia: los módulos se actualizan sin recargar.

### Problema
El backend ya difundía **todos** los eventos de auditoría por `/ws/auditoria`, pero solo
la página de **Auditoría** se suscribía. Si un usuario creaba un insumo o registraba un
movimiento, las demás pantallas seguían mostrando datos viejos hasta recargar manualmente.

### Comportamiento
1. `useAuditSocket` devuelve ahora `onMessage` **memoizado** (`useMemo`), estable frente a
   los re-renders, para evitar resuscripciones.
2. Nuevo hook **`useRealtimeSync(eventTypes, onEvent)`** (`frontend/src/hooks/`): se
   suscribe al WebSocket y ejecuta `onEvent` (que vuelve a consultar por REST) **solo**
   cuando llega un `eventType` incluido en la lista.
3. Suscripciones:
   - **Insumos**: `INSUMO_CREADO`, `INSUMO_ACTUALIZADO`, `INSUMO_INACTIVADO`,
     `INSUMO_REACTIVADO`, `PRESENTACION_AGREGADA`, `MOVIMIENTO_CREADO`.
   - **Movimientos** y **Ajustes**: el mismo conjunto (por `MOVIMIENTO_CREADO` y eventos de
     insumo, que alteran stock y catálogos derivados).

### Archivos involucrados
- `frontend/src/hooks/useRealtimeSync.ts` — **nuevo** (hook de suscripción filtrada).
- `frontend/src/hooks/useRealtimeSync.test.tsx` — **nuevo** (2 tests: filtrado y lista vacía).
- `frontend/src/hooks/useAuditSocket.ts` — `onMessage` memoizado.
- `frontend/src/pages/{Insumos,Movimientos,Ajustes}.tsx` — suscripciones.

### Notas
- Sin cambios en backend: la difusión de eventos ya era total.
- El canal **no transporta datos de negocio**; cada módulo re-consulta por REST con su JWT.

---

## 16. Permisos de Reportería para JEFE y AUXILIAR

**Fecha:** 2026-09-30
**Naturaleza:** Corrección de permisos (el módulo era visible pero no cargaba).

### Problema
`Reportes.tsx` carga en paralelo `GET /movimientos`, `GET /insumos` y `GET /usuarios`
mediante un `Promise.all`. Pero `UsuarioController` declara
`@PreAuthorize("hasRole('ADMIN')")` **a nivel de clase**, que restringía **todos** sus
endpoints, incluido el resumen `GET /api/usuarios`. Para JEFE y AUXILIAR ese request
devolvía **403**, el `Promise.all` rechazaba y **no se cargaba nada**: la tabla quedaba
vacía aunque el módulo fuera accesible. Solo ADMIN veía movimientos.

### Solución
`listarUsuariosResumen()` sobrescribe a nivel de método con
`@PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")`. El endpoint solo expone
`{id, name, rol}` (no datos sensibles) y es necesario para el filtro de Usuario, coherente
con que Reportería está abierto a los tres roles. El CRUD completo
(`/usuarios/admin`, `.../rol`, `.../status`) **sigue siendo solo ADMIN**.

### Archivos involucrados
- `backend/src/main/java/com/gestion/inventario/controller/UsuarioController.java`.

### Validación
Con `apgarcia@pdh.org.gt` (JEFE): `GET /api/usuarios` → 200 y `GET /api/movimientos` → 200.

---

## 17. Recuperación de contraseña: diagnóstico del correo

**Fecha:** 2026-09-30
**Naturaleza:** Diagnóstico (sin cambios de código).

### Situación
El flujo de recuperación respondía `200` y mostraba el mensaje genérico, pero el correo no
llegaba. Configuración verificada como **correcta**: `MAIL_USERNAME`/`MAIL_PASSWORD` en el
`.env` del servidor, presentes en el contenedor, y la credencial es válida
(`235 2.7.0 Accepted` en la prueba SMTP). Los tokens se creaban en
`password_reset_tokens`, y `mailSender.send()` no lanzaba excepción (por eso el endpoint
respondía 200).

### Diagnóstico
La entrega es responsabilidad del buzón destino, no del sistema. Los envíos de prueba
llegaron **con retraso** (Gmail aplica controles antispam) y pueden caer en
**Spam/Promociones**. Confirmado por el usuario: los correos llegaron.

### Notas
- `solicitarRecuperacion` usa `ifPresent`: si el correo no está registrado, no envía nada y
  la respuesta sigue siendo genérica (por diseño, no revela si el correo existe).
- Posible mejora futura: registrar en logs el envío (destino + resultado) para diagnosticar
  entregas fallidas sin depender de la bandeja del usuario.

---

## 18. Paginación unificada en todos los módulos

### Problema
Con varios registros, las tablas de los módulos **crecían hacia abajo** sin límite: la
página se volvía larga y el contenido inferior quedaba fuera de vista. Solo
`Auditoria` estaba paginado y cada módulo resolvía el pie por su cuenta.

### Auditoría previa (volumen real en BD)

| Módulo | Antes | Ahora |
|---|---|---|
| Auditoría | servidor, 20/pág (propia) | componente compartido |
| Dashboard – Alertas | 5/pág (propia) | componente compartido |
| Kárdex | **sin paginación** | **servidor**, 10/pág |
| Catálogo (Insumos) | **sin paginación** | cliente, 10/pág |
| Ajustes | **sin paginación** | cliente, 10/pág |
| Reportes | **sin paginación** | cliente, 10/pág |
| Proyecciones | **sin paginación** | cliente, 10/pág (ambas tablas) |
| Usuarios | **sin paginación** | cliente, 10/pág |

### Componente único
`frontend/src/components/Paginacion.tsx` es **la única** implementación del pie.
Cambiar el texto, el tamaño de los botones o cuándo se oculta se hace en ese
archivo y aplica a todos los módulos, sin editar cada página.

- No renderiza nada con una sola página (evita pies vacíos).
- Se oculta mientras carga, para que la tabla no cambie de alto.
- `variant="tarjeta"` para pies que viven dentro de una tarjeta (Dashboard),
  sin el padding lateral de tabla.

### Hooks
- `frontend/src/hooks/usePaginacion.ts` — listas acotadas (cliente). Concentra el
  `slice`, el cálculo de páginas y **el acotado del índice** para que, si un
  filtro reduce el conjunto, la página actual no quede huérfana.
- `frontend/src/hooks/usePaginacionServidor.ts` — listas sin límite (Kárdex).
  Encapsula la lectura de `content` / `totalPages` / `totalElements` del `Page<T>`.

### Backend: por qué Kárdex pagina en servidor
`inventario_movimientos` suma una fila por cada operación, así que es la única
tabla que crece sin límite. Se agregó:

- `MovimientoRepository.findAllWithDetailsOrderByCreatedAtDesc(Pageable)` con
  `countQuery` explícito (con `@Query` + `@EntityGraph` Spring no deriva el
  count de forma confiable) y orden determinista `createdAt DESC, id DESC` para
  que una página no repita ni omita filas con el mismo timestamp.
- `GET /api/movimientos/paginado?page=&size=` → `Page<MovimientoResponseDTO>`.
- Tope duro de 100 por página en el service (`clampSize`), para que el cliente
  no pueda pedir el histórico entero.

**`GET /api/movimientos` (sin `/paginado`) se mantiene intacto a propósito:** el
Dashboard, Reportes y Ajustes calculan totales y agregados sobre **todos** los
movimientos; paginar ese endpoint rompería las cifras.

### Lo que NO se pagina (a propósito)
- Los `<select>` de filtro de Reportes y Proyecciones: un desplegable paginado
  sería peor de usar que uno completo.
- Los exports a Excel/PDF: siguen enviando el conjunto filtrado **completo**. Un
  reporte debe abarcar todo lo que el filtro seleccionó, no la página visible.
- Los KPIs del Dashboard y de Proyecciones (`inversionTotal`, totales): se
  calculan sobre el conjunto completo.

### Archivos
`components/Paginacion.tsx`, `hooks/usePaginacion.ts`,
`hooks/usePaginacionServidor.ts`, `pages/{Insumos,Movimientos,Ajustes,Reportes,Proyecciones,Usuarios,Auditoria,Dashboard}.tsx`,
`controller/MovimientoController.java`, `service/MovimientoService.java`,
`repository/MovimientoRepository.java`.

### Tests
54 frontend (11 archivos) y 22 backend, incluidos los nuevos de `Paginacion`,
`usePaginacion`, `Movimientos` (verifica que pida `/paginado` y **no** el listado
completo) y `MovimientoService` (mapeo, tamaño de página, corrección de valores
inválidos).

### Corrección de permisos
`Ajustes.tsx` y `Movimientos.tsx` pasaban el arreglo de eventos de tiempo real
como literal dentro del render, lo que re-suscribía el WebSocket en cada cambio
de estado. Ahora son constantes a nivel de módulo.

---

## 19. Estrategia de despliegue en producción (documentación)

Nuevo documento `docs/ESTRATEGIA_DESPLIEGUE.md` con el principio de **reconstruir
solo lo que cambió**, las brechas reales detectadas en `docker-compose.prod.yml`
(backend sin healthcheck, `depends_on` sin condición, sin `stop_grace_period`,
túnel con hostname aleatorio) y la recomendación por etapas desde healthcheck
hasta CI/CD. Complementa a `FLUJO_DESPLIEGUE.md`, que cubre las ramas.

---

## 21. Matriz de permisos por rol + exportación Excel del catálogo

**Fecha:** 2026-10-02
**Naturaleza:** Endurecimiento de autorización y nueva funcionalidad de reportes.

### La regla acordada

| Módulo / acción | ADMIN | JEFE | AUXILIAR |
| --- | :-: | :-: | :-: |
| Movimientos de entrada/salida | Sí | Sí | Sí |
| Reportes | Sí | Sí | Sí |
| Catálogo (crear/editar/activar) | Sí | **Sí (antes No)** | No |
| Ajustes de stock | Sí | Sí | No |
| Sugerencias de stock / Aplicar | Sí | **Sí (antes No)** | No |
| Proyecciones | Sí | Sí | No |
| Auditoría (solo lectura) | Sí | **Sí (antes No)** | No |
| **Gestión de usuarios** | **Sí** | **No** | **No** |

JEFE entra a todo **excepto** la gestión de usuarios; AUXILIAR conserva solo su
operación diaria.

### El hueco que se cerró

`POST /movimientos` es un endpoint único compartido por entradas, salidas y
ajustes, y estaba abierto a los tres roles. En la UI el módulo `/ajustes` no le
aparecía al AUXILIAR, pero nada impedía que mandara un `AJUSTE_POSITIVO` por la
API. La comprobación vive ahora en `MovimientoService`, no en el controller,
para que ningún camino de entrada la esquive.

Dentro del service el permiso se evalúa **antes** que la validación de negocio,
no al revés: un AUXILIAR es rechazado por rol antes de que se revise el stock o
la justificación, lo que permite distinguir "rol rechazado" de "datos malos".

Ojo con el alcance de esa afirmación: **no aplica a la capa HTTP.** `MovimientoDTO`
es `@Valid` y `quantity` lleva `@Min(1)`, así que esa validación de Spring corre
*antes* de entrar al service. En consecuencia, un `quantity: 0` devuelve **400 a
los tres roles**, nunca 403.

Para medir autorización por HTTP hay que mandar un payload que ya sea válido
(cantidad >= 1 y, en ajustes, justificación >= 20 caracteres) y que solo sería
rechazado por el rol: exactamente lo que hace `scripts/test_permisos.sh`. El
orden "permiso antes que negocio" queda cubierto por los unit tests del service,
donde el método se invoca directamente.

### Endurecimientos de seguridad

- **`passwordHash` ya no sale por la API.** `GET /usuarios/admin` lo devolvía en
  el JSON a cualquier ADMIN autenticado. Ahora lleva `@JsonIgnore`; JPA sigue
  leyéndolo para login y validación.
- **Los 403 llevan `message`.** Sin `@ExceptionHandler(AccessDeniedException)`, un
  rechazo de `@PreAuthorize` lo capturaba `ExceptionTranslationFilter` y salía
  el JSON por defecto de Spring, sin campo `message`. En el frontend todo caía al
  mismo texto genérico que hacía pensar al usuario que había escrito mal los
  datos.
- **Alta de usuario sin rol ya no da 500.** `NuevoUsuarioDTO` es `@Valid` con
  `@NotBlank`/`@Email`/`@Size(min=8)`, y `UsuarioController` aplica `@Valid`.
- **Nombre+tamaño repetido en una presentación da 400 legible.** El constraint
  `uq_presentation_item_name_size` reventaba el INSERT y devolvía 500 opaco; ahora
  `PresentationRepository.findDuplicada` lo comprueba antes de escribir.

### Exportación Excel del catálogo completo

`GET /api/reportes/catalogo/excel` (ADMIN y JEFE) genera el catálogo entero con
una fila por presentación: código, material, presentación, tamaño, existencia,
stock mínimo/máximo, costo estimado, **valor de la existencia**, estado y código
QR. Incluye los materiales inactivos con su columna de estado, porque si no se
cuenta comida que ya no se puede mover. El botón **Excel** en el catálogo lo
descarga con `responseType: blob`, ya que el token viaja en el header
`Authorization` y un `<a href>` sin token recibiría 403.

Existía el problema de que la tabla está paginada (mejora 18) y nunca mostró el
total: copiar la pantalla nunca dio el inventario completo para calcular compras.

### Coherencia de permisos en las tres capas

`access.ts` (menú y rutas), `@PreAuthorize` (backend) y los botones de cada
página se fijaron a la misma tabla. Antes, `Insumos.tsx` leía `user.rol` directo
mientras el resto del app usaba `getRol(user)`, que tolera rol como texto o como
`{ name }`: si el usuario venía como objeto, los botones de edición desaparecían
para un JEFE que sí podía operar.

### Tests
54 frontend y 35 backend (antes 22). Nuevos: matriz de roles de ajustes
(AUXILIAR no ajusta pero sí entrada/salida, JEFE y ADMIN sí, usuario sin rol
denegado), orden permiso→validación, 403 con mensaje, duplicado de presentación
y regresión del 422 de stock insuficiente. `scripts/test_permisos.sh` exige
`--confirmar`, y los `PUT` de usuarios apuntan al usuario QA de la corrida, no a
un usuario real.

---

## 20. Próximas mejoras / pendientes
- **Fase 10 — Bodegas por departamento** (pendiente de diseño; ver
  `docs/upgrade-V2-Manejo-de-bodegas.md` y `AGENTS.md` §8). Incluye el **motor de
  préstamos entre bodegas** (acuerdo bilateral, topes por item/total/prórrogas).
- **Agregar healthcheck al backend** y `condition: service_healthy` en
  `depends_on` del frontend (documentado en `docs/ESTRATEGIA_DESPLIEGUE.md` §2.1).
  Requiere exponer un endpoint público barato tipo `/api/auth/ping`.
- **Revisar `stock_reservado`** del motor de préstamos: el diseño dice que la
  solicitud no reserva stock, pero la aprobación ejecuta
  `stock_reservado -= cantidad`. Resolver antes de implementar la Fase 10.
- (registrar aquí futuras implementaciones)
