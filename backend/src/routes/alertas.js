import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const alertasRouter = Router();

// Centro de alertas (transversal a varios modulos, seccion 8 de la
// propuesta): cada alerta se calcula a partir de datos reales ya
// existentes, no de umbrales inventados. Pensado para crecer conforme se
// agreguen mas modulos.
alertasRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    const [creditosAtrasados, comisionesPendientes, tramitesAbiertos, importacionesConRechazos] = await Promise.all([
      db.get(`SELECT COUNT(*) AS n, COALESCE(SUM(saldo_actual),0) AS saldo FROM credito WHERE estatus = 'atrasado'`),
      db.get(`SELECT COUNT(*) AS n, COALESCE(SUM(monto),0) AS monto FROM comision WHERE pagada = 0`),
      db.get(`SELECT COUNT(*) AS n FROM tramite_juridico WHERE estatus = 'en_proceso'`),
      db.all(
        `SELECT id, archivo, registros_rechazados, fecha FROM importacion
         WHERE registros_rechazados > 0 ORDER BY fecha DESC LIMIT 5`
      ),
    ]);

    const alertas = [];
    const nCreditos = Number(creditosAtrasados.n);
    if (nCreditos > 0) {
      alertas.push({
        severidad: "alta",
        modulo: "Cartera",
        ruta: "/cartera",
        mensaje: `${nCreditos} credito(s) atrasado(s), saldo ${Number(creditosAtrasados.saldo).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`,
      });
    }
    const nComisiones = Number(comisionesPendientes.n);
    if (nComisiones > 0) {
      alertas.push({
        severidad: "media",
        modulo: "Comisiones",
        ruta: "/comisiones",
        mensaje: `${nComisiones} comision(es) pendiente(s) de pago, ${Number(comisionesPendientes.monto).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`,
      });
    }
    const nTramites = Number(tramitesAbiertos.n);
    if (nTramites > 0) {
      alertas.push({
        severidad: "media",
        modulo: "Control juridico",
        ruta: "/juridico",
        mensaje: `${nTramites} expediente(s) en proceso judicial`,
      });
    }
    importacionesConRechazos.forEach((i) => {
      alertas.push({
        severidad: "baja",
        modulo: "Importaciones",
        ruta: "/importaciones",
        mensaje: `Importacion #${i.id} (${i.archivo}): ${i.registros_rechazados} fila(s) rechazada(s)`,
      });
    });

    res.json({ alertas });
  } catch (err) {
    next(err);
  }
});
