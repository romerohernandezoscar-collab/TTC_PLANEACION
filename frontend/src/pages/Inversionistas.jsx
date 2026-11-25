import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "../components/Sidebar.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const badgePorEstatus = { activo: "ok", retirado: "warn" };

export default function Inversionistas() {
  const { token } = useAuth();
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

  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="header-row">
          <div>
            <div className="page-title">Inversionistas</div>
            <div className="page-subtitle">Capital aportado por inversionistas · Fase 3</div>
          </div>
        </div>

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
          {totales && (
            <div className="totales-row">
              <div>
                <div className="mini-label">Capital aportado</div>
                <div className="mini-value">{moneda.format(totales.capital_aportado)}</div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

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
      </main>
    </div>
  );
}
