import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";
import Tabs from "../components/Tabs.jsx";

const badgePorEstatus = { abierto: "warn", en_proceso: "info", cerrado: "ok" };

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "expedientes", label: "Expedientes" },
  { id: "alertas", label: "Alertas" },
];

export default function ControlJuridico() {
  const { token } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [tramites, setTramites] = useState([]);
  const [estatus, setEstatus] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async (estatusParam) => {
    setError("");
    try {
      const params = new URLSearchParams();
      const valor = estatusParam !== undefined ? estatusParam : estatus;
      if (valor) params.set("estatus", valor);
      const res = await fetch(apiUrl(`/api/juridico?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar los tramites");
      const data = await res.json();
      setTramites(data.tramites);
    } catch (err) {
      setError(err.message);
    }
  }, [token, estatus]);

  useEffect(() => {
    cargar("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abiertos = tramites.filter((t) => t.estatus === "abierto").length;
  const enProceso = tramites.filter((t) => t.estatus === "en_proceso");
  const cerrados = tramites.filter((t) => t.estatus === "cerrado").length;

  return (
    <Layout titulo="Control juridico" subtitulo="Escrituracion, cobranza judicial y contratos · Fase 3">
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === "resumen" && (
        <div className="kpi-grid">
          <div className="card kpi-card">
            <div className="kpi-label">Expedientes abiertos</div>
            <div className="kpi-value">{abiertos}</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-label">En proceso judicial</div>
            <div className="kpi-value">{enProceso.length}</div>
            {enProceso.length > 0 && <span className="badge bad">Cartera en riesgo</span>}
          </div>
          <div className="card kpi-card">
            <div className="kpi-label">Cerrados</div>
            <div className="kpi-value">{cerrados}</div>
          </div>
        </div>
      )}

      {tab === "expedientes" && (
        <>
          <div className="card">
            <div className="filtros-row">
              <label>
                Estatus
                <select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="abierto">Abierto</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </label>
              <button onClick={() => cargar()}>Aplicar filtro</button>
            </div>
          </div>
          <TablaTramites titulo={`Tramites (${tramites.length})`} tramites={tramites} />
        </>
      )}

      {tab === "alertas" && (
        <TablaTramites
          titulo={`Expedientes en proceso judicial (${enProceso.length})`}
          tramites={enProceso}
          nota="Credito con juicio abierto es cartera en riesgo: conviene cruzarlo contra Cartera para confirmar si ya se reclasifico como 'atrasado' y cuantificar el saldo expuesto."
        />
      )}

      {error && <div className="error-banner">{error}</div>}
    </Layout>
  );
}

function TablaTramites({ titulo, tramites, nota }) {
  return (
    <div className="card">
      <div className="card-title">{titulo}</div>
      {nota && <div className="upload-hint" style={{ marginBottom: 10 }}>{nota}</div>}
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Inicio</th>
            <th>Notas</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {tramites.map((t) => (
            <tr key={t.id}>
              <td>{t.cliente}</td>
              <td>{t.tipo}</td>
              <td>{t.fecha_inicio}</td>
              <td>{t.notas || "-"}</td>
              <td>
                <span className={`badge ${badgePorEstatus[t.estatus] || "warn"}`}>{t.estatus}</span>
              </td>
            </tr>
          ))}
          {tramites.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "#6B7684" }}>
                No hay tramites con el filtro seleccionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
