// Capa de persistencia (migrada a Postgres/Neon en Fase 3.1).
//
// Antes se usaba SQLite con el archivo en el disco local del servicio de
// Render. El plan gratuito de Render no tiene disco persistente: cada
// redeploy reinicia el filesystem y borra cualquier dato cargado despues
// del seed. Para resolverlo de raiz (y no solo "mover el problema" a otro
// hosting) la base de datos ahora vive en Postgres (Neon, plan gratuito,
// con almacenamiento persistente real), independiente de donde corra el
// backend.
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Por defecto node-postgres convierte las columnas DATE a objetos Date en
// hora local/UTC, lo que al serializar a JSON agrega una hora ("...T00:00:00.000Z")
// y puede correr el dia un dia atras segun el huso horario. El resto del
// codigo (y el frontend) espera "YYYY-MM-DD" tal cual, como lo devolvia
// SQLite, asi que se desactiva ese parseo para el tipo DATE (oid 1082).
pg.types.setTypeParser(1082, (valor) => valor);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL no esta definida. Configura la cadena de conexion de Postgres (Neon) en el archivo .env o en las variables de entorno del servicio."
  );
}

const pool = new Pool({
  connectionString,
  // Neon exige TLS; en un Postgres local de desarrollo (sin TLS) se
  // desactiva automaticamente.
  ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
  // Por defecto pg no tiene limite de tiempo para establecer la conexion:
  // si Render no logra alcanzar a Neon (problema de red transitorio), el
  // proceso se queda colgado para siempre en vez de fallar. Con esto, si
  // no conecta en 15s se lanza un error y el arranque falla rapido (y
  // Render puede reintentar) en vez de agotar el chequeo de puerto.
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  // Error en un cliente ocioso del pool (ej. la conexion con Neon se cayo).
  // Sin este handler, un error asincrono aqui tumba el proceso entero sin
  // log util.
  console.error("Error inesperado en el pool de Postgres:", err);
});

// Convierte los placeholders estilo SQLite ("?") que usaba el codigo
// original a los placeholders posicionales de Postgres ("$1", "$2", ...),
// para minimizar el numero de lineas distintas entre ambas versiones.
function toPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function construirCliente(ejecutor) {
  return {
    // Equivalente a better-sqlite3 .prepare(sql).get(...params)
    async get(sql, params = []) {
      const res = await ejecutor.query(toPgParams(sql), params);
      return res.rows[0];
    },
    // Equivalente a .prepare(sql).all(...params)
    async all(sql, params = []) {
      const res = await ejecutor.query(toPgParams(sql), params);
      return res.rows;
    },
    // Equivalente a .prepare(sql).run(...params). Para obtener el id
    // autogenerado hay que terminar el INSERT con "RETURNING id".
    async run(sql, params = []) {
      const res = await ejecutor.query(toPgParams(sql), params);
      return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id ?? null };
    },
  };
}

export const db = construirCliente(pool);

// Equivalente a better-sqlite3 db.transaction(fn) — aqui "fn" recibe un
// cliente de transaccion (tx) con los mismos metodos get/all/run, y debe
// ser async.
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tx = construirCliente(client);
    const resultado = await fn(tx);
    await client.query("COMMIT");
    return resultado;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// connectionTimeoutMillis de pg no cubre una resolucion DNS colgada (solo
// mide desde que el socket ya se esta conectando), asi que ademas se pone
// un limite manual, duro, independiente de lo que haga la libreria pg por
// dentro: si una operacion no resuelve en "ms", seguimos adelante (y el
// intento se cuenta como fallido) aunque la promesa original siga colgada
// en segundo plano.
function conLimite(promesa, ms, etiqueta) {
  return Promise.race([
    promesa,
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error(`${etiqueta}: sin respuesta tras ${ms}ms`)), ms)
    ),
  ]);
}

export async function initSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  // La conexion inicial a Neon a veces falla por un hipo transitorio de
  // red entre Render y Neon (observado: el intento se queda colgado sin
  // ni siquiera llegar a abrir sesion en Postgres - probablemente una
  // resolucion DNS que nunca responde). Se reintenta unas veces con
  // backoff antes de rendirse, en vez de tumbar el arranque al primer
  // fallo.
  const intentosMax = 4;
  for (let intento = 1; intento <= intentosMax; intento++) {
    console.log(`initSchema: intento ${intento}/${intentosMax} - conectando a Postgres...`);
    try {
      await conLimite(pool.query(schema), 20000, "initSchema");
      console.log("initSchema: esquema aplicado correctamente.");
      return;
    } catch (err) {
      console.error(`initSchema: intento ${intento}/${intentosMax} fallo:`, err.message);
      if (intento === intentosMax) throw err;
      await esperar(intento * 3000);
    }
  }
}
