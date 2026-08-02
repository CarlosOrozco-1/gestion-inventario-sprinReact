# Accesos por Rol y Módulos del Sistema

> **Sistema:** SIGES — Sistema de Gestión de Inventarios
> **Versión:** 1.0
> **Última actualización:** 2026-08-01

---

## 1. Roles del Sistema

El sistema maneja **tres roles jerárquicos**, donde un rol de mayor nivel
incluye los accesos de los roles inferiores. El orden jerárquico está dado
por el campo `nivel` de la tabla `roles`.

| Rol       | Nivel | Descripción                              |
| --------- | ----- | ---------------------------------------- |
| `ADMIN`   | 100   | Acceso total a todos los módulos.        |
| `JEFE`    | 80    | Autoriza salidas, ingresos y ajustes.    |
| `AUXILIAR`| 50    | Solo consulta de insumos.                |

> **Nota de normalización:** Los roles se almacenan y comparan en
> **MAYÚSCULAS** (`ADMIN`, `JEFE`, `AUXILIAR`). El seeder
> (`DataSeeder.java`) normaliza cualquier valor legado (p. ej. `admin`) y
> siembra los tres roles automáticamente al arrancar la aplicación.

---

## 2. Matriz de Acceso por Módulo

| Módulo                      | Ruta           | ADMIN | JEFE | AUXILIAR |
| --------------------------- | -------------- | :---: | :--: | :------: |
| Inicio (Dashboard)          | `/`            |   ✔   |  ✔   |    ✔     |
| Insumos                     | `/insumos`     |   ✔   |  ✘   |    ✘     |
| Kárdex (Movimientos)        | `/movimientos` |   ✔   |  ✔   |    ✔     |
| Auditoría (Ajustes)         | `/ajustes`     |   ✔   |  ✔   |    ✘     |
| Reportería                  | `/reportes`    |   ✔   |  ✔   |    ✔     |
| Proyecciones (Beta)         | `/proyecciones`|   ✔   |  ✔   |    ✘     |
| Gestión de Usuarios         | `/usuarios`    |   ✔   |  ✘   |    ✘     |

### Resumen por Rol

- **ADMIN:** Acceso total a todos los módulos.
- **JEFE:** Reportería, Kárdex (Movimientos), Auditoría (Ajustes) y
  Proyecciones. **No** ve Insumos ni Gestión de Usuarios.
- **AUXILIAR:** Reportería y Kárdex (Movimientos). **No** ve Insumos,
  Auditoría, Proyecciones ni Gestión de Usuarios.

---

## 3. Cómo se aplica el control de acceso (Implementación)

### 3.1 Fuente única de verdad

La matriz de accesos está centralizada en el frontend:

```
frontend/src/access.ts
```

- `ROLES`: constantes de los tres roles.
- `MODULE_ACCESS`: mapa `ruta → [roles permitidos]`.
- `hasAccess(path, user)`: helper usado por el menú lateral.
- `getRol(user)`: extrae y normaliza el rol del usuario (maneja tanto
  `rol` como string —respuesta de login— como objeto con `nombre`).

Para agregar, quitar o cambiar un permiso solo se modifica este archivo;
el menú lateral y las rutas se actualizan automáticamente.

### 3.2 Menú lateral (`Layout.tsx`)

Los enlaces de navegación se filtran con `hasAccess(link.path, user)`.
Un usuario **nunca ve** en la barra un módulo que no tenga permitido.

### 3.3 Protección de rutas (`App.tsx` + `RequireRole.tsx`)

Además de ocultar el menú, las rutas restringidas están envueltas con
`<RequireRole roles={[...]} />`, que redirige a `/` si el usuario no tiene
el rol requerido. Esto impide acceder escribiendo la URL directamente:

```tsx
<Route element={<RequireRole roles={[ROLES.ADMIN, ROLES.JEFE]} />}>
  <Route path="/ajustes" element={<Ajustes />} />
  <Route path="/proyecciones" element={<Proyecciones />} />
</Route>
<Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
  <Route path="/insumos" element={<Insumos />} />
  <Route path="/usuarios" element={<Usuarios />} />
</Route>
```

> **Importante:** Todo módulo definido en `MODULE_ACCESS` debe tener su
> ruta registrada en `App.tsx` (envuelta con `RequireRole` cuando sea
> restringida). Si un enlace apunta a una ruta que no existe, React Router
> muestra una página en blanco y avisa `No routes matched location ...`.

### 3.4 Nivel de seguridad del backend

El control de acceso implementado es de **navegación (UI)**. Para una
aplicación en producción es **recomendado** reforzar cada endpoint del
backend con la anotación `@PreAuthorize("hasRole('JEFE')")` o
`@PreAuthorize("hasRole('ADMIN')")`, ya que actualmente los
`@RestController` no validan el rol del token JWT.

---

## 4. Modelo de Gestión de Permisos (Propuesta)

Existen dos enfoques para habilitar/deshabilitar accesos. La decisión
depende del nivel de granularidad que se necesite:

### Opción A — Cambiar el rol del usuario (Recomendada para empezar)

- Se **cambia el `rol_id`** del usuario y, con ello, hereda todos los
  accesos configurados para ese rol.
- **Ventajas:** simple, predecible, ya existe la jerarquía por `nivel`,
  no requiere tablas nuevas ni migraciones.
- **Desventajas:** el permiso es "todo o nada" por rol; no se puede dar
  un acceso puntual (p. ej. JEFE con Reportería pero sin Proyecciones).

### Opción B — Permisos por módulo habilitables (mayor flexibilidad)

- Crear una tabla puente `usuario_modulos`:

  ```sql
  CREATE TABLE usuario_modulos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    modulo     TEXT    NOT NULL,          -- '/reportes', '/usuarios', ...
    habilitado INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE (usuario_id, modulo)
  );
  ```

- El rol define los **permisos por defecto** y la tabla permite
  **excepciones por usuario** (habilitar/deshabilitar un módulo puntual).
- **Ventajas:** control fino, ideal cuando un rol necesita excepciones.
- **Desventajas:** más complejo (mantener consistencia entre rol y
  excepciones), requiere pantalla de permisos y consultas adicionales.

### Opción C — Campo booleano por módulo (no recomendada)

- Agregar columnas booleanas (`ver_reporteria`, `ver_usuarios`, ...) a la
  tabla `usuarios`.
- **Desventajas:** cada módulo nuevo exige migración de esquema y
  mantenimiento en el seeder; no aprovecha la jerarquía de roles; escala
  mal. Se menciona solo para descartarla.

### Recomendación

1. **Hoy:** quedarse con la **Opción A** (matriz por rol en `access.ts`).
   Es suficiente mientras el negocio no exija excepciones individuales.
2. **Futuro (cuando haya excepciones):** evolucionar a la **Opción B**
   manteniendo el rol como base y agregando la tabla `usuario_modulos`
   para sobreescribir accesos por usuario, sin migrar el esquema actual.

---

## 5. Usuarios de Prueba (Sembrados por DataSeeder)

| Email               | Password  | Rol       |
| ------------------- | --------- | --------- |
| `admin@inventario.com` | `admin123` | `ADMIN` |

> El seeder únicamente crea el usuario ADMIN por defecto. Los usuarios
> JEFE y AUXILIAR se crean desde el módulo **Gestión de Usuarios**
> (seleccionando su rol en el formulario).
