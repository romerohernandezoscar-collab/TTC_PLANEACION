import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "./Sidebar.jsx";

const severidadClase = { alta: "bad", media: "warn", baja: "info" };

function BuscadorGlobal() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResultados([]);
      return;
    }
    const controlador = new AbortController();
    const temporizador = setTimeout(() => {
      fetch(apiUrl(`/api/buscar?q=${encodeURIComponent(q)}`), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controlador.signal,
      })
        .then((res) => res.json())
        .then((data) => setResultados(data.resultados || []))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [q, token]);

  useEffect(() => {
    function cerrarSiFuera(e) {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarSiFuera);
    return () => document.removeEventListener("mousedown", cerrarSiFuera);
  }, []);

  return (
    <div className="buscador-global" ref={cajaRef}>
      <input
        type="search"
        placeholder="Buscar por folio, acreditado o inversionista..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && q.trim().length >= 2 && (
        <div className="buscador-dropdown">
          {resultados.length === 0 && <div className="buscador-vacio">Sin resultados</div>}
          {resultados.map((r) => (
            <div
              key={`${r.tipo}-${r.id}`}
              className="buscador-item"
              onClick={() => {
                navigate(r.ruta);
                setAbierto(false);
                setQ("");
              }}
            >
              <span className="buscador-titulo">{r.titulo}</span>
              <span className="buscador-modulo">{r.modulo}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CentroAlertas() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef(null);

  useEffect(() => {
    fetch(apiUrl("/api/alertas"), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setAlertas(data.alertas || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    function cerrarSiFuera(e) {
      if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarSiFuera);
    return () => document.removeEventListener("mousedown", cerrarSiFuera);
  }, []);

  return (
    <div className="alertas-centro" ref={cajaRef}>
      <button className="alertas-boton" onClick={() => setAbierto((a) => !a)}>
        Alertas
        {alertas.length > 0 && <span className="alertas-contador">{alertas.length}</span>}
      </button>
      {abierto && (
        <div className="alertas-dropdown">
          {alertas.length === 0 && <div className="buscador-vacio">Sin alertas activas</div>}
          {alertas.map((a, i) => (
            <div
              key={i}
              className="alerta-item"
              onClick={() => {
                navigate(a.ruta);
                setAbierto(false);
              }}
            >
              <span className={`badge ${severidadClase[a.severidad] || "info"}`}>{a.modulo}</span>
              <span className="alerta-mensaje">{a.mensaje}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ titulo, subtitulo, children }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="topbar">
          <BuscadorGlobal />
          <CentroAlertas />
        </div>
        {(titulo || subtitulo) && (
          <div className="header-row">
            <div>
              {titulo && <div className="page-title">{titulo}</div>}
              {subtitulo && <div className="page-subtitle">{subtitulo}</div>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
