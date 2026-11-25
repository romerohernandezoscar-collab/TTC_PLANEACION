import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", fase: 1 }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API TTC Capital (Fase 1) escuchando en http://localhost:${PORT}`);
});
