import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/connection.js";
import { firmarToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { correo, password } = req.body || {};
  if (!correo || !password) {
    return res.status(400).json({ error: "correo y password son requeridos" });
  }

  const usuario = db
    .prepare(
      `SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, r.nombre AS rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id
       WHERE u.correo = ?`
    )
    .get(correo);

  if (!usuario || !usuario.activo || !bcrypt.compareSync(password, usuario.password_hash)) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const token = firmarToken(usuario);
  db.prepare("INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, 'login', ?)").run(
    usuario.id,
    `Inicio de sesion desde API`
  );

  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
  });
});
