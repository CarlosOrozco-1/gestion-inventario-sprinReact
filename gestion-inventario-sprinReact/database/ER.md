# Diagrama Entidad-Relación

## Modelo Relacional (Mermaid)

```mermaid
erDiagram
    roles {
        int id PK
        string nombre UK
        int nivel
        string descripcion
        string created_at
    }

    usuarios {
        int id PK
        string nombre
        string email UK
        string password_hash
        int rol_id FK
        int activo
        string created_at
        string updated_at
    }

    inventario_insumos {
        int id PK
        int numero
        string insumo
        string presentacion
        string tamano_presentacion
        int stock
        int entrada
        string created_at
        string updated_at
    }

    inventario_saldos_mensuales {
        int id PK
        int inventario_id FK
        int anio
        int mes
        int egresos
        string created_at
        string updated_at
    }

    inventario_requerimientos_anuales {
        int id PK
        int inventario_id FK
        int anio
        int cantidad
        string created_at
        string updated_at
    }

    inventario_movimientos {
        int id PK
        int inventario_id FK
        string tipo
        int usuario_id FK
        int mes
        int anio
        int cantidad
        string detalle
        string created_at
    }

    roles ||--o{ usuarios : "tiene"
    usuarios ||--o{ inventario_movimientos : "realiza"
    inventario_insumos ||--o{ inventario_movimientos : "genera"
    inventario_insumos ||--o{ inventario_saldos_mensuales : "tiene"
    inventario_insumos ||--o{ inventario_requerimientos_anuales : "tiene"
```

## Resumen de Relaciones

| Relacion | Tipo | FK | Restriccion |
|----------|------|-----|-------------|
| `roles` → `usuarios` | 1:N | `rol_id` | NOT NULL |
| `usuarios` → `movimientos` | 1:N | `usuario_id` | NOT NULL |
| `insumos` → `movimientos` | 1:N | `inventario_id` | ON DELETE CASCADE |
| `insumos` → `saldos_mensuales` | 1:N | `inventario_id` | ON DELETE CASCADE |
| `insumos` → `requerimientos_anuales` | 1:N | `inventario_id` | ON DELETE CASCADE |

## Llaves Primarias

| Tabla | PK | Tipo | Generacion |
|-------|-----|------|------------|
| `roles` | `id` | INT | AUTOINCREMENT |
| `usuarios` | `id` | INT | AUTOINCREMENT |
| `inventario_insumos` | `id` | INT | AUTOINCREMENT |
| `inventario_saldos_mensuales` | `id` | INT | AUTOINCREMENT |
| `inventario_requerimientos_anuales` | `id` | INT | AUTOINCREMENT |
| `inventario_movimientos` | `id` | INT | AUTOINCREMENT |

## Llaves Foraneas

| Tabla | Columna FK | Tabla Referenciada | Columna PK | Accion |
|-------|------------|-------------------|------------|--------|
| `usuarios` | `rol_id` | `roles` | `id` | - |
| `inventario_movimientos` | `inventario_id` | `inventario_insumos` | `id` | CASCADE |
| `inventario_movimientos` | `usuario_id` | `usuarios` | `id` | - |
| `inventario_saldos_mensuales` | `inventario_id` | `inventario_insumos` | `id` | CASCADE |
| `inventario_requerimientos_anuales` | `inventario_id` | `inventario_insumos` | `id` | CASCADE |

## Restricciones Unicas

| Tabla | Columnas | Nombre |
|-------|----------|--------|
| `roles` | `nombre` | UNIQUE |
| `usuarios` | `email` | UNIQUE |
| `inventario_insumos` | `insumo, presentacion, tamano_presentacion` | uq_insumo |
| `inventario_saldos_mensuales` | `inventario_id, anio, mes` | uq_saldo_mensual |
| `inventario_requerimientos_anuales` | `inventario_id, anio` | uq_requerimiento_anual |

## CHECK Constraints

| Tabla | Columna | Condicion |
|-------|---------|-----------|
| `inventario_saldos_mensuales` | `mes` | `BETWEEN 1 AND 12` |
| `inventario_movimientos` | `mes` | `IS NULL OR (BETWEEN 1 AND 12)` |
