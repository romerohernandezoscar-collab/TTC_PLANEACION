import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const tesoreriaRouter = Router();

tesoreriaRouter.get("/macrocategorias", requireAuth, async (_req, res, next) => {
  try {
    const filas = await db.all("SELECT id, nombre FROM macrocategoria ORDER BY nombre");
    res.json({ macrocategorias: filas });
  } catch (err) {
    next(err);
  }
});

// Listado de movimientos con filtros opcionales: desde, hasta (YYYY-MM-DD),
// macrocategoria_id. Pensado para alimentar la pantalla de Tesoreria
// (seccion 3 de la propuesta conceptual).
tesoreriaRouter.get("/movimientos", requireAuth, async (req, res, next) => {
  try {
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

    const movimientosRaw = await db.all(
      `SELECT m.id, m.fecha, m.concepto, mc.nombre AS macrocategoria, m.cargo, m.abono, m.conciliado, m.importacion_id
       FROM movimiento_caja m LEFT JOIN macrocategoria mc ON mc.id = m.macrocategoria_id
       ${whereSql}
       ORDER BY m.fecha DESC, m.id DESC
       LIMIT 500`,
      parametros
    );
    const movimientos = movimientosRaw.map((m) => ({ ...m, cargo: Number(m.cargo), abono: Number(m.abono) }));

    const totalesRaw = await db.get(
      `SELECT COALESCE(SUM(m.cargo),0) AS cargos, COALESCE(SUM(m.abono),0) AS abonos
       FROM movimiento_caja m ${whereSql}`,
      parametros
    );
    const cargos = Number(totalesRaw.cargos);
    const abonos = Number(totalesRaw.abonos);

    res.json({
      movimientos,
      totales: {
        cargos: Number(cargos.toFixed(2)),
        abonos: Number(abonos.toFixed(2)),
        neto: Number((abonos - cargos).toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Conciliacion (pestana de Tesoreria): marca/desmarca un movimiento como
// conciliado. Accion reversible a proposito (un clic de mas no debe
// requerir tocar la base de datos a mano).
tesoreriaRouter.patch("/movimientos/:id/conciliar", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const conciliado = req.body?.conciliado ? 1 : 0;
    const actualizado = await db.get(
      "UPDATE movimiento_caja SET conciliado = ? WHERE id = ? RETURNING id, conciliado",
      [conciliado, id]
    );
    if (!actualizado) return res.status(404).json({ error: "Movimiento no encontrado" });
    res.json({ movimiento: actualizado });
  } catch (err) {
    next(err);
  }
});
