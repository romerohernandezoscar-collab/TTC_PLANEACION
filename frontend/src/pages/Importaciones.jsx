import React, { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";

export default function Importaciones() {
  const { token } = useAuth();
  const [importaciones, setImportaciones] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/importaciones"), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el historial de importaciones");
        return res.json();
      })
      .then((data) => setImportaciones(data.importaciones || []))
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <Layout titulo="Importaciones" subtitulo="Historial de cargas de Excel y errores · transversal">
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        <div className="card-title">Historial ({importaciones.length})</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Archivo</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Cargados</th>
              <th>Rechazados</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {importaciones.map((i) => (
              <tr key={i.id}>
                <td>#{i.id}</td>
                <td>{i.archivo}</td>
                <td>{i.usuario || "-"}</td>
                <td>{new Date(i.fecha).toLocaleString("es-MX")}</td>
                <td>{i.registros_cargados}</td>
                <td>
                  {i.registros_rechazados > 0 ? (
                    <span className="badge bad">{i.registros_rechazados}</span>
                  ) : (
                    i.registros_rechazados
                  )}
                </td>
                <td>{i.notas || "-"}</td>
              </tr>
            ))}
            {importaciones.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: "#6B7684" }}>
                  Todavia no hay importaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
