-- =====================================================================
-- SIGES - Migración V1: esquema inicial (PostgreSQL)
-- Aplicada por Flyway SOLO en el perfil prod (SPRING_PROFILES_ACTIVE=prod).
-- Mantener en sincronía con: database/postgres/{01,02,03}.sql
-- =====================================================================

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(255) NOT NULL,
    nivel       INTEGER      NOT NULL,
    descripcion VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL,
    CONSTRAINT uq_roles_nombre UNIQUE (nombre)
);

CREATE TABLE usuarios (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id        BIGINT       NOT NULL,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

CREATE TABLE inventario_insumos (
    id                  BIGSERIAL PRIMARY KEY,
    numero              INTEGER      NOT NULL,
    insumo              VARCHAR(255) NOT NULL,
    presentacion        VARCHAR(255) NOT NULL,
    tamano_presentacion VARCHAR(255) NOT NULL,
    stock               INTEGER      NOT NULL DEFAULT 0,
    entrada             INTEGER      NOT NULL DEFAULT 0,
    stock_minimo        INTEGER,
    stock_maximo        INTEGER,
    costo_estimado      NUMERIC(10,2),
    created_at          TIMESTAMP    NOT NULL,
    updated_at          TIMESTAMP,
    CONSTRAINT uq_insumo_presentacion_tamano
        UNIQUE (insumo, presentacion, tamano_presentacion)
);

CREATE TABLE inventario_saldos_mensuales (
    id            BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT    NOT NULL,
    anio          INTEGER   NOT NULL,
    mes           INTEGER   NOT NULL,
    egresos       INTEGER   NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_saldos_inventario_anio_mes UNIQUE (inventario_id, anio, mes)
);

CREATE TABLE inventario_requerimientos_anuales (
    id            BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT    NOT NULL,
    anio          INTEGER   NOT NULL,
    cantidad      INTEGER   NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_requerimientos_inventario_anio UNIQUE (inventario_id, anio)
);

CREATE TABLE inventario_movimientos (
    id            BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT       NOT NULL,
    tipo          VARCHAR(255) NOT NULL,
    usuario_id    BIGINT       NOT NULL,
    mes           INTEGER,
    anio          INTEGER,
    cantidad      INTEGER      NOT NULL,
    detalle       TEXT,
    created_at    TIMESTAMP    NOT NULL
);

-- Llaves foráneas
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles(id);

ALTER TABLE inventario_saldos_mensuales ADD CONSTRAINT fk_saldos_inventario
    FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id);

ALTER TABLE inventario_requerimientos_anuales ADD CONSTRAINT fk_requerimientos_inventario
    FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id);

ALTER TABLE inventario_movimientos ADD CONSTRAINT fk_movimientos_inventario
    FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id);

ALTER TABLE inventario_movimientos ADD CONSTRAINT fk_movimientos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

-- Índices de búsqueda frecuente
CREATE INDEX idx_movimientos_inventario ON inventario_movimientos (inventario_id);
CREATE INDEX idx_movimientos_usuario   ON inventario_movimientos (usuario_id);
CREATE INDEX idx_movimientos_fecha     ON inventario_movimientos (anio, mes);
CREATE INDEX idx_saldos_busqueda       ON inventario_saldos_mensuales (inventario_id, anio, mes);
CREATE INDEX idx_requerimientos_busqueda ON inventario_requerimientos_anuales (inventario_id, anio);
CREATE INDEX idx_usuarios_rol           ON usuarios (rol_id);