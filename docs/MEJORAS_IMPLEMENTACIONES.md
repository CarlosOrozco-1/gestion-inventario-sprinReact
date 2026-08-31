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

### Próximas mejoras
- (registrar aquí futuras implementaciones)
