# Versión 1.2.0 - Reorganización de módulos: Movimientos y Kárdex

**Objetivo:** Reorganizar la nomenclatura y funcionalidad de los módulos para que el flujo sea más claro: `Movimientos` = registro (acción) y `Kárdex` = trazabilidad/consulta (histórico con saldo).

## Tareas a realizar

### 1. Módulo Movimientos (actual "Kárdex / Movimientos" en ruta `/movimientos`)
El módulo debe convertirse en **únicamente para registrar movimientos**. Se eliminará la tabla de histórico/trazabilidad de esta vista y se añadirá una interfaz con **cards de acceso rápido**.

#### 1.1 Frontend - `frontend/src/pages/Movimientos.tsx`
- [ ] **Renombrar título**: Cambiar "Kárdex / Movimientos" → "Movimientos"
- [ ] **Eliminar vista de listado/histórico**: Quitar tabla de movimientos, paginación y filtros de trazabilidad actuales en este módulo
- [ ] **Crear vista tipo "dashboard de acciones"**: Implementar cards/botones de acceso rápido
- [ ] **Card ENTRADA**: Botón que abre `MovimientoModal` con `tipo` preseleccionado a `ENTRADA`
- [ ] **Card SALIDA**: Botón que abre `MovimientoModal` con `tipo` preseleccionado a `SALIDA`
- [ ] **Card AJUSTE**: Botón que redirige a `/ajustes` **si** el usuario tiene permisos (ADMIN/JEFE). **Si NO** tiene permisos (AUXILIAR), mostrar modal informando "No tiene autorización para realizar ajustes" (modal existente o nuevo `ConfirmModal` según estilo)
- [ ] **Acceso a Kárdex (trazabilidad)**: Añadir card/botón secundario "Ver Kárdex" que redirija a `/reportes` (donde estará el nuevo Kárdex)
- [ ] **Diseño responsivo**: Usar grid con Tailwind, seguir estilos existentes (`btn`, colores por función según `buttonStyles.ts`)

#### 1.2 Frontend - Layout y navegación
- [ ] **`frontend/src/components/Layout.tsx`**: Cambiar nombre del menú "Kárdex" → "Movimientos" (manteniendo ruta `/movimientos` por compatibilidad)

#### 1.3 Backend
- [ ] **Evaluar impacto**: Revisar si hay endpoints que solo usa este módulo para listar. Actualmente ya tenemos paginación filtrada; al quitar listado del módulo, **NO** es necesario eliminar endpoints (`/api/movimientos/paginado` se reutilizará en el nuevo Kárdex). **Verificar** si hay algún cambio necesario en permisos/validaciones (no debería haberlo).
- [ ] **Mantener endpoints existentes**: `/api/movimientos` (completo), `/api/movimientos/paginado` (con filtros) se mantienen para ser usados en el módulo Kárdex (Reportes).

### 2. Módulo Kárdex (actual `Reportes` en ruta `/reportes`)
Mover toda la trazabilidad con saldo acumulado a este módulo y renombrarlo a **Kárdex**.

#### 2.1 Frontend - `frontend/src/pages/Reportes.tsx`
- [ ] **Renombrar título**: "Reportería" → "Kárdex"
- [ ] **Reorganizar vista**: Convertir en módulo **únicamente Kárdex** (trazabilidad). Mantener la pestaña "Trazabilidad por producto" como principal y mejorar UX
- [ ] **Mover/ajustar exportación**: Evaluar si mantener exportación (Excel/PDF) desde Kárdex para el historial filtrado. Propuesta: añadir botones "Exportar Excel/PDF" cuando hay resultados filtrados en trazabilidad
- [ ] **Eliminar o mover pestaña "Reportes dinámicos"**: Los filtros cruzados globales pueden quedarse como sub-sección "Reportes" dentro del Kárdex, o separarse. Definición: **Kárdex = trazabilidad por producto** (principal). Añadir apartado "Histórico global con filtros" si se desea conservar reportes dinámicos
- [ ] **Mejoras UX**: Añadir botón "Ir a Movimientos" para registrar nuevos movimientos desde Kárdex
- [ ] **Mantener cálculo de saldo acumulado**: Ya implementado, conservarlo tal cual (orden asc/desc correcto y validación con stock)

