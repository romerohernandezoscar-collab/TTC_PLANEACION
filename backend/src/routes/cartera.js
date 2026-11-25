import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const carteraRouter = Router();

carteraRouter.get("/", requireAuth, (req, res) => {
  const { estatus } = req.query;
  const condiciones = [];
  const parametros = [];
  if (estatus) {
    condiciones.push("estatus = ?");
    parametros.push(String(estatus));
  }
  const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const creditos = db
    .prepare(`SELECT * FROM credito ${whereSql} ORDER BY fecha_inicio DESC`)
    .all(...parametros);

  const totales = db
    .prepare(
      `SELECT COALESCE(SUM(monto_original),0) AS monto_original, COALESCE(SUM(saldo_actual),0) AS saldo_actual
       FROM credito ${whereSql}`
    )
    .get(...parametros);

  res.json({ creditos, totales });
});
