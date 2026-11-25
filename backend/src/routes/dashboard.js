import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

// Fase 1: el dashboard lee movimiento_caja ya consolidado (no el Excel
// directo), tal como describe la seccion 4 de la propuesta conceptual.
dashboardRouter.get("/", requireAuth, (req, res) => {
  const totales = db
    .prepare("SELECT COALESCE(SUM(abono),0) AS abonos, COALESCE(SUM(cargo),0) AS cargos FROM movimiento_caja")
    .get();

  const posicionEfectivo = totales.abonos - totales.cargos;
  const metaDiasCaja = 19.5;
  const saldoMinimo = 250000;
  const gastoDiarioPromedio = totales.cargos > 0 ? totales.cargos / 30 : 1;
  const diasCaja = Number((posicionEfectivo / gastoDiarioPromedio).toFixed(1));
  const porcentajeSaldoMinimo = Number(((posicionEfectivo / saldoMinimo) * 100).toFixed(1));

  const movimientosRecientes = db
    .prepare(
      `SELECT m.fecha, m.concepto, mc.nombre AS macrocategoria, m.cargo, m.abono, m.conciliado
       FROM movimiento_caja m LEFT JOIN macrocategoria mc ON mc.id = m.macrocategoria_id
       ORDER BY m.fecha DESC LIMIT 10`
    )
    .all();

  const porMacrocategoria = db
    .prepare(
      `SELECT mc.nombre AS macrocategoria, COALESCE(SUM(m.abono),0) AS abonos, COALESCE(SUM(m.cargo),0) AS cargos
       FROM movimiento_caja m LEFT JOIN macrocategoria mc ON mc.id = m.macrocategoria_id
       GROUP BY mc.nombre ORDER BY abonos DESC`
    )
    .all();

  res.json({
    kpis: {
      posicion_efectivo: Number(posicionEfectivo.toFixed(2)),
      dias_caja: diasCaja,
      meta_dias_caja: metaDiasCaja,
      porcentaje_saldo_minimo: porcentajeSaldoMinimo,
      saldo_minimo_meta: saldoMinimo,
    },
    ingresos_egresos_periodo: {
      abonos: Number(totales.abonos.toFixed(2)),
      cargos: Number(totales.cargos.toFixed(2)),
      neto: Number(posicionEfectivo.toFixed(2)),
    },
    movimientos_recientes: movimientosRecientes,
    por_macrocategoria: porMacrocategoria,
  });
});
