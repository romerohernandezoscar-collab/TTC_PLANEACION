import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const comisionesRouter = Router();

comisionesRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { pagada } = req.query;
    const condiciones = [];
    const parametros = [];
    if (pagada === "0" || pagada === "1") {
      condiciones.push("pagada = ?");
      parametros.push(Number(pagada));
    }
    const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const comisionesRaw = await db.all(`SELECT * FROM comision ${whereSql} ORDER BY fecha DESC`, parametros);
    const comisiones = comisionesRaw.map((c) => ({ ...c, monto: Number(c.monto) }));

    const totalesRaw = await db.get(
      `SELECT COALESCE(SUM(monto),0) AS monto_total,
              COALESCE(SUM(CASE WHEN pagada = 0 THEN monto ELSE 0 END),0) AS monto_pendiente
       FROM comision ${whereSql}`,
      parametros
    );
    const totales = {
      monto_total: Number(totalesRaw.monto_total),
      monto_pendiente: Number(totalesRaw.monto_pendiente),
    };

    res.json({ comisiones, totales });
  } catch (err) {
    next(err);
  }
});
