import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const comisionesRouter = Router();

comisionesRouter.get("/", requireAuth, (req, res) => {
  const { pagada } = req.query;
  const condiciones = [];
  const parametros = [];
  if (pagada === "0" || pagada === "1") {
    condiciones.push("pagada = ?");
    parametros.push(Number(pagada));
  }
  const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const comisiones = db
    .prepare(`SELECT * FROM comision ${whereSql} ORDER BY fecha DESC`)
    .all(...parametros);

  const totales = db
    .prepare(
      `SELECT COALESCE(SUM(monto),0) AS monto_total,
              COALESCE(SUM(CASE WHEN pagada = 0 THEN monto ELSE 0 END),0) AS monto_pendiente
       FROM comision ${whereSql}`
    )
    .get(...parametros);

  res.json({ comisiones, totales });
});
