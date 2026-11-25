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

  // "Dias de caja" = posicion de efectivo / gasto diario promedio reciente.
  // Antes se dividia entre el TOTAL historico de cargos / 30, lo que daba
  // numeros absurdos en cuanto el historico dejo de ser de solo unas
  // semanas (p. ej. al cargar anios de datos reales). Ahora el gasto
  // diario se calcula sobre una ventana movil de 30 dias que termina en
  // la fecha mas reciente registrada (no en "hoy"), para que siga
  // funcionando igual con datos demo o con datos reales historicos.
  const fechaMax = db.prepare("SELECT MAX(fecha) AS f FROM movimiento_caja").get().f;
  let cargos30d = 0;
  if (fechaMax) {
    cargos30d = db
      .prepare(
        `SELECT COALESCE(SUM(cargo),0) AS cargos FROM movimiento_caja
         WHERE fecha >= date(?, '-29 days') AND fecha <= ?`
      )
      .get(fechaMax, fechaMax).cargos;
  }
  const gastoDiarioPromedio = cargos30d / 30;
  const diasCaja = gastoDiarioPromedio > 0 ? Number((posicionEfectivo / gastoDiarioPromedio).toFixed(1)) : null;
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
