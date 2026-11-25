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

export async function initSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);
}
