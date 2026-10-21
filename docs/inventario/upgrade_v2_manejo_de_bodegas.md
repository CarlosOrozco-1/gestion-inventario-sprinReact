# Upgrade V2: Manejo de Bodegas por Departamento

> **Documento:** `upgrade-V2-Manejo-de-bodegas.md`
> **Alcance:** análisis de impacto + decisiones de diseño para la **Fase 10** (pendiente).
> **Estado:** propuesta de diseño, **no implementada**.
> **Fecha:** 2026-09-30.
> **Riesgo:** el cambio más grande del proyecto. Requiere migración de datos,
> coordinación con el usuario y validación por fases.
>
> Se le llama **"V2"** porque no es una mejora incremental: cambia la **unidad de
> inventario** (de un stock global a N bodegas) y por tanto el modelo de datos, las
> transacciones, la autorización y la UI. El catálogo de materiales, en cambio,
> se mantiene compartido.

---

## 1. Resumen ejecutivo

Hoy SIGES maneja **un inventario único y global**: cualquier usuario (ADMIN, JEFE,
AUXILIAR) ve **todos** los insumos, todos los movimientos y puede registrar operaciones
sobre cualquier presentación.

La necesidad es pasar a **bodegas independientes por departamento** (Soporte,
Desarrollo, etc.), donde:

- El **catálogo de materiales sigue siendo general y compartido** (no se duplica).
- Lo que se separa es **a qué bodega pertenece cada item/presentación, su stock y sus
  movimientos**.
- Cada bodega tiene sus **propios ítems, totales, ingresos y egresos**.
- El usuario **solo ve su bodega**; el ADMIN ve todas.

Es el equivalente a gestionar **bodegas de un inventario industrial**: el mismo catálogo,
pero existencias separadas por ubicación.

Además, las bodegas podrán **prestarse insumos entre sí** (p. ej. Desarrollo presta
aire comprimido a Soporte), con un **motor de préstamos** que vigila la deuda y avisa
automáticamente cuando la bodega prestataria ya tiene existencia para devolver (§9).

**El cambio es grande** porque toca el modelo de datos, la lógica transaccional del stock,
el filtrado de casi todos los endpoints, los QR, la auditoría, la UI y un motor de
préstamos/traspasos entre bodegas. No es un ajuste puntual: es una nueva dimensión
transversal al sistema.

---

## 2. Modelo actual (recordatorio del impacto)

Entidades clave hoy (tabla → entidad):

| Tabla | Entidad | Rol en el sistema |
|---|---|---|
| `usuarios` | `Usuario` | Correo, nombre, `rol_id`, `active`. **Sin departamento.** |
| `roles` | `Rol` | ADMIN / JEFE / AUXILIAR (nivel). |
| `items` | `Item` | Catálogo de materiales (`code` inmutable, `name`, `activo`). **Compartido.** |
| `presentations` | `Presentation` | Variante de un material; **vive el `stock`, `min_stock`, `max_stock`, `qr_code`**. |
| `inventario_movimientos` | `Movimiento` | `presentation_id`, `type`, `usuario_id`, `quantity`, `detail`. **Sin bodega.** |
| `audit_logs` | `AuditLog` | Bitácora append-only. |

Puntos que **hoy son globales** y pasarían a ser **por bodega**:

- El **`stock`** está en `presentations.stock` (una sola cifra por presentación, sin
  ubicación). Con bodegas, un mismo insumo puede tener existencias distintas en Soporte y
  en Desarrollo.
- Los **movimientos** no tienen bodega; el stock se valida contra la cifra global.
- El **usuario** no tiene departamento; el aislamiento actual es **por rol**, no por
  ubicación.

El motor transaccional (`MovimientoService`) hoy:
1. Bloquea la fila de la presentación (`findByIdForUpdate`).
2. Aplica `stock ± quantity` según el tipo, validando `quantity ≤ stock` en salidas.
3. Guarda la presentación y registra el movimiento + auditoría.

Con bodegas, los pasos 1–3 deben operar sobre **el stock de una bodega concreta**, y el
paso de validación (`cantidad ≤ stock`) debe usar **el stock de esa bodega**, nunca el
consolidado.

---

## 3. Decisiones de diseño abiertas (resolver ANTES de migrar)

Estas son las preguntas que definen el modelo. Se recomiendan pero requieren confirmación
del usuario:

### 3.1 ¿Dónde vive el stock por bodega?

**Opción A (recomendada) — tabla `stock_bodega`:**
- Nueva tabla `stock_bodega` (`departamento_id`, `presentation_id`, `stock`, `min_stock`,
  `max_stock`) con UNIQUE `(departamento_id, presentation_id)`.
- El `stock` actual de `presentations` pasa a ser el **stock consolidado** (solo lectura,
  para reportes) o se elimina.
- **Permite** que un insumo exista con stock distinto en varias bodegas.
- Es la opción más fiel a "cada bodega tiene sus propios ítems/totales".

**Opción B — `departamento_id` en `presentations`:**
- Cada presentación pertenece a **una sola bodega**.
- Más simple de implementar.
- **Impide** que el mismo insumo exista en dos bodegas (si Soporte y Desarrollo necesitan
  alcohol, habría que duplicar la presentación).

**Recomendación:** Opción A. El caso "cada bodega tiene sus propios insumos" y la
posibilidad de compartir un mismo material entre bodegas es exactamente lo que pide el
requerimiento.

### 3.2 ¿A qué nivel se asigna un item a una bodega?

- **Item ↔ Bodega (N:N, tabla puente `item_departamentos`)**: qué bodegas "tienen" el
  material. El catálogo (item) es único y compartido; la pertenencia es many-to-many.
- **Presentación ↔ Bodega**: cada variante en una bodega concreta.

Con la Opción A de stock, lo natural es que la **pertenencia se defina a nivel
presentación** (el stock es por presentación y bodega). La puente `item_departamentos`
puede usarse para saber "qué items aparecen en el catálogo de esta bodega" (para poblar el
selector), mientras que `stock_bodega` maneja las existencias.

### 3.3 ¿Qué pasa con los QR?

- El QR actual es `SIGES-PRES-{id}` (apunta a la presentación global).
- Con bodegas, el QR debe **resolverse por defecto a la bodega del usuario que escanea**
  (cada usuario ve solo su bodega, así que el escaneo de un material que está en su bodega
  funciona; si no está en su bodega, avisa).
- Alternativa: incluir el departamento en el QR (`SIGES-PRES-{id}-D{depId}`), pero rompe
  los QR ya impresos y es más complejo de etiquetar.
- **Recomendación:** mantener `SIGES-PRES-{id}` y resolver por la bodega del usuario que
  escanea. Si el material no existe en su bodega, mostrar aviso claro. Esto **no invalida**
  los QR ya impresos.

