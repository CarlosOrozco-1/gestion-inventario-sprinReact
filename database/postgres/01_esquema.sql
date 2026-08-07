-- =====================================================================
-- SIGES - Esquema PostgreSQL (solo tablas, SIN llaves foráneas)
-- 01_esquema.sql
-- Fuente de verdad: entidades JPA (backend/src/main/java/.../model/*.java)
-- Ejecutar en orden: 01_esquema.sql -> 02_llaves_foraneas.sql -> 03_indices.sql
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