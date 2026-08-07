-- =====================================================================
-- SIGES - V4: Normalización del esquema a inglés (Fase 17)
-- Renombra columnas de las tablas restantes (los nombres de items/
-- presentations creados en V3 ya están en inglés). No edita V1-V3
-- para no romper los checksums de Flyway. Preserva los datos y las
-- FK: RENAME COLUMN actualiza automáticamente constraints e índices.
-- =====================================================================

ALTER TABLE roles RENAME COLUMN nombre TO name;
ALTER TABLE roles RENAME COLUMN nivel TO level;
ALTER TABLE roles RENAME COLUMN descripcion TO description;

ALTER TABLE usuarios RENAME COLUMN nombre TO name;
ALTER TABLE usuarios RENAME COLUMN activo TO active;

ALTER TABLE inventario_insumos RENAME COLUMN numero TO code;
ALTER TABLE inventario_insumos RENAME COLUMN insumo TO name;
ALTER TABLE inventario_insumos RENAME COLUMN presentacion TO presentation;
ALTER TABLE inventario_insumos RENAME COLUMN tamano_presentacion TO size;
ALTER TABLE inventario_insumos RENAME COLUMN entrada TO entries;
ALTER TABLE inventario_insumos RENAME COLUMN stock_minimo TO min_stock;
ALTER TABLE inventario_insumos RENAME COLUMN stock_maximo TO max_stock;
ALTER TABLE inventario_insumos RENAME COLUMN costo_estimado TO estimated_cost;

ALTER TABLE inventario_movimientos RENAME COLUMN tipo TO type;
ALTER TABLE inventario_movimientos RENAME COLUMN mes TO month;
ALTER TABLE inventario_movimientos RENAME COLUMN anio TO year;
ALTER TABLE inventario_movimientos RENAME COLUMN cantidad TO quantity;
ALTER TABLE inventario_movimientos RENAME COLUMN detalle TO detail;

ALTER TABLE inventario_saldos_mensuales RENAME COLUMN anio TO year;
ALTER TABLE inventario_saldos_mensuales RENAME COLUMN mes TO month;
ALTER TABLE inventario_saldos_mensuales RENAME COLUMN egresos TO outflows;

ALTER TABLE inventario_requerimientos_anuales RENAME COLUMN anio TO year;
ALTER TABLE inventario_requerimientos_anuales RENAME COLUMN cantidad TO quantity;

ALTER TABLE password_reset_tokens RENAME COLUMN codigo_hash TO code_hash;
ALTER TABLE password_reset_tokens RENAME COLUMN expiracion TO expires_at;
ALTER TABLE password_reset_tokens RENAME COLUMN usado TO used;
ALTER TABLE password_reset_tokens RENAME COLUMN intentos_fallidos TO failed_attempts;