### 3.4 ¿Los usuarios pueden pertenecer a varias bodegas?

- **Opción 1 (simple):** un usuario → una bodega (`usuarios.departamento_id`). El caso
  descrito ("matias pertenece a Desarrollo y solo ve esa bodega") encaja perfecto.
- **Opción 2 (flexible):** N:N (`usuario_departamentos`) para usuarios multi-area.
- **Recomendación:** Opción 1 por simplicidad; se puede ampliar a N:N después.

### 3.5 ¿El ADMIN ve todas o una seleccionada?

- **Recomendación:** el ADMIN ve **todas** las bodegas y puede **seleccionar** una para
  operar en ella. Esto evita errores al mover stock entre bodegas.

---

## 4. Modelo de datos propuesto (Opción A + usuario→una bodega)

### 4.1 Tablas nuevas

```sql
-- Bodegas / Departamentos
CREATE TABLE departamentos (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP
);

-- A qué bodegas pertenece cada material (para poblar el catálogo de la bodega)
CREATE TABLE item_departamentos (
    item_id        BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    departamento_id BIGINT NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, departamento_id)
);

-- Stock por bodega (la cifra real de existencias)
CREATE TABLE stock_bodega (
    id              BIGSERIAL PRIMARY KEY,
    departamento_id BIGINT NOT NULL REFERENCES departamentos(id),
    presentation_id BIGINT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    stock           INTEGER NOT NULL DEFAULT 0,
    stock_reservado INTEGER NOT NULL DEFAULT 0,   -- para admisiones/prestamos que aun no se confirman
    min_stock       INTEGER,
    max_stock       INTEGER,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP,
    CONSTRAINT uq_stock_bodega UNIQUE (departamento_id, presentation_id),
    CONSTRAINT ck_stock_bodega CHECK (stock >= 0 AND stock_reservado >= 0 AND stock_reservado <= stock)
);
```

Y los topes del módulo de préstamos se configuran **por bodega** (no hardcodeados):

```sql
ALTER TABLE departamentos
    ADD COLUMN max_prestamos_activos        INTEGER NOT NULL DEFAULT 5,  -- tope total (§9.12)
    ADD COLUMN max_prestamos_por_item       INTEGER NOT NULL DEFAULT 2,  -- tope por item (§9.12)
    ADD COLUMN max_prorogas                 INTEGER NOT NULL DEFAULT 3;  -- tope de prorrogas (§9.12)
```

> `disponible = stock - stock_reservado`. El `CHECK` impide que `stock_reservado`
> exceda al stock real (una reserva nunca puede ser mayor que lo que hay), lo que
> **blinda contra montos fantasma**.

### 4.2 Columnas nuevas

- `usuarios.departamento_id BIGINT REFERENCES departamentos(id)` (nullable: ADMIN puede
  quedar sin departamento = vista global).
- `inventario_movimientos.departamento_id BIGINT REFERENCES departamentos(id)` (la bodega
  del movimiento).

### 4.3 Índices

- `idx_stock_bodega_dep ON stock_bodega(departamento_id)`.
- `idx_movimientos_dep ON inventario_movimientos(departamento_id, created_at DESC)` (el
  filtro principal del kárdex/reportes será por bodega + fecha).
- `idx_item_dep_dep ON item_departamentos(departamento_id)`.

### 4.4 Qué pasa con `presentations.stock`

- Pasa a ser el **stock consolidado** (suma de todas las bodegas) y se mantiene **solo para
  lectura/reportes**. La fuente de verdad pasa a ser `stock_bodega`.
- El motor de movimientos **deja de usar** `presentations.stock` para validar/actualizar.

---

## 5. Migración de datos (con respaldo)

> ⚠️ **Regla de oro:** respaldo de BD **obligatorio** antes de la primera migración que
> agregue columnas. Las migraciones Flyway son aditivas (no borran), pero un respaldo es el
> estándar del proyecto.

Migración `V9__departamentos_bodegas.sql` (estrategia de acceso, **sin perder datos**):

1. Crear tabla `departamentos` e insertar la bodega inicial **"General"**.
2. Crear `item_departamentos` y `stock_bodega`; añadir columnas
   `usuarios.departamento_id` y `inventario_movimientos.departamento_id` (nullable al
   principio).
3. **Asignar todos los usuarios actuales** a la bodega "General".
4. **Asignar todos los items/presentaciones** a la bodega "General":
   - `INSERT INTO item_departamentos SELECT id, (id de General) FROM items`.
   - `INSERT INTO stock_bodega SELECT (General), id, stock, min_stock, max_stock FROM presentations`.
5. **Backfill de movimientos**: `inventario_movimientos.departamento_id = General`.

Con esto, **todo el histórico y el stock actual quedan en la bodega "General"** y el sistema
sigue funcionando exactamente igual (una sola bodega). A partir de ahí se migran los
departamentos reales uno por uno (tras agreed con el usuario cuáles items/presentaciones
pertenecen a cada bodega, y reasignando usuarios).

Estrategia de acceso: **primero todo en General**, luego migrar Soporte, Desarrollo, etc.
Esto permite validar que el cambio no rompe nada antes de separar.

---

## 6. Impacto en el backend

### 6.1 Entidades nuevas (`model/`)
- `Departamento` (nombre: considerar `Bodega`; el usuario dice "departamento/bodega").
- `ItemDepartamento` (entidad puente o solo repositorio con query nativa).
- `StockBodega`.

### 6.2 Cambios en entidades existentes
- `Usuario`: añadir `@ManyToOne Departamento departamento`.
- `Movimiento`: añadir `@ManyToOne Departamento departamento`.

### 6.3 Repositorios
- `DepartamentoRepository`, `StockBodegaRepository` (con `findByDepartamentoIdAndPresentationId`,
  y un **`findBy...ForUpdate`** para el bloqueo pesimista), `ItemDepartamentoRepository`.

### 6.4 `MovimientoService` (el corazón del cambio)
Hoy opera sobre `presentations.stock`. Con bodegas:
1. Resolver la **bodega del usuario** (desde el JWT → `usuario.departamento_id`; si es
   ADMIN sin departamento, requiere la bodega seleccionada en el request).
2. **Bloquear** la fila `stock_bodega` de esa bodega+presentación
   (`findBy...(..., ForUpdate)`), no la presentación global.
3. Validar `quantity ≤ stock_bodega.stock` en salidas.
4. Actualizar `stock_bodega.stock`, crear el movimiento con `departamento_id`, y guardar.
5. Todo dentro de **la misma `@Transactional`** (requisito de AGENTS.md).

