import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const inversionistasRouter = Router();

inversionistasRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { estatus } = req.query;
    const condiciones = [];
    const parametros = [];
    if (estatus) {
      condiciones.push("estatus = ?");
      parametros.push(String(estatus));
    }
    const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const inversionistasRaw = await db.all(
      `SELECT * FROM inversionista ${whereSql} ORDER BY fecha_ingreso DESC`,
      parametros
    );
    const inversionistas = inversionistasRaw.map((i) => ({
      ...i,
      capital_aportado: Number(i.capital_aportado),
      tasa_rendimiento: i.tasa_rendimiento != null ? Number(i.tasa_rendimiento) : null,
    }));

    const totalesRaw = await db.get(
      `SELECT COALESCE(SUM(capital_aportado),0) AS capital_aportado FROM inversionista ${whereSql}`,
      parametros
    );
    const totales = { capital_aportado: Number(totalesRaw.capital_aportado) };

    res.json({ inversionistas, totales });
  } catch (err) {
    next(err);
  }
});
