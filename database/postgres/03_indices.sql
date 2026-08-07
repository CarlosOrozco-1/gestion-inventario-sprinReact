-- =====================================================================
-- SIGES - Índices PostgreSQL
-- 03_indices.sql
-- Se ejecuta DESPUES de 01_esquema.sql y 02_llaves_foraneas.sql.
-- PostgreSQL ya indexa las columnas con UNIQUE (creadas en 01_esquema.sql),
-- por lo que aquí solo se añaden los índices de búsqueda frecuente.
-- =====================================================================

-- Movimientos: filtro por insumo, por usuario y por rango de fecha
CREATE INDEX idx_movimientos_inventario ON inventario_movimientos (inventario_id);
CREATE INDEX idx_movimientos_usuario   ON inventario_movimientos (usuario_id);
CREATE INDEX idx_movimientos_fecha     ON inventario_movimientos (anio, mes);

-- Saldos mensuales: búsqueda por insumo + (anio, mes)
CREATE INDEX idx_saldos_busqueda ON inventario_saldos_mensuales (inventario_id, anio, mes);

-- Requerimientos anuales: búsqueda por insumo + anio
CREATE INDEX idx_requerimientos_busqueda ON inventario_requerimientos_anuales (inventario_id, anio);

-- Usuarios: listar por rol
CREATE INDEX idx_usuarios_rol ON usuarios (rol_id);