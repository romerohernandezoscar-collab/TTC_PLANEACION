import { Router } from "express";
import multer from "multer";
import { db } from "../db/connection.js";
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

importacionesRouter.get("/", requireAuth, (_req, res) => {
  const historial = db
    .prepare(
      `SELECT i.id, i.archivo, i.fecha, i.registros_cargados, i.registros_rechazados, i.notas, u.nombre AS usuario
       FROM importacion i LEFT JOIN usuario u ON u.id = i.usuario_id
       ORDER BY i.fecha DESC LIMIT 50`
    )
    .all();
  res.json({ importaciones: historial });
});

importacionesRouter.post("/", requireAuth, upload.single("archivo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se recibio ningun archivo (campo 'archivo')" });
  }
  const nombreOriginal = req.file.originalname || "archivo.xlsx";
  if (!/\.(xlsx|xls)$/i.test(nombreOriginal)) {
    return res.status(400).json({ error: "El archivo debe ser .xlsx o .xls" });
  }

  const macrocategorias = db.prepare("SELECT id, nombre FROM macrocategoria").all();
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

  const insertarImportacion = db.prepare(
    `INSERT INTO importacion (archivo, usuario_id, registros_cargados, registros_rechazados, notas)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertarMovimiento = db.prepare(
    `INSERT INTO movimiento_caja (fecha, concepto, macrocategoria_id, cargo, abono, conciliado, importacion_id)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  );
  const insertarAuditoria = db.prepare(
    `INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, ?, ?)`
  );

  // Transaccion: si algo revienta a mitad de la carga, no queda una
  // importacion a medias (trazabilidad, seccion de integridad del prompt).
  const transaccion = db.transaction(() => {
    const notas = errores.length > 0 ? `${errores.length} fila(s) rechazada(s)` : null;
    const infoImportacion = insertarImportacion.run(
      nombreOriginal,
      req.usuario.sub,
      filas.length,
      errores.length,
      notas
    );
    const importacionId = infoImportacion.lastInsertRowid;

    for (const fila of filas) {
      const macroId = mapaMacro.get(fila.macrocategoriaNormalizada);
      insertarMovimiento.run(fila.fecha, fila.concepto, macroId, fila.cargo, fila.abono, importacionId);
    }

    insertarAuditoria.run(
      req.usuario.sub,
      "importacion_excel",
      `archivo=${nombreOriginal} cargados=${filas.length} rechazados=${errores.length} importacion_id=${importacionId}`
    );

    return importacionId;
  });

  const importacionId = transaccion();

  res.status(201).json({
    importacion_id: importacionId,
    registros_cargados: filas.length,
    registros_rechazados: errores.length,
    errores,
  });
});
