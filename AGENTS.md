# AGENTS.md — Migración a Spring Boot + React

> **Proyecto:** Sistema de Gestión de Inventario de Insumos (V2)
> **Stack Nuevo:** Spring Boot (Java) + React + PostgreSQL
> **Objetivo:** Sistema ultra-preciso para el manejo de entradas, salidas y ajustes justificados, con validaciones estrictas y arquitectura orientada a transacciones seguras.

---

## 1. Tecnologías a utilizar

### Backend (Spring Boot)
- **Framework:** Spring Boot 3.x (Java 17 o 21).
- **Persistencia:** Spring Data JPA / Hibernate.
- **Base de Datos:** PostgreSQL (producción vía Docker + Flyway; el sistema ya NO usa SQLite).
- **Seguridad:** Spring Security + JWT (JSON Web Tokens).
- **Manejo de Errores:** `@RestControllerAdvice` para centralización de excepciones.
- **Precisión Numérica:** **ESTRICTAMENTE** usar `BigDecimal` o `Integer` (si no hay decimales) para todo cálculo de cantidades/dinero. **Prohibido usar `float` o `double`** por problemas de precisión en coma flotante.

### Frontend (React)
- **Librería principal:** React 18+ (Functional Components + Hooks).
- **Manejo de Estado:** Zustand o Redux Toolkit.
- **Enrutamiento:** React Router Dom v6.
- **Peticiones:** Axios o Fetch nativo con Interceptors para manejar el JWT.
- **UI:** Tailwind CSS + Componentes tipo shadcn/ui o Material UI.

---

## 2. Fases del Proyecto

1. **Fase 1: Setup y Modelado de Datos**
   - Inicializar Spring Boot y migrar el esquema SQL (`schema.sql`) a Entidades JPA.
   - Configurar la conexión a la base de datos.
2. **Fase 2: Seguridad y Autenticación**
   - Implementar login, generación de JWT y roles (Admin, Jefe, Auxiliar).
3. **Fase 3: Módulo Base (Insumos)**
   - CRUD de catálogo de insumos (Solo creación/edición, no borrado físico si tiene movimientos).
4. **Fase 4: Motor Transaccional (Movimientos)**
   - Desarrollo de lógica de entradas, salidas y validaciones estrictas de stock.
5. **Fase 5: Frontend y UI Premium**
   - Inicializar Vite + React.
   - Replicar vistas (Login, Dashboard, Insumos) con diseño responsivo.
6. **Fase 6: Pruebas y Auditoría**
   - Pruebas unitarias de las fórmulas matemáticas.

---

## 3. Fórmulas y Reglas de Negocio para Movimientos

Para garantizar precisión milimétrica en el inventario, el agente debe aplicar las siguientes reglas:

### A. Ecuación Fundamental de Inventario
```text
Stock_Actual = (Σ Entradas) - (Σ Salidas) + (Σ Ajustes Positivos) - (Σ Ajustes Negativos)
```
*El sistema nunca debe actualizar el stock "a ciegas" modificando el campo `stock` directamente con un UPDATE. Se deben registrar los movimientos e inferir el stock o actualizarlo mediante transacciones atómicas seguras (ej. `@Transactional` en Spring).*

### B. Validaciones Críticas Previas a Modificación
1. **Validación de Salida (Egreso):**
   - **Regla:** `Cantidad Solicitada <= Stock_Actual`
   - Si la cantidad es mayor, lanzar excepción de negocio (`InsufficientStockException`) con HTTP 422 o 400. NUNCA permitir saldo negativo.
2. **Entradas (Ingresos):**
   - Solo pueden ser enteros positivos `> 0`.
3. **Ajustes Justificados (Manuales y Correcciones):**
   - **Regla Estricta:** TODO ajuste (`AJUSTE_MANUAL`, `CORRECCION_ENTRADA`, etc.) **DEBE** requerir un campo `motivo_ajuste` o `justificacion` (String mínimo de 20 caracteres) y quedar registrado con el `usuario_id` responsable.

---

## 4. Nueva Estructura para Manejo de Errores y Validaciones (Estándares)

Para el desarrollo en Spring Boot, el agente debe seguir esta arquitectura robusta:

