import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const buscarRouter = Router();

// Busqueda global (barra superior): folio real/escritura no existe todavia
// como campo propio en el modelo, asi que por ahora busca por nombre de
// acreditado (credito.cliente), nombre de inversionista y nombre de cliente
// en control juridico. Cuando exista un campo de folio formal, se agrega
// aqui sin cambiar el contrato de la respuesta.
buscarRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) {
      return res.json({ resultados: [] });
    }
    const like = `%${q}%`;

    const [creditos, inversionistas, juridicos] = await Promise.all([
      db.all(
        `SELECT id, cliente AS titulo, estatus, saldo_actual FROM credito
         WHERE cliente ILIKE ? ORDER BY cliente LIMIT 8`,
        [like]
      ),
      db.all(
        `SELECT id, nombre AS titulo, estatus, capital_aportado FROM inversionista
         WHERE nombre ILIKE ? ORDER BY nombre LIMIT 8`,
        [like]
      ),
      db.all(
        `SELECT id, cliente AS titulo, estatus, tipo FROM tramite_juridico
         WHERE cliente ILIKE ? ORDER BY cliente LIMIT 8`,
        [like]
      ),
    ]);

    const resultados = [
      ...creditos.map((c) => ({ tipo: "credito", modulo: "Cartera", ruta: "/cartera", ...c })),
      ...inversionistas.map((i) => ({ tipo: "inversionista", modulo: "Inversionistas", ruta: "/inversionistas", ...i })),
      ...juridicos.map((j) => ({ tipo: "tramite_juridico", modulo: "Control juridico", ruta: "/juridico", ...j })),
    ];

    res.json({ resultados });
  } catch (err) {
    next(err);
  }
});
