import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "../components/Sidebar.jsx";

const badgePorEstatus = { abierto: "warn", en_proceso: "info", cerrado: "ok" };

export default function ControlJuridico() {
  const { token } = useAuth();
  const [tramites, setTramites] = useState([]);
  const [estatus, setEstatus] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (estatus) params.set("estatus", estatus);
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
    cargar();
  }, [cargar]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="header-row">
          <div>
            <div className="page-title">Control juridico</div>
            <div className="page-subtitle">Escrituracion, cobranza judicial y contratos · Fase 3</div>
          </div>
        </div>

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
            <button onClick={cargar}>Aplicar filtro</button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <div className="card-title">Tramites ({tramites.length})</div>
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
      </main>
    </div>
  );
}
