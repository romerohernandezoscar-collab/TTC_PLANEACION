import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { tesoreriaRouter } from "./routes/tesoreria.js";
import { importacionesRouter } from "./routes/importaciones.js";
import { carteraRouter } from "./routes/cartera.js";
import { inversionistasRouter } from "./routes/inversionistas.js";
import { comisionesRouter } from "./routes/comisiones.js";
import { juridicoRouter } from "./routes/juridico.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", fase: 3 }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/tesoreria", tesoreriaRouter);
app.use("/api/importaciones", importacionesRouter);
app.use("/api/cartera", carteraRouter);
app.use("/api/inversionistas", inversionistasRouter);
app.use("/api/comisiones", comisionesRouter);
app.use("/api/juridico", juridicoRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API TTC Capital (Fase 3) escuchando en http://localhost:${PORT}`);
});
