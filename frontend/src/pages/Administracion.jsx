import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Layout from "../components/Layout.jsx";
import Tabs from "../components/Tabs.jsx";

const fechaHora = new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" });

const TABS = [
  { id: "usuarios", label: "Usuarios" },
  { id: "roles", label: "Roles" },
  { id: "auditoria", label: "Auditoria" },
];

export default function Administracion() {
  const { token } = useAuth();
  const [tab, setTab] = useState("usuarios");

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(
    async (recurso, setter) => {
      setCargando(true);
      setError("");
      try {
        const res = await fetch(apiUrl(`/api/admin/${recurso}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error("No tienes permisos de administrador para ver esta seccion");
          throw new Error(`No se pudo cargar ${recurso}`);
        }
        const data = await res.json();
        setter(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (tab === "usuarios") cargar("usuarios", (d) => setUsuarios(d.usuarios || []));
    if (tab === "roles") cargar("roles", (d) => setRoles(d.roles || []));
    if (tab === "auditoria") cargar("auditoria", (d) => setEventos(d.eventos || []));
  }, [tab, cargar]);

  return (
    <Layout titulo="Administracion" subtitulo="Usuarios, roles y auditoria · visible solo para administradores">
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />
      {error && <div className="error-banner">{error}</div>}
      {cargando && <div>Cargando...</div>}

      {!cargando && !error && tab === "usuarios" && (
        <div className="card">
          <div className="card-title">Usuarios ({usuarios.length})</div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estatus</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>{u.rol}</td>
                  <td>
                    <span className={`badge ${u.activo ? "ok" : "bad"}`}>{u.activo ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td>{u.creado_en ? fechaHora.format(new Date(u.creado_en)) : "-"}</td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5}>Sin usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && !error && tab === "roles" && (
        <div className="card">
          <div className="card-title">Roles ({roles.length})</div>
          <table>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Descripcion</th>
                <th>Usuarios asignados</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>{r.nombre}</td>
                  <td>{r.descripcion || "-"}</td>
                  <td>{r.usuarios}</td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={3}>Sin roles registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && !error && tab === "auditoria" && (
        <div className="card">
          <div className="card-title">Ultimos eventos ({eventos.length})</div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Accion</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id}>
                  <td>{e.creado_en ? fechaHora.format(new Date(e.creado_en)) : "-"}</td>
                  <td>{e.usuario || "Sistema"}</td>
                  <td>{e.accion}</td>
                  <td>{e.detalle || "-"}</td>
                </tr>
              ))}
              {eventos.length === 0 && (
                <tr>
                  <td colSpan={4}>Sin eventos de auditoria registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
