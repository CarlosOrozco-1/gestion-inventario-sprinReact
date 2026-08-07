-- =====================================================================
-- SIGES - Recrear la base de datos completa (psql)
-- 00_recrear_todo.sql
-- Ejecutar SOLO cuando se necesita reconstruir el esquema desde cero
-- (ej. ambiente de desarrollo/preproducción). ADVERTENCIA: elimina datos.
--
--   psql -U <usuario> -h <host> -d <basedatos> -f 00_recrear_todo.sql
--
-- NOTA: usa directivas \ir, así que debe ejecutarse con psql y los tres
-- archivos deben estar en la misma carpeta.
-- En pgAdmin, ejecute los archivos en orden: 01 -> 02 -> 03.
-- =====================================================================

-- 1) Eliminar todo en orden inverso de dependencias (FURTHER garantiza que se
--    borren también las FK/objetos asociados).
DROP TABLE IF EXISTS inventario_movimientos          CASCADE;
DROP TABLE IF EXISTS inventario_saldos_mensuales     CASCADE;
DROP TABLE IF EXISTS inventario_requerimientos_anuales CASCADE;
DROP TABLE IF EXISTS presentations                   CASCADE;
DROP TABLE IF EXISTS items                           CASCADE;
DROP TABLE IF EXISTS inventario_insumos              CASCADE;
DROP TABLE IF EXISTS usuarios                        CASCADE;
DROP TABLE IF EXISTS roles                           CASCADE;

-- 2) Recrear esquema, llaves foráneas e índices
\ir 01_esquema.sql
\ir 02_llaves_foranesas.sql
\ir 03_indices.sql