const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { poolPromise, sql } = require("../config/db");
require("dotenv").config();

function validarCorreoInstitucional(correo) {
  return /^[a-zA-Z0-9._%+-]+@unsaac\.edu\.pe$/.test(correo);
}

function validarDni(dni) {
  return /^[0-9]{8}$/.test(dni);
}

function validarPasswordSegura(password) {
  /*
    Mínimo 8 caracteres,
    al menos una mayúscula,
    al menos una minúscula,
    al menos un número,
    al menos un símbolo.
  */
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

async function login(req, res) {
  try {
    const { correo, password, rolSeleccionado } = req.body;

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
    if (rolSeleccionado === "REVISOR" && usuario.rol !== "REVISOR") {
      return res.status(403).json({
      mensaje: "El correo ingresado no corresponde al rol Revisor. Seleccione el rol correcto e intente nuevamente."
      });
    }

    if (
      rolSeleccionado === "ADMIN" &&
      usuario.rol !== "ADMIN_GENERAL" &&
      usuario.rol !== "ADMIN_AREA"
      ) {
      return res.status(403).json({
      mensaje: "El correo ingresado no corresponde al rol Administrador. Seleccione el rol correcto e intente nuevamente."
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
        dni: usuario.dni,
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

async function registrarUsuario(req, res) {
  try {
    const {
      nombres,
      apellidos,
      dni,
      correo,
      password
    } = req.body;

    if (!nombres || !apellidos || !dni || !correo || !password) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios"
      });
    }

    if (nombres.trim().length < 2) {
      return res.status(400).json({
        mensaje: "El nombre debe tener al menos 2 caracteres"
      });
    }

    if (apellidos.trim().length < 2) {
      return res.status(400).json({
        mensaje: "El apellido debe tener al menos 2 caracteres"
      });
    }

    if (!validarDni(dni)) {
      return res.status(400).json({
        mensaje: "El DNI debe tener exactamente 8 dígitos numéricos"
      });
    }

    if (!validarCorreoInstitucional(correo)) {
      return res.status(400).json({
        mensaje: "Debe usar un correo institucional válido: usuario@unsaac.edu.pe"
      });
    }

    if (!validarPasswordSegura(password)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo"
      });
    }

    const pool = await poolPromise;

    const existe = await pool.request()
      .input("correo", sql.NVarChar, correo.trim().toLowerCase())
      .input("dni", sql.NVarChar, dni.trim())
      .query(`
        SELECT id_usuario
        FROM usuarios
        WHERE correo = @correo OR dni = @dni
      `);

    if (existe.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe un usuario con ese correo o DNI"
      });
    }

    const rolResult = await pool.request()
      .query(`
        SELECT id_rol
        FROM roles
        WHERE nombre = 'USUARIO'
      `);

    if (rolResult.recordset.length === 0) {
      return res.status(500).json({
        mensaje: "No existe el rol USUARIO en la base de datos"
      });
    }

    const idRolUsuario = rolResult.recordset[0].id_rol;
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input("id_rol", sql.Int, idRolUsuario)
      .input("nombres", sql.NVarChar, nombres.trim())
      .input("apellidos", sql.NVarChar, apellidos.trim())
      .input("dni", sql.NVarChar, dni.trim())
      .input("correo", sql.NVarChar, correo.trim().toLowerCase())
      .input("password_hash", sql.NVarChar, passwordHash)
      .query(`
        INSERT INTO usuarios (
          id_rol,
          nombres,
          apellidos,
          dni,
          correo,
          password_hash,
          estado
        )
        VALUES (
          @id_rol,
          @nombres,
          @apellidos,
          @dni,
          @correo,
          @password_hash,
          'ACTIVO'
        )
      `);

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al registrar usuario"
    });
  }
}

async function solicitarRecuperacionPassword(req, res) {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        mensaje: "El correo es obligatorio"
      });
    }

    const mensajeGenerico = "Si el correo está registrado, se enviará un enlace de recuperación.";

    const pool = await poolPromise;

    const usuarioResult = await pool.request()
      .input("correo", sql.NVarChar, correo.trim().toLowerCase())
      .query(`
        SELECT id_usuario, correo, estado
        FROM usuarios
        WHERE correo = @correo
      `);

    /*
      Importante:
      No revelamos si el correo existe o no.
      Esto evita que alguien pruebe correos para saber cuáles están registrados.
    */
    if (usuarioResult.recordset.length === 0) {
      return res.json({
        mensaje: mensajeGenerico
      });
    }

    const usuario = usuarioResult.recordset[0];

    if (usuario.estado !== "ACTIVO") {
      return res.json({
        mensaje: mensajeGenerico
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await pool.request()
      .input("id_usuario", sql.Int, usuario.id_usuario)
      .query(`
        UPDATE recuperacion_password
        SET usado = 1
        WHERE id_usuario = @id_usuario AND usado = 0
      `);

    await pool.request()
      .input("id_usuario", sql.Int, usuario.id_usuario)
      .input("token_hash", sql.NVarChar, tokenHash)
      .query(`
        INSERT INTO recuperacion_password (
          id_usuario,
          token_hash,
          fecha_expiracion,
          usado
        )
        VALUES (
          @id_usuario,
          @token_hash,
          DATEADD(MINUTE, 30, SYSDATETIME()),
          0
        )
      `);

    const linkRecuperacion = `http://localhost:5173/restablecer-password/${token}`;

    return res.json({
      mensaje: mensajeGenerico,
      linkRecuperacion
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al solicitar recuperación de contraseña"
    });
  }
}

async function restablecerPassword(req, res) {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({
        mensaje: "Token y nueva contraseña son obligatorios"
      });
    }

    if (!validarPasswordSegura(nuevaPassword)) {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo"
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const pool = await poolPromise;

    const recuperacionResult = await pool.request()
      .input("token_hash", sql.NVarChar, tokenHash)
      .query(`
        SELECT 
          rp.id_recuperacion,
          rp.id_usuario,
          rp.fecha_expiracion,
          rp.usado
        FROM recuperacion_password rp
        WHERE rp.token_hash = @token_hash
      `);

    if (recuperacionResult.recordset.length === 0) {
      return res.status(400).json({
        mensaje: "El enlace de recuperación no es válido"
      });
    }

    const recuperacion = recuperacionResult.recordset[0];

    if (recuperacion.usado) {
      return res.status(400).json({
        mensaje: "Este enlace ya fue utilizado"
      });
    }

    const ahora = new Date();
    const expiracion = new Date(recuperacion.fecha_expiracion);

    if (ahora > expiracion) {
      return res.status(400).json({
        mensaje: "El enlace de recuperación ha expirado"
      });
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);

    await pool.request()
      .input("id_usuario", sql.Int, recuperacion.id_usuario)
      .input("password_hash", sql.NVarChar, nuevoHash)
      .query(`
        UPDATE usuarios
        SET password_hash = @password_hash
        WHERE id_usuario = @id_usuario
      `);

    await pool.request()
      .input("id_recuperacion", sql.Int, recuperacion.id_recuperacion)
      .query(`
        UPDATE recuperacion_password
        SET usado = 1
        WHERE id_recuperacion = @id_recuperacion
      `);

    return res.json({
      mensaje: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al restablecer contraseña"
    });
  }
}

module.exports = {
  login,
  registrarUsuario,
  solicitarRecuperacionPassword,
  restablecerPassword
};