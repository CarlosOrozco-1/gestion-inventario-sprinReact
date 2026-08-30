-- =====================================================================
-- SIGES - Migración V5: Agregar campo QR code a presentations (Fase 19)
-- Cada presentación (variante de insumo) tendrá un código QR único
-- para identificación rápida en Kárdex y Auditoría.
-- =====================================================================

ALTER TABLE presentations ADD COLUMN qr_code VARCHAR(255) UNIQUE;

-- Generar QR codes para presentaciones existentes
-- Formato: SIGES-ITEM-{item_code}-PRES-{presentation_id}
UPDATE presentations p
SET qr_code = 'SIGES-ITEM-' || i.code || '-PRES-' || p.id
FROM items i
WHERE p.item_id = i.id
AND p.qr_code IS NULL;

-- Índice para búsqueda rápida por QR
CREATE INDEX idx_presentations_qr_code ON presentations (qr_code);