### 6.5 Endpoints de lectura (filtrar por bodega)
Casi **todos** los endpoints de lectura necesitan filtrar por la bodega del usuario:
- `GET /insumos` (catálogo): mostrar solo items/presentaciones con stock en su bodega.
- `GET /movimientos`: filtrar por su bodega.
- `GET /reportes/*`: idem (y el filtro por usuario sigue igual).
- `GET /presentations/qr/{qr}`: resolver por la bodega del usuario que escanea.
- `GET /auditoria` (ADMIN): puede ver todas; los filtros podrían incluir bodega.
- `GET /proyecciones` / `sugerencias-stock`: calcular con movimientos de la bodega.

> **Regla de seguridad (AGENTS.md):** el aislamiento se filtra en el **backend**, nunca
> solo ocultando en la UI. Un usuario no debe poder ver datos de otra bodega aunque manipule
> la URL; devolver `403` o filtrar según su bodega.

### 6.6 DTOs
- `LoginResponse.UsuarioInfo`: incluir `departamento`/`bodega` (para la UI).
- `MovimientoDTO`: la bodega se deriva del usuario (no del body) — el usuario **no elige**
  freely la bodega de su movimiento (salvo ADMIN).
- `InsumoViewDTO` / vista de catálogo: exponer el stock **de la bodega del usuario**, no el
  consolidado.

### 6.7 Auditoría
- Los eventos de movimiento/ajuste deben **incluir el departamento** en la descripción
  (p. ej. "ENTRADA de 10 · Alcohol · Bodega Desarrollo").
- Opcional: nuevo evento `BODEGA_CREADA`, `ITEM_ASIGNADO_BODEGA`.

---

## 7. Impacto en el frontend

- **Header / sidebar:** mostrar la **bodega actual** del usuario (p. ej. "Desarrollo") como
  etiqueta; el ADMIN ve un **selector de bodega**.
- **Catálogo, Kárdex, Ajustes, Reportería, Dashboard:** los datos ya llegan filtrados del
  backend; el frontend muestra la bodega en títulos/filtros y en los movimientos/reportes
  (columna "Bodega").
- **`MODULE_ACCESS`:** revisar si un jefe ahora ve menos módulos (p. ej. si deja de ver
  usuarios de otras bodegas).
- **QR:** al escanear, si el material no está en la bodega del usuario, mostrar aviso
  ("este material no pertenece a tu bodega") en vez de error genérico.
- **Dashboard:** las tarjetas (totales, stock bajo) se calculan por la bodega.
- **Ajustes de UX (AGENTS.md §5):** la bodega se informa en tooltips/etiquetas breves, no
  en párrafos dentro de modales.

---

## 8. Impacto en QR, reportes y proyecciones

- **QR:** mantener `SIGES-PRES-{id}`; la resolución usa la bodega del usuario que escanea
  (§3.3). Los QR **ya impresos siguen funcionando**.
- **Reportes (Excel/PDF):** los movimientos exportados deben incluir la columna **Bodega**
  y el filtro de usuario se combina con la bodega.
- **Proyecciones / Smart Restock:** el consumo histórico debe calcularse **por bodega**
  (si no, el stock mínimo sugerido mezcla consumos de bodegas distintas). `SugerenciaStockService`
  debe agrupar por `departamento_id`.
- **Dashboard:** totales y alertas **por bodega**.

---

## 9. Préstamos entre bodegas (motor de préstamos)

> Caso motivating: **Soporte no tiene aire comprimido, Desarrollo sí.** Desarrollo le
> presta 50 unidades a Soporte. Cuando Soporte vuelve a tener existencia, el sistema debe
> **alertar que tiene que devolverlas**. No es solo un registro: es un ciclo de vida con
> alertas automáticas.

### 9.1 Préstamo ≠ Traspaso (distinción obligatoria)

Son dos operaciones **distintas** y confundirlas corrompe el inventario:

| | **Traspaso** | **Préstamo** |
|---|---|---|
| Intención | La mercancía **cambia de dueño** (Soporte se queda con las 50). | Soporte la usa **temporalmente** y la devuelve. |
| Efecto en stock | Origen −50, Destino +50. **Igual que el préstamo.** | Origen −50, Destino +50. **Igual que el traspaso.** |
| Obligación futura | Ninguna. Se cierra. | **Deuda de devolución** (quedan las 50 prestadas). |
| Seguimiento | Ninguno. | Préstamo **ACTIVO** con alertas hasta devolver. |
| Ejemplo | Desarrollo dona 50 a Soporte y se olvidan. | Desarrollo presta 50 y Soporte las devuelve al reponer. |

**Ambos generan los mismos 2 movimientos de stock** (origen −N, destino +N). Lo que
diferencia al préstamo es que además **crea un registro de deuda** con ciclo de vida.
Por eso el módulo se llama "Préstamos" e incluye el traspaso como caso simplificado.

### 9.2 Flujo del préstamo (acuerdo bilateral + ciclo de vida)

El préstamo **nunca es unilateral**: siempre hay un **acuerdo entre las dos bodegas**,
tanto para prestar como para cerrar la deuda. Cada lado tiene su acción y su
responsabilidad.

```
SOLICITUD   Soporte pide 50 a Desarrollo (cantidad + fecha propuesta + motivo)
     |       estado = SOLICITUD.   NO mueve stock. NO reserva (ver 9.11-A)
     |
     +--> CANCELADO        Soporte se arrepiente antes de la aprobacion
     +--> RECHAZADO        Desarrollo no acepta (con motivo)
     |
APROBACION   Desarrollo revisa y ACEPTA
     |       * revalida stock de origen en ese instante (9.11-B)
     |       estado = ACTIVO; mueve stock:  Origen -50, Destino +50
     |       fecha_limite = la propuesta por el solicitante (o la que fije el aprobador)
     |
CONSUMO      Soporte usa las unidades -> su stock baja por SALIDAS normales.
     |       El prestamo sigue ACTIVO. El motor lo vigila.
     |
ALERTA       stock_destino >= nivel_referencia  ->  "Devolver 50 a Desarrollo"
     |       + alerta de VENCIMIENTO si se pasa fecha_limite sin prorroga
     |
PRORROGA    Si hay atraso en la reposicion: Soporte pide ampliar la fecha,
     |       Desarrollo la ACEPTA (queda auditada, con justificacion). 9.11-D
     |
DEVOLUCION  Soporte devuelve (TOTAL o PARCIAL):
     |       * mueve stock:  Destino -N,  Origen +N
     |       * estado = DEVUELTO (si pendiente=0)  o  PARCIAL
     |
CONFIRMACION Desarrollo CONFIRMA que recibio las unidades.
     |       Si N pendiente = 0, el prestamo se CIERRA. 9.11-C
     |
CIERRES ALTERNATIVOS
     +--> DADA DE BAJA   Si ya no se puede reponer (falta de compra):
     |                   requiere autorizacion de AMBAS partes + justificacion.
     |                   NO mueve stock: las unidades pasan a ser de Soporte.
     +--> ANULADO        Origen (o ADMIN) revierte los 2 movimientos (prestamo error).
```

