import React from "react";

// Subpestanas dentro de un modulo (resumen / movimientos / conciliacion,
// etc.), segun la arquitectura de informacion definida para la plataforma.
export default function Tabs({ tabs, activa, onChange }) {
  return (
    <div className="tabs-row">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${activa === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
