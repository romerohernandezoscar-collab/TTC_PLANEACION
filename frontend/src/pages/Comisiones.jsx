import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "../components/Sidebar.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function Comisiones() {
  const { token } = useAuth();
  const [comisiones, setComisiones] = useState([]);
  const [totales, setTotales] = useState(null);
  const [pagada, setPagada] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (pagada !== "") params.set("pagada", pagada);
      const res = await fetch(apiUrl(`/api/comisiones?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar las comisiones");
      const data = await res.json();
      setComisiones(data.comisiones);
      setTotales(data.totales);
    } catch (err) {
      setError(err.message);
    }
  }, [token, pagada]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="header-row">
          <div>
            <div className="page-title">Comisiones</div>
            <div className="page-subtitle">Comisiones de apertura, inmobiliarias y referenciadores · Fase 3</div>
          </div>
        </div>

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
            <button onClick={cargar}>Aplicar filtro</button>
          </div>
          {totales && (
            <div className="totales-row">
              <div>
                <div className="mini-label">Monto total</div>
                <div className="mini-value">{moneda.format(totales.monto_total)}</div>
              </div>
              <div>
                <div className="mini-label">Monto pendiente</div>
                <div className="mini-value">{moneda.format(totales.monto_pendiente)}</div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <div className="card-title">Comisiones ({comisiones.length})</div>
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
      </main>
    </div>
  );
}
