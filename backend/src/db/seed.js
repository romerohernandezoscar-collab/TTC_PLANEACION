// Carga datos FICTICIOS para poder encender el dashboard en Fase 1
// (criterio 11 de la propuesta: nunca se usa informacion real de TTC
// Capital en demostraciones). Ejecutar con: npm run seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./connection.js";

const roles = [
  ["direccion", "Visibilidad total, sin edicion"],
  ["gerencia_area", "Ve y edita su propia area"],
  ["operacion", "Captura dentro de su area"],
  ["juridico", "Lectura de cartera, lectura/escritura juridico"],
  ["administrador", "Administra usuarios y configuracion"],
];

const insertRol = db.prepare("INSERT OR IGNORE INTO rol (nombre, descripcion) VALUES (?, ?)");
for (const [nombre, descripcion] of roles) insertRol.run(nombre, descripcion);

const rolAdminId = db.prepare("SELECT id FROM rol WHERE nombre = 'administrador'").get().id;
const rolDireccionId = db.prepare("SELECT id FROM rol WHERE nombre = 'direccion'").get().id;

const existingUser = db.prepare("SELECT id FROM usuario WHERE correo = ?").get("demo@ttccapital.test");
if (!existingUser) {
  const hash = bcrypt.hashSync("DemoTTC2026!", 10);
  db.prepare(
    "INSERT INTO usuario (nombre, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)"
  ).run("Usuario Demo", "demo@ttccapital.test", hash, rolDireccionId);

  const hashAdmin = bcrypt.hashSync("AdminTTC2026!", 10);
  db.prepare(
    "INSERT INTO usuario (nombre, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)"
  ).run("Administrador", "admin@ttccapital.test", hashAdmin, rolAdminId);
}

const macrocategorias = ["Cobranza", "Financiamiento", "Inmuebles", "Inversionistas", "Comisiones", "Operacion"];
const insertMacro = db.prepare("INSERT OR IGNORE INTO macrocategoria (nombre) VALUES (?)");
for (const nombre of macrocategorias) insertMacro.run(nombre);
const macroIds = Object.fromEntries(
  db.prepare("SELECT id, nombre FROM macrocategoria").all().map((m) => [m.nombre, m.id])
);

const movCount = db.prepare("SELECT COUNT(*) AS n FROM movimiento_caja").get().n;
if (movCount === 0) {
  const importacionId = db
    .prepare("INSERT INTO importacion (archivo, registros_cargados, registros_rechazados, notas) VALUES (?, ?, ?, ?)")
    .run("CAJA_DEMO_OCTUBRE_2026.xlsx", 8, 0, "Carga ficticia de arranque (seed)").lastInsertRowid;

  const movimientos = [
    ["2026-10-01", "Saldo inicial del periodo", "Operacion", 0, 29187.09],
    ["2026-11-22", "Pago cuota hipoteca La Campina", "Inmuebles", 87500, 0],
    ["2026-11-21", "Abono cobranza cartera", "Cobranza", 0, 42310],
    ["2026-11-20", "Pago acreedor tasa fija", "Financiamiento", 10479.7, 0],
    ["2026-11-19", "Aportacion inversionista", "Inversionistas", 0, 150000],
    ["2026-11-18", "Comision referenciador", "Comisiones", 6200, 0],
    ["2026-11-15", "Abono cobranza cartera", "Cobranza", 0, 38500],
    ["2026-11-10", "Pago nomina y gastos de oficina", "Operacion", 54300, 0],
  ];
  const insertMov = db.prepare(
    "INSERT INTO movimiento_caja (fecha, concepto, macrocategoria_id, cargo, abono, conciliado, importacion_id) VALUES (?, ?, ?, ?, ?, 1, ?)"
  );
  for (const [fecha, concepto, macro, cargo, abono] of movimientos) {
    insertMov.run(fecha, concepto, macroIds[macro], cargo, abono, importacionId);
  }
}

console.log("Seed completado: usuarios demo, macrocategorias y movimientos ficticios cargados.");
console.log("  demo@ttccapital.test / DemoTTC2026!  (rol: direccion)");
console.log("  admin@ttccapital.test / AdminTTC2026! (rol: administrador)");
