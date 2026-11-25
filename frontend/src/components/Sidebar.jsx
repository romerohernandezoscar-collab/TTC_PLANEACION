import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const modulos = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Tesoreria", to: "/tesoreria" },
  { label: "Planeacion financiera", to: "/planeacion" },
  { label: "Cartera", to: "/cartera" },
  { label: "Inversionistas", to: "/inversionistas" },
  { label: "Comisiones", to: "/comisiones" },
  { label: "Control juridico", to: "/juridico" },
  { label: "Importaciones", to: "/importaciones" },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const esAdministrador = usuario?.rol === "administrador";

  return (
    <aside className="sidebar">
      <div className="brand">TTC Capital</div>
      {modulos.map((m) => {
        const activo = location.pathname === m.to;
        return (
          <Link key={m.label} to={m.to} className={`navitem ${activo ? "active" : ""}`}>
            {m.label}
          </Link>
        );
      })}
      {esAdministrador && (
        <Link to="/administracion" className={`navitem ${location.pathname === "/administracion" ? "active" : ""}`}>
          Administracion
        </Link>
      )}
      <div className="spacer" />
      <div className="navitem" onClick={logout} style={{ cursor: "pointer" }}>
        Cerrar sesion ({usuario?.nombre})
      </div>
    </aside>
  );
}
