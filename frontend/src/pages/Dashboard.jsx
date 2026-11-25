import React, { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "../components/Sidebar.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    fetch(apiUrl("/api/dashboard"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar el dashboard");
        return res.json();
      })
      .then((json) => activo && setData(json))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, [token]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="header-row">
          <div>
            <div className="page-title">Dashboard ejecutivo</div>
            <div className="page-subtitle">Datos consolidados desde movimiento_caja · Fase 1</div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {!data && !error && <div>Cargando...</div>}

        {data && (
          <>
            <div className="kpi-grid">
              <KpiCard label="Posicion de efectivo" value={moneda.format(data.kpis.posicion_efectivo)} />
              <KpiCard
                label="Dias de caja"
                value={data.kpis.dias_caja}
                badge={data.kpis.dias_caja < data.kpis.meta_dias_caja ? "bad" : "ok"}
                badgeText={`Meta: ${data.kpis.meta_dias_caja} dias`}
              />
              <KpiCard
                label="% del saldo minimo"
                value={`${data.kpis.porcentaje_saldo_minimo}%`}
                badge={data.kpis.porcentaje_saldo_minimo < 100 ? "warn" : "ok"}
                badgeText={data.kpis.porcentaje_saldo_minimo < 100 ? "Bajo minimo" : "Sobre minimo"}
              />
              <KpiCard label="Movimiento neto del periodo" value={moneda.format(data.ingresos_egresos_periodo.neto)} />
            </div>

            <div className="card">
              <div className="card-title">Ingresos y egresos por macrocategoria</div>
              <table>
                <thead>
                  <tr>
                    <th>Macrocategoria</th>
                    <th>Abonos</th>
                    <th>Cargos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.por_macrocategoria.map((m) => (
                    <tr key={m.macrocategoria}>
                      <td>{m.macrocategoria}</td>
                      <td>{moneda.format(m.abonos)}</td>
                      <td>{moneda.format(m.cargos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-title">Movimientos recientes</div>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Macrocategoria</th>
                    <th>Cargo</th>
                    <th>Abono</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movimientos_recientes.map((m, i) => (
                    <tr key={i}>
                      <td>{m.fecha}</td>
                      <td>{m.concepto}</td>
                      <td>{m.macrocategoria}</td>
                      <td>{m.cargo ? moneda.format(m.cargo) : "-"}</td>
                      <td>{m.abono ? moneda.format(m.abono) : "-"}</td>
                      <td>
                        <span className={`badge ${m.conciliado ? "ok" : "warn"}`}>
                          {m.conciliado ? "Conciliado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, badge, badgeText }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {badgeText && <span className={`badge ${badge}`}>{badgeText}</span>}
    </div>
  );
}
