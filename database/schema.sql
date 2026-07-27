-- ============================================================
-- Esquema de base de datos - Inventario de Insumos
-- Motor: SQLite (via better-sqlite3 / Spring Boot + Hibernate)
-- Version: 2.0 (normalizado multi-anual con usuarios y roles)
-- ============================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------
-- Tabla: roles
-- Descripcion: Catalogo de roles del sistema con nivel
--              numerico para comparaciones de jerarquia.
--              admin=100, jefe=50, auxiliar=10
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  nivel INTEGER NOT NULL,
  descripcion TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- -----------------------------------------------------------
-- Tabla: usuarios
-- Descripcion: Usuarios del sistema con autenticacion por
--              email y password hasheado.
-- FK: rol_id → roles(id)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id)
    REFERENCES roles(id)
);

-- -----------------------------------------------------------
-- Tabla: inventario_insumos
-- Descripcion: Catalogo principal de insumos del inventario.
--              Catalogo base: cada fila es un producto
--              identificado por (insumo, presentacion,
--              tamano_presentacion).
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL,
  insumo TEXT NOT NULL,
  presentacion TEXT NOT NULL,
  tamano_presentacion TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  entrada INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  CONSTRAINT uq_insumo UNIQUE (insumo, presentacion, tamano_presentacion)
);

-- -----------------------------------------------------------
-- Tabla: inventario_saldos_mensuales
-- Descripcion: Almacena los egresos mensuales de cada insumo
--              por anio. Reemplaza las 12 columnas mensuales
--              (enero-diciembre) de la version anterior.
-- FK: inventario_id → inventario_insumos(id) CASCADE
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_saldos_mensuales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventario_id INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK(mes BETWEEN 1 AND 12),
  egresos INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  CONSTRAINT fk_saldos_insumo FOREIGN KEY (inventario_id)
    REFERENCES inventario_insumos(id) ON DELETE CASCADE,
  CONSTRAINT uq_saldo_mensual UNIQUE (inventario_id, anio, mes)
);

-- -----------------------------------------------------------
-- Tabla: inventario_requerimientos_anuales
-- Descripcion: Almacena los requerimientos anuales de cada
--              insumo. Reemplaza la columna requerir_2026
--              de la version anterior.
-- FK: inventario_id → inventario_insumos(id) CASCADE
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_requerimientos_anuales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventario_id INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  CONSTRAINT fk_requerimientos_insumo FOREIGN KEY (inventario_id)
    REFERENCES inventario_insumos(id) ON DELETE CASCADE,
  CONSTRAINT uq_requerimiento_anual UNIQUE (inventario_id, anio)
);

-- -----------------------------------------------------------
-- Tabla: inventario_movimientos
-- Descripcion: Bitacora de todos los movimientos realizados
--              sobre los insumos (entradas, salidas,
--              correcciones y ajustes).
-- FK: inventario_id → inventario_insumos(id) CASCADE
-- FK: usuario_id   → usuarios(id)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventario_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  usuario_id INTEGER NOT NULL,
  mes INTEGER CHECK(mes IS NULL OR (mes BETWEEN 1 AND 12)),
  anio INTEGER,
  cantidad INTEGER NOT NULL,
  detalle TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  CONSTRAINT fk_movimientos_insumo FOREIGN KEY (inventario_id)
    REFERENCES inventario_insumos(id) ON DELETE CASCADE,
  CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
);

-- -----------------------------------------------------------
-- Indices para mejorar rendimiento de consultas frecuentes
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_saldos_mensuales_inventario
  ON inventario_saldos_mensuales(inventario_id);

CREATE INDEX IF NOT EXISTS idx_saldos_mensuales_periodo
  ON inventario_saldos_mensuales(inventario_id, anio, mes);

CREATE INDEX IF NOT EXISTS idx_requerimientos_anuales_inventario
  ON inventario_requerimientos_anuales(inventario_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario
  ON inventario_movimientos(inventario_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_usuario
  ON inventario_movimientos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo
  ON inventario_movimientos(tipo);
