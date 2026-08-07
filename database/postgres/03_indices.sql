-- =====================================================================
-- SIGES - Índices PostgreSQL
-- 03_indices.sql
-- Se ejecuta DESPUES de 01_esquema.sql y 02_llaves_foraneas.sql.
-- PostgreSQL ya indexa las columnas con UNIQUE (creadas en 01_esquema.sql),
-- por lo que aquí solo se añaden los índices de búsqueda frecuente.
-- =====================================================================

-- Movimientos: filtro por presentación, por usuario y por rango de fecha
CREATE INDEX idx_movimientos_inventario ON inventario_movimientos (inventario_id);
CREATE INDEX idx_movimientos_usuario   ON inventario_movimientos (usuario_id);
CREATE INDEX idx_movimientos_fecha     ON inventario_movimientos (year, month);

-- Presentaciones: listar por material
CREATE INDEX idx_presentations_item ON presentations (item_id);

-- Saldos mensuales: búsqueda por insumo + (year, month)
CREATE INDEX idx_saldos_busqueda ON inventario_saldos_mensuales (inventario_id, year, month);

-- Requerimientos anuales: búsqueda por insumo + year
CREATE INDEX idx_requerimientos_busqueda ON inventario_requerimientos_anuales (inventario_id, year);

-- Usuarios: listar por rol
CREATE INDEX idx_usuarios_rol ON usuarios (rol_id);