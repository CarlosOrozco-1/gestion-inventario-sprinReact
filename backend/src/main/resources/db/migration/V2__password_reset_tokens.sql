-- =====================================================================
-- SIGES - Migración V2: tokens de recuperación de contraseña (Fase 12)
-- =====================================================================

CREATE TABLE password_reset_tokens (
    id               BIGSERIAL PRIMARY KEY,
    usuario_id       BIGINT       NOT NULL,
    codigo_hash      VARCHAR(255) NOT NULL,
    expiracion       TIMESTAMP    NOT NULL,
    usado            BOOLEAN      NOT NULL DEFAULT FALSE,
    intentos_fallidos INTEGER     NOT NULL DEFAULT 0,
    created_at       TIMESTAMP    NOT NULL,
    CONSTRAINT fk_password_reset_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_password_reset_usuario ON password_reset_tokens (usuario_id);
