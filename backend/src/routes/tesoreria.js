import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const tesoreriaRouter = Router();

tesoreriaRouter.get("/macrocategorias", requireAuth, (_req, res) => {
  const filas = db.prepare("SELECT id, nombre FROM macrocategoria ORDER BY nombre").all();
  res.json({ macrocategorias: filas });
});

// Listado de movimientos con filtros opcionales: desde, hasta (YYYY-MM-DD),
// macrocategoria_id. Pensado para alimentar la pantalla de Tesoreria
// (seccion 3 de la propuesta conceptual).
tesoreriaRouter.get("/movimientos", requireAuth, (req, res) => {
  const { desde, hasta, macrocategoria_id: macrocategoriaId } = req.query;

  const condiciones = [];
  const parametros = [];

  if (desde) {
    condiciones.push("m.fecha >= ?");
    parametros.push(String(desde));
  }
  if (hasta) {
    condiciones.push("m.fecha <= ?");
    parametros.push(String(hasta));
  }
  if (macrocategoriaId) {
    condiciones.push("m.macrocategoria_id = ?");
    parametros.push(Number(macrocategoriaId));
  }

  const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const movimientos = db
    .prepare(
      `SELECT m.id, m.fecha, m.concepto, mc.nombre AS macrocategoria, m.cargo, m.abono, m.conciliado, m.importacion_id
       FROM movimiento_caja m LEFT JOIN macrocategoria mc ON mc.id = m.macrocategoria_id
       ${whereSql}
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT 500`
    )
    .all(...parametros);

  const totales = db
    .prepare(
      `SELECT COALESCE(SUM(m.cargo),0) AS cargos, COALESCE(SUM(m.abono),0) AS abonos
       FROM movimiento_caja m ${whereSql}`
    )
    .get(...parametros);

  res.json({
    movimientos,
    totales: {
      cargos: Number(totales.cargos.toFixed(2)),
      abonos: Number(totales.abonos.toFixed(2)),
      neto: Number((totales.abonos - totales.cargos).toFixed(2)),
    },
  });
});
