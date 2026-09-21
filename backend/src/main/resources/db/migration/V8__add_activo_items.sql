-- Inactivos lógicos para materiales: permite ocultar un insumo del catálogo
-- activo y bloquear movimientos sin borrarlo físicamente (conserva histórico).
-- Solo ADMIN y JEFE pueden cambiar este estado.
ALTER TABLE items ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;