> **Punto clave:** cuando Soporte "consume" aire comprimido, ese consumo es un
> `SALIDA` **normal de su bodega** (ya validado contra su propio stock por bodega). El
> préstamo **no** consume el stock por sí mismo: solo lo vigila y lo devuelve cuando
> reaparece la existencia. Esto mantiene la ecuación fundamental intacta en ambas bodegas.

### 9.3 Modelo de datos: tabla `prestamos`

```sql
CREATE TABLE prestamos (
    id                    BIGSERIAL PRIMARY KEY,
    presentacion_id       BIGINT       NOT NULL REFERENCES presentations(id),
    bodega_origen_id      BIGINT       NOT NULL REFERENCES departamentos(id),  -- quien presta (Desarrollo)
    bodega_destino_id     BIGINT       NOT NULL REFERENCES departamentos(id),  -- quien recibe (Soporte)

    -- Acuerdo: solicitud y aprobacion
    cantidad              INTEGER      NOT NULL CHECK (cantidad > 0),
    cantidad_devuelta     INTEGER      NOT NULL DEFAULT 0,
    stock_destino_antes   INTEGER      NOT NULL,      -- snapshot para el motor de alertas
    estado                VARCHAR(20)  NOT NULL,      -- SOLICITUD|ACTIVO|PARCIAL|DEVUELTO|RECHAZADO|CANCELADO|ANULADO|DADA_DE_BAJA
    --   (columna VARCHAR: usar CHECK en vez de ENUM para no bloquearse)
    -- Trazabilidad de las dos firmas del acuerdo
    solicitante_id        BIGINT       NOT NULL REFERENCES usuarios(id),      -- Bodega destino
    autorizador_id        BIGINT       REFERENCES usuarios(id),                -- Bodega origen
    receptor_id           BIGINT       REFERENCES usuarios(id),                -- Bodega origen (confirma)
    baja_autorizador_id   BIGINT       REFERENCES usuarios(id),                -- Bodega origen (da de baja)
    baja_solicitante_id   BIGINT       REFERENCES usuarios(id),                -- Bodega destino (da de baja)

    -- Fechas
    fecha_limite          TIMESTAMP    NOT NULL,      -- vigente (incluye prorrogas)
    fecha_prestamo        TIMESTAMP,
   created_at            TIMESTAMP    NOT NULL,
    updated_at            TIMESTAMP,

    -- Control de topes (§9.12): contadores desnormalizados para validar rapido
    num_prorogas          INTEGER      NOT NULL DEFAULT 0,   -- tope 3
    en_mora_critica       BOOLEAN      NOT NULL DEFAULT FALSE, -- agoto las 3 prorrogas y vencio

    -- Justificaciones (>= 20 chars, igual que los ajustes)
    motivo                VARCHAR(255) NOT NULL,      -- por que se presta
    motivo_rechazo        VARCHAR(255),               -- por que se rechaza
    motivo_baja           VARCHAR(255),               -- por que se da de baja
    CONSTRAINT ck_prestamos_cant CHECK (cantidad_devuelta >= 0 AND cantidad_devuelta <= cantidad),
    CONSTRAINT ck_prestamos_bodegas CHECK (bodega_origen_id <> bodega_destino_id)
);
CREATE INDEX idx_prestamos_destino_estado ON prestamos (bodega_destino_id, estado);
CREATE INDEX idx_prestamos_origen_estado  ON prestamos (bodega_origen_id, estado);
```

**Invariantes (inviolables):**
- `0 ≤ cantidad_devuelta ≤ cantidad`.
- `bodega_origen_id <> bodega_destino_id` (auto-préstamo prohibido; usar Ajuste).
- Cada estado terminal (`DEVUELTO`, `RECHAZADO`, `CANCELADO`, `ANULADO`, `DADA_DE_BAJA`)
  tiene su usuario responsable en la columna correspondiente.
- **`stock_destino_antes` se captura en la APROBACION** (no en la solicitud), porque es
  el stock real del destino justo antes de recibir las unidades.

**Tablas de soporte del acuerdo (historial):**

```sql
-- Cada cambio de estado queda auditado (acuerdo bilateral explicito)
CREATE TABLE prestamos_historial (
    id            BIGSERIAL PRIMARY KEY,
    prestamo_id   BIGINT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20),
    estado_nuevo  VARCHAR(20) NOT NULL,
    usuario_id    BIGINT NOT NULL REFERENCES usuarios(id),
    bodega_id     BIGINT NOT NULL REFERENCES departamentos(id),  -- de que bodega actuo
    cantidad      INTEGER,        -- devoluciones / baja de deuda
    justificacion VARCHAR(255),
    created_at    TIMESTAMP NOT NULL
);

-- Prorogas de fecha limite (acuerdo bilateral, 9.11-D)
CREATE TABLE prestamos_prorogas (
    id            BIGSERIAL PRIMARY KEY,
    prestamo_id   BIGINT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    fecha_limite_anterior TIMESTAMP NOT NULL,
    fecha_limite_nueva    TIMESTAMP NOT NULL,
    solicitante_id BIGINT NOT NULL REFERENCES usuarios(id),
    autorizador_id BIGINT NOT NULL REFERENCES usuarios(id),
    justificacion VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL
);
```

> Estas dos tablas hacen auditable **quién acordó qué y cuándo**. Sin ellas, un
> préstamo que se prorroga tres veces no deja rastro de por qué.

**Y una reserva de stock (9.11-A):** para que varias solicitudes simultáneas no se
sobre-prometan, `stock_bodega` gana la columna `stock_reservado` (definida en §4.1):

```
disponible = stock - stock_reservado
--  Al APROBAR un prestamo:  stock_reservado -= cantidad;  stock -= cantidad
```

> **Nota:** la reserva se aplica al **aprobar**, no al solicitar. Si se reservara al
> solicitar, una solicitud abandonada congelaría stock indefinidamente.

| Tipo | Efecto en stock | Cuándo |
|------|-----------------|--------|
| `PRESTAMO_SALIDA` | Origen −cantidad | Desarrollo aprueba y presta 50. |
| `PRESTAMO_ENTRADA` | Destino +cantidad | Desarrollo aprueba y presta 50. |
| `DEVOLUCION_SALIDA` | Destino −cantidad | Soporte devuelve. |
| `DEVOLUCION_ENTRADA` | Origen +cantidad | Soporte devuelve. |
| `TRASPASO_SALIDA` / `TRASPASO_ENTRADA` | Origen −N / Destino +N | Traspaso sin deuda. |

