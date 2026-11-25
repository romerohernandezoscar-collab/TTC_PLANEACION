import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";
import Tabs from "../components/Tabs.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "calculo", label: "Calculo" },
  { id: "pendientes", label: "Pagos pendientes" },
];

export default function Comisiones() {
  const { token } = useAuth();
  const [tab, setTab] = useState("resumen");
  // Copia completa (sin filtro), usada para Resumen y Pagos pendientes.
  const [todas, setTodas] = useState([]);
  const [totalesGenerales, setTotalesGenerales] = useState(null);
  // Copia filtrada por el usuario, solo para la pestana Calculo.
  const [filtradas, setFiltradas] = useState([]);
  const [pagada, setPagada] = useState("");
  const [error, setError] = useState("");

  const cargarTodas = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(apiUrl("/api/comisiones"), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("No se pudo cargar las comisiones");
      const data = await res.json();
      setTodas(data.comisiones);
      setTotalesGenerales(data.totales);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const cargarFiltradas = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (pagada !== "") params.set("pagada", pagada);
      const res = await fetch(apiUrl(`/api/comisiones?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar las comisiones");
      const data = await res.json();
      setFiltradas(data.comisiones);
    } catch (err) {
      setError(err.message);
    }
  }, [token, pagada]);

  useEffect(() => {
    cargarTodas();
  }, [cargarTodas]);

  useEffect(() => {
    cargarFiltradas();
  }, [cargarFiltradas]);

  const pendientes = todas.filter((c) => !c.pagada);
  const porTipo = todas.reduce((acc, c) => {
    const key = c.tipo || "sin tipo";
    acc[key] = (acc[key] || 0) + Number(c.monto);
    return acc;
  }, {});

  return (
    <Layout titulo="Comisiones" subtitulo="Comisiones de apertura, inmobiliarias y referenciadores · Fase 3">
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === "resumen" && totalesGenerales && (
        <>
          <div className="kpi-grid">
            <div className="card kpi-card">
              <div className="kpi-label">Monto total</div>
              <div className="kpi-value">{moneda.format(totalesGenerales.monto_total)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Monto pendiente</div>
              <div className="kpi-value">{moneda.format(totalesGenerales.monto_pendiente)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Comisiones pendientes</div>
              <div className="kpi-value">{pendientes.length}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Por tipo</div>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(porTipo).map(([tipo, monto]) => (
                  <tr key={tipo}>
                    <td>{tipo}</td>
                    <td>{moneda.format(monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "calculo" && (
        <>
          <div className="card">
            <div className="filtros-row">
              <label>
                Estatus de pago
                <select value={pagada} onChange={(e) => setPagada(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="1">Pagadas</option>
                  <option value="0">Pendientes</option>
                </select>
              </label>
              <button onClick={cargarFiltradas}>Aplicar filtro</button>
            </div>
          </div>
          <TablaComisiones titulo={`Comisiones (${filtradas.length})`} comisiones={filtradas} />
        </>
      )}

      {tab === "pendientes" && (
        <TablaComisiones
          titulo={`Pagos pendientes (${pendientes.length})`}
          comisiones={pendientes}
          nota="Comisiones con pagada = 0, para seguimiento de pago."
        />
      )}

      {error && <div className="error-banner">{error}</div>}
    </Layout>
  );
}

function TablaComisiones({ titulo, comisiones, nota }) {
  return (
    <div className="card">
      <div className="card-title">{titulo}</div>
      {nota && <div className="upload-hint" style={{ marginBottom: 10 }}>{nota}</div>}
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Beneficiario</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {comisiones.map((c) => (
            <tr key={c.id}>
              <td>{c.fecha}</td>
              <td>{c.concepto}</td>
              <td>{c.beneficiario || "-"}</td>
              <td>{c.tipo || "-"}</td>
              <td>{moneda.format(c.monto)}</td>
              <td>
                <span className={`badge ${c.pagada ? "ok" : "warn"}`}>{c.pagada ? "Pagada" : "Pendiente"}</span>
              </td>
            </tr>
          ))}
          {comisiones.length === 0 && (
            <tr>
              <td colSpan={6} style={{ color: "#6B7684" }}>
                No hay comisiones con el filtro seleccionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
