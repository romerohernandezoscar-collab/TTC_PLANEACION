import "dotenv/config";
import express from "express";
import cors from "cors";
import { initSchema } from "./db/connection.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { tesoreriaRouter } from "./routes/tesoreria.js";
import { importacionesRouter } from "./routes/importaciones.js";
import { carteraRouter } from "./routes/cartera.js";
import { inversionistasRouter } from "./routes/inversionistas.js";
import { comisionesRouter } from "./routes/comisiones.js";
import { juridicoRouter } from "./routes/juridico.js";
import { adminRouter } from "./routes/admin.js";
import { buscarRouter } from "./routes/buscar.js";
import { alertasRouter } from "./routes/alertas.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", fase: 3, db: "postgres" }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/tesoreria", tesoreriaRouter);
app.use("/api/importaciones", importacionesRouter);
app.use("/api/cartera", carteraRouter);
app.use("/api/inversionistas", inversionistasRouter);
app.use("/api/comisiones", comisionesRouter);
app.use("/api/juridico", juridicoRouter);
app.use("/api/admin", adminRouter);
app.use("/api/buscar", buscarRouter);
app.use("/api/alertas", alertasRouter);

// Manejador de errores generico: las rutas ahora son asincronas (Postgres)
// y cualquier error de consulta cae aqui via next(err) en vez de tronar
// el proceso.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;

// El esquema se asegura (CREATE TABLE IF NOT EXISTS) al arrancar, antes de
// aceptar conexiones, para no depender de correr "npm run seed" a mano en
// cada ambiente nuevo.
initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API TTC Capital (Fase 3) escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo inicializar el esquema de la base de datos:", err);
    process.exit(1);
  });
