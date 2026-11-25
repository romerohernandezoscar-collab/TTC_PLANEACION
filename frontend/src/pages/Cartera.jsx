import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "../components/Sidebar.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const badgePorEstatus = { vigente: "ok", atrasado: "bad", liquidado: "warn" };

export default function Cartera() {
  const { token } = useAuth();
  const [creditos, setCreditos] = useState([]);
  const [totales, setTotales] = useState(null);
  const [estatus, setEstatus] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (estatus) params.set("estatus", estatus);
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
  }, [token, estatus]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="header-row">
          <div>
            <div className="page-title">Cartera de creditos</div>
            <div className="page-subtitle">Creditos otorgados a clientes · Fase 3</div>
          </div>
        </div>

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
            <button onClick={cargar}>Aplicar filtro</button>
          </div>
          {totales && (
            <div className="totales-row">
              <div>
                <div className="mini-label">Monto original</div>
                <div className="mini-value">{moneda.format(totales.monto_original)}</div>
              </div>
              <div>
                <div className="mini-label">Saldo actual</div>
                <div className="mini-value">{moneda.format(totales.saldo_actual)}</div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <div className="card-title">Creditos ({creditos.length})</div>
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
      </main>
    </div>
  );
}
