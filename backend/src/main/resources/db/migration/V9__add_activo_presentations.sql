-- Inactivos lógicos para presentaciones (variantes): una presentación mal
-- creada (por ejemplo un duplicado) se puede ocultar del catálogo y de los
-- selects sin borrarla físicamente, conservando su stock y su histórico de
-- movimientos. Solo ADMIN y JEFE pueden cambiar este estado.
--
-- Es el mismo criterio que V8 aplicó a items (materiales): un material puede
-- tener algunas presentaciones inactivas y seguir activo.
ALTER TABLE presentations ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN presentations.activo IS
    'Inactivo lógico: la presentación no aparece en nuevos movimientos ni en los selects, pero se conserva con su stock e histórico.';