### 9.4 Tipos de movimiento nuevos

Se agregan a los tipos de `inventario_movimientos` (y al switch de `MovimientoService`):

| Tipo | Efecto en stock | Cuándo |
|------|-----------------|--------|
| `PRESTAMO_SALIDA` | Origen −cantidad | Desarrollo aprueba y presta 50. |
| `PRESTAMO_ENTRADA` | Destino +cantidad | Desarrollo aprueba y presta 50. |
| `DEVOLUCION_SALIDA` | Destino −cantidad | Soporte devuelve. |
| `DEVOLUCION_ENTRADA` | Origen +cantidad | Soporte devuelve. |
| `TRASPASO_SALIDA` / `TRASPASO_ENTRADA` | Origen −N / Destino +N | Traspaso sin deuda. |

> La columna `type` es `VARCHAR`, así que **no requiere migración de tipo**: solo se
> amplían los valores válidos. Los ajustes (**`AJUSTE_MANUAL`**) **no** participan en
> préstamos: son un mecanismo independiente y ambos pueden coexistir sobre la misma
> presentación.

### 9.5 El motor inteligente: cómo sabe que "ya puede devolver"

El motor no adivina: usa el **stock actual de la bodega destino** y lo compara con un
**nivel de referencia** guardado al crear el préstamo. La regla (por presentación):

```
disponible_para_devolver = max(0, stock_actual_destino - nivel_referencia_base)
pendiente               = cantidad - cantidad_devuelta
nivel_referencia         = stock_destino_antes_del_prestamo + pendiente
puede_devolver           = (stock_actual_destino - stock_antes) >= pendiente
```

- `nivel_referencia_base` = el stock que tenía la **bodega destino** justo **antes** de
  recibir el préstamo (se guarda como snapshot en `stock_destino_antes`).
- Si `stock_actual_destino >= nivel_referencia` → **disponible para devolver** (total o
  parcial). Se dispara la alerta.
- Si `stock_actual_destino < nivel_referencia` → todavía no puede devolver; no alerta.

**Ejemplo (el caso de Soporte):**
1. Soporte tiene 0 de aire comprimido. Desarrollo presta 50.
   → `stock_destino_antes = 0`, `nivel_referencia = 0 + 50 = 50`. Soporte queda con 50.
2. Soporte consume los 50 (salidas normales) → su stock baja a 0. **No puede devolver**
   (0 < 50). Sin alerta.
3. Soporte recibe/normaliza 50 nuevas unidades (entradas normales de su bodega) →
   su stock sube a 50. Ahora `50 >= 50` → **motor dispara alerta: "Devolver 50 a
   Desarrollo"**.
4. Soporte registra la devolución → `DEVOLUCION_SALIDA` (Soporte −50) +
   `DEVOLUCION_ENTRADA` (Desarrollo +50). `cantidad_devuelta = 50`, estado `DEVUELTO`.

> **Por que este método y no "contar los movimientos"?** Rastrear cuáles movimientos
> consumieron exactamente las unidades prestadas es frágil (FIFO/LIFO, ajustes manuales,
> saldos que ya no cuadran). Comparar contra el **snapshot de stock** es simple, auditable
> y no depende de la trazabilidad de cada unidad. La contra es que un **ajuste manual** o
> un **traspaso de una tercera bodega** puede "engañar" al motor: por eso se documenta
> como limitación conocida y se ofrece una anulación manual (§9.7).

### 9.6 Alertas del motor

- **ALERTA_DEVOLUCION** → al destino (Soporte): "Tenés existencia para devolver 50 u. de
  Aire Comprimido a Desarrollo" (con acción de un clic para registrar la devolución).
- **ALERTA_PRESTADO** → al origen (Desarrollo): "Le prestaste 50 u. a Soporte; pendiente
  de devolución".
- **ALERTA_VENCIDO** → si `fecha_limite < hoy` y sigue `ACTIVO`/`PARCIAL`: "Préstamo
  vencido" (a ambas bodegas + ADMIN).
- **ALERTA_PRRORGA_AGOTADA** → al alcanzar la **3ª prórroga**: "Este préstamo agotó sus 3
  prórrogas; solo queda devolver o dar de baja" (a ambas bodegas + ADMIN). Es la barrera
  anti-préstamo flotante (§9.12).
- **ALERTA_MORA_CRITICA** → préstamo `en_mora_critica` (3 prórrogas agotadas + fecha
  vencida sin cerrar): aparece en el Dashboard del ADMIN como **"Mora crítica"**. Nunca
  se auto-da de baja: requiere la doble firma humana.
- **ALERTA_TOPE_ALCANZADO** → al bloquear una solicitud por topes (§9.12): "Tu bodega
  alcanzó el tope de préstamos (2 del mismo item / 5 totales)". Mensaje accionable con
  qué cerrar primero.
