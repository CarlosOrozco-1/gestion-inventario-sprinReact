-- =====================================================================
-- SIGES - Migración V3: presentaciones múltiples por insumo (Fase 16)
--
-- Nuevo modelo normalizado (nombres ya en inglés, Fase 17):
--   items:         catálogo de materiales (code, name)
--   presentations: variantes de cada item (name, size, min/max_stock,
--                  estimated_cost, stock) con stock propio
--
-- Se migran los datos existentes de inventario_insumos agrupando por
-- nombre (un item por material, una presentation por fila) y se re-apunta
-- inventario_movimientos.inventario_id -> presentations.id conservando
-- los ids originales para no romper referencias.
--
-- inventario_insumos se conserva como archivo legado (la conservan
-- inventario_saldos_mensuales e inventario_requerimientos_anuales).
-- =====================================================================

CREATE TABLE items (
    id         BIGSERIAL PRIMARY KEY,
    code       INTEGER      NOT NULL,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE presentations (
    id             BIGSERIAL PRIMARY KEY,
    item_id        BIGINT       NOT NULL,
    name           VARCHAR(255) NOT NULL,
    size           VARCHAR(255) NOT NULL,
    min_stock      INTEGER,
    max_stock      INTEGER,
    estimated_cost NUMERIC(10,2),
    stock          INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL,
    updated_at     TIMESTAMP,
    CONSTRAINT uq_presentation_item_name_size UNIQUE (item_id, name, size),
    CONSTRAINT fk_presentations_item
        FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 1) Un item por material (insumo). El código toma el menor numero del grupo.
INSERT INTO items (code, name, created_at, updated_at)
SELECT MIN(numero), insumo, MIN(created_at), MAX(COALESCE(updated_at, created_at))
FROM inventario_insumos
GROUP BY insumo;

-- 2) Cada fila de inventario_insumos se convierte en una presentation,
--    copiando el id original para que inventario_movimientos siga apuntando.
INSERT INTO presentations (id, item_id, name, size, min_stock, max_stock,
                           estimated_cost, stock, created_at, updated_at)
SELECT ii.id, i.id, ii.presentacion, ii.tamano_presentacion,
       ii.stock_minimo, ii.stock_maximo, ii.costo_estimado, ii.stock,
       ii.created_at, ii.updated_at
FROM inventario_insumos ii
JOIN items i ON i.name = ii.insumo
ORDER BY ii.id;

-- 3) Re-apuntar los movimientos a presentations
ALTER TABLE inventario_movimientos DROP CONSTRAINT fk_movimientos_inventario;
ALTER TABLE inventario_movimientos ADD CONSTRAINT fk_movimientos_presentacion
    FOREIGN KEY (inventario_id) REFERENCES presentations(id);

-- 4) Sincronizar secuencias (presentations usó ids explícitos)
SELECT setval('items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM items));
SELECT setval('presentations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM presentations));

-- Índices de búsqueda frecuente
CREATE INDEX idx_presentations_item ON presentations (item_id);
