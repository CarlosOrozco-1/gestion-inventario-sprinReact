-- Limpia los datos de prueba generados por scripts/smoke_test_e2e.py
-- (usuarios/movimientos/items/presentations marcados con "E2E"). No borra datos reales.
--
-- ADVERTENCIA: purga la bitácora de auditoría (audit_logs). Este script es de
-- DESARROLLO/QA (se ejecuta después de cada smoke test): en producción no
-- debe usarse, porque borraría la trazabilidad del sistema.
BEGIN;

-- Auditoría: el smoke test genera eventos (logins admin, movimientos E2E,
-- exportaciones). Se purgan para dejar la BD/bitácora pristina tras cada run.
DELETE FROM audit_logs;

DELETE FROM inventario_movimientos
WHERE inventario_id IN (
    SELECT p.id FROM presentations p
    JOIN items i ON i.id = p.item_id
    WHERE i.name LIKE '%E2E%'
);

DELETE FROM presentations
WHERE item_id IN (SELECT id FROM items WHERE name LIKE '%E2E%');

DELETE FROM items
WHERE name LIKE '%E2E%';

DELETE FROM password_reset_tokens
WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE '%e2e%@inventario.com');

DELETE FROM usuarios
WHERE email LIKE '%e2e%@inventario.com';

COMMIT;