- **ALERTA_STOCK_BAJO_ORIGEN** → si la bodega origen (Desarrollo) cae por debajo de
  `min_stock` **por culpa del préstamo** (alerta informativa: "prestaste tu última
  reserva").

Las alertas se pueden exponer como: (a) **badge/ícono en el header**, (b) **tarjeta en
Dashboard**, (c) **evento WebSocket** en tiempo real (extender `useRealtimeSync`), y
opcionalmente (d) resumen por correo.

### 9.7 Casos borde resueltos y decisiones de confirmación

**Resueltos por las decisiones del usuario:**

| Caso | Resolución |
|---|---|
| Solicitud/aprobación | **Bilateral obligatorio.** El solicitante nunca mueve stock; el aprobador (de la bodega origen) confirma. |
| Fecha límite | **Obligatoria.** Propuesta por el solicitante, aceptable/modificable por el aprobador. Prorrogable vía acuerdo bilateral (§9.2). |
| Devolución parcial | **Permitida.** Queda `PARCIAL`; el motor sigue vigilando el resto. |
| Baja de deuda | **Permitida con doble autorización** (una firma de cada bodega) + justificación. **No mueve stock**: las unidades pasan a ser del destino (equivalente a un traspaso sin deuda). |
| Auto-préstamo | Prohibido por `CHECK (bodega_origen_id <> bodega_destino_id)`. Usar Ajuste o Traspaso. |
| Préstamo a bodega sin el item asignado | Permitido **solo si la solicitud viene del destino**: la solicitud crea el vínculo pendiente; al aprobar, se exige que el origen tenga el item asignado. |
| Préstamos en cadena (A→B→C) | Permitido a **un solo nivel** (A↔B). Para más niveles, usar préstamos independientes. Ver (§9.11-G). |

### 9.8 Endpoints del módulo de Préstamos

```
# Acuerdo: solicitud y aprobacion
GET  /api/prestamos                      # listar (filtrado por bodega del usuario + estado)
GET  /api/prestamos/{id}                 # detalle con nivel de referencia, disponible, historial
POST /api/prestamos                      # SOLICITAR (destino). Crea estado=SOLICITUD
POST /api/prestamos/{id}/aprobar         # (origen) ACTIVA + mueve stock
POST /api/prestamos/{id}/rechazar        # (origen) RECHAZADO + motivo
POST /api/prestamos/{id}/cancelar        # (destino, mientras SOLICITUD) CANCELADO
POST /api/prestamos/{id}/prorrogar       # SOLICITA prorroga (destino) + acepta (origen)

# Operacion y cierre
POST /api/prestamos/{id}/devolver        # devolucion total o parcial (cantidad) -> mueve stock
POST /api/prestamos/{id}/confirmar       # (origen) CONFIRMA recepcion; si pendiente=0 -> CIERRA
POST /api/prestamos/{id}/dar-baja        # doble firma + justificacion -> DADA_DE_BAJA
POST /api/prestamos/{id}/anular          # origen/ADMIN revierte 2 movimientos

# Motor de alertas (consulta)
GET  /api/prestamos/alertas              # prestamos que YA pueden devolverse + vencidos + mora critica
GET  /api/prestamos/resumen              # KPI: unidades pendientes, # prestamos, vencidos, mora
GET  /api/prestamos/{id}/historial       # auditoria del acuerdo bilateral
GET  /api/prestamos/limites              # topes configurados de la bodega (§9.12)
```

Todos dentro del aislamiento de bodega (§6.5), con `@Transactional` (AGENTS.md) y con
**transiciones de estado validadas** (no se puede ir de `DEVUELTO` a `ACTIVO`).

**Validaciones obligatorias al `solicitar()` y al `aprobar()`** (§9.12), que deben
devolver `422` con mensaje accionable:
- `origen ≠ destino`.
- Préstamos concurrentes de la **misma presentación** ≤ `max_prestamos_por_item`.
- Préstamos concurrentes **totales** de la bodega destino ≤ `max_prestamos_activos`.
- `cantidad > 0` y `cantidad ≤ disponible` del origen (recalculado en el instante).
- `num_prorogas < max_prorogas` al intentar prorrogar.

### 9.9 Frontend: módulo de Préstamos

- **`SolicitudModal.tsx`** (destino): pide presentación (puede no estar en su catálogo),
  cantidad, fecha límite propuesta, motivo.
- **`PrestamoModal.tsx`** (origen): bandeja de solicitudes con **stock disponible actual**,
  aprobar / rechazar (con motivo).
- **`DevolucionModal.tsx`** (destino): pendiente, **cuanto puede devolver ahora**
  (`disponible_para_devolver`), devolver TOTAL o PARCIAL, solicitar prorroga.
- **`ConfirmacionModal.tsx`** (origen): confirma que recibio las unidades; si
  `pendiente = 0`, el prestamo se cierra.
- **Badge de alerta** en el header (icono de manos + contador) + tarjeta en Dashboard:
  "Prestamos por devolver: 50 u." y "Vencidos: 1".
- Textos breves en etiquetas/tooltips (AGENTS.md §5), no parrafos en modales.
- Aislamiento en UI **solo como reflejo**: el backend es la fuente de verdad.

### 9.10 Pasos de implementacion del motor

1. **Esquema:** `V10__prestamos.sql` (prestamos + historial + prorrogas + indices +
   `stock_reservado` en `stock_bodega`) + tipos de movimiento nuevos.
2. **Backend — núcleo base:** `PrestamoService` con la **máquina de estados** completa
   (solicitar/aprobar/rechazar/cancelar), transaccional, revalidando stock de origen al
   aprobar.
3. **Backend — cierre:** devolver (total/parcial), confirmar, dar de baja (doble firma),
   anular con reversion.
4. **Motor de alertas:** `evaluarDevoluciones(presentacionId)` al cerrar cada
   `ENTRADA`/`SALIDA` de la bodega destino; emite `ALERTA_DEVOLUCION` / `ALERTA_VENCIDO`.
5. **Tiempo real:** extender `useRealtimeSync` con los eventos de prestamo.
6. **UI:** modulo, modales, badge, KPI de dashboard.
7. **Tests:** devolucion total/parcial, no-devolver-cuando-no-alcanza, prorroga bilateral,
   doble firma de baja, rechazo/cancelacion, transicion-de-estado invalida, aislamiento
   (destino no ve prestamos ajenos), **sobre-promesa bloqueada por `stock_reservado`**,
   **los 3 topes de §9.12 (por item, total y prorrogas)**, concurrencia (dos devoluciones
   no duplican) y **ecuación fundamental intacta tras cada operación**.
8. **QA con el usuario:** recorrido completo del caso Soporte/Desarrollo (solicitud →
   aprobación → consumo → alerta → devolución → confirmación) y de los cierres
   alternativos (prorroga, baja, rechazo).

### 9.11 Agujeros funcionales detectados → decisiones cerradas

Estos son los puntos que **podrían haber dejado el inventario con déficits o montos
fantasma**. Cada uno está **resuelto** (no es propuesta: es la regla a implementar).

| # | Agujero | Riesgo si no se cierra | **Decisión** | Dónde se implementa |
|---|---|---|---|---|
| **A** | Sobre-promesa: 3 solicitudes de 50 con 60 en stock; la 3ª aprobación falla | Stock prometido que no existe | **`stock_reservado`** en `stock_bodega`; `disponible = stock − reservado`. Se reserva al **aprobar** (no al solicitar). La modal de aprobación muestra el disponible real. | `stock_bodega.stock_reservado` |
| **B** | El stock del origen cambia entre solicitud y aprobación | Se aprueban 50 cuando ya no hay | **Revalidar el stock de origen en el instante de la aprobación**, dentro de la `@Transactional` y con bloqueo pesimista de la fila del origen. | `PrestamoService.aprobar()` |
| **C** | ¿Cuándo se mueve el stock en la devolución? | Stock "colgado" esperando confirmación | **Se mueve al registrar** (traslado físico real) + **el origen confirma y cierra**. Si no confirma en 48h, auto-cierre con nota en auditoría. | `PrestamoService.devolver()` / `confirmar()` |
| **D** | Prórrogas sin límite | Préstamo eterno = traspaso disfrazado | **Máximo 3 prórrogas.** Cada una con justificación, en `prestamos_prorogas`, y **al agotarse** el sistema avisa y ofrece cerrar como **DADA_DE_BAJA** (§9.12). | `PrestamoService.prorrogar()` |
| **E** | Varios préstamos del mismo item a la misma bodega | Ambigüedad: no se sabe cuál devolución cubre cuál | **Máximo 2 préstamos concurrentes del mismo item** por bodega destino (§9.12) + **FIFO** (`fecha_prestamo`) y la devolución **apunta a un préstamo específico**. | `PrestamoService.solicitar()` |
| **F** | Baja de deuda: efecto en stock ambiguo | Déficit fantasma (se espera stock que nunca vuelve) | La baja **NO mueve stock**: Desarrollo ya descontó al prestar y las unidades pasan a ser del destino = "pérdida aceptada por ambas bodegas". Doble firma + justificación + auditoría. | `darBaja()` |
| **G** | Préstamos en cadena (A→B→C) | B no puede devolver a A lo que prestó a C | **Solo un nivel** (A↔B). Más niveles = préstamos independientes. Bloquear cualquier transacción que toque >2 bodegas. | validación de `PrestamoService` |
| **H** | Un AJUSTE_MANUAL puede "engañar" al motor | Devolución de stock fantasma | Cuando la alerta provenga de un **ajuste** (no de una entrada real), la UI lo marca y **exige confirmación del origen** antes de cerrar. | `evaluarDevoluciones()` |
| **I** | Origen "confirma" 50 recibidas pero en destino quedan 20 | Saldo descuadrado en la devolución | La devolución valida `cantidad ≤ stock_destino` **en el momento**; si no alcanza, se registra **parcial** o la diferencia con ajuste justificado. | `PrestamoService.devolver()` |
| **J** | El pasivo es invisible en el stock consolidado | El ADMIN no ve la deuda real | Tarjetas separadas: **"Pendiente de devolución"** y **"Dado de baja acumulado"**; y por bodega **"lo que me deben" / "lo que debo"**. | `GET /api/prestamos/resumen` |

#### Detalle de los puntos que cambian el stock (anti-deficiencia)

Para que **nunca** haya déficit ni monto fantasma, estas tres reglas son sacredas:

1. **Ningún préstamo modifica stock sin movimientos.** Siempre 2 movimientos
   (`PRESTAMO_SALIDA` + `PRESTAMO_ENTRADA`) en la misma `@Transactional`.
2. **`cantidad_devuelta ≤ cantidad` siempre**, validado en el service (con bloqueo
   pesimista de **ambas** bodegas, en orden determinista por `departamento_id`) **y**
   con `CHECK` en BD.
3. **La ecuación fundamental por bodega se mantiene después de cada operación**:
   `Stock_Bodega = Σ Entradas − Σ Salidas + Σ Ajustes+ − Σ Ajustes−`. Los movimientos
   de préstamo/devolución entran como entradas/salidas más, sin excepciones. Un test
   debe verificar la ecuación tras cada operación del módulo.

### 9.12 Topes del módulo de préstamos (anti-enjuague)

Estos topes evitan que el módulo se llene de Pragmas flotantes. **Son configurables por
bodega** (no están hardcodeados) y se aplican **tanto al solicitar como al aprobar**
(solo así se evita encolar solicitudes infinitas).

| Límite | Valor | Qué cuenta | Mensaje al bloquear |
|---|---|---|---|
| **Prórrogas por préstamo** | **3** | Prórrogas registradas en `prestamos_prorogas` | "Este préstamo ya agotó sus 3 prórrogas. Se debe cerrar (devolver o dar de baja)." |
| **Préstamos concurrentes del MISMO item** (misma presentación → misma bodega destino) | **2** | Préstamos en `SOLICITUD`, `ACTIVO` o `PARCIAL` de esa presentación | "Ya tenés 2 préstamos activos de [item]. Devolvé o cerrá uno antes de pedir de nuevo." |
| **Préstamos concurrentes TOTALES** (por bodega destino, cualquier item) | **5** | Préstamos en `SOLICITUD`, `ACTIVO` o `PARCIAL` de la bodega | "Tu bodega alcanzó el tope de 5 préstamos simultáneos. Cerrá alguno primero." |

> **Estados que NO cuentan para los topes:** `DEVUELTO`, `RECHAZADO`, `CANCELADO`,
> `ANULADO`, `DADA_DE_BAJA` (son históricos, no carga viva). Solo cuentan `SOLICITUD`,
> `ACTIVO` y `PARCIAL`.

**Al agotar la 3ª prórroga:** el sistema dispara una alerta a ambas bodegas y al ADMIN:
"Este préstamo agotó sus 3 prórrogas y su fecha límite venció. Solo queda devolver o dar
de baja." Si no se actúa, el préstamo queda `ACTIVO` pero marcado como **"en mora
crítica"** (visible en el Dashboard del ADMIN) — **nunca se auto-darda de baja** (esa
decisión requiere la doble firma humana).

