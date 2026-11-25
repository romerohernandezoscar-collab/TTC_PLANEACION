import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tesoreria from "./pages/Tesoreria.jsx";
import Cartera from "./pages/Cartera.jsx";
import Inversionistas from "./pages/Inversionistas.jsx";
import Comisiones from "./pages/Comisiones.jsx";
import ControlJuridico from "./pages/ControlJuridico.jsx";
import { AuthProvider, useAuth } from "./auth.jsx";
import "./styles.css";

function Privada({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="login" element={<Login />} />
            <Route
              path="dashboard"
              element={
                <Privada>
                  <Dashboard />
                </Privada>
              }
            />
            <Route
              path="tesoreria"
              element={
                <Privada>
                  <Tesoreria />
                </Privada>
              }
            />
            <Route
              path="cartera"
              element={
                <Privada>
                  <Cartera />
                </Privada>
              }
            />
            <Route
              path="inversionistas"
              element={
                <Privada>
                  <Inversionistas />
                </Privada>
              }
            />
            <Route
              path="comisiones"
              element={
                <Privada>
                  <Comisiones />
                </Privada>
              }
            />
            <Route
              path="juridico"
              element={
                <Privada>
                  <ControlJuridico />
                </Privada>
              }
            />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
