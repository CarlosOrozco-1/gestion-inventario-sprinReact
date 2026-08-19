-- ============================================================
-- Esquema de base de datos - Inventario de Insumos
-- Motor: SQLite (via better-sqlite3)
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
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT
);

-- -----------------------------------------------------------
-- Tabla: inventario_insumos
-- Descripcion: Catalogo principal de insumos del inventario.
--              NOTA: Se eliminaron las columnas mensuales
--              (enero-diciembre), egresos, total y requerir_2026.
--              Ahora los saldos mensuales estan en la tabla
--              inventario_saldos_mensuales y los requerimientos
--              en inventario_requerimientos_anuales.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL,
  insumo TEXT NOT NULL,
  presentacion TEXT NOT NULL,
  tamano_presentacion TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  entrada INTEGER NOT NULL DEFAULT 0,
  codigo_qr TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  UNIQUE (insumo, presentacion, tamano_presentacion)
);

-- -----------------------------------------------------------
-- Tabla: inventario_saldos_mensuales
-- Descripcion: Almacena los egresos mensuales de cada insumo
--              por año. Reemplaza las 12 columnas mensuales
--              (enero-diciembre) de la version anterior.
--              Permite consultar cualquier mes de cualquier año.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_saldos_mensuales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventario_id INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK(mes BETWEEN 1 AND 12),
  egresos INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id) ON DELETE CASCADE,
  UNIQUE (inventario_id, anio, mes)
);

-- -----------------------------------------------------------
-- Tabla: inventario_requerimientos_anuales
-- Descripcion: Almacena los requerimientos anuales de cada
--              insumo. Reemplaza la columna requerir_2026
--              de la version anterior.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_requerimientos_anuales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventario_id INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT,
  FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id) ON DELETE CASCADE,
  UNIQUE (inventario_id, anio)
);

-- -----------------------------------------------------------
-- Tabla: inventario_movimientos
-- Descripcion: Bitacora de todos los movimientos realizados
--              sobre los insumos (entradas, salidas,
--              correcciones y ajustes).
--              NOTA: responsable (texto) se reemplazo por
--              usuario_id (FK a usuarios).
--              mes ahora es INTEGER (1-12) y se agrego anio.
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
  FOREIGN KEY (inventario_id) REFERENCES inventario_insumos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- -----------------------------------------------------------
-- Indices para mejorar rendimiento de consultas frecuentes
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_insumos_codigo_qr
  ON inventario_insumos(codigo_qr);

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

-- -----------------------------------------------------------
-- Tabla: bitacora
-- Descripcion: Registro de auditoría de todas las acciones
--              realizadas en el sistema. Cada acción requiere
--              una justificación obligatoria del usuario.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  justificacion TEXT NOT NULL,
  usuario_id INTEGER NOT NULL,
  usuario_nombre TEXT NOT NULL,
  entidad_id INTEGER,
  entidad_tipo TEXT,
  datos_anteriores TEXT,
  datos_nuevos TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_bitacora_usuario
  ON bitacora(usuario_id);

CREATE INDEX IF NOT EXISTS idx_bitacora_modulo
  ON bitacora(modulo);

CREATE INDEX IF NOT EXISTS idx_bitacora_accion
  ON bitacora(accion);

CREATE INDEX IF NOT EXISTS idx_bitacora_created_at
  ON bitacora(created_at);
