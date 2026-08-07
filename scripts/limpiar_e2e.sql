-- Limpia los datos de prueba generados por scripts/smoke_test_e2e.py
-- (usuarios/movimientos/items/presentations marcados con "E2E"). No borra datos reales.
BEGIN;

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
