import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";
import Tabs from "../components/Tabs.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const badgePorEstatus = { vigente: "ok", atrasado: "bad", liquidado: "warn" };

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "creditos", label: "Creditos" },
  { id: "vencida", label: "Cartera vencida" },
];

export default function Cartera() {
  const { token } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [creditos, setCreditos] = useState([]);
  const [totales, setTotales] = useState(null);
  const [estatus, setEstatus] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async (estatusParam) => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (estatusParam) params.set("estatus", estatusParam);
      const res = await fetch(apiUrl(`/api/cartera?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar la cartera");
      const data = await res.json();
      setCreditos(data.creditos);
      setTotales(data.totales);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    cargar(estatus);
  }, [cargar, estatus]);

  const vigentes = creditos.filter((c) => c.estatus === "vigente").length;
  const atrasados = creditos.filter((c) => c.estatus === "atrasado");
  const liquidados = creditos.filter((c) => c.estatus === "liquidado").length;

  return (
    <Layout titulo="Cartera de creditos" subtitulo="Creditos otorgados a clientes · Fase 3">
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === "resumen" && (
        <>
          {totales && (
            <div className="kpi-grid">
              <div className="card kpi-card">
                <div className="kpi-label">Monto original</div>
                <div className="kpi-value">{moneda.format(totales.monto_original)}</div>
              </div>
              <div className="card kpi-card">
                <div className="kpi-label">Saldo actual</div>
                <div className="kpi-value">{moneda.format(totales.saldo_actual)}</div>
              </div>
              <div className="card kpi-card">
                <div className="kpi-label">Creditos vigentes</div>
                <div className="kpi-value">{vigentes}</div>
              </div>
              <div className="card kpi-card">
                <div className="kpi-label">Creditos atrasados</div>
                <div className="kpi-value">{atrasados.length}</div>
                {atrasados.length > 0 && <span className="badge bad">Requiere seguimiento</span>}
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-title">Distribucion por estatus</div>
            <table>
              <thead>
                <tr>
                  <th>Estatus</th>
                  <th>Creditos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge ok">vigente</span></td>
                  <td>{vigentes}</td>
                </tr>
                <tr>
                  <td><span className="badge bad">atrasado</span></td>
                  <td>{atrasados.length}</td>
                </tr>
                <tr>
                  <td><span className="badge warn">liquidado</span></td>
                  <td>{liquidados}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "creditos" && (
        <>
          <div className="card">
            <div className="filtros-row">
              <label>
                Estatus
                <select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="vigente">Vigente</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="liquidado">Liquidado</option>
                </select>
              </label>
              <button onClick={() => cargar(estatus)}>Aplicar filtro</button>
            </div>
          </div>
          <TablaCreditos titulo={`Creditos (${creditos.length})`} creditos={creditos} />
        </>
      )}

      {tab === "vencida" && (
        <TablaCreditos
          titulo={`Cartera vencida (${atrasados.length})`}
          creditos={atrasados}
          nota="Creditos con estatus 'atrasado'. Revisar contra el control juridico si ya hay expediente abierto."
        />
      )}

      {error && <div className="error-banner">{error}</div>}
    </Layout>
  );
}

function TablaCreditos({ titulo, creditos, nota }) {
  return (
    <div className="card">
      <div className="card-title">{titulo}</div>
      {nota && <div className="upload-hint" style={{ marginBottom: 10 }}>{nota}</div>}
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Monto original</th>
            <th>Saldo actual</th>
            <th>Tasa anual</th>
            <th>Inicio</th>
            <th>Vencimiento</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {creditos.map((c) => (
            <tr key={c.id}>
              <td>{c.cliente}</td>
              <td>{moneda.format(c.monto_original)}</td>
              <td>{moneda.format(c.saldo_actual)}</td>
              <td>{c.tasa_anual != null ? `${c.tasa_anual}%` : "-"}</td>
              <td>{c.fecha_inicio}</td>
              <td>{c.fecha_vencimiento || "-"}</td>
              <td>
                <span className={`badge ${badgePorEstatus[c.estatus] || "warn"}`}>{c.estatus}</span>
              </td>
            </tr>
          ))}
          {creditos.length === 0 && (
            <tr>
              <td colSpan={7} style={{ color: "#6B7684" }}>
                No hay creditos con el filtro seleccionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