**Sobre el tope por item (2 vs 3):** se eligió **2** (no 3) porque el riesgo real no es
que Soporte deba 3 cosas distintas (eso es normal y lo cubre el tope total de 5), sino
que la **misma presentación esté prestada varias veces**, lo que ambigüa qué devolución
cubre qué préstamo (punto E). Con 2 el motor sigue siendo inequívoco.

### 9.13 Puntos de vista (propios vs. del usuario)

Registro de las consideraciones de diseño, para que quede claro qué pidió el negocio
y qué propuso la ingeniería:

**Puntos de vista del usuario (negocio):**
- El préstamo **debe ser un acuerdo entre ambas bodegas** (solicitud + aprobación), no
  una acción unilateral de quien tiene stock.
- La **fecha límite** es obligatoria y **prorrogable** (los atrasos de reposición son
  reales y previsibles).
- Se aceptan **devoluciones parciales** (no siempre se puede devolver todo).
- Si el insumo **ya no se puede reponer** (falta de compra), se debe poder **dar de
  baja** la deuda con autorización de **ambas partes** y justificación.
- Se quiere **limitar los préstamos por item y en total** para no "ensuciar" el
  inventario ni dejar préstamos flotando.

**Puntos de vista de la ingeniería (técnicos):**
- Un préstamo **nunca** es solo un registro: **siempre** mueve stock con 2 movimientos
  atómicos. La tabla `prestamos` es una deuda, no la fuente de stock (evita déficits).
- El motor de alertas debe ser **simple y auditable**: comparar contra un **snapshot** de
  stock, no rastrear movimientos (que es frágil con ajustes/FIFO).
- La **sobre-promesa** y el **stock cambiante** son los dos riesgos que más necesitan
  control transaccional → `stock_reservado` + revalidación al aprobar.
- Los **topes deben ser configurables y contarse en solicitud y aprobación**, no solo
  al approve, o se pueden encolar solicitudes infinitas.
- Un Ajuste o un traspaso de una tercera bodega pueden "engañar" al motor → por eso hay
  confirmación humana y marcado del origen de la alerta.

