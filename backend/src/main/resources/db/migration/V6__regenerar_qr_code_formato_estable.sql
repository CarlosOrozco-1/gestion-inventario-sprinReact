-- =====================================================================
-- SIGES - Migración V6: Regenerar QR codes a formato estable
--
-- MOTIVO (ver docs/MEJORAS_IMPLEMENTACIONES.md sección 4):
-- Se cambia el formato del QR de "SIGES-ITEM-{code}-PRES-{id}" a
-- "SIGES-PRES-{id}" por tres razones:
--   1. ESTABILIDAD: el id de la presentación es inmutable; el code del
--      material es editable. Si el QR dependiera del code, al cambiarlo
--      el QR impreso quedaría apuntando a un string inexistente.
--   2. NO EXPONER DATOS: el formato anterior revelaba el código interno
--      del material a cualquiera que fotografíe el QR.
--   3. SIMPLICIDAD: el QR ya contiene la clave primaria; no hace falta
--      redundancia del código del material.
--
-- Esta migración regenera los QR de las presentaciones existentes para
-- que sean consistentes con el nuevo formato. El UNIQUE se mantiene
-- porque el id de la presentación es único por definición.
-- =====================================================================

UPDATE presentations
SET qr_code = 'SIGES-PRES-' || id
WHERE qr_code IS NULL
   OR qr_code LIKE 'SIGES-ITEM-%';

-- Se mantiene el índice existente (idx_presentations_qr_code).
