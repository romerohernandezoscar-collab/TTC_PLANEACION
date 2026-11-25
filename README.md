# Plataforma Financiera TTC Capital — Fase 1

Arranque real de desarrollo: arquitectura, autenticación y dashboard,
según la sección 10 (plan de desarrollo por fases) de la propuesta
conceptual. **Iniciativa personal complementaria** a la Estadía
Profesional, no un entregable académico comprometido.

Usa únicamente datos ficticios (criterio 11 de la propuesta). Nada de
este repositorio toca información real de TTC Capital.

## Qué incluye esta Fase 1

- Backend (`/backend`): API en Node.js/Express, base de datos SQLite
  (migrable a PostgreSQL sin cambiar el modelo — ver `schema.sql`),
  autenticación con JWT y matriz de roles básica.
- Frontend (`/frontend`): React + Vite, pantalla de login y dashboard
  ejecutivo que replica el prototipo visual (KPIs, movimientos
  recientes, desglose por macrocategoría), consumiendo la API real.
- Datos de arranque (`npm run seed`): dos usuarios demo y un puñado de
  movimientos de caja ficticios, suficientes para ver el dashboard con
  cifras reales en pantalla.

## Cómo correrlo

Requiere Node.js 18 o superior.

```bash
# 1. Backend
cd backend
cp .env.example .env     # ajusta JWT_SECRET si quieres
npm install
npm run seed              # crea la base de datos y la llena con datos ficticios
npm start                 # API en http://localhost:4000

# 2. Frontend (en otra terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Abre `http://localhost:5173` e inicia sesión con:

| Correo | Contraseña | Rol |
| --- | --- | --- |
| demo@ttccapital.test | DemoTTC2026! | dirección |
| admin@ttccapital.test | AdminTTC2026! | administrador |

## Qué falta para cerrar la Fase 1 y pasar a la Fase 2

- [ ] Pantallas reales de los demás módulos (hoy solo están como bocetos
      en el prototipo visual).
- [ ] Importación real de archivos Excel (Fase 2): hoy los datos entran
      solo vía `seed.js`.
- [ ] Bitácora de auditoría visible en una pantalla de administración
      (la tabla `auditoria` ya existe y ya registra los logins).
- [ ] Endurecer la matriz de roles y permisos (`requireRol`) conforme se
      agreguen endpoints de escritura en las fases siguientes.
- [ ] Mover de SQLite a PostgreSQL cuando el proyecto salga de la
      laptop de desarrollo.

## Estructura

```
backend/
  src/
    db/
      schema.sql     # modelo de datos (sección 6 de la propuesta)
      connection.js  # conexión SQLite + aplica el esquema al arrancar
      seed.js        # datos ficticios de arranque
    middleware/auth.js
    routes/
      auth.js        # POST /api/auth/login
      dashboard.js    # GET /api/dashboard (requiere token)
    server.js
frontend/
  src/
    pages/Login.jsx
    pages/Dashboard.jsx
    auth.jsx          # contexto de sesión (token en localStorage)
    styles.css         # misma paleta del prototipo visual
```
