# Plataforma Financiera TTC Capital — Fase 3

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

- Backend (`/backend`): API en Node.js/Express, base de datos
  PostgreSQL (Neon, plan gratuito con almacenamiento persistente —
  ver `schema.sql`), autenticación con JWT y matriz de roles básica.
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
cp .env.example .env     # ajusta JWT_SECRET y DATABASE_URL (Postgres)
npm install
npm run seed              # crea las tablas y las llena con datos ficticios
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

**Actualización (Fase 3.1):** la base de datos ya no vive en el disco
del servicio de Render (que en el plan gratuito no es persistente y se
perdía en cada redeploy). Ahora el backend se conecta a **PostgreSQL
en Neon** (plan gratuito, con almacenamiento persistente real) vía la
variable de entorno `DATABASE_URL`, configurada en el servicio de
Render. Esto significa que un redeploy o reinicio del backend **ya no
borra los datos** — incluidos los datos reales de Tesorería cargados
por el usuario, una vez autorizados.

El Static Site del frontend tiene una regla de **Rewrite** configurada
en Render (`/* → /index.html`), necesaria para que las rutas del SPA
(`/dashboard`, `/tesoreria`, etc.) funcionen al entrar directo o al
refrescar la página, no solo navegando desde dentro de la app.

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
- [x] Mover de SQLite a PostgreSQL con almacenamiento persistente
      (Neon) — resuelto en Fase 3.1.

## Estructura

```
backend/
  src/
    db/
      schema.sql       # modelo de datos (sección 6 de la propuesta), Postgres
      connection.js    # conexión a Postgres (Neon) + aplica el esquema al arrancar
      seed.js          # datos ficticios de arranque
    importacion/
      parseExcel.js    # parseo y validación de archivos Excel
    middleware/auth.js
    routes/
      auth.js          # POST /api/auth/login
      dashboard.js     # GET /api/dashboard (requiere token)
      tesoreria.js      # GET /api/tesoreria/movimientos, /macrocategorias
      importaciones.js  # POST/GET /api/importaciones
      cartera.js, inversionistas.js, comisiones.js, juridico.js  # Fase 3
    server.js
frontend/
  src/
    components/Sidebar.jsx
    pages/Login.jsx
    pages/Dashboard.jsx
    pages/Tesoreria.jsx
    pages/Cartera.jsx, Inversionistas.jsx, Comisiones.jsx, ControlJuridico.jsx  # Fase 3
    auth.jsx            # contexto de sesión (token en localStorage)
    apiBase.js           # URL base de la API (dev: proxy, prod: VITE_API_URL)
    styles.css            # misma paleta del prototipo visual
```
