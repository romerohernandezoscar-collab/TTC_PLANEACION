import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("ttc_token"));
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem("ttc_usuario");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (correo, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "No se pudo iniciar sesion");
    }
    const data = await res.json();
    localStorage.setItem("ttc_token", data.token);
    localStorage.setItem("ttc_usuario", JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ttc_token");
    localStorage.removeItem("ttc_usuario");
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
