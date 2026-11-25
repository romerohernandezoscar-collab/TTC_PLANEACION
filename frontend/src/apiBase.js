// Base URL para llamadas a la API.
// En desarrollo (npm run dev) se deja vacio y Vite usa el proxy "/api" -> localhost:4000.
// En produccion (build estatico en Render) se debe definir VITE_API_URL con la URL
// publica del backend, por ejemplo: https://ttc-capital-backend.onrender.com
const base = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
  return `${base}${path}`;
}
