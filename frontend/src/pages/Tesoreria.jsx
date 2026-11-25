import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../apiBase";
import Sidebar from "../components/Sidebar.jsx";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function Tesoreria() {
  const { token } = useAuth();
  const [macrocategorias, setMacrocategorias] = useState([]);
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", macrocategoria_id: "" });
  const [movimientos, setMovimientos] = useState([]);
  const [totales, setTotales] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [errorImportacion, setErrorImportacion] = useState("");
  const inputArchivoRef = useRef(null);

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.set("desde", filtros.desde);
      if (filtros.hasta) params.set("hasta", filtros.hasta);
      if (filtros.macrocategoria_id) params.set("macrocategoria_id", filtros.macrocategoria_id);

      const res = await fetch(apiUrl(`/api/tesoreria/movimientos?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar los movimientos");
      const data = await res.json();
      setMovimientos(data.movimientos);
      setTotales(data.totales);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [token, filtros]);

  useEffect(() => {
    fetch(apiUrl("/api/tesoreria/macrocategorias"), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setMacrocategorias(data.macrocategorias || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    cargarMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function actualizarFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  async function subirArchivo() {
    if (!archivo) return;
    setSubiendo(true);
    setErrorImportacion("");
    setResultadoImportacion(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await fetch(apiUrl("/api/importaciones"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo procesar el archivo");
      }
      setResultadoImportacion(data);
      setArchivo(null);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
      cargarMovimientos();
    } catch (err) {
      setErrorImportacion(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <div className="header-row">
          <div>
            <div className="page-title">Tesoreria</div>
            <div className="page-subtitle">Movimientos de caja e importacion de Excel · Fase 2</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Importar archivo de flujo de caja</div>
          <div className="upload-row">
            <input
              ref={inputArchivoRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            />
            <button onClick={subirArchivo} disabled={!archivo || subiendo}>
              {subiendo ? "Procesando..." : "Subir e importar"}
            </button>
          </div>
          <div className="upload-hint">
            Columnas esperadas: Fecha, Concepto, Macrocategoria, Cargo, Abono. Las filas con datos invalidos o
            macrocategorias que no existan en el catalogo se rechazan y se reportan, sin detener la carga del resto.
          </div>

          {errorImportacion && <div className="error-banner" style={{ marginTop: 10 }}>{errorImportacion}</div>}

          {resultadoImportacion && (
            <div className="resultado-importacion">
              <div className="success-banner">
                Importacion #{resultadoImportacion.importacion_id}: {resultadoImportacion.registros_cargados}{" "}
                registro(s) cargado(s), {resultadoImportacion.registros_rechazados} rechazado(s).
              </div>
              {resultadoImportacion.errores.length > 0 && (
                <ul className="errores-lista">
                  {resultadoImportacion.errores.map((e, i) => (
                    <li key={i}>
                      Fila {e.fila}: {e.motivo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Filtros</div>
          <div className="filtros-row">
            <label>
              Desde
              <input type="date" value={filtros.desde} onChange={(e) => actualizarFiltro("desde", e.target.value)} />
            </label>
            <label>
              Hasta
              <input type="date" value={filtros.hasta} onChange={(e) => actualizarFiltro("hasta", e.target.value)} />
            </label>
            <label>
              Macrocategoria
              <select
                value={filtros.macrocategoria_id}
                onChange={(e) => actualizarFiltro("macrocategoria_id", e.target.value)}
              >
                <option value="">Todas</option>
                {macrocategorias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={cargarMovimientos} disabled={cargando}>
              {cargando ? "Cargando..." : "Aplicar filtros"}
            </button>
          </div>

          {totales && (
            <div className="totales-row">
              <div>
                <div className="mini-label">Abonos</div>
                <div className="mini-value">{moneda.format(totales.abonos)}</div>
              </div>
              <div>
                <div className="mini-label">Cargos</div>
                <div className="mini-value">{moneda.format(totales.cargos)}</div>
              </div>
              <div>
                <div className="mini-label">Neto</div>
                <div className="mini-value">{moneda.format(totales.neto)}</div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <div className="card-title">Movimientos ({movimientos.length})</div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Macrocategoria</th>
                <th>Cargo</th>
                <th>Abono</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{m.fecha}</td>
                  <td>{m.concepto}</td>
                  <td>{m.macrocategoria}</td>
                  <td>{m.cargo ? moneda.format(m.cargo) : "-"}</td>
                  <td>{m.abono ? moneda.format(m.abono) : "-"}</td>
                  <td>
                    <span className={`badge ${m.conciliado ? "ok" : "warn"}`}>
                      {m.conciliado ? "Conciliado" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))}
              {movimientos.length === 0 && !cargando && (
                <tr>
                  <td colSpan={6} style={{ color: "#6B7684" }}>
                    No hay movimientos con los filtros seleccionados.
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
