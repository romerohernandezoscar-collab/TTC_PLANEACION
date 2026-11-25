import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("demo@ttccapital.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(correo, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-title">TTC Capital</div>
        <div className="login-subtitle">Plataforma financiera · Fase 1</div>
        <label>
          Correo
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} type="email" required />
        </label>
        <label>
          Contrasena
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={cargando}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
        <div className="login-hint">Demo: demo@ttccapital.test / DemoTTC2026!</div>
      </form>
    </div>
  );
}
