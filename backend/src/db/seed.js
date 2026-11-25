// Carga datos FICTICIOS para poder encender el dashboard en Fase 1
// (criterio 11 de la propuesta: nunca se usa informacion real de TTC
// Capital en demostraciones). Ejecutar con: npm run seed
//
// Migrado a Postgres (Neon): el seed ahora es idempotente via
// "ON CONFLICT DO NOTHING" (antes "INSERT OR IGNORE" de SQLite) y las
// consultas son asincronas.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, initSchema } from "./connection.js";

async function seed() {
  await initSchema();

  const roles = [
    ["direccion", "Visibilidad total, sin edicion"],
    ["gerencia_area", "Ve y edita su propia area"],
    ["operacion", "Captura dentro de su area"],
    ["juridico", "Lectura de cartera, lectura/escritura juridico"],
    ["administrador", "Administra usuarios y configuracion"],
  ];
  for (const [nombre, descripcion] of roles) {
    await db.run("INSERT INTO rol (nombre, descripcion) VALUES (?, ?) ON CONFLICT (nombre) DO NOTHING", [
      nombre,
      descripcion,
    ]);
  }

  const rolAdminId = (await db.get("SELECT id FROM rol WHERE nombre = 'administrador'")).id;
  const rolDireccionId = (await db.get("SELECT id FROM rol WHERE nombre = 'direccion'")).id;

  const existingUser = await db.get("SELECT id FROM usuario WHERE correo = ?", ["demo@ttccapital.test"]);
  if (!existingUser) {
    const hash = bcrypt.hashSync("DemoTTC2026!", 10);
    await db.run("INSERT INTO usuario (nombre, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)", [
      "Usuario Demo",
      "demo@ttccapital.test",
      hash,
      rolDireccionId,
    ]);

    const hashAdmin = bcrypt.hashSync("AdminTTC2026!", 10);
    await db.run("INSERT INTO usuario (nombre, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)", [
      "Administrador",
      "admin@ttccapital.test",
      hashAdmin,
      rolAdminId,
    ]);
  }

  const macrocategorias = ["Cobranza", "Financiamiento", "Inmuebles", "Inversionistas", "Comisiones", "Operacion"];

  // Catalogo real de macrocategorias de TTC Capital (seccion "Catalogo de
  // movimientos" del modelo financiero). Se agrega al catalogo ficticio de
  // arranque -sin reemplazarlo- para no romper los movimientos demo ya
  // cargados, y para permitir la importacion de datos reales autorizados
  // por el usuario (iniciativa personal, no un entregable academico).
  const macrocategoriasReales = [
    "1. INGRESOS POR INTERESES",
    "2. COMISIONES POR APERTURA DE CREDITO",
    "3. COMISIONES INMOBILIARIAS",
    "4. INGRESOS POR RENTAS INMOBILIARIAS",
    "5. INGRESOS POR VENTA DE ACTIVOS",
    "6. COLOCACION DE CREDITOS A CLIENTES",
    "7. RECUPERACION DE CAPITAL",
    "8. PAGO DE CAPITAL A INVERSIONISTAS",
    "9. PAGO DE INTERESES A INVERSIONISTAS",
    "10. ADMINISTRACION DE PAGOS Y TRASPASOS A INVERSIONISTAS",
    "11. NOMINA Y COMPENSACIONES AL PERSONAL",
    "12. GASTOS ADMINISTRATIVOS Y DE OFICINA",
    "13. GASTOS LEGALES, FISCALES Y PREDIALES",
    "14. GASTOS DE PUBLICIDAD, VIATICOS Y TRANSPORTE",
    "15. OTROS GASTOS OPERATIVOS Y ANTICIPOS",
    "16. COMPRA Y ADQUISICION DE INMUEBLES",
    "17. GASTOS DE ESCRITURACION Y TRAMITES INMOBILIARIOS",
    "18. GASTOS DE MANTENIMIENTO Y OPERACION DE INMUEBLES",
    "19. GASTOS PERSONALES - VEHICULOS Y TARJETAS",
    "20. GASTOS PERSONALES - HOGAR Y FAMILIA",
    "NO OPERATIVO",
  ];

  for (const nombre of [...macrocategorias, ...macrocategoriasReales]) {
    await db.run("INSERT INTO macrocategoria (nombre) VALUES (?) ON CONFLICT (nombre) DO NOTHING", [nombre]);
  }
  const macroFilas = await db.all("SELECT id, nombre FROM macrocategoria");
  const macroIds = Object.fromEntries(macroFilas.map((m) => [m.nombre, m.id]));

  const movCount = Number((await db.get("SELECT COUNT(*) AS n FROM movimiento_caja")).n);
  if (movCount === 0) {
    const importacionId = (
      await db.run(
        "INSERT INTO importacion (archivo, registros_cargados, registros_rechazados, notas) VALUES (?, ?, ?, ?) RETURNING id",
        ["CAJA_DEMO_OCTUBRE_2026.xlsx", 8, 0, "Carga ficticia de arranque (seed)"]
      )
    ).lastInsertRowid;

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
    for (const [fecha, concepto, macro, cargo, abono] of movimientos) {
      await db.run(
        "INSERT INTO movimiento_caja (fecha, concepto, macrocategoria_id, cargo, abono, conciliado, importacion_id) VALUES (?, ?, ?, ?, ?, 1, ?)",
        [fecha, concepto, macroIds[macro], cargo, abono, importacionId]
      );
    }
  }

  // Fase 3: datos ficticios de arranque para cartera, inversionistas,
  // comisiones y control juridico (mismo criterio que el resto del seed:
  // nunca informacion real).
  const creditoCount = Number((await db.get("SELECT COUNT(*) AS n FROM credito")).n);
  if (creditoCount === 0) {
    const creditos = [
      ["Constructora La Campina SA de CV", 1500000, 980000, 18, "2025-03-10", "2027-03-10", "vigente"],
      ["Erwin Arrieta", 300000, 0, 24, "2022-01-15", "2024-01-15", "liquidado"],
      ["Inmobiliaria Sendero del Valle", 850000, 850000, 20, "2026-09-01", "2028-09-01", "vigente"],
      ["Maria Lopez Hdz", 120000, 45000, 22, "2024-06-01", "2026-06-01", "atrasado"],
    ];
    for (const c of creditos) {
      await db.run(
        `INSERT INTO credito (cliente, monto_original, saldo_actual, tasa_anual, fecha_inicio, fecha_vencimiento, estatus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        c
      );
    }
  }

  const inversionistaCount = Number((await db.get("SELECT COUNT(*) AS n FROM inversionista")).n);
  if (inversionistaCount === 0) {
    const inversionistas = [
      ["Max Torres", 1000000, 12, "2021-05-01", "activo"],
      ["Fondo Patrimonial Bajio", 2500000, 14, "2023-02-15", "activo"],
      ["Juan Carlos Mendez", 500000, 11, "2020-11-01", "retirado"],
    ];
    for (const i of inversionistas) {
      await db.run(
        `INSERT INTO inversionista (nombre, capital_aportado, tasa_rendimiento, fecha_ingreso, estatus)
         VALUES (?, ?, ?, ?, ?)`,
        i
      );
    }
  }

  const comisionCount = Number((await db.get("SELECT COUNT(*) AS n FROM comision")).n);
  if (comisionCount === 0) {
    const comisiones = [
      ["2026-11-18", "Comision por apertura - Constructora La Campina", "Referenciador Gomez", "apertura", 6200, 1],
      ["2026-11-05", "Comision inmobiliaria - Sendero del Valle", "Agente Ruiz", "inmobiliaria", 8500, 1],
      ["2026-11-25", "Comision referenciador pendiente", "Referenciador Gomez", "referenciador", 3000, 0],
    ];
    for (const c of comisiones) {
      await db.run(
        `INSERT INTO comision (fecha, concepto, beneficiario, tipo, monto, pagada) VALUES (?, ?, ?, ?, ?, ?)`,
        c
      );
    }
  }

  const juridicoCount = Number((await db.get("SELECT COUNT(*) AS n FROM tramite_juridico")).n);
  if (juridicoCount === 0) {
    const tramites = [
      ["Maria Lopez Hdz", "cobranza_judicial", "en_proceso", "2026-10-01", "Credito atrasado, se inicio proceso de cobranza"],
      ["Inmobiliaria Sendero del Valle", "escrituracion", "abierto", "2026-11-01", "Pendiente firma ante notario"],
      ["Constructora La Campina SA de CV", "contrato", "cerrado", "2025-03-05", "Contrato de credito firmado y archivado"],
    ];
    for (const t of tramites) {
      await db.run(`INSERT INTO tramite_juridico (cliente, tipo, estatus, fecha_inicio, notas) VALUES (?, ?, ?, ?, ?)`, t);
    }
  }

  console.log("Seed completado: usuarios demo, macrocategorias y movimientos ficticios cargados.");
  console.log("  demo@ttccapital.test / DemoTTC2026!  (rol: direccion)");
  console.log("  admin@ttccapital.test / AdminTTC2026! (rol: administrador)");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error al ejecutar el seed:", err);
  process.exit(1);
});
