import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";
import Tabs from "../components/Tabs.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const badgePorEstatus = { activo: "ok", retirado: "warn" };

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "catalogo", label: "Catalogo" },
  { id: "movimientos", label: "Movimientos" },
];

export default function Inversionistas() {
  const { token } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [inversionistas, setInversionistas] = useState([]);
  const [totales, setTotales] = useState(null);
  const [estatus, setEstatus] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (estatus) params.set("estatus", estatus);
      const res = await fetch(apiUrl(`/api/inversionistas?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar los inversionistas");
      const data = await res.json();
      setInversionistas(data.inversionistas);
      setTotales(data.totales);
    } catch (err) {
      setError(err.message);
    }
  }, [token, estatus]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const activos = inversionistas.filter((i) => i.estatus === "activo").length;
  const retirados = inversionistas.filter((i) => i.estatus === "retirado").length;

  return (
    <Layout titulo="Inversionistas" subtitulo="Capital aportado por inversionistas · Fase 3">
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === "resumen" && (
        <>
          {totales && (
            <div className="kpi-grid">
              <div className="card kpi-card">
                <div className="kpi-label">Capital aportado total</div>
                <div className="kpi-value">{moneda.format(totales.capital_aportado)}</div>
              </div>
              <div className="card kpi-card">
                <div className="kpi-label">Inversionistas activos</div>
                <div className="kpi-value">{activos}</div>
              </div>
              <div className="card kpi-card">
                <div className="kpi-label">Retirados</div>
                <div className="kpi-value">{retirados}</div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "catalogo" && (
        <>
          <div className="card">
            <div className="filtros-row">
              <label>
                Estatus
                <select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="retirado">Retirado</option>
                </select>
              </label>
              <button onClick={cargar}>Aplicar filtro</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Inversionistas ({inversionistas.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Capital aportado</th>
                  <th>Tasa rendimiento</th>
                  <th>Ingreso</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {inversionistas.map((i) => (
                  <tr key={i.id}>
                    <td>{i.nombre}</td>
                    <td>{moneda.format(i.capital_aportado)}</td>
                    <td>{i.tasa_rendimiento != null ? `${i.tasa_rendimiento}%` : "-"}</td>
                    <td>{i.fecha_ingreso}</td>
                    <td>
                      <span className={`badge ${badgePorEstatus[i.estatus] || "warn"}`}>{i.estatus}</span>
                    </td>
                  </tr>
                ))}
                {inversionistas.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: "#6B7684" }}>
                      No hay inversionistas con el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "movimientos" && (
        <div className="card">
          <div className="card-title">Movimientos de inversionistas</div>
          <div className="upload-hint">
            Proximamente. El modelo de datos actual guarda el capital aportado por inversionista, pero no un historial
            de aportaciones y retiros individuales; eso requiere una tabla propia (movimiento_inversionista) que aun
            no existe en el esquema. Los movimientos de pago de capital/intereses a inversionistas ya se ven reflejados
            de forma agregada en el Dashboard y en Tesoreria, bajo las macrocategorias 8, 9 y 10.
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
    </Layout>
  );
}
