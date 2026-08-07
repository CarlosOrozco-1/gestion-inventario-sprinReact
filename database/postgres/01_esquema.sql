-- =====================================================================
-- SIGES - Esquema PostgreSQL (solo tablas, SIN llaves foráneas)
-- 01_esquema.sql
-- Fuente de verdad: entidades JPA (backend/src/main/java/.../model/*.java)
-- Ejecutar en orden: 01_esquema.sql -> 02_llaves_foraneas.sql -> 03_indices.sql
-- =====================================================================

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    level       INTEGER      NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL,
    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE TABLE usuarios (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id        BIGINT       NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

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
    CONSTRAINT uq_presentation_item_name_size UNIQUE (item_id, name, size)
);

-- Tabla legada (archivo): las Fases 16/17 migraron su contenido a items/presentations
CREATE TABLE inventario_insumos (
    id            BIGSERIAL PRIMARY KEY,
    code          INTEGER      NOT NULL,
    name          VARCHAR(255) NOT NULL,
    presentation  VARCHAR(255) NOT NULL,
    size          VARCHAR(255) NOT NULL,
    stock         INTEGER      NOT NULL DEFAULT 0,
    entries       INTEGER      NOT NULL DEFAULT 0,
    min_stock     INTEGER,
    max_stock     INTEGER,
    estimated_cost NUMERIC(10,2),
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_insumo_name_presentation_size
        UNIQUE (name, presentation, size)
);

CREATE TABLE inventario_saldos_mensuales (
    id            BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT    NOT NULL,
    year          INTEGER   NOT NULL,
    month         INTEGER   NOT NULL,
    outflows      INTEGER   NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_saldos_inventario_year_month UNIQUE (inventario_id, year, month)
);

CREATE TABLE inventario_requerimientos_anuales (
    id            BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT    NOT NULL,
    year          INTEGER   NOT NULL,
    quantity      INTEGER   NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP,
    CONSTRAINT uq_requerimientos_inventario_year UNIQUE (inventario_id, year)
);

CREATE TABLE inventario_movimientos (
    id            BIGSERIAL PRIMARY KEY,
    inventario_id BIGINT       NOT NULL,
    type          VARCHAR(255) NOT NULL,
    usuario_id    BIGINT       NOT NULL,
    month         INTEGER,
    year          INTEGER,
    quantity      INTEGER      NOT NULL,
    detail        TEXT,
    created_at    TIMESTAMP    NOT NULL
);