### Validaciones (Bean Validation)
Utilizar `jakarta.validation.constraints` a nivel de DTO:
```java
public class MovimientoDTO {
    @NotNull(message = "El ID del insumo es obligatorio")
    private Long insumoId;

    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @NotBlank(message = "Debe justificar este ajuste")
    @Size(min = 20, message = "La justificación debe tener al menos 20 caracteres")
    private String justificacion;
}
```

### Manejo Global de Errores (Controller Advice)
Crear una clase anotada con `@RestControllerAdvice` para capturar excepciones e interceptar errores de validación sin que el servidor se caiga o devuelva HTML.

**Respuestas estandarizadas (JSON):**
```json
{
  "timestamp": "2026-07-25T22:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error de validación en los campos enviados",
  "details": {
    "cantidad": "La cantidad debe ser mayor a 0",
    "justificacion": "La justificación es obligatoria en ajustes manuales"
  }
}
```

### Transaccionalidad
Toda función en la capa Service que afecte inventario (entradas o salidas) **debe** llevar la anotación `@Transactional`. Esto asegura que si una validación falla a mitad de un proceso (o si la BD falla), **nada** se guarde y el stock no se corrompa.

---

## 5. Convenciones de UI/UX (Frontend)

1. **Texto informativo en tooltips, no en los modales/módulos.** Mantener los
   modales y módulos lo más limpios posible. NO colocar párrafos o frases
   informativas largas directamente en la interfaz; en su lugar, ese contenido
   va en un **tooltip** (atributo `title`, `data-tip` o un tooltip custom) para
   que el usuario tenga la instrucción sin recargar la UI.
2. **Textos breves en campos, títulos y secciones.** Preferir etiquetas y
   encabezados cortos (una o pocas palabras). Si un concepto requiere
   explicación, ir al tooltip.
3. **Botones y enlaces de solo icono** (p. ej. menú colapsado) **deben llevar
   tooltip** indicando el nombre del módulo/acción.
