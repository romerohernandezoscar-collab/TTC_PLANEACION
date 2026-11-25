-- Esquema Postgres (migrado desde SQLite para tener persistencia real en
-- Render free tier, que no ofrece disco persistente). Entidades de la
-- seccion 6 de la propuesta conceptual: usuario/rol (autenticacion),
-- movimiento_caja + macrocategoria (dashboard + importacion de Excel),
-- y cartera/inversionistas/comisiones/juridico (Fase 3).

CREATE TABLE IF NOT EXISTS rol (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,              -- direccion | gerencia_area | operacion | juridico | administrador
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES rol(id),
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS macrocategoria (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS importacion (
  id SERIAL PRIMARY KEY,
  archivo TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuario(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  registros_cargados INTEGER NOT NULL DEFAULT 0,
  registros_rechazados INTEGER NOT NULL DEFAULT 0,
  notas TEXT
);

CREATE TABLE IF NOT EXISTS movimiento_caja (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  concepto TEXT NOT NULL,
  macrocategoria_id INTEGER REFERENCES macrocategoria(id),
  cargo NUMERIC NOT NULL DEFAULT 0,
  abono NUMERIC NOT NULL DEFAULT 0,
  conciliado INTEGER NOT NULL DEFAULT 0,
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuario(id),
  accion TEXT NOT NULL,
  detalle TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON movimiento_caja(fecha);

-- Fase 3: cartera de creditos, inversionistas, comisiones y control
-- juridico (seccion 6 de la propuesta conceptual). Modelo deliberadamente
-- simple en esta fase: cada modulo es una tabla propia de lectura, sin
-- flujo de captura todavia (eso se evaluara en fases posteriores).

CREATE TABLE IF NOT EXISTS credito (
  id SERIAL PRIMARY KEY,
  cliente TEXT NOT NULL,
  monto_original NUMERIC NOT NULL DEFAULT 0,
  saldo_actual NUMERIC NOT NULL DEFAULT 0,
  tasa_anual NUMERIC,
  fecha_inicio DATE NOT NULL,
  fecha_vencimiento DATE,
  estatus TEXT NOT NULL DEFAULT 'vigente', -- vigente | atrasado | liquidado
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS inversionista (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  capital_aportado NUMERIC NOT NULL DEFAULT 0,
  tasa_rendimiento NUMERIC,
  fecha_ingreso DATE NOT NULL,
  estatus TEXT NOT NULL DEFAULT 'activo', -- activo | retirado
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS comision (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  concepto TEXT NOT NULL,
  beneficiario TEXT,
  tipo TEXT, -- apertura | inmobiliaria | referenciador | otro
  monto NUMERIC NOT NULL DEFAULT 0,
  pagada INTEGER NOT NULL DEFAULT 0,
  importacion_id INTEGER REFERENCES importacion(id)
);

CREATE TABLE IF NOT EXISTS tramite_juridico (
  id SERIAL PRIMARY KEY,
  cliente TEXT NOT NULL,
  tipo TEXT NOT NULL, -- escrituracion | cobranza_judicial | contrato | otro
  estatus TEXT NOT NULL DEFAULT 'abierto', -- abierto | en_proceso | cerrado
  fecha_inicio DATE NOT NULL,
  notas TEXT,
  importacion_id INTEGER REFERENCES importacion(id)
);
