import React, { useCallback, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";
import Tabs from "../components/Tabs.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "escenarios", label: "Escenarios" },
  { id: "comparativo", label: "Comparativo real vs. proyectado" },
];

export default function PlaneacionFinanciera() {
  const { token } = useAuth();
  const [tab, setTab] = useState("resumen");

  const [rango, setRango] = useState({ desde: "", hasta: "" });
  const [real, setReal] = useState(null);
  const [proyectado, setProyectado] = useState({ abonos: "", cargos: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const consultarReal = useCallback(async () => {
    if (!rango.desde || !rango.hasta) {
      setError("Selecciona desde y hasta para consultar el real del periodo.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams({ desde: rango.desde, hasta: rango.hasta });
      const res = await fetch(apiUrl(`/api/tesoreria/movimientos?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo consultar el periodo");
      const data = await res.json();
      setReal(data.totales);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [token, rango]);

  const abonosProy = Number(proyectado.abonos) || 0;
  const cargosProy = Number(proyectado.cargos) || 0;
  const netoProy = abonosProy - cargosProy;
  const desviacionNeto = real && netoProy !== 0 ? ((real.neto - netoProy) / Math.abs(netoProy)) * 100 : null;

  return (
    <Layout titulo="Planeacion financiera" subtitulo="Modelo de proyeccion y control de flujo de efectivo · Fase 4">
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === "resumen" && (
        <div className="card">
          <div className="card-title">Alcance del modelo</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#44505C" }}>
            El modelo completo (pro forma de Estado de Resultados y flujo de efectivo movil de 13 semanas) vive en
            TTC_BASE_PROYECTO_v2.xlsx y se documenta en los Retos 4-6 de la Estadia Profesional. Esta pantalla no
            reemplaza ese libro; conecta con los datos reales ya cargados (movimiento_caja) para poder comparar el
            real contra lo proyectado sin tener que hacerlo a mano cada semana.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#44505C" }}>
            La actividad A11 del cronograma (seguimiento semanal del flujo de 13 semanas, 23 de noviembre al 21 de
            febrero) es el primer caso de uso real de la pestana "Comparativo real vs. proyectado".
          </p>
        </div>
      )}

      {tab === "escenarios" && (
        <div className="card">
          <div className="card-title">Escenarios de liquidez</div>
          <div className="upload-hint">
            Las siete estrategias de optimizacion de liquidez y su tablero de trece indicadores se desarrollaron y
            documentaron en el Reto 5 (v4, con las salidas de inversion incluidas). Traerlas a esta pantalla como
            datos vivos requiere una tabla propia de escenarios/indicadores que aun no existe en el esquema de la
            base de datos; por ahora el documento del Reto 5 es la fuente autorizada.
          </div>
        </div>
      )}

      {tab === "comparativo" && (
        <>
          <div className="card">
            <div className="card-title">Periodo a comparar</div>
            <div className="filtros-row">
              <label>
                Desde
                <input
                  type="date"
                  value={rango.desde}
                  onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))}
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={rango.hasta}
                  onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))}
                />
              </label>
              <button onClick={consultarReal} disabled={cargando}>
                {cargando ? "Consultando..." : "Consultar real"}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {real && (
            <div className="card">
              <div className="card-title">Real del periodo (desde movimiento_caja)</div>
              <div className="totales-row">
                <div>
                  <div className="mini-label">Abonos</div>
                  <div className="mini-value">{moneda.format(real.abonos)}</div>
                </div>
                <div>
                  <div className="mini-label">Cargos</div>
                  <div className="mini-value">{moneda.format(real.cargos)}</div>
                </div>
                <div>
                  <div className="mini-label">Neto</div>
                  <div className="mini-value">{moneda.format(real.neto)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title">Proyectado (del modelo TTC_BASE_PROYECTO_v2.xlsx)</div>
            <div className="upload-hint" style={{ marginBottom: 10 }}>
              Captura aqui el abono/cargo proyectado para el mismo periodo, tal como lo da el libro. Esta captura no
              se guarda todavia en la base de datos (no hay tabla de proyecciones); es para comparar en pantalla.
            </div>
            <div className="filtros-row">
              <label>
                Abonos proyectados
                <input
                  type="number"
                  value={proyectado.abonos}
                  onChange={(e) => setProyectado((p) => ({ ...p, abonos: e.target.value }))}
                />
              </label>
              <label>
                Cargos proyectados
                <input
                  type="number"
                  value={proyectado.cargos}
                  onChange={(e) => setProyectado((p) => ({ ...p, cargos: e.target.value }))}
                />
              </label>
            </div>
          </div>

          {real && (abonosProy || cargosProy) ? (
            <div className="card">
              <div className="card-title">Desviacion</div>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Real</th>
                    <th>Proyectado</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Abonos</td>
                    <td>{moneda.format(real.abonos)}</td>
                    <td>{moneda.format(abonosProy)}</td>
                    <td>{moneda.format(real.abonos - abonosProy)}</td>
                  </tr>
                  <tr>
                    <td>Cargos</td>
                    <td>{moneda.format(real.cargos)}</td>
                    <td>{moneda.format(cargosProy)}</td>
                    <td>{moneda.format(real.cargos - cargosProy)}</td>
                  </tr>
                  <tr>
                    <td>Neto</td>
                    <td>{moneda.format(real.neto)}</td>
                    <td>{moneda.format(netoProy)}</td>
                    <td>
                      {moneda.format(real.neto - netoProy)}
                      {desviacionNeto !== null && (
                        <span className={`badge ${Math.abs(desviacionNeto) > 15 ? "bad" : "ok"}`} style={{ marginLeft: 8 }}>
                          {desviacionNeto.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </Layout>
  );
}
