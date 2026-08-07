-- Limpia los datos de prueba generados por scripts/smoke_test_e2e.py
-- (usuarios/insumos/movimientos marcados con "E2E"). No borra datos reales.
BEGIN;

DELETE FROM inventario_movimientos
WHERE inventario_id IN (SELECT id FROM inventario_insumos WHERE insumo LIKE '%E2E%');

DELETE FROM inventario_insumos
WHERE insumo LIKE '%E2E%';

DELETE FROM password_reset_tokens
WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE '%e2e%@inventario.com');

DELETE FROM usuarios
WHERE email LIKE '%e2e%@inventario.com';

COMMIT;
