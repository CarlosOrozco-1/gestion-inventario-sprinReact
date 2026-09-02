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

## 10. Próximas mejoras / pendientes
- (registrar aquí futuras implementaciones)
