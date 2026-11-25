import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const juridicoRouter = Router();

juridicoRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { estatus } = req.query;
    const condiciones = [];
    const parametros = [];
    if (estatus) {
      condiciones.push("estatus = ?");
      parametros.push(String(estatus));
    }
    const whereSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const tramites = await db.all(`SELECT * FROM tramite_juridico ${whereSql} ORDER BY fecha_inicio DESC`, parametros);

    res.json({ tramites });
  } catch (err) {
    next(err);
  }
});
