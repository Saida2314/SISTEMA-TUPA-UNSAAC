const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../config/db");
require("dotenv").config();

async function login(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: "Correo y contraseña son obligatorios"
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("correo", sql.NVarChar, correo)
      .query(`
        SELECT 
          u.id_usuario,
          u.nombres,
          u.apellidos,
          u.dni,
          u.correo,
          u.password_hash,
          u.estado,
          r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.correo = @correo
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    const usuario = result.recordset[0];

    if (usuario.estado !== "ACTIVO") {
      return res.status(403).json({
        mensaje: "La cuenta no está activa"
      });
    }

    const passwordCorrecto = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES
      }
    );

    await pool.request()
      .input("id_usuario", sql.Int, usuario.id_usuario)
      .query(`
        UPDATE usuarios
        SET ultimo_acceso = SYSDATETIME()
        WHERE id_usuario = @id_usuario
      `);

    return res.json({
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al iniciar sesión"
    });
  }
}

module.exports = {
  login
};