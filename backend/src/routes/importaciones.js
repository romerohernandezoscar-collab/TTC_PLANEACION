import { Router } from "express";
import multer from "multer";
import { db, transaction } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { parseMovimientosExcel } from "../importacion/parseExcel.js";

export const importacionesRouter = Router();

// Archivo en memoria (sin disco persistente en el free tier de Render);
// limite conservador de 5 MB para un Excel de flujo de caja.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function normalizar(txt) {
  return String(txt ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

importacionesRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    const historial = await db.all(
      `SELECT i.id, i.archivo, i.fecha, i.registros_cargados, i.registros_rechazados, i.notas, u.nombre AS usuario
       FROM importacion i LEFT JOIN usuario u ON u.id = i.usuario_id
       ORDER BY i.fecha DESC LIMIT 50`
    );
    res.json({ importaciones: historial });
  } catch (err) {
    next(err);
  }
});

importacionesRouter.post("/", requireAuth, upload.single("archivo"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibio ningun archivo (campo 'archivo')" });
    }
    const nombreOriginal = req.file.originalname || "archivo.xlsx";
    if (!/\.(xlsx|xls)$/i.test(nombreOriginal)) {
      return res.status(400).json({ error: "El archivo debe ser .xlsx o .xls" });
    }

    const macrocategorias = await db.all("SELECT id, nombre FROM macrocategoria");
    const mapaMacro = new Map(macrocategorias.map((m) => [normalizar(m.nombre), m.id]));
    const validas = new Set(mapaMacro.keys());

    let resultado;
    try {
      resultado = parseMovimientosExcel(req.file.buffer, validas);
    } catch (err) {
      return res.status(400).json({ error: "No se pudo leer el archivo: " + err.message });
    }

    if (resultado.columnasFaltantes.length > 0) {
      return res.status(400).json({
        error: "Faltan columnas obligatorias en el archivo",
        columnas_faltantes: resultado.columnasFaltantes,
        columnas_esperadas: ["Fecha", "Concepto", "Macrocategoria", "Cargo", "Abono"],
      });
    }

    const { filas, errores } = resultado;

    // Transaccion: si algo revienta a mitad de la carga, no queda una
    // importacion a medias (trazabilidad, seccion de integridad del prompt).
    const importacionId = await transaction(async (tx) => {
      const notas = errores.length > 0 ? `${errores.length} fila(s) rechazada(s)` : null;
      const infoImportacion = await tx.run(
        `INSERT INTO importacion (archivo, usuario_id, registros_cargados, registros_rechazados, notas)
         VALUES (?, ?, ?, ?, ?) RETURNING id`,
        [nombreOriginal, req.usuario.sub, filas.length, errores.length, notas]
      );
      const id = infoImportacion.lastInsertRowid;

      // Con SQLite local cada INSERT era practicamente gratis (sin red de
      // por medio). Con Postgres remoto (Neon), insertar fila por fila
      // significa un viaje de red por cada una -con decenas de miles de
      // filas (carga del historico completo) eso tarda minutos y puede
      // parecer que la carga se "cuelga". Se insertan en lotes de 500
      // filas por sentencia para reducir drasticamente el numero de
      // round-trips, sin perder la atomicidad (sigue dentro de la misma
      // transaccion).
      const LOTE = 500;
      for (let inicio = 0; inicio < filas.length; inicio += LOTE) {
        const lote = filas.slice(inicio, inicio + LOTE);
        const valores = [];
        const parametros = [];
        lote.forEach((fila, idx) => {
          const macroId = mapaMacro.get(fila.macrocategoriaNormalizada);
          const base = idx * 6;
          valores.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, 0, $${base + 6})`
          );
          parametros.push(fila.fecha, fila.concepto, macroId, fila.cargo, fila.abono, id);
        });
        await tx.run(
          `INSERT INTO movimiento_caja (fecha, concepto, macrocategoria_id, cargo, abono, conciliado, importacion_id)
           VALUES ${valores.join(", ")}`,
          parametros
        );
      }

      await tx.run(`INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, ?, ?)`, [
        req.usuario.sub,
        "importacion_excel",
        `archivo=${nombreOriginal} cargados=${filas.length} rechazados=${errores.length} importacion_id=${id}`,
      ]);

      return id;
    });

    res.status(201).json({
      importacion_id: importacionId,
      registros_cargados: filas.length,
      registros_rechazados: errores.length,
      errores,
    });
  } catch (err) {
    next(err);
  }
});
