import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const modulos = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Tesoreria", to: "/tesoreria" },
  { label: "Planeacion financiera", to: null },
  { label: "Cartera", to: "/cartera" },
  { label: "Inversionistas", to: "/inversionistas" },
  { label: "Comisiones", to: "/comisiones" },
  { label: "Control juridico", to: "/juridico" },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="brand">TTC Capital</div>
      {modulos.map((m) => {
        const activo = m.to && location.pathname === m.to;
        const disponible = Boolean(m.to);
        return disponible ? (
          <Link key={m.label} to={m.to} className={`navitem ${activo ? "active" : ""}`}>
            {m.label}
          </Link>
        ) : (
          <div key={m.label} className="navitem navitem-disabled" title="Disponible en una fase posterior">
            {m.label}
          </div>
        );
      })}
      <div className="spacer" />
      <div className="navitem" onClick={logout} style={{ cursor: "pointer" }}>
        Cerrar sesion ({usuario?.nombre})
      </div>
    </aside>
  );
}
