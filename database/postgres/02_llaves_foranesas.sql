-- =====================================================================
-- SIGES - Llaves foráneas PostgreSQL
-- 02_llaves_foraneas.sql
-- Se ejecuta DESPUES de 01_esquema.sql (las tablas ya deben existir).
-- =====================================================================

-- usuarios -> roles
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles(id);

-- inventario_saldos_mensuales -> inventario_insumos
ALTER TABLE inventario_saldos_mensuales ADD CONSTRAINT fk_saldos_inventario
    FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id);

-- inventario_requerimientos_anuales -> inventario_insumos
ALTER TABLE inventario_requerimientos_anuales ADD CONSTRAINT fk_requerimientos_inventario
    FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id);

-- inventario_movimientos -> inventario_insumos / usuarios
ALTER TABLE inventario_movimientos ADD CONSTRAINT fk_movimientos_inventario
    FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id);

ALTER TABLE inventario_movimientos ADD CONSTRAINT fk_movimientos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id);