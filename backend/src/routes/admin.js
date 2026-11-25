import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth, requireRol } from "../middleware/auth.js";

export const adminRouter = Router();

// Administracion (seccion 8 de la propuesta): usuarios, roles y auditoria.
// Visible solo para el rol administrador (ver Sidebar/Layout en el frontend,
// que ademas oculta el enlace; esto es la verificacion real del lado del
// servidor).
adminRouter.use(requireAuth, requireRol("administrador"));

adminRouter.get("/usuarios", async (_req, res, next) => {
  try {
    const usuarios = await db.all(
      `SELECT u.id, u.nombre, u.correo, u.activo, u.creado_en, r.nombre AS rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id
       ORDER BY u.nombre`
    );
    res.json({ usuarios });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/roles", async (_req, res, next) => {
  try {
    const roles = await db.all(
      `SELECT r.id, r.nombre, r.descripcion, COUNT(u.id) AS usuarios
       FROM rol r LEFT JOIN usuario u ON u.rol_id = r.id
       GROUP BY r.id, r.nombre, r.descripcion ORDER BY r.nombre`
    );
    res.json({ roles: roles.map((r) => ({ ...r, usuarios: Number(r.usuarios) })) });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/auditoria", async (_req, res, next) => {
  try {
    const eventos = await db.all(
      `SELECT a.id, a.accion, a.detalle, a.creado_en, u.nombre AS usuario
       FROM auditoria a LEFT JOIN usuario u ON u.id = a.usuario_id
       ORDER BY a.creado_en DESC LIMIT 200`
    );
    res.json({ eventos });
  } catch (err) {
    next(err);
  }
});
