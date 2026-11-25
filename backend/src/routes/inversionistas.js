import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const inversionistasRouter = Router();

inversionistasRouter.get("/", requireAuth, (req, res) => {
  const { estatus } = req.query;
  const condiciones = [];
  const parametros = [];
  if (estatus) {
    condiciones.push("estatus = ?");
    parametros.push(String(estatus));
  }
  const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const inversionistas = db
    .prepare(`SELECT * FROM inversionista ${whereSql} ORDER BY fecha_ingreso DESC`)
    .all(...parametros);

  const totales = db
    .prepare(`SELECT COALESCE(SUM(capital_aportado),0) AS capital_aportado FROM inversionista ${whereSql}`)
    .get(...parametros);

  res.json({ inversionistas, totales });
});
