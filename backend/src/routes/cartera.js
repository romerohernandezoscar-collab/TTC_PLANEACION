import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const carteraRouter = Router();

carteraRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { estatus } = req.query;
    const condiciones = [];
    const parametros = [];
    if (estatus) {
      condiciones.push("estatus = ?");
      parametros.push(String(estatus));
    }
    const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const creditosRaw = await db.all(`SELECT * FROM credito ${whereSql} ORDER BY fecha_inicio DESC`, parametros);
    const creditos = creditosRaw.map((c) => ({
      ...c,
      monto_original: Number(c.monto_original),
      saldo_actual: Number(c.saldo_actual),
      tasa_anual: c.tasa_anual != null ? Number(c.tasa_anual) : null,
    }));

    const totalesRaw = await db.get(
      `SELECT COALESCE(SUM(monto_original),0) AS monto_original, COALESCE(SUM(saldo_actual),0) AS saldo_actual
       FROM credito ${whereSql}`,
      parametros
    );
    const totales = {
      monto_original: Number(totalesRaw.monto_original),
      saldo_actual: Number(totalesRaw.saldo_actual),
    };

    res.json({ creditos, totales });
  } catch (err) {
    next(err);
  }
});
