# Casos de Uso - Sistema de Inventario de Insumos

## 1. Gestion de Usuarios

### CU-01: Registrar Usuario
- **Actor:** Administrador
- **Precondicion:** Administrador autenticado
- **Flujo:**
  1. Administrador accede a gestion de usuarios
  2. Selecciona "Nuevo Usuario"
  3. Ingresa: nombre, email, password, rol
  4. Sistema valida email unico
  5. Sistema guarda usuario
- **Postcondicion:** Usuario creado en el sistema

### CU-02: Editar Usuario
- **Actor:** Administrador
- **Precondicion:** Administrador autenticado
- **Flujo:**
  1. Administrador selecciona usuario a editar
  2. Modifica campos (nombre, email, rol, activo)
  3. Sistema valida cambios
  4. Sistema actualiza usuario
- **Postcondicion:** Usuario actualizado

### CU-03: Eliminar Usuario
- **Actor:** Administrador
- **Precondicion:** Administrador autenticado
- **Flujo:**
  1. Administrador selecciona usuario
  2. Confirma eliminacion
  3. Sistema desactiva usuario (soft delete)
- **Postcondicion:** Usuario desactivado

---

## 2. Gestion de Inventario

### CU-04: Agregar Insumo
- **Actor:** Administrador, Jefe
- **Precondicion:** Usuario autenticado con permisos
- **Flujo:**
  1. Usuario accede a inventario
  2. Selecciona "Nuevo Insumo"
  3. Ingresa: numero, nombre, presentacion, tamano, stock inicial, entrada
  4. Sistema valida unicidad (insumo + presentacion + tamano)
  5. Sistema guarda insumo
- **Postcondicion:** Insumo registrado en catalogo

### CU-05: Editar Insumo
- **Actor:** Administrador
- **Precondicion:** Administrador autenticado
- **Flujo:**
  1. Administrador selecciona insumo
  2. Modifica campos permitidos
  3. Sistema actualiza insumo
- **Postcondicion:** Insumo actualizado

### CU-06: Eliminar Insumo
- **Actor:** Administrador
- **Precondicion:** Administrador autenticado
- **Flujo:**
  1. Administrador selecciona insumo
  2. Confirma eliminacion
  3. Sistema elimina insumo y registros relacionados (CASCADE)
- **Postcondicion:** Insumo y movimientos eliminados

---

## 3. Gestion de Movimientos

### CU-07: Registrar Entrada
- **Actor:** Administrador, Jefe, Auxiliar
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario selecciona insumo
  2. Selecciona tipo "Entrada"
  3. Ingresa: cantidad, detalle, mes, anio
  4. Sistema actualiza: stock = stock + cantidad
  5. Sistema registra movimiento
  6. Sistema actualiza saldo mensual
- **Postcondicion:** Stock incrementado, movimiento registrado

### CU-08: Registrar Salida
- **Actor:** Administrador, Jefe, Auxiliar
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario selecciona insumo
  2. Selecciona tipo "Salida"
  3. Ingresa: cantidad, detalle, mes, anio
  4. Sistema valida: stock >= cantidad
  5. Sistema actualiza: stock = stock - cantidad
  6. Sistema registra movimiento
  7. Sistema actualiza saldo mensual
- **Postcondicion:** Stock reducido, movimiento registrado

### CU-09: Registrar Ajuste/Correccion
- **Actor:** Administrador, Jefe
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario selecciona insumo
  2. Selecciona tipo "Ajuste" o "Correccion"
  3. Ingresa: cantidad (positiva o negativa), detalle
  4. Sistema actualiza stock segun tipo
  5. Sistema registra movimiento
- **Postcondicion:** Stock ajustado, movimiento registrado

---

## 4. Consulta y Reportes

### CU-10: Consultar Inventario
- **Actor:** Todos los usuarios
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario accede a inventario
  2. Sistema muestra lista de insumos con stock actual
  3. Usuario puede filtrar/buscar
- **Postcondicion:** Consulta realizada

### CU-11: Ver Movimientos
- **Actor:** Administrador, Jefe
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario accede a reportes
  2. Selecciona rango de fechas o tipo
  3. Sistema muestra movimientos filtrados
- **Postcondicion:** Consulta realizada

### CU-12: Ver Saldos Mensuales
- **Actor:** Administrador, Jefe
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario selecciona insumo y periodo
  2. Sistema muestra egresos mensuales del periodo
- **Postcondicion:** Consulta realizada

### CU-13: Ver Requerimientos Anuales
- **Actor:** Administrador, Jefe
- **Precondicion:** Usuario autenticado
- **Flujo:**
  1. Usuario selecciona anio
  2. Sistema muestra requerimientos de todos los insumos
- **Postcondicion:** Consulta realizada

---

## 5. Autenticacion

### CU-01: Iniciar Sesion
- **Actor:** Cualquier usuario
- **Precondicion:** Usuario registrado en sistema
- **Flujo:**
  1. Usuario ingresa email y password
  2. Sistema valida credenciales
  3. Sistema carga rol y permisos
  4. Sistema redirige a menu principal
- **Postcondicion:** Sesion iniciada

### CU-02: Cerrar Sesion
- **Actor:** Cualquier usuario
- **Precondicion:** Sesion activa
- **Flujo:**
  1. Usuario selecciona cerrar sesion
  2. Sistema invalida token/sesion
  3. Sistema redirige a login
- **Postcondicion:** Sesion terminada

---

## Matriz de Permisos

| Caso de Uso | Admin | Jefe | Auxiliar |
|-------------|-------|------|----------|
| CU-01 Registrar Usuario | ✓ | ✗ | ✗ |
| CU-02 Editar Usuario | ✓ | ✗ | ✗ |
| CU-03 Eliminar Usuario | ✓ | ✗ | ✗ |
| CU-04 Agregar Insumo | ✓ | ✓ | ✗ |
| CU-05 Editar Insumo | ✓ | ✗ | ✗ |
| CU-06 Eliminar Insumo | ✓ | ✗ | ✗ |
| CU-07 Registrar Entrada | ✓ | ✓ | ✓ |
| CU-08 Registrar Salida | ✓ | ✓ | ✓ |
| CU-09 Registrar Ajuste | ✓ | ✓ | ✗ |
| CU-10 Consultar Inventario | ✓ | ✓ | ✓ |
| CU-11 Ver Movimientos | ✓ | ✓ | ✗ |
| CU-12 Ver Saldos Mensuales | ✓ | ✓ | ✗ |
| CU-13 Ver Requerimientos | ✓ | ✓ | ✗ |