4. **Feedback del escáner QR:** el escaneo exitoso debe reproducir un **sonido**
   de confirmación y mostrar una **breve transición de carga** ("Escaneo
   exitoso / Cargando datos...") antes de abrir el modal con la información, para
   que el cambio no sea abrupto. (Utilidad: `src/utils/sound.ts` +
   `QrScanner.tsx`.)
5. **Texto técnico/para el desarrollador va en el código, no en la UI.** Si una
   explicación (fórmulas, reglas de cálculo, criterios de negocio) NO añade
   valor al usuario, NO debe mostrarse en modal ni en tooltip: queda como
   **comentario en el código** (junto a la lógica, p. ej. en el service del
   backend). Solo lo útil para el usuario final va como tooltip breve.

### 5.1 Estándar de botones (OBLIGATORIO)

> **Regla de oro: el color y el tamaño se eligen por la FUNCIÓN del botón, no
> por el módulo donde vive.** La misma acción se ve idéntica en toda la app.

#### Por función

| Función | Fondo | Tailwind |
|---|---|---|
| **Principal** (la acción más importante de la pantalla): crear, guardar, confirmar, aplicar, continuar | Azul de marca | `bg-brand-600 hover:bg-brand-700` |
| **Éxito / Exportar Excel / Entrada** | Verde | `bg-emerald-600 hover:bg-emerald-700` |
| **Peligro / Exportar PDF / Salida / Eliminar** | Rojo | `bg-rose-600 hover:bg-rose-700` |
| **Advertencia / Ajuste de stock** | Ámbar | `bg-amber-600 hover:bg-amber-700` |
| **Secundario** (acción disponible pero no principal): limpiar, cancelar, generar código, abrir la búsqueda | Gris claro | `bg-slate-100 hover:bg-slate-200` |
| **Fantasma** (texto, sin fondo): enlaces, acciones de fila | Texto azul + fondo al hover | `text-brand-600 hover:bg-brand-50` |

> **Una sola acción azul por barra.** Si en la misma pantalla hay dos botones que
> compiten (p. ej. "Buscar" y "Nuevo"), el principal es azul y el otro pasa a
> gris. Nunca dos azules idénticos lado a lado.
>
> **Exportar a Excel SIEMPRE verde** (`emerald-600`) y **Exportar a PDF SIEMPRE
> rojo** (`rose-600`), en Reportes, Proyecciones, Insumos y donde aparezca.
> No importa el módulo.

#### Tamaño (obligatorio según la ubicación)

| Contexto | Padding | Uso |
|---|---|---|
| Barra de acciones de la página | `px-5 py-2.5` | Botones principales de pantalla |
| Pie de modal | `px-5 py-2.5` | Guardar / Cancelar |
| Acción dentro de una fila de tabla | `px-3 py-1.5 text-xs` | Editar, Suspender, Aplicar |
| Acción inline ligera | `px-2 py-1 text-xs` | Editar presentación, Activar |

#### Reglas fijas (no negociables)

- **`rounded-lg` en todos los botones.** Nada de `rounded-xl` ni `rounded-md`
  (salvo segmentados de tipo Entrada/Salida y chips).
- **`font-medium` en todos los botones** de página y modal.
- **Foco visible siempre:** `focus:ring-2 focus:ring-<color>-500/50`. Nunca
  `focus:outline-none` sin anillo.
- **Deshabilitado siempre:** `disabled:opacity-60 disabled:cursor-not-allowed`.
- **`shadow-sm` en botones sólidos.**
- **FAMILIA DE COLOR ÚNICA:** peligro = `rose`, **nunca `red`**. Éxito = `emerald`,
  **nunca `green`**. En el proyecto no se mezclan `red-*` con `rose-*` para el
  mismo significado.
- **Botón de solo icono → `title` obligatorio** (regla 3 de esta sección).

### 5.2 Fuente única de estilos de botón

> **Los colores y tamaños de la tabla de 5.1 ya NO se escriben a mano en los
> componentes.** Viven todos en un solo archivo:
> **`frontend/src/utils/buttonStyles.ts`** (`TONOS`, `TAMANOS`, `btn()`, `iconBtn()`).

```tsx
import { btn, iconBtn } from '../utils/buttonStyles';

// Botón de la barra de acciones
<button className={btn('exito', 'barra')}>Exportar Excel</button>
<button className={btn('peligro', 'barra')}>Exportar PDF</button>
<button className={btn('primario', 'barra')}>Nuevo material</button>

// Botón de pie de modal (+ una clase extra si hace falta)
<button className={`${btn('primario', 'modal')} flex-1`}>Guardar</button>

// Acción dentro de una fila de tabla
<button className={btn('fantasma', 'fila')}>Editar</button>

// Botón de solo icono: `title` es obligatorio (regla 3)
<button className={iconBtn('neutro', 'chico')} title="Cerrar" aria-label="Cerrar">
```

**Tonos:** `primario` `exito` `peligro` `aviso` `neutro` `contorno` `oscuro` `fantasma`
**Tamaños:** `barra` `modal` `bloque` `fila` `inline` `pantalla`

#### Cómo aplicarlo

1. Para cambiar el aspecto de **todos** los botones de la app: editar **solo**
   `frontend/src/utils/buttonStyles.ts`. No se tocan los `.tsx`.
2. Para un botón nuevo: llamar a `btn(tono, tamaño)` o `iconBtn(...)`. **Nunca**
   escribir `bg-brand-600`, `px-5 py-2.5`, `rounded-lg`, `shadow-sm`, etc. en un
   `<button>`.
3. Solo se aceptan clases **de layout** pegadas al resultado
   (`flex-1`, `w-full`, `shrink-0`, `mr-2`), nunca de color, borde ni padding.
4. Si se requiere un tono que no existe, **no se crea**: primero se documenta la
   regla de negocio en 5.1 y se agrega el tono al archivo.
5. Test del contrato: `frontend/src/utils/buttonStyles.test.ts`. Si se edita
   `buttonStyles.ts`, sus asserts son la red de seguridad del resto de la app.

#### Excepciones (fuera de la fuente única)

- **Segmentados** Entrada/Salida y chips de filtro (tienen su propio estado activo).
- **Chrome del shell**: barra lateral de `Layout`, `Toast` y las tarjetas de
  resultado de `SearchModal` (son contenedores navegables, no acciones).
- **Pantalla de acceso** (`Login`, `RecuperarPassword`): el CTA degradado con
  `py-3` es intencional; solo aplica la parte de `focus:ring-2` y `title`.
- **Enlaces de texto** (`Reportes`, `ProfileModal`) y la **miniatura de QR** de
  `Insumos`: no son botones de acción, no llevan el estilo de botón.

---

### 5.3 Estados lógicos: inactivar y reactivar (OBLIGATORIO)

No existe borrado físico de insumos ni de presentaciones. "Eliminar" del
catálogo es **inactivar**: la fila sigue visible con su badge para poder
reactivarla, conserva su stock y su histórico de movimientos, y desaparece de
los selects, del QR operativo y de `/api/insumos`.

1. **Motivo obligatorio al inactivar**, en materiales y en presentaciones. Se
   valida en el backend (`ItemService.validarMotivoInactivacion`, mínimo 10
   caracteres) y queda escrito en `audit_logs.description`. Al reactivar es
   una nota opcional.
2. **El modal debe mostrar las unidades afectadas** y, si son > 0, avisar que
   quedan retenidas: la explicación va en tooltip, no en párrafo
   (sección 1 de `.opencode/skills/mejora-ux/SKILL.md`).
   Componente único: `frontend/src/components/EstadoInsumoModal.tsx`.
3. **El backend es la barrera, no la UI**: `ItemService.listarVistaInsumos()`
   filtra inactivos y `MovimientoService` rechaza movimientos hacia un material
   o una presentación inactiva aunque alguien llame la API directo.
4. Un material puede tener presentaciones inactivas y seguir activo: el estado
   vive en los dos niveles (`items.activo` V8, `presentations.activo` V9) y no se
   propaga de uno al otro.
5. Solo `ADMIN` y `JEFE` cambian estos estados (`@PreAuthorize`).
6. Los reportes y el Excel del catálogo exportan **también** los inactivos, con
   una columna de estado por nivel: es el inventario que se puede dar por
   perdido, no solo el que se puede mover.

---

## 6. Testing y Skills del Proyecto

### Framework de testing
- **Frontend (React):** `Vitest` + `React Testing Library` + `jsdom`
  (config en `frontend/vitest.config.ts`, setup en `src/test/setup.ts`).
  - Ejecutar: `cd frontend && npm test` (una sola pasada) o `npm run test:watch`.
  - Convención: archivos `src/**/*.test.{ts,tsx}` junto al código que prueban
    (p. ej. `MovimientoModal.test.tsx` junto a `MovimientoModal.tsx`).
  - Los tests se actualizan **junto con el componente**: si se modifica un
    componente, se ajusta su test en el mismo cambio para mantener ambos
    sincronizados.
- **Backend (Spring Boot):** `JUnit 5` + `Mockito` (ya en `build.gradle`).
  - El entorno local NO tiene JDK compilador, por lo que los tests se ejecutan
    en Docker: **`scripts/test_backend.sh`** (imagen `gradle:9.5.1-jdk21`,
    corre el paquete `com.gestion.inventario.service.*`; `BackendApplicationTests`
    requiere PostgreSQL y queda fuera de la corrida Docker).
  - Reporte HTML: `backend/build/reports/tests/test/index.html` (en la copia
    de trabajo `/tmp/opencode/backend-tests`).

### Skills de opencode (`.opencode/skills/`)
- **`validacion-e2e`** — ejecutar el smoke test E2E y limpiar datos residuales.
- **`mejora-ux`** — convenciones de UI/UX para cambios de interfaz.
- **`deploy-docker`** — desplegar/validar el stack y diagnosticar "el front no
  carga" (incluye verificación con Chromium headless).
- **`auditoria-tecnica`** — auditoría de cumplimiento de estándares del stack
  (React/Spring Boot, endpoints, estructura); solo reporta hallazgos.
- Agregar una skill nueva = crear `.opencode/skills/<nombre>/SKILL.md` con
  frontmatter (`name`, `description`) y cuerpo en markdown. Tras crearla o
  editar config, **reiniciar opencode** para que la cargue.

---

## 7. Fases completadas

1. **Fase 1: Setup y Modelado de Datos** — Spring Boot + PostgreSQL + Flyway.
2. **Fase 2: Seguridad y Autenticación** — JWT + BCrypt + roles.
3. **Fase 3: Módulo Base (Insumos)** — catálogo con materiales y presentaciones.
4. **Fase 4: Motor Transaccional (Movimientos)** — entradas/salidas/ajustes justificados.
5. **Fase 5: Frontend y UI** — React + Vite + Tailwind.
6. **Fase 6: Pruebas y Auditoría** — Vitest/JUnit + bitácora de auditoría.
7. **Fase 7: Códigos QR** — identificación por presentación (`SIGES-PRES-{id}`).
8. **Fase 8: Recuperación de contraseña por correo** — SMTP + código de un solo uso.
9. **Fase 9: Tiempo real (WebSocket)** — refresco en vivo de Auditoría, Catálogo,
   Kárdex y Ajustes (`useAuditSocket` + `useRealtimeSync`).
10. **Eliminación lógica de presentaciones y motivo obligatorio** — `presentations.activo`
    (V9), endpoints de estado de material y presentación con el motivo en la bitácora,
    y `EstadoInsumoModal` con el detalle de las existencias retenidas (ver 5.3).

---

## 8. Fase 10 (PENDIENTE) — Bodegas / Separation por Departamento

> **Estado:** aprobada en diseño, **no iniciada**. Antes de escribir código,
> leer `docs/upgrade-V2-Manejo-de-bodegas.md` (análisis de impacto y decisiones abiertas).

### Objetivo
Gestionar **bodegas independientes** (una por departamento: Soporte, Desarrollo, etc.).
El **catálogo de materiales sigue siendo general y compartido**; lo que se separa es **a qué
bodega pertenece cada item/presentación, su stock y sus movimientos**.

Cada bodega tiene sus propios ítems, totales, ingresos y egresos. El usuario **solo ve su
bodega**: p. ej. `matias@pdh.org.gt` (AUXILIAR, Departamento de Desarrollo) únicamente ve la
bodega de Desarrollo; el jefe de ese departamento también solo la suya. El ADMIN ve todas.

### Modelo de datos objetivo (propuesta, confirmar antes de migrar)
- `departamentos` (o `bodegas`): `id`, `name` (único), `descripcion`, `activo`, timestamps.
- `usuarios.departamento_id` → FK a `departamentos` (un usuario pertenece a una bodega;
  ADMIN puede quedar sin departamento = vista global).
- Tabla puente `item_departamentos` (`item_id`, `departamento_id`): quéBodegas tienen cada
  material. **No** duplicar el catálogo: el item es único, la pertenencia es N:N.
- `presentations.departamento_id` **o** stock por bodega. ⚠️ **Decisión de diseño abierta:**
  - *Opción A (recomendada):* mover el stock a una tabla `stock_bodega`
    (`departamento_id`, `presentation_id`, `stock`, `min_stock`, `max_stock`) con UNIQUE
    `(departamento_id, presentation_id)`. El `stock` actual de `presentations` pasa a ser
    el **stock consolidado** (solo lectura) o se elimina.
  - *Opción B:* poner `departamento_id` en `presentations` (una presentación pertenece a una
    sola bodega). Más simple, pero **impide que el mismo insumo exista en dos bodegas**.
- `inventario_movimientos.departamento_id` → bodega del movimiento (obligatorio). El
  `usuario` sigue viniendo del JWT.
- **QR:** el `SIGES-PRES-{id}` actual apunta a la presentación global. Con bodegas, el QR
  debe **resolvers por defecto a la bodega del usuario que escanea**, o incluir el
  departamento (`SIGES-PRES-{id}-D{depId}`). **Decisión abierta.**

### Reglas de negocio (inviolables)
1. **Aislamiento:** un usuario sin permiso ve **solo** su bodega. Filtrar en el **backend**
   (nunca solo ocultando en la UI). ADMIN ve todas o selecciona una.
2. **Validación de stock por bodega:** la salida se valida contra el stock **de esa bodega**
   (`Cantidad Solicitada ≤ Stock_Bodega`), nunca contra el consolidado.
3. **Un movimiento pertenece a una única bodega** y se valida que el usuario pueda operar
   sobre ella (`403` si no).
4. **Los ajustes siguen exigiendo justificación ≥ 20 caracteres** y quedan atados a
   `usuario_id` **y** `departamento_id`.
5. **La ecuación fundamental pasa a ser por bodega:**
   `Stock_Bodega = (Σ Entradas_B) − (Σ Salidas_B) + (Σ Ajustes+_B) − (Σ Ajustes−_B)`.
6. **Transaccionalidad:** crear una fila de stock en la bodega dentro de la misma
   transacción `@Transactional` del movimiento, con bloqueo pesimista de esa fila.
7. **Auditoría:** los eventos de movimiento/ajuste deben incluir el departamento en la
   descripción.
8. **Préstamos entre bodegas (§9 de `docs/upgrade-V2-Manejo-de-bodegas.md`):**
   - Un préstamo **nunca** modifica el stock por sí solo: **siempre** genera 2 movimientos
     (`PRESTAMO_SALIDA` en el origen y `PRESTAMO_ENTRADA` en el destino) dentro de la misma
     `@Transactional`. La tabla `prestamos` es un **registro de deuda**, no la fuente del stock.
   - `cantidad_devuelta ≤ cantidad` es **inviolable**; validar en el service con bloqueo
     pesimista de las filas de `stock_bodega` de **ambas** bodegas.
   - Bloquear siempre las dos filas en **orden determinista** (`departamento_id` ascendente)
     para evitar deadlocks en devoluciones cruzadas.
- El motor de alertas compara `stock_actual_destino` contra el **snapshot**
      `stock_destino_antes + pendiente`; no rastrea movimientos individuales.
   - **Acuerdo bilateral obligatorio:** un préstamo exige `SOLICITUD` (bodega destino) +
     `APROBACION` (bodega origen). La solicitud **nunca** mueve stock ni reserva; la
     aprobación revalida el stock de origen **dentro de la transacción** (evita la
     sobre-promesa de varias solicitudes simultáneas: ver `stock_reservado` en §9.11-A).
   - **Máquina de estados estricta:** `SOLICITUD → ACTIVO → PARCIAL → DEVUELTO`, más
     `RECHAZADO`, `CANCELADO`, `ANULADO` y `DADA_DE_BAJA`. Toda transición se registra en
     `prestamos_historial` con usuario, bodega y justificación.
   - **Dar de baja** (insumo perdido, sin reposición) exige **una firma de cada bodega** +
     justificación, **no mueve stock** y es terminal.
   - **Prórroga** de `fecha_limite` requiere acuerdo bilateral y queda en
     `prestamos_prorogas`; nunca unilateral. **Máximo 3 prórrogas** (configurable en
     `departamentos.max_prorogas`); al agotarlas se alerta y solo queda devolver o dar de
     baja, de modo que **ningún préstamo quede flotando**.
   - **Topes anti-enjuague** (configurables en `departamentos`, validados al **solicitar**
     y al **aprobar**, contando solo estados `SOLICITUD`/`ACTIVO`/`PARCIAL`):
     - ≤ **2 préstamos concurrentes de la misma presentación** por bodega destino.
       Con 3+ la devolucion se vuelve ambigua (§9.11-E). Bloquear con mensaje accionable.
     - ≤ **5 préstamos concurrentes totales** por bodega destino.
     - Reservar stock con `stock_reservado`: `disponible = stock - stock_reservado`, con
       `CHECK (stock_reservado <= stock)` para que **nunca exista monto fantasma**.
   - **La ecuación fundamental por bodega debe seguir cuadrando despues de cada
     operacion** de prestamos/devoluciones (test obligatorio).

### Plan de migración (respaldo antes de aplicar)
- `V9__departamentos_bodegas.sql`: crear tablas + columnas + índices + bridge, **sin**
  borrar datos. Asignar todos los usuarios/items actuales a una bodega "General" inicial.
- Derivar `stock_bodega` desde `presentations.stock` en la bodega General.
- Backfill de `inventario_movimientos.departamento_id` = bodega General.
- Estrategia de acceso: primero **todo en General**, luego migrar cada departamento.
- **Respaldo de BD es obligatorio** antes de la primera migración que agregue columnas.

### Alcance esperado (impacto)
- **Backend:** 2–3 entidades nuevas + repositorios, cambios en `MovimientoService`
  (validación de stock por bodega), `ItemService` (pertenencia), `Usuario` (FK), filtros en
  todos los endpoints de lectura (insumos/movimientos/reportes/QR), DTOs y auditoría.
- **Frontend:** selector de bodega en el header, filtrado de listas, mostrar bodega en
  movimientos/reportes, ajuste de `MODULE_ACCESS` si un jefe ve solo su bodega.
- **Migración de datos y coordinación con el usuario** para definir los departamentos.
- **Tests:** unitarios de aislamiento por bodega y de stock por bodega.

> ⚠️ **Es el cambio más grande del proyecto.** Debe hacerse por fases, con respaldo y
> validación en `desa`/`pre`, nunca directo en `pro`.