**Dónde convergen:** ambos coinciden en que la deuda debe ser **explícita, bilateral y
visible**, y en blindar contra stock fantasma. La ingeniería aporta los mecanismos
(transacciones, reservas, snapshot) que hacen confiable la regla de negocio del usuario.

---

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Corrupción de stock al migrar | Alto | Respaldo previo; estrategia "todo en General" primero; validar ecuación fundamental antes/después. |
| Fuga de datos entre bodegas | Alto | Filtrado en backend; tests de aislamiento (un usuario no ve otra bodega). |
| QR roto tras el cambio | Medio | Mantener `SIGES-PRES-{id}`; resolver por bodega del usuario. |
| Mezcla de consumos en proyecciones | Medio | Agrupar por `departamento_id` en `SugerenciaStockService`. |
| Cambio grande en un solo PR | Alto | Implementar **por fases** (esquema → backend → UI → datos). |
| Confundir roles con bodegas | Medio | Roles siguen siendo permisos (quién puede hacer qué); bodegas son **dónde**. Son ortogonales. |
| Préstamos sin devolución (deuda colgada) | Alto | Alertas por nivel de stock + vencimiento; KPI de pendientes en Dashboard; opción de dar de baja con justificación. |
| Falsa alarma del motor de préstamos | Medio | Basarse en el **snapshot** de stock (no en el rastreo de movimientos); permitir anulación/devolución manual. |
| Préstamo que altera el stock sin movimiento | **Crítico** | Un préstamo **nunca** cambia stock por sí solo: siempre genera 2 movimientos (`PRESTAMO_*`) en la misma `@Transactional`. La tabla `prestamos` es un *registro de deuda*, nunca la fuente del stock. |
| Devoluciones concurrentes duplican | Alto | Bloqueo pesimista de `stock_bodega` de **ambas** bodegas + validar `cantidad_devuelta + n ≤ cantidad` dentro de la transacción. |
| Deadlock en devoluciones cruzadas | Medio | Bloquear siempre las filas en **orden determinista** (por `departamento_id` ascendente) al tocar dos bodegas en la misma transacción. |

> **Nota importante:** los **roles** (ADMIN/JEFE/AUXILIAR) y las **bodegas** son conceptos
> **ortogonales**: el rol define *qué operaciones* puede hacer alguien; la bodega define
> *sobre qué datos* opera. Un jefe de Soporte (JEFE de Soporte) tiene permisos de jefe pero
> solo sobre su bodega.

---

## 11. Plan de fases sugerido (implementación)

1. **F10.1 — Esquema:** migración `V9` (tablas, columnas, índices) + crear bodega "General"
   + backfill. **Sin tocar lógica todavía** (validar que el sistema sigue igual).
2. **F10.2 — Backend lectura:** filtrar catálogo/movimientos/reportes por la bodega del
   usuario; exponer bodega en el login y DTOs; selector de bodega para ADMIN.
3. **F10.3 — Backend escritura:** mover el motor de movimientos a `stock_bodega`
   (validación por bodega, bloqueo pesimista, `departamento_id` en el movimiento).
4. **F10.4 — QR y auditoría:** resolver QR por bodega; incluir bodega en auditoría.
5. **F10.5 — UI:** etiquetas de bodega, selector ADMIN, columna bodega en reportes, avisos
   de QR.
6. **F10.6 — Proyecciones y Dashboard:** agrupar por bodega.
7. **F10.7 — Módulo de Préstamos (motor):** `V10__prestamos.sql` + `PrestamoService`
   (crear/devolver/anular) + motor de alertas + endpoints + UI + tiempo real (§9.10).
8. **F10.8 — Datos reales:** con el usuario, crear los departamentos (Soporte, Desarrollo,
   ...), reasignar usuarios e items/presentaciones desde "General" a cada bodega, y validar
   la ecuación fundamental por bodega.

Cada fase: respaldo de BD, tests en verde, validación en `desa`/`pre`.

---

## 12. Preguntas para el usuario (bloqueantes para iniciar F10)

1. **¿Cuántas bodegas/departamentos y cuáles?** (p. ej. Soporte, Desarrollo, +otros).
2. **¿Un material puede estar en varias bodegas?** (define Opción A vs B en §3.1).
3. **¿Los usuarios son de una sola bodega?** (supuesto: sí, §3.4).
4. **¿El ADMIN necesita operar en varias bodegas a la vez?** (selector o vista global).
5. **¿La bodega va en el QR impreso?** (recomendación: no, resolver por usuario).
6. **Datos actuales:** ¿el stock/movimientos actuales deben quedar en "General" o
   distribuirse ya entre las bodegas reales desde el inicio?

### Sobre los préstamos (§9) — YA RESPONDIDO

| # | Pregunta | Respuesta del usuario |
|---|---|---|
| 7 | ¿Flujo de solicitud/aprobación o registro directo? | **Solicitud + aprobación bilateral obligatoria.** Acuerdo entre ambas partes. |
| 8 | ¿Fecha límite? | **Obligatoria**, propuesta por el solicitante y **modificable**; prorrogable por atrasos de reposición. |
| 9 | ¿Devoluciones parciales? | **Sí**, por si no puede devolver todo completo. |
| 10 | ¿Baja de deuda si no se puede reponer? | **Sí**, con **autorización de ambas partes** + justificación del por qué no se devolvió. |
| 11 | ¿Tope de prórrogas? | **3.** Al agotarlas, alerta y se cierra como baja (nada de préstamo flotando). |
| 12 | ¿Tope de préstamos por item? | Propuesto 3, **unificado a 2** (ver §9.12: con 2 el motor sigue siendo inequívoco). |
| 13 | ¿Tope total de préstamos concurrentes? | Propuesto 3 o 5, **unificado a 5** y **configurable por bodega** (3 bloqueaba casos legítimos de varios insumos a la vez). |

### Decisiones cerradas por ingeniería (§9.11) — sin consulta al usuario

A, B, C, E, F, G, H, I y J quedaron resueltos con mecanismo técnico (ver la tabla de
§9.11). No requieren decisión del usuario: son condiciones de integridad del inventario.

### Pendiente de confirmar en la implementación

14. **Confirmación de recepción**: el stock se mueve al registrar la devolución y el
    origen solo **cierra** el préstamo (con auto-cierre a las 48h). ¿Te parece?
    *Propuesta de ingeniería §9.11-C.*
15. **Préstamo a bodega que no tiene el insumo en su catálogo**: ¿se permite que Soporte
    pida algo que no tiene registrado? *Propuesta: sí, solo si la solicitud viene del
    destino.*

> Con estas respuestas se cierra el diseño y se puede escribir la migración `V9` (y `V10`
> para préstamos) con confianza. Hasta entonces, la Fase 10 queda **documentada pero no
> iniciada**.
