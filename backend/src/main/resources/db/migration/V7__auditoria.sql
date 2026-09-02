-- ====================================================================
-- SIGES - V7: Auditoría del Sistema (Fase 24)
-- Bitácora de eventos para registrar de forma inmutable ("append-only")
-- las acciones relevantes: inicios de sesión, movimientos/ajustes,
-- gestión de usuarios y exportaciones. Las filas nunca se editan ni se
-- borran: es el registro de auditoría del sistema.
-- ====================================================================

CREATE TABLE audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    event_type     VARCHAR(50)  NOT NULL,   -- LOGIN, LOGIN_FALLIDO, MOVIMIENTO_CREADO, EXPORTACION_PDF, ...
    description    TEXT,                    -- detalle legible del evento
    entity_name    VARCHAR(100),            -- tabla/entidad afectada (inventario_movimientos, usuarios...)
    entity_id      BIGINT,                  -- id del registro afectado
    usuario_email  VARCHAR(255),            -- quién ejecutó la acción
    usuario_name   VARCHAR(255),
    ip_address     VARCHAR(45),             -- IPv4/IPv6 de origen
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_fecha   ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_usuario ON audit_logs (usuario_email);
CREATE INDEX idx_audit_logs_evento  ON audit_logs (event_type);