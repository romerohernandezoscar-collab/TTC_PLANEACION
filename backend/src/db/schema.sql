-- Esquema inicial (Fase 1). Entidades de la seccion 6 de la propuesta
-- conceptual que ya tienen uso en Fase 1: usuario/rol (autenticacion) y
-- movimiento_caja + macrocategoria (datos que alimentan el dashboard).
-- Las entidades de cartera, inversionistas, comisiones y juridico se
-- agregan en las fases 2 a 6, cuando sus modulos entren en desarrollo.

CREATE TABLE IF NOT EXISTS rol (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,              -- direccion | gerencia_area | operacion | juridico | administrador
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES rol(id),
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS macrocategoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS importacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuario(id),
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  registros_cargados INTEGER NOT NULL DEFAULT 0,
  registros_rechazados INTEGER NOT NULL DEFAULT 0,
  notas TEXT
);

CREATE TABLE IF NOT EXISTS movimiento_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  concepto TEXT NOT NULL,
  macrocategoria_id INTEGER REFERENCES macrocategoria(id),
  cargo REAL NOT NULL DEFAULT 0,
  abono REAL NOT NULL DEFAULT 0,
  conciliado INTEGER NOT NULL DEFAULT 0,
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuario(id),
  accion TEXT NOT NULL,
  detalle TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON movimiento_caja(fecha);
