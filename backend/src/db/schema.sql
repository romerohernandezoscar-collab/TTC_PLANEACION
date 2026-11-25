-- Esquema inicial (Fase 1-2). Entidades de la seccion 6 de la propuesta
-- conceptual que ya tenian uso: usuario/rol (autenticacion) y
-- movimiento_caja + macrocategoria (datos que alimentan el dashboard e
-- importacion de Excel). Las entidades de cartera, inversionistas,
-- comisiones y juridico se agregan a continuacion (Fase 3).

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

-- Fase 3: cartera de creditos, inversionistas, comisiones y control
-- juridico (seccion 6 de la propuesta conceptual). Modelo deliberadamente
-- simple en esta fase: cada modulo es una tabla propia de lectura, sin
-- flujo de captura todavia (eso se evaluara en fases posteriores).

CREATE TABLE IF NOT EXISTS credito (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  monto_original REAL NOT NULL DEFAULT 0,
  saldo_actual REAL NOT NULL DEFAULT 0,
  tasa_anual REAL,
  fecha_inicio TEXT NOT NULL,
  fecha_vencimiento TEXT,
  estatus TEXT NOT NULL DEFAULT 'vigente', -- vigente | atrasado | liquidado
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS inversionista (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  capital_aportado REAL NOT NULL DEFAULT 0,
  tasa_rendimiento REAL,
  fecha_ingreso TEXT NOT NULL,
  estatus TEXT NOT NULL DEFAULT 'activo', -- activo | retirado
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS comision (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  concepto TEXT NOT NULL,
  beneficiario TEXT,
  tipo TEXT, -- apertura | inmobiliaria | referenciador | otro
  monto REAL NOT NULL DEFAULT 0,
  pagada INTEGER NOT NULL DEFAULT 0,
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS tramite_juridico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  tipo TEXT NOT NULL, -- escrituracion | cobranza_judicial | contrato | otro
  estatus TEXT NOT NULL DEFAULT 'abierto', -- abierto | en_proceso | cerrado
  fecha_inicio TEXT NOT NULL,
  notas TEXT,
  importacion_id INTEGER REFERENCES importacion(id)
);
