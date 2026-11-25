# Plataforma Financiera TTC Capital — Fase 2

Arranque real de desarrollo: arquitectura, autenticación, dashboard,
tesorería e importación de Excel, según la sección 10 (plan de
desarrollo por fases) de la propuesta conceptual. **Iniciativa personal
complementaria** a la Estadía Profesional, no un entregable académico
comprometido.

Usa únicamente datos ficticios (criterio 11 de la propuesta). Nada de
este repositorio toca información real de TTC Capital.

## Qué incluye esta Fase 2 (además de la Fase 1)

- Importación real de archivos Excel (`.xlsx`/`.xls`) con flujo de caja:
  validación fila por fila, reporte de filas rechazadas con motivo, y
  trazabilidad completa (tabla `importacion` + `auditoria`).
- Pantalla de **Tesorería**: filtros por fecha y macrocategoría, totales
  (abonos/cargos/neto) y el formulario de carga de Excel.
- Endpoints nuevos: `POST /api/importaciones`, `GET /api/importaciones`
  (historial), `GET /api/tesoreria/movimientos`,
  `GET /api/tesoreria/macrocategorias`.

### Formato esperado del Excel

Primera hoja, primera fila = encabezados (no sensible a mayúsculas ni
acentos):

| Fecha | Concepto | Macrocategoria | Cargo | Abono |
| --- | --- | --- | --- | --- |
| 2026-11-23 | Pago proveedor | Operacion | 3200 | 0 |

- La **Macrocategoria** debe existir ya en el catálogo (no se crean
  categorías nuevas automáticamente, para mantener control).
- Cada fila debe traer **Cargo** o **Abono** distinto de cero.
- Las filas inválidas se rechazan y se reportan con número de fila y
  motivo; el resto de la carga continúa sin interrumpirse.

## Qué incluye la Fase 1 (base)

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

## Desplegado (Render)

- Backend: `https://ttc-capital-backend.onrender.com`
- Frontend: `https://ttc-capital-frontend.onrender.com`

El plan gratuito de Render no tiene disco persistente: si el backend se
redespliega o reinicia, la base SQLite vuelve al estado del seed. Para
producción real habría que mover a un plan con disco persistente (o a
PostgreSQL, ver más abajo) antes de cargar datos reales.

## Qué falta para pasar a la Fase 3

- [ ] Pantallas reales de los demás módulos (cartera, inversionistas,
      comisiones, control jurídico — hoy solo están como bocetos en el
      prototipo visual).
- [ ] Permitir conciliar movimientos desde la pantalla de Tesorería
      (hoy `conciliado` solo se actualiza manualmente en la base).
- [ ] Bitácora de auditoría visible en una pantalla de administración
      (la tabla `auditoria` ya existe y ya registra logins e
      importaciones).
- [ ] Endurecer la matriz de roles y permisos (`requireRol`) conforme se
      agreguen endpoints de escritura en las fases siguientes —hoy
      cualquier usuario autenticado puede importar.
- [ ] Mover de SQLite a PostgreSQL y a un plan con disco persistente
      cuando el proyecto salga de la fase de prototipo.

## Estructura

```
backend/
  src/
    db/
      schema.sql       # modelo de datos (sección 6 de la propuesta)
      connection.js    # conexión SQLite + aplica el esquema al arrancar
      seed.js          # datos ficticios de arranque
    importacion/
      parseExcel.js    # parseo y validación de archivos Excel
    middleware/auth.js
    routes/
      auth.js          # POST /api/auth/login
      dashboard.js     # GET /api/dashboard (requiere token)
      tesoreria.js      # GET /api/tesoreria/movimientos, /macrocategorias
      importaciones.js  # POST/GET /api/importaciones
    server.js
frontend/
  src/
    components/Sidebar.jsx
    pages/Login.jsx
    pages/Dashboard.jsx
    pages/Tesoreria.jsx
    auth.jsx            # contexto de sesión (token en localStorage)
    apiBase.js           # URL base de la API (dev: proxy, prod: VITE_API_URL)
    styles.css            # misma paleta del prototipo visual
```