#### 2.2 Frontend - Navegación
- [ ] **`frontend/src/components/Layout.tsx`**: Cambiar "Reportería" → "Kárdex" y mantener ruta `/reportes` (o evaluar si renombrar ruta a `/kardex` con redirect para compatibilidad). **Recomendación:** mantener rutas existentes para no romper enlaces (`/movimientos`, `/reportes`).

#### 2.3 App/Rutas
- [ ] **`frontend/src/App.tsx`**: Actualizar imports/comentarios si necesario. No es obligatorio cambiar rutas, solo nombres visuales.

### 3. Enlaces/compatibilidad
- [ ] **"Ver trazabilidad" desde Insumos**: Actualmente apunta a `/movimientos?presentationId=...`. Cambiar a `/reportes?presentationId=...` (nueva ubicación del Kárdex) para que funcione con el nuevo flujo.
- [ ] **Query params**: Asegurar que Reportes/Kárdex lea `?presentationId=`/`?itemId=` desde URL (ya implementado).

### 4. Backend (mínimo)
- [ ] **Verificar endpoints**: No eliminar `/api/movimientos/paginado`. Puede seguir usándose en Kárdex. No requiere cambios estructurales.
- [ ] **Documentar cambios**: Actualizar comentarios si mencionan "Kárdex" vs "Movimientos".

### 5. Pruebas y validación
- [ ] **Módulo Movimientos**: Abrir `/movimientos` → debe mostrar cards (ENTRADA, SALIDA, AJUSTE, Ver Kárdex). Probar cada acción con modal preseleccionado.
- [ ] **Permisos AJUSTE**: AUXILIAR → card AJUSTE abre modal de "sin autorización". ADMIN/JEFE → redirige a `/ajustes`.
- [ ] **Kárdex**: Abrir `/reportes` → muestra vista de Kárdex con trazabilidad. Filtros y saldo acumulado funcionan.
- [ ] **Enlace desde Insumos**: Botón "Ver trazabilidad" lleva a Kárdex con filtro pre-cargado.

### 6. Documentación
- [ ] **Actualizar README/docs**: Ajustar nombres según nueva nomenclatura.
- [ ] **Actualizar comentarios**: En código (JSX/comments) reflejar el nuevo propósito de cada módulo.

## Notas de implementación
- **Mantener rutas por compatibilidad** (`/movimientos`, `/reportes`) para evitar romper enlaces existentes (como el botón "Ver trazabilidad" y favoritos).
- **Separación clara**: Movimientos = registro (acción). Kárdex = consulta/trazabilidad (lectura con saldo).
- **Reutilización**: Se reutiliza `MovimientoModal` (ya acepta props/preselección), backend existente y cálculo de saldo ya implementado.


## Cambios aplicados (v1.2.0)
- Menú: "Movimientos" (antes Kárdex) apunta a `/movimientos`. "Kárdex" apunta a `/reportes`.
- `/movimientos`: convertido a módulo de registro con cards (Entrada, Salida, Ajuste con validación de permisos, Ver Kárdex, Escanear QR). Historial removido.
- `/reportes`: renombrado a Kárdex, trazabilidad por producto como principal.
- `/insumos`: "Ver trazabilidad" apunta a `/reportes`.
- AJUSTES: se accede desde `/movimientos` (card Ajuste). Se mantiene ruta `/ajustes` activa; se puede ocultar del menú si se desea (comentado en Layout).
- QR: añadido como card en Movimientos.
- Últimos movimientos: opcional. Si se añade, usar tarjeta compacta con límite 5 y sin paginación para evitar ensuciar la vista